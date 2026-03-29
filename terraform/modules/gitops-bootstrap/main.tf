# ============================================================================
# External Secrets Operator (ESO) — IAM + Helm
# ============================================================================

# Least-privilege IAM policy: ESO can only read secrets matching a specific prefix
# (e.g., "tellme/*") — not all secrets in the account
resource "aws_iam_policy" "external_secrets_read" {
  name        = "eso-read-secrets"
  description = "Allow External Secrets Operator to read GitOps SSH secret."
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      # Wildcard at end covers the random suffix AWS adds to secret ARNs
      Resource = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:${var.gitops_secrets_prefix}*" #  - only secrets whose name starts with your prefix (e.g. tellme/) in my region
    }]
  })
}

# IRSA role for ESO: only the external-secrets SA in the external-secrets namespace can assume it
# Two conditions enforce both the SA identity (:sub) and audience (:aud) for defense in depth
resource "aws_iam_role" "external_secrets" {
  name = "external-secrets-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn # Trust only tokens from your EKS OIDC provider (not IAM users directly).
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(var.oidc_provider_url, "https://", "")}:sub" = "system:serviceaccount:external-secrets:external-secrets" #    Only that exact ServiceAccount (namespace/name).
          "${replace(var.oidc_provider_url, "https://", "")}:aud" = "sts.amazonaws.com" #token must be intended for sts
        } 
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "external_secrets_read" {
  role       = aws_iam_role.external_secrets.name
  policy_arn = aws_iam_policy.external_secrets_read.arn
}

# Install ESO via Helm — the eks.amazonaws.com/role-arn annotation on the SA triggers IRSA
# When the pod starts, AWS injects a projected token that ESO uses to call STS → Secrets Manager
resource "helm_release" "external_secrets" {
  name             = "external-secrets"
  namespace        = "external-secrets"
  create_namespace = true
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  version          = "0.10.3"

  values = [yamlencode({
    installCRDs = true
    serviceAccount = {
      name = "external-secrets"
      annotations = {
        # This annotation is what makes IRSA work — maps K8s SA → AWS IAM role
        "eks.amazonaws.com/role-arn" = aws_iam_role.external_secrets.arn
      }
    }
  })]
  
  depends_on = [aws_iam_role_policy_attachment.external_secrets_read]
}

# Wait 120s for ESO CRDs and controller to be fully ready before deploying ArgoCD
# (ArgoCD's extraObjects include ClusterSecretStore/ExternalSecret which need ESO CRDs)
resource "time_sleep" "wait_for_eso" {
  depends_on      = [helm_release.external_secrets]
  create_duration = "120s"
}

resource "helm_release" "argocd" {
  name             = "argocd"
  namespace        = "argocd"
  create_namespace = true
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = var.argocd_chart_version
  wait             = true   # Terraform waits until all ArgoCD pods are ready
  timeout          = 600    # 10 min timeout — ArgoCD has many components to start
  values = [yamlencode({
    crds = {
      install = true
    }
    configs = {
      ssh = {
        # Pre-load GitLab's SSH host key so ArgoCD doesn't fail on first git clone
        knownHosts = "gitlab.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCsj2bNKTBSpIYDEGk9KxsGh3mySTRgMtXL583qmBpzeQ+jqCMRgBqB98u3z++J1sKlXHWfM9dyhSevkMwSbhoR8XIq/U0tCNyokEi/ueaBMCvbcTHhO7FcwzY92WK4Yt0aGROY5qX2UKSeOvuP4D6TPqKF1onrSzH9bx9XUf2lEdWT/ia1NEKjunUqu1xOB/StKDHMoX4/OKyIzuS0q/T1zOATthvasJFoPrAjkohTyaDUz2LN5JoH839hViyEG82yB+MjcFV5MU3N1l1QL3cVUCh93xSaua1N85qivl+siMkPGbO5xR/En4iEY6K2XPASUEMaieWVNTRCtJ4S8H+9"
      }
    }
    # extraObjects: K8s resources deployed alongside ArgoCD in the same Helm release
    extraObjects = [
      {
        # ClusterSecretStore: cluster-wide config telling ESO how to reach AWS Secrets Manager
        # Uses JWT auth via the external-secrets service account (IRSA-backed)
        apiVersion = "external-secrets.io/v1beta1"
        kind       = "ClusterSecretStore"
        metadata = {
          name = "aws-secretsmanager"
        }
        spec = {
          provider = {
            aws = {
              service = "SecretsManager"
              region  = var.aws_region
              auth = {
                jwt = {
                  serviceAccountRef = {
                    name      = "external-secrets" ##tells eso what service account to use for jwt auth (irsa)
                    namespace = "external-secrets"
                  }
                }
              }
            }
          }
        }
      },
      {
        # ExternalSecret: tells ESO to fetch the SSH private key from AWS Secrets Manager
        # and create a K8s Secret that ArgoCD uses to authenticate with the GitOps repo
        apiVersion = "external-secrets.io/v1beta1"
        kind       = "ExternalSecret"
        metadata = {
          name      = "argocd-gitops-repo"
          namespace = "argocd"
        }
        spec = {
          refreshInterval = "1h"  # Re-sync from Secrets Manager every hour
          secretStoreRef = {  ##know what secret store to use for this external secret (the one we defined above)
            name = "aws-secretsmanager"
            kind = "ClusterSecretStore"
          }
          target = {
            name           = "gitops-repo" ##Name of the K8s Secret that will be created in argocd namespace with the git repo credentials
            creationPolicy = "Owner"  # ESO owns (creates/deletes) this secret
            template = {
              metadata = {
                labels = {
                  # This label tells ArgoCD "this secret contains repo credentials"
                  "argocd.argoproj.io/secret-type" = "repository"
                }
              }
              data = {
                name          = "gitops-repo" # The "name" field is the SSH remote name used in ArgoCD repo configs (e.g., repoURL:
                url           = var.gitops_repo_url
                type          = "git"
                # Double-brace escaping: outer {{ }} is Terraform, inner is Go template (ESO)
                sshPrivateKey = "{{ \"{{ .ssh_private_key }}\" }}"
              }
            }
          }
          data = [
            {
              secretKey = "ssh_private_key" ##key name inside the secret
              remoteRef = {
                key      = var.gitops_repo_ssh_secret_name   # Secret name in AWS Secrets Manager
                property = "ssh_private_key"                  # JSON key within that secret in aws
              }
            }
          ]
        }
      }
    ]
  })]

  # ArgoCD needs ESO running first so the ClusterSecretStore/ExternalSecret can be processed
  depends_on = [time_sleep.wait_for_eso]
}

# ============================================================================
# ArgoCD Root Application (App-of-Apps Pattern)
# ============================================================================
# This creates the single "root-root" Application that points to the parents/ directory
# in the gitops repo. ArgoCD then discovers and deploys everything else automatically.
# Pattern: Terraform installs ArgoCD → ArgoCD manages everything else (GitOps)
resource "helm_release" "argocd_apps" {
  name             = "argocd-apps"
  namespace        = "argocd"
  create_namespace = true
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argocd-apps"
  version          = "2.0.1"

  values = [yamlencode({
    applications = {
      "root-root" = {
        namespace = "argocd"
        project   = "default"
        source = {
          repoURL        = var.gitops_repo_url
          targetRevision = var.gitops_target_revision
          path           = "parents"  # Contains root-infra.yaml and root-app.yaml
        }
        destination = {
          server    = "https://kubernetes.default.svc"  # Deploy to the same cluster
          namespace = "argocd"
        }
        syncPolicy = {
          automated = {
            prune    = true   # Delete resources removed from git
            selfHeal = true   # Revert manual kubectl changes to match git
          }
        }
      }
    }
  })]

  depends_on = [
    helm_release.argocd,
    time_sleep.wait_for_eso
  ]
}

## Terraform's job ends here: ArgoCD + ESO + repo credentials are installed.
## From this point, ArgoCD takes over and manages all cluster resources via GitOps.






# ----------------------------------------------------------------------------
# Alternative (comment-only): health-based readiness gate instead of fixed sleep
# ----------------------------------------------------------------------------
# Why: depends_on enforces create order only; it does NOT guarantee controller readiness.
# Example pattern:
#
# resource "null_resource" "wait_for_eso_ready" {
#   depends_on = [helm_release.external_secrets]
#
#   provisioner "local-exec" {
#     command = "kubectl -n external-secrets wait --for=condition=Available deploy/external-secrets --timeout=5m"
#   }
# }
#
# Then point downstream dependencies to:
#   depends_on = [null_resource.wait_for_eso_ready]
#
# Keep in mind:
# - This requires kubectl access from the Terraform runner environment.
# - It is runtime health-aware, unlike fixed-duration sleep.

# ============================================================================
# ArgoCD Installation
# ============================================================================
# Installs ArgoCD via Helm and bootstraps it with:
# 1. GitLab SSH known_hosts (so ArgoCD can clone the gitops repo via SSH)
# 2. ClusterSecretStore (tells ESO how to connect to AWS Secrets Manager)
# 3. ExternalSecret (pulls the SSH private key from Secrets Manager into a K8s secret)

variable "argocd_chart_version" {
  type        = string
  description = "Argo CD Helm chart version."
}

variable "gitops_repo_url" {
  type        = string
  description = "GitOps repo URL for Argo CD."
}

variable "gitops_target_revision" {
  type        = string
  description = "Git revision for GitOps repo."
}

variable "gitops_repo_ssh_secret_name" {
  type        = string
  description = "AWS Secrets Manager secret name that stores the GitOps SSH private key."
}

variable "gitops_secrets_prefix" {
  type        = string
  description = "Secrets Manager name prefix (folder) to allow access to."
}

variable "aws_region" {
  type        = string
  description = "AWS region (for Secrets Manager)."
}

variable "aws_account_id" {
  type        = string
  description = "AWS account ID (for Secrets Manager ARN)."
}

variable "oidc_provider_arn" {
  type        = string
  description = "EKS OIDC provider ARN for IRSA."
}

variable "oidc_provider_url" {
  type        = string
  description = "EKS OIDC provider URL for IRSA."
}

############################
# Terraform & Providers
############################
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    # time provider used to add artificial delays between dependent resources
    time = {
      source  = "hashicorp/time"
      version = "~> 0.11"
    }
  }
}

provider "aws" {
  region = var.region
}

############################
# Phase 1: Networking
############################
# Create VPC, subnets, IGW, NAT — networking foundation for EKS
module "network" {
  source = "./modules/network"

  name_prefix    = var.name_prefix
  cluster_name   = var.cluster_name
  vpc_cidr       = var.vpc_cidr
  az_count       = var.az_count
  subnet_newbits = var.subnet_newbits
  tags           = var.tags
}

############################
# Phase 2: EKS Cluster
############################
# Create EKS cluster + node group — depends on network module outputs
module "eks" {
  source = "./modules/eks"

  name_prefix             = var.name_prefix
  cluster_name            = var.cluster_name
  cluster_version         = var.cluster_version
  vpc_id                  = module.network.vpc_id
  private_subnet_ids      = module.network.private_subnet_ids
  public_subnet_ids       = module.network.public_subnet_ids
  endpoint_private_access = var.endpoint_private_access
  endpoint_public_access  = var.endpoint_public_access
  public_access_cidrs     = var.public_access_cidrs
  node_instance_types     = var.node_instance_types
  node_desired_size       = var.node_desired_size
  node_min_size           = var.node_min_size
  node_max_size           = var.node_max_size
  tags                    = var.tags
}

# Fetch EKS cluster details after creation — needed to configure kubernetes/helm providers
data "aws_eks_cluster" "this" {
  name       = module.eks.cluster_name
  depends_on = [module.eks]
}

# Kubernetes provider authenticates to EKS using exec plugin — generates token at runtime

provider "kubernetes" {
  host                   = data.aws_eks_cluster.this.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name] ##token used by terraform at runtime to authenticate into eks api
  }
}

# Helm provider must explicitly configure its own K8s connection — it does NOT inherit from provider "kubernetes"
# Without this, Helm falls back to kubeconfig default context which could point at the wrong cluster
provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.this.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

# Buffer time: EKS API server needs ~60s after creation before it reliably accepts Helm installs
resource "time_sleep" "wait_for_eks" {
  depends_on      = [module.eks]
  create_duration = "60s"
}

############################
# Phase 3: GitOps Bootstrap
############################
# Install ArgoCD + External Secrets Operator via Helm into the EKS cluster
# OIDC outputs are passed so ESO can use IRSA to access AWS Secrets Manager
module "gitops_bootstrap" {
  source = "./modules/gitops-bootstrap"

  argocd_chart_version        = var.argocd_chart_version
  gitops_repo_url             = var.gitops_repo_url
  gitops_target_revision      = var.gitops_target_revision
  gitops_repo_ssh_secret_name = var.gitops_repo_ssh_secret_name
  gitops_secrets_prefix       = var.gitops_secrets_prefix
  aws_region                  = var.region
  aws_account_id              = var.aws_account_id
  oidc_provider_arn           = module.eks.oidc_provider_arn
  oidc_provider_url           = module.eks.oidc_provider_url

  # Wait for EKS to be fully ready before installing Helm charts
  depends_on = [time_sleep.wait_for_eks]
}

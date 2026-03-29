variable "region" {
  type        = string
  description = "AWS region to deploy into."
  default     = "ap-south-1"
}

variable "name_prefix" {
  type        = string
  description = "Prefix for resource names."
  default     = "tellme"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC."
  default     = "10.0.0.0/16"
}

variable "az_count" {
  type        = number
  description = "Number of availability zones to use."
  default     = 2
}

variable "subnet_newbits" {
  type        = number
  description = "Number of bits to add when creating subnets."
  default     = 8
}

variable "tags" {
  type        = map(string)
  description = "Common tags applied to all resources."
  default = {
    Project = "tellme"
  }
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name."
  default     = "tellme-eks"
}

variable "cluster_version" {
  type        = string
  description = "Kubernetes version for the EKS control plane."
  default     = null
}

variable "endpoint_private_access" {
  type        = bool
  description = "Enable private access to the Kubernetes API server."
  default     = true
}

variable "endpoint_public_access" {
  type        = bool
  description = "Enable public access to the Kubernetes API server."
  default     = true
}

variable "public_access_cidrs" {
  type        = list(string)
  description = "CIDR blocks allowed to access the public Kubernetes API endpoint."
  default     = ["0.0.0.0/0"]
}

variable "node_instance_types" {
  type        = list(string)
  description = "EC2 instance types for the managed node group."
  default     = ["t3a.medium"]
}

variable "node_desired_size" {
  type        = number
  description = "Desired number of worker nodes."
  default     = 3
}

variable "node_min_size" {
  type        = number
  description = "Minimum number of worker nodes."
  default     = 3
}

variable "node_max_size" {
  type        = number
  description = "Maximum number of worker nodes."
  default     = 3
}

variable "argocd_chart_version" {
  type        = string
  description = "Argo CD Helm chart version."
  default     = "9.3.4"
}

variable "gitops_repo_url" {
  type        = string
  description = "GitOps repo URL for Argo CD."
  default     = "git@gitlab.com:salihdaher9/tellme-gitops.git"
}

variable "gitops_target_revision" {
  type        = string
  description = "Git revision for GitOps repo."
  default     = "master"
}

variable "gitops_repo_ssh_secret_name" {
  type        = string
  description = "AWS Secrets Manager secret name that stores the GitOps SSH private key."
  default     = "tellme/gitops-ssh"
}

variable "gitops_secrets_prefix" {
  type        = string
  description = "Secrets Manager name prefix (folder) to allow access to."
  default     = "tellme/"
}

variable "aws_account_id" {
  type        = string
  description = "AWS account ID. No default — forces explicit input to prevent accidental deployment to wrong account."
}

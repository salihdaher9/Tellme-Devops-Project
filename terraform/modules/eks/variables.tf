variable "name_prefix" {
  type        = string
  description = "Prefix for resource names."
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name."
}

variable "cluster_version" {
  type        = string
  description = "Kubernetes version for the EKS control plane."
  default     = null
}

variable "vpc_id" {
  type        = string
  description = "VPC ID for the EKS cluster."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for the EKS cluster and nodes."
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs used by load balancers."
  default     = []
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
  default     = 2
}

variable "node_min_size" {
  type        = number
  description = "Minimum number of worker nodes."
  default     = 2
}

variable "node_max_size" {
  type        = number
  description = "Maximum number of worker nodes."
  default     = 3
}

variable "tags" {
  type        = map(string)
  description = "Common tags applied to all resources."
  default     = {}
}

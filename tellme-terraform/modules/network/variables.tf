variable "name_prefix" {
  type        = string
  description = "Prefix for resource names."
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC."
}

variable "az_count" {
  type        = number
  description = "Number of availability zones to use."
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name for subnet discovery tags."
}

variable "tags" {
  type        = map(string)
  description = "Common tags applied to all resources."
  default     = {}
}

variable "subnet_newbits" {
  description = "Number of bits to add when creating subnets"
  type        = number
  default     = 8
}

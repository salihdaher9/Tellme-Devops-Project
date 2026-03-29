# Expose the VPC ID so other modules can attach resources like EKS, SGs, and route-related components to this VPC.
output "vpc_id" {
  value = aws_vpc.this.id
}

# Expose public subnet IDs so callers can place public-facing resources there, such as load balancers or NAT gateway dependencies.
output "public_subnet_ids" {
  value = [for subnet in aws_subnet.public : subnet.id]
}

# Expose private subnet IDs so workloads like EKS worker nodes can be launched in non-public subnets.
output "private_subnet_ids" {
  value = [for subnet in aws_subnet.private : subnet.id]
}

# Expose the selected AZ list so other modules can stay aligned with the network layout across zones.
output "availability_zones" {
  value = local.azs
}

############################
# Dynamic AZ Discovery
############################
# Dynamically fetches available AZs in the region — avoids hardcoding zone names
data "aws_availability_zones" "available" {
  state = "available"
}

############################
# Local Values
############################

locals {
  # Slice to the desired number of AZs (e.g., 2 AZs for HA without over-provisioning)
  azs= slice(data.aws_availability_zones.available.names, 0, var.az_count)

  # cidrsubnet() carves the VPC CIDR into smaller subnets — public subnets get indices 0,1,...
  public_cidrs = { for idx, az in local.azs : az => cidrsubnet(var.vpc_cidr, var.subnet_newbits, idx) }
  # {
  #   "ap-south-1a" = "10.0.0.0/24"
  #  "ap-south-1b" = "10.0.1.0/24"
  #}

  # Private subnets start after public ones — offset by length(azs) to avoid CIDR overlap
  private_cidrs = {
    for idx, az in local.azs : az => cidrsubnet(var.vpc_cidr, var.subnet_newbits, idx + 10)
  }
  #ap-south-1a -> 10.0.10.0/24
  #ap-south-1b -> 10.0.11.0/24

  #So private subnets are shifted forward and never reuse public CIDR blocks.

  common_tags = merge(var.tags, {
    ManagedBy = "terraform"
  })
}


############################
# VPC
############################
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  # DNS support/hostnames required for EKS — nodes need to resolve internal DNS names
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-vpc"
  })
}

############################
# Internet Gateway
############################
# IGW allows public subnets to reach the internet (for load balancers, NAT source, etc.)
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-igw"
  })
}

############################
# Public Subnets
  # {
  #   "ap-south-1a" = "10.0.0.0/24"
   #  "ap-south-1b" = "10.0.1.0/24"
  #}
############################
resource "aws_subnet" "public" {
  for_each = local.public_cidrs

  vpc_id                  = aws_vpc.this.id
  availability_zone       = each.key
  cidr_block              = each.value
  map_public_ip_on_launch = true  # Instances get public IPs — needed for NAT GW and LBs

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-public-${each.key}"
    Tier = "public"
    # These tags let the AWS Load Balancer Controller auto-discover subnets for internet-facing LBs
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    # - Signals these subnets are for internet-facing load balancers.
    "kubernetes.io/role/elb"                    = "1"
  })
}

############################
# Public Route Table
############################
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-public-rt"
  })
}

############################
# Public Internet Route
############################
# Default route: all outbound traffic from public subnets goes through the IGW
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

############################
# Public Route Table Associations
############################
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

############################
# NAT EIP
############################
# Static Elastic IP for the NAT Gateway — provides a fixed outbound IP for private subnets
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-nat-eip"
  })
}

############################
# NAT Gateway
############################
# NAT GW sits in a public subnet and lets private subnet resources reach the internet
# (e.g., worker nodes pulling container images) without exposing them to inbound traffic
# Single NAT GW (not per-AZ) — cost optimization, acceptable for non-production
resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = values(aws_subnet.public)[0].id

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-nat"
  })
}

############################
# Private Subnets
############################
resource "aws_subnet" "private" {
  for_each = local.private_cidrs

  vpc_id            = aws_vpc.this.id
  availability_zone = each.key
  cidr_block        = each.value
  # No public IPs — worker nodes run here, isolated from direct internet access

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-private-${each.key}"
    Tier = "private"
    # These tags let the AWS LB Controller discover subnets for internal LBs
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  })
}

############################
# Private Route Table
############################
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-private-rt"
  })
}

############################
# Private NAT Route
############################
# Default route: all outbound traffic from private subnets goes through the NAT Gateway
resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this.id
}

############################
# Private Route Table Associations
############################
resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}

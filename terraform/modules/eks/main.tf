############################
# Local Values
############################
locals {
  common_tags = merge(var.tags, {
    ManagedBy = "terraform"
  })
}

############################
# IAM: Cluster Role
############################
# EKS control plane assumes this role to manage AWS resources (ENIs, LBs, etc.)
resource "aws_iam_role" "cluster" {
  name = "${var.name_prefix}-eks-cluster-role"

  # Trust policy: only the EKS service can assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

# AWS-managed policy that grants EKS the permissions it needs (networking, logging, etc.)
resource "aws_iam_role_policy_attachment" "cluster_policy" {
  role       = aws_iam_role.cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}


############################
# IAM: Node Role
############################
# EC2 instances (worker nodes) assume this role to join the cluster and pull images
resource "aws_iam_role" "node" {
  name = "${var.name_prefix}-eks-node-role"

  # Trust policy: only EC2 instances can assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

# Allows nodes to register with the EKS cluster
resource "aws_iam_role_policy_attachment" "node_worker" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

# Allows the VPC CNI plugin to manage pod networking (assign pod IPs from VPC CIDR)
#configure network interfaces for containers
resource "aws_iam_role_policy_attachment" "node_cni" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

# Allows nodes to pull container images from ECR
resource "aws_iam_role_policy_attachment" "node_ecr" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

############################
# Security Groups
############################
# Control plane SG — controls traffic to/from the EKS API server
resource "aws_security_group" "cluster" {
  name        = "${var.name_prefix}-eks-cluster-sg"
  description = "Security group for EKS control plane."
  vpc_id      = var.vpc_id

  # Allow all outbound — control plane needs to reach nodes, AWS APIs, etc.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-eks-cluster-sg"
  })
}

# Worker node SG — controls traffic between nodes and from control plane
resource "aws_security_group" "node" {
  name        = "${var.name_prefix}-eks-node-sg"
  description = "Security group for EKS worker nodes."
  vpc_id      = var.vpc_id

  # self = true: nodes can talk to each other on all ports (pod-to-pod, CoreDNS, etc.)
  # Example: if a pod on node A calls a pod on node B (ClusterIP/Service routing), this inbound rule allows it.
  ingress {
    description = "Node to node communication."
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  # Control plane → nodes on 443: for webhook callbacks and aggregated API servers
  ingress {
    description     = "Control plane to nodes (API server)."
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.cluster.id]
  }

  # Control plane → kubelet on 10250: for logs, exec, port-forward commands
  ingress {
    description     = "Control plane to kubelet."
    from_port       = 10250
    to_port         = 10250
    protocol        = "tcp"
    security_groups = [aws_security_group.cluster.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-eks-node-sg"
  })
}

# Reverse direction: nodes → control plane on 443 (for kubectl, API calls from pods)
resource "aws_security_group_rule" "cluster_from_nodes" {
  type                     = "ingress"
  description              = "Nodes access the Kubernetes API server."
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.cluster.id
  source_security_group_id = aws_security_group.node.id
}

############################
# EKS Cluster
############################
resource "aws_eks_cluster" "this" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.cluster_version

  vpc_config {
    # Control plane ENIs placed in private subnets for security
    subnet_ids              = var.private_subnet_ids
    security_group_ids      = [aws_security_group.cluster.id]
    endpoint_private_access = var.endpoint_private_access  # Nodes access API via private VPC endpoint
    endpoint_public_access  = var.endpoint_public_access   # You (developer) access API from internet
    public_access_cidrs     = var.public_access_cidrs      # Restrict public access to specific IPs
  }

  tags = merge(local.common_tags, {
    Name = var.cluster_name
  })
}

############################
# Managed Node Group
############################
# AWS manages node provisioning, AMI updates, and drain/replace during upgrades
resource "aws_eks_node_group" "this" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.name_prefix}-managed-ng"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.private_subnet_ids  # Nodes run in private subnets (no direct internet exposure)

  instance_types = var.node_instance_types

  scaling_config {
    desired_size = var.node_desired_size
    min_size     = var.node_min_size
    max_size     = var.node_max_size
  }

  # Rolling update: max 1 node unavailable at a time to maintain availability during upgrades
  update_config {
    max_unavailable = 1
  }

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-managed-ng"
  })
}

############################
# OIDC Provider (IRSA)
############################
# IRSA = IAM Roles for Service Accounts
# This lets Kubernetes service accounts assume AWS IAM roles — no static AWS credentials needed
# How it works: pod → K8s SA token (JWT) → STS validates via OIDC → returns temp AWS creds

# Fetch the TLS cert thumbprint of the EKS OIDC issuer for IAM trust validation
data "tls_certificate" "eks_oidc" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

# Register the EKS OIDC issuer with IAM so AWS STS trusts tokens signed by this cluster
resource "aws_iam_openid_connect_provider" "eks" {
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_oidc.certificates[0].sha1_fingerprint]

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-eks-oidc"
  })
}
##pod identity
############################
# EBS CSI Driver IAM Role
############################
# IRSA role for the EBS CSI driver — only the ebs-csi-controller-sa service account can assume it
# Needed so the CSI driver can create/attach/delete EBS volumes for PersistentVolumeClaims
resource "aws_iam_role" "ebs_csi" {
  name = "${var.name_prefix}-ebs-csi-role"
  #who can assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { #trust identites from the EKS OIDC provider we created above
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      # Condition scopes this role to ONLY the EBS CSI controller service account (least privilege)
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ebs_csi_policy" {
  role       = aws_iam_role.ebs_csi.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

############################
# EBS CSI Driver Addon
############################
# EKS managed addon — AWS handles updates and compatibility
# Required for dynamic PV provisioning (e.g., MongoDB storage uses gp2/gp3 EBS volumes)
resource "aws_eks_addon" "ebs_csi" {
  cluster_name             = aws_eks_cluster.this.name
  addon_name               = "aws-ebs-csi-driver"
  service_account_role_arn = aws_iam_role.ebs_csi.arn

  tags = local.common_tags
}

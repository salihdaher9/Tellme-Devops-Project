# TellMe Terraform

Infrastructure as Code for AWS (VPC + EKS + GitOps bootstrap).

## Modules
- `modules/network`: VPC, subnets, IGW, NAT, routes
- `modules/eks`: EKS cluster + node group + security groups
- `modules/gitops-bootstrap`: ArgoCD + External Secrets Operator + repo bootstrap

## State
Remote state in S3 with DynamoDB locking (see `backend.tf`).

## Typical Use
```bash
terraform init
terraform apply
```

## Diagram
**AWS Infrastructure**
![AWS Infrastructure](./docs/diagrams/aws.png)

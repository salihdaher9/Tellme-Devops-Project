# Remote state stored in S3 — enables team collaboration and CI/CD access to state
# encrypt = true ensures state file (which may contain secrets) is encrypted at rest
terraform {
  backend "s3" {
    bucket         = "tellme-terraform.state-bucket"
    key            = "tellme-terraform/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    use_lockfile   = true
  }
}

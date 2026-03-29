output "argocd_namespace" {
  value = helm_release.argocd.namespace
}

output "root_app_name" {
  value = "root-root"
}

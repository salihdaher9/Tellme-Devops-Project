# TellMe GitOps

GitOps repo for all Kubernetes workloads: infra + app.

## Structure
- `root-root.yaml`: App-of-apps root
- `parents/`: root-app + root-infra
- `infra/`: ArgoCD Applications for ingress, cert-manager, monitoring, logging
- `apps/`: App workloads (tellme)
- `charts/`: Helm charts (umbrella app + subcharts)
- `values/`: environment values (prod)

## How It Deploys
ArgoCD syncs `root-root` → `parents` → `infra` + `apps`.

## Diagram
**Application / Kubernetes**
![Application / Kubernetes](./docs/diagrams/eks.png)

## Observability
**Logging (infra)**
![Logging Infra](./docs/diagrams/logging/infra/image.png)

**Logging (app)**
![Logging App](./docs/diagrams/logging/app/Screenshot%20from%202026-02-03%2023-55-46.png)

**Monitoring (infra)**
![Monitoring Infra](./docs/diagrams/monitoring/infra/Screenshot%20from%202026-02-04%2021-31-17.png)

**Monitoring (app)**
![Monitoring App](./docs/diagrams/monitoring/app/Screenshot%20from%202026-02-04%2021-31-36.png)

## Notes
Secrets are managed via AWS Secrets Manager + External Secrets Operator.

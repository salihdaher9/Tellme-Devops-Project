{{/* app.name: hardcoded app identifier used in labels and selectors */}}
{{- define "app.name" -}}
tellme
{{- end -}}

{{/* app.fullname: combines release name + app name (e.g., "tellme-tellme")
     trunc 63: K8s resource names are limited to 63 characters */}}
{{- define "app.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "app.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

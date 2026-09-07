{{- define "client.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Object labels - include provenance. */}}
{{- define "client.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{ include "client.podLabels" . }}
{{- end -}}

{{/*
Pod-template labels: object labels MINUS helm.sh/chart, so bumping the chart
version does not restart every front end for no reason.
*/}}
{{- define "client.podLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: paapeli
{{- end -}}

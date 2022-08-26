{{/* toucaApp service */}}
{{- define "svcIngress" -}}
{{- if not .Values.ingress.enabled }}
nodePort: 30001
{{- end }}
{{- end }}
---
title: 'Self-Hosted Home Lab'
domain: 'Systems Infrastructure'
featured: false
order: 6
presentation: 'note'
visibility: 'archived'
tech: ['Terraform', 'Oracle Cloud', 'Docker Compose', 'LiteLLM', 'PostgreSQL + pgvector', 'TrueNAS', 'Tailscale']
github: 'https://github.com/PatVraj/home-cloud-infra'
summary: 'Personal hybrid home lab: a Terraform-defined Oracle Cloud node plus a self-hosted AI stack and TrueNAS services.'
---

Personal home lab spanning local nodes and an Oracle Cloud A1 instance defined in Terraform, with a deploy script that retries across availability domains when capacity is unavailable. A Docker Compose stack runs a LiteLLM gateway over local Ollama and hosted models, Open WebUI with PostgreSQL + pgvector, and n8n, with the database reachable only on an internal Docker network. TrueNAS SCALE hosts containerized media services. Exact capacity, topology, and current access boundaries remain unpublished until reverified.

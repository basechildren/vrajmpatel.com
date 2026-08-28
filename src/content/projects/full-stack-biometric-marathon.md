---
title: 'SeeMyRace: Race Photo Search'
domain: 'Machine Learning'
featured: true
order: 3
tech: ['Flask', 'Docker', 'PostgreSQL', 'DeepFace', 'PaddleOCR', 'Google Drive API']
privateRepo: true
summary: 'Collaborative Flask prototype exploring selfie- and bib-based race-photo discovery, moderation workflows, and asynchronous processing.'
contribution: 'UI implementation · moderation workflows · ML-pipeline connectors · bib-detection experiments'
setting: 'Collaborative Dockerized Flask MVP'
status: 'Private team project'
systemPathLabel: 'Prototype architecture'
systemPathHeading: 'How the prototype was designed'
systemPathDescription: 'A public-safe view of the intended flow. Open any step for the design decision behind it.'
proof:
  - value: '2 discovery paths'
    label: 'Selfie matching and bib-number lookup explored for race photos'
  - value: 'Async-processing design'
    label: 'Model work planned outside the interactive request path'
  - value: 'Moderation workflow'
    label: 'Flagging and review designed into the product flow'
systemPath:
  - title: 'Photo intake'
    purpose: 'Race photos enter from shared event storage without blocking the search experience.'
    technical: 'The team designed Google Drive imports around asynchronous ingestion so model work would not run inside an interactive request.'
  - title: 'Visual analysis'
    purpose: 'The pipeline prepares face and bib evidence for two different discovery paths.'
    technical: 'The team explored DeepFace for facial matching and compared stroke-width methods, Tesseract, and PaddleOCR for bib detection.'
  - title: 'Similarity search'
    purpose: 'A selfie or bib number is connected to likely photos rather than requiring manual browsing.'
    technical: 'The team explored PostgreSQL with pgvector for cosine search. I contributed to the surrounding ML integration but did not lead that storage layer.'
  - title: 'Application experience'
    purpose: 'A Dockerized Flask interface gives runners and reviewers a coherent workflow.'
    technical: 'The product design paired Google OAuth, backend connectors, and a Flask interface with an asynchronous-processing path.'
  - title: 'Moderation boundary'
    purpose: 'Flagging and review remain first-class parts of a product handling biometric search.'
    technical: 'I contributed flagging and moderation workflows so questionable matches or images could enter a human review path.'
---

## The product

SeeMyRace is a collaborative Dockerized Flask prototype exploring race-photo discovery through selfies and bib numbers. The team designed Google Drive imports, Google OAuth, and asynchronous processing around a search experience intended to keep model work away from the interactive request path.

## My contribution

I contributed UI implementation, flagging and moderation workflows, and backend connectors to the ML inference pipeline. I also ran bib-number detection experiments, including stroke-width methods and comparisons between Tesseract and PaddleOCR.

PaddleOCR looked strongest in a small internal comparison, but it was difficult to operationalize within the MVP’s constraints. That tradeoff mattered more than selecting the most impressive model on paper: a component only helps the product if the team can deploy, observe, and maintain it.

## Architecture and boundaries

I contributed to the DeepFace integration and the design around asynchronous ingestion. The team explored PostgreSQL with pgvector for cosine search, but I did not lead that storage and retrieval layer. My contribution was concentrated in UI implementation, moderation workflows, ML connectors, and bib-detection experiments.

The project remains private, so this case study uses a sanitized architecture view and does not publish team-owned screenshots, datasets, or biometric examples.

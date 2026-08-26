---
title: 'SeeMyRace: Race Photo Search'
domain: 'Machine Learning'
featured: true
order: 3
tech: ['Flask', 'Docker', 'PostgreSQL', 'DeepFace', 'PaddleOCR', 'Google Drive API']
privateRepo: true
summary: 'Collaborative Flask platform for race photography with selfie search, bib detection, moderation, and asynchronous image processing.'
---

SeeMyRace is a collaborative Dockerized Flask app that helps runners find race photos through selfies and bib numbers. It imports photos from Google Drive and uses Google OAuth. I built much of the main UI, flagging and moderation flows, and backend connectors to the ML inference pipeline. I also led bib-number detection research, including stroke width transform experiments.

I compared Tesseract and PaddleOCR; PaddleOCR performed best in our tests but was difficult to operationalize for the MVP. I also worked on DeepFace-based matching with a sub-50ms latency target and an asynchronous ingestion pipeline that kept model work off the request path. The product uses PostgreSQL with pgvector for cosine search, though I did not lead that part of the implementation.

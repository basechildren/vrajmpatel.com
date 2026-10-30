---
organization: 'University of Colorado Boulder · Institute of Behavioral Science'
title: 'Lead Technical Research Assistant'
period: 'March 2023 – May 2025'
order: 3
visibility: 'public'
organizationMark: 'cu-boulder'
context: "Concurrent IBS research appointment"
---

- Built the production Hindi speech pipeline: collected 2014, 2019, and 2024 campaign speeches and transcribed and translated them with Amazon Transcribe and Translate; the 2024 run alone covered 181 speeches (about 110 hours) at about $0.03 per audio-minute.
- Trained an Amazon Transcribe custom language model on about 110K words of official Hindi transcripts; word error rate fell from 40.1% to 30.1% on a held-out speech.
- Scraped 111,000+ state bill records (2008–2023) from four NCSL archives and built a resumable LegiScan client with caching, rate-limit backoff, and per-bill checkpoints, cutting redundant requests about 40% during bulk ingestion.
- Built a PyTorch / ResNet50 image-analysis pipeline with PhD researchers to study visual bias in New York Times COVID-19 imagery.

<details>
<summary>More about this work</summary>

- Collected 300+ rally speeches (200+ hours, 40+ GB) from YouTube, resampled them to 16 kHz WAV, and staged them in S3 with a job manifest so reruns skip completed files
- Used a truncated ResNet50 to extract image embeddings, then grouped them with k-means for analysis without labeled data

</details>

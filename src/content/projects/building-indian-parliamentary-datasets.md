---
title: 'Indian Parliamentary Data'
domain: 'Data Engineering'
featured: true
order: 2
visibility: 'public'
tech: ['Python', 'Selenium', 'SQLite', 'Amazon Transcribe', 'Amazon Translate', 'Amazon S3', 'PyMuPDF']
summary: "Restartable pipelines that turn campaign audio and parliamentary documents into structured research data."
contribution: "I evaluated speech tools at Studio Lab, built the production speech pipeline at IBS, and built Princeton’s parliamentary-data pipeline."
setting: "CU Boulder Studio Lab and IBS · Princeton University"
status: "Princeton appointment completed · May 2026"
proof:
  - value: "200+ hours of audio"
    label: "40+ GB of 2014, 2019, and 2024 campaign speeches; the 2024 run alone transcribed and translated 181 (about 110 hours)."
  - value: "40.1% → 30.1% WER"
    label: "Custom language model result on one held-out speech, before the full 2024 run."
  - value: "Thousands of PDFs"
    label: "Parliamentary statements parsed and mapped to standardized ministry names."
systemPath:
  - title: 'Tool evaluation'
    purpose: 'Speech and translation services are compared against the needs of the research workflow before they become pipeline dependencies.'
    technical: 'At Studio Lab, I set up WER-oriented comparisons across Deepgram, Google Speech-to-Text, Amazon Transcribe, and Azure Speech, plus translation comparisons across Google, AWS, and Azure services.'
  - title: 'Archive scraping'
    purpose: 'Dynamic parliamentary pages and documents become a recoverable source collection.'
    technical: 'At Princeton, I built Selenium collection workflows for Indian parliamentary records spanning 1951 through 2024, handled pagination, and persisted progress in SQLite so long collection runs could resume.'
  - title: 'Speech pipeline'
    purpose: 'Campaign audio becomes transcripts and English translations that researchers can analyze.'
    technical: 'At IBS in 2024, YouTube audio was resampled to 16 kHz WAV, staged in S3, and transcribed with an Amazon Transcribe custom language model trained on about 110K words of official Hindi transcripts. An S3 job manifest let reruns skip completed files, and byte-aware chunking kept requests within Amazon Translate limits. Total AWS spend was about $216, roughly $0.03 per audio-minute.'
  - title: 'Data structuring'
    purpose: 'Inconsistent records become formats that researchers can inspect and analyze.'
    technical: 'PyMuPDF extraction, metadata normalization, and fuzzy ministry-name mapping produce structured outputs for downstream analysis.'
  - title: 'Recovery and review'
    purpose: 'A failed stage can restart without discarding completed work or hiding transformation decisions.'
    technical: 'Saved state, intermediate outputs, and reviewable mappings keep processing recoverable and normalization decisions auditable.'
overview:
  problem: "Political archives span dynamic pages, long recordings, PDFs, and inconsistent ministry names. Researchers need traceable outputs without restarting hours of collection after an interruption."
  built: "I designed comparative speech and translation evaluations at Studio Lab, built the production Amazon Transcribe pipeline at IBS in 2024, and later built archive scraping, PDF extraction, normalization, and resumable processing under a Princeton appointment."
---

## Studio Lab: evaluation phase

At CU Boulder’s Studio Lab, I compared speech services using word error rate and evaluated translation services from Google, AWS, and Azure. Speech tools included Deepgram, Google Speech-to-Text, Amazon Transcribe, and Azure Speech. I also researched language adaptation for political names and domain vocabulary.

## IBS: production speech pipeline (2024)

At IBS, I built the production pipeline for 2014, 2019, and 2024 campaign speeches: more than 300 speeches and 200+ hours (40+ GB) of audio in all. I resampled audio to 16 kHz WAV, staged it in S3, and used Amazon Transcribe and Translate. Of 182 videos collected for the 2024 corpus, the run transcribed and translated 181 speeches (about 110 hours).

A custom language model trained on about 110K words of official Hindi transcripts lowered word error rate from 40.1% to 30.1% on one held-out speech. That is a single-speech check, not a corpus-wide benchmark, and the references are edited official texts rather than verbatim transcripts. Transcripts were linked back to video metadata by fuzzy title matching. Total AWS spend was about $216.

## Princeton: engineering phase

At Princeton, I built archive collection and processing for parliamentary records spanning 1951–2024. The workflow handled dynamic pagination, resumable SQLite state across multi-day runs, OCR evaluation, and PDF extraction with PyMuPDF.

One retained checkpoint database contains 2,526 Lok Sabha debate records from 1985 through 2024 (8th through 18th Lok Sabha). This snapshot represents part of the project's broader archival coverage.

I parsed thousands of parliamentary statements and used fuzzy matching to standardize ministry names. Saved checkpoints and intermediate outputs made jobs restartable and transformations reviewable.

## Engineering decisions

- Evaluate interchangeable services before embedding one vendor into the research workflow.
- Persist collection state so interrupted sessions can resume near the failure rather than restarting.
- Keep raw source material, intermediate text, and normalized outputs distinct so transformations can be inspected.
- Treat source text and fuzzy matching as assistive normalization inputs that still need review, not unquestioned ground truth.
- Separate the campaign-audio corpora (2014, 2019, and 2024) from the parliamentary-document corpus so scale and date claims are not merged.

## Research context

This project spanned three appointments: Studio Lab at CU Boulder (January 21–April 13, 2024), my IBS research appointment (production speech pipeline, 2024), and Princeton (January 15, 2025–May 2026). [Experience](/experience/) lists the roles and their distinct contributions.

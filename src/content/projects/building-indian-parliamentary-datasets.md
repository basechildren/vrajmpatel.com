---
title: 'Indian Parliamentary Data'
domain: 'Research'
featured: true
order: 2
tech: ['Python', 'Selenium', 'SQLite', 'AWS', 'Google Cloud', 'Azure', 'Deepgram', 'PyMuPDF']
summary: 'Multi-vendor speech and translation evaluation followed by a recoverable end-to-end pipeline for parliamentary records, campaign audio, and structured analysis data.'
contribution: 'Tool benchmarking at Studio Lab · End-to-end data-pipeline engineering at Princeton'
setting: 'CU Boulder Studio Lab and Princeton University · Separate paid appointments'
status: 'Princeton appointment concluded · May 2026'
proof:
  - value: '40+ GB'
    label: '2014 and 2019 campaign audio processed after multi-vendor tool evaluation'
  - value: 'Multi-decade'
    label: 'Lok Sabha and Rajya Sabha records collected for research'
  - value: 'Thousands'
    label: 'PDF statements parsed and mapped to standardized ministry names'
systemPath:
  - title: 'Tool evaluation'
    purpose: 'Speech and translation services are compared against the needs of the research workflow before they become pipeline dependencies.'
    technical: 'At Studio Lab, I set up WER-oriented comparisons across Deepgram, Google Speech-to-Text, Amazon Transcribe, and Azure Speech, plus translation comparisons across Google, AWS, and Azure services.'
  - title: 'Archive scraping'
    purpose: 'Dynamic parliamentary pages and documents become a recoverable source collection.'
    technical: 'At Princeton, I built the Selenium scraping logic, handled pagination, and persisted progress in SQLite so long collection runs could resume.'
  - title: 'End-to-end orchestration'
    purpose: 'Audio, page metadata, and documents move through one inspectable research workflow.'
    technical: 'The workflow coordinates source capture, speech and translation processing, PDF text extraction, and intermediate artifacts instead of relying on disconnected one-off scripts.'
  - title: 'Data structuring'
    purpose: 'Inconsistent records become formats that researchers can inspect and analyze.'
    technical: 'PyMuPDF extraction, metadata normalization, and fuzzy ministry-name mapping produce structured outputs for downstream analysis.'
  - title: 'Recovery and review'
    purpose: 'A failed stage can restart without discarding completed work or hiding transformation decisions.'
    technical: 'Saved state, intermediate outputs, and reviewable mappings keep processing recoverable and normalization decisions auditable.'
---

## The challenge

Indian political archives span dynamic web pages, long audio recordings, PDFs, and inconsistent institutional names. The work had two distinct phases: first determining which speech and translation tools fit the research workflow, then engineering the collection and processing pipeline end to end.

## Studio Lab: evaluation phase

At CU Boulder’s Studio Lab, my primary work was comparative research. I designed word-error-rate evaluations across Deepgram, Google Speech-to-Text, Amazon Transcribe, and Azure Speech, then set up parallel translation comparisons across Google Cloud Translation, Amazon Translate, and Azure Translator. I also researched configuration and language-adaptation options for political names and domain-specific vocabulary.

The goal was not to promote one vendor. It was to understand how standard tools behaved on the project’s material and identify which components fit the workflow.

## Princeton: engineering phase

Under the later Princeton appointment, I built the scraping logic and orchestrated the workflow end to end. That included dynamic Parliament Digital Library pagination, resumable SQLite state, speech and translation processing for more than 40 GB of 2014 and 2019 campaign audio, PDF text extraction with PyMuPDF, and structured outputs for further analysis.

I parsed thousands of parliamentary statements and used fuzzy matching to map inconsistent ministry names into a standardized research representation. Checkpoints and intermediate artifacts made long-running jobs restartable and kept transformations open to review.

## Engineering decisions

- Evaluate interchangeable services before embedding one vendor into the research workflow.
- Persist collection state so interrupted sessions can resume near the failure rather than restarting.
- Keep raw source material, intermediate text, and normalized outputs distinct so transformations can be inspected.
- Treat source text and fuzzy matching as assistive normalization inputs that still need review, not unquestioned ground truth.
- Separate the campaign-audio corpus from the parliamentary-document corpus so scale and date claims are not merged.

## Research context

The evaluation work began under a paid CU Boulder Studio Lab appointment from January 21 through April 13, 2024. After that appointment ended, I continued collaborating on the research. Princeton later paid me directly under a separate appointment beginning January 15, 2025 for the end-to-end engineering phase; that appointment concluded in May 2026. The roles are listed separately because the employers, appointments, and contribution phases were distinct even though the research project continued across them.

---
title: 'Operational Ticket Intelligence'
domain: 'Software Engineering'
featured: true
order: 1
privateRepo: true
tech: ['FastAPI', 'PostgreSQL', 'React', 'TypeScript', 'SQLAlchemy', 'Recharts', 'scikit-learn', 'Docker']
summary: 'Full-stack support operations combining dependable backend workflows, lifecycle-aware analytics, and advisory routing suggestions.'
contribution: 'Backend workflows · Integration safety · Operational analytics · Model-release tooling'
setting: 'Internal support operations · CU Boulder IBS'
status: 'Active development'
proof:
  - value: '10,803 / 96.7%'
    label: 'Current ticket corpus / records carrying support-group IDs'
  - value: '82.63% / 0.7563'
    label: 'Sealed-test accuracy / macro-F1 for an unreleased BERT candidate trained on 6,137 tickets'
  - value: '61% / 66% smaller'
    label: 'Raw / gzip analytics payload after moving from Plotly to Recharts'
systemPath:
  - title: 'Source reconciliation'
    purpose: 'Support-ticket changes enter one consistent intake and update path.'
    technical: 'Polling remains the correctness path. Optional authenticated notifications fetch canonical source state before using the same upsert workflow.'
  - title: 'Durable application state'
    purpose: 'PostgreSQL preserves lifecycle-aware state for analytics, review, and reconciliation.'
    technical: 'Durable watermarks, overlapping recovery, per-record transaction boundaries, and failure-aware checkpoint advancement keep partial ingestion from looking complete.'
  - title: 'Advisory ML boundary'
    purpose: 'Predictions appear as evidence for review rather than automatic decisions.'
    technical: 'Prediction provenance is retained. A prediction alone cannot authorize an external update; accepted labels or explicitly approved rules create approval records.'
  - title: 'Bounded delivery'
    purpose: 'External changes remain constrained by approval, lifecycle, and runtime controls.'
    technical: 'Read-only and disabled modes, destination checks, caps, dry runs, retry and backoff, and a final lifecycle check bound the write path.'
  - title: 'Operator surface'
    purpose: 'React views connect monitoring, labeling, and operational patterns for day-to-day decisions.'
    technical: 'Lifecycle-aware analytics distinguish intake from reportable volume. Replacing Plotly with Recharts and accessible chart tables reduced the visualization payload from about 1.07 MB to 415 KB raw and from 361 KB to 123 KB gzip.'
---

## The problem

Support operations combine external ticket state, historical analytics, model predictions, staff decisions, and sometimes outbound changes. A useful platform has to reconcile those pieces without letting stale data or automation outrun operator judgment.

## What I built

At CU Boulder’s Institute of Behavioral Science, my work on an internal FastAPI and PostgreSQL platform spans core backend workflows, integration safety controls, operational analytics, and model-release tooling for a React interface.

The interface brings monitoring, analysis, labeling, and model evidence into one operating surface. Offline training and candidate packaging are separated from serving. When ML is enabled, bounded single-ticket or batch inference produces support-group routing suggestions that remain subject to review rather than being treated as ground truth.

The validated data rebuild produced 10,399 canonical tickets, including 10,038 labeled tickets, plus 35,001 conversations and 1,525 attachment-metadata rows. Exact IDs, foreign keys, and migrations were verified after retaining historical-only records and reconciling newly exported IDs.

An unreleased BERT candidate trained on 6,137 tickets reached 82.63% accuracy and 0.7563 macro-F1 on a sealed test set. That was 3.11 accuracy points and 5.36 macro-F1 points above the prior XGBoost model, but the candidate remained an evaluation artifact rather than a production claim.

## Current operating data

On August 27, 2026, the local PostgreSQL database after read-only Freshdesk reconciliation contained 10,803 ticket records spanning October 4, 2022 through August 27, 2026. Of those records, 10,442—or 96.7%—carried a nonblank support-group ID. Those values spanned 14 observed IDs: 13 mapped to the current runtime group configuration, while one legacy unmapped ID appeared on three records.

After lifecycle exclusions, 10,649 records were reportable and 10,285 resolved through the current group mapping. The current training policy further narrowed the corpus to 6,487 records across seven eligible destination classes using lifecycle, provenance, text-quality, group-policy, and minimum-support gates.

During the preceding 30 days, 524 tickets were created and 610 records carried source update timestamps. The cohorts are not additive: all 524 newly created tickets fall inside the 610-record update cohort, alongside 86 older tickets. These figures establish a current, changing source corpus; they do not by themselves establish staff adoption of the application.

## Reliability and control

- Source reconciliation uses durable progress markers and failure-aware advancement so a partial ingest is not reported as complete.
- Ticket lifecycle state distinguishes source intake from reportable operational volume, including records that were deleted, merged, or marked as spam.
- Production-target readiness fails closed when required database, migration, or model contracts do not pass.
- Predictions retain provenance. External changes require an accepted label or an explicitly approved automation rule; a prediction alone is not authorization.
- Human/source-assigned and automation-derived routing records retain distinct provenance. Unreviewed automation remains excluded from model training unless a complete human override is recorded.
- Delivery behavior supports read-only and disabled modes, dry runs, bounded retries, and a final lifecycle check before any approved update.
- The checked-in hosted policy keeps the integration read-only, disables automatic delivery, and sets the daily external-write cap to zero.

## Operational evidence

A Recharts dashboard exposes busiest weekdays and peak hours as independent measures. Lifecycle-aware filtering keeps deleted, merged, and spam records from silently inflating reportable operational volume. Replacing Plotly reduced the analytics visualization payload by 61% raw and 66% gzip while adding accessible chart-table fallbacks.

Across the first 248 successful authenticated requests logged inside the running Compose app container on August 27, 2026, the stored analytics-snapshot endpoint measured 24.2 ms p50 and 45.8 ms p95 server-side latency. This was a warm local read of a persisted snapshot—not analytics recomputation, browser or network latency, concurrent load, or a production service-level objective.

This case study describes source-level system behavior, a current local database, and validated local measurements. It does not claim deployed staff adoption, production latency, or downstream staffing improvement.

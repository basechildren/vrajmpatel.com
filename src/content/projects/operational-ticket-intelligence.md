---
title: 'Operational Ticket Intelligence'
domain: 'Software Engineering'
featured: true
order: 1
visibility: 'public'
privateRepo: true
tech: ['FastAPI', 'PostgreSQL', 'React', 'TypeScript', 'SQLAlchemy', 'Recharts', 'scikit-learn', 'Docker']
summary: "A support-operations platform for reconciling tickets, reviewing routing suggestions, and understanding workload."
contribution: "I built backend workflows, integration controls, operational analytics, and model-release tooling."
setting: 'Internal support operations · CU Boulder IBS'
status: "Active development · deployed on CU OpenShift for internal IT use · read-only integration"
proof:
  - value: "10,803 tickets"
    label: "Local reconciled corpus on August 27, 2026; 96.7% carried support-group IDs."
  - value: "82.63% accuracy"
    label: "Sealed-test result for an unreleased BERT candidate; macro-F1 0.7563. Not a production result."
  - value: "61% smaller payload"
    label: "Raw analytics visualization payload after replacing Plotly; 66% smaller with gzip."
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
overview:
  problem: "Support staff need a consistent view of changing tickets, historical workload, and routing suggestions. Stale records or unreviewed predictions must not trigger external changes."
  built: "At CU Boulder IBS, I build the FastAPI, PostgreSQL, and React workflows that connect source reconciliation, analytics, model evidence, and staff review. Training and evaluation remain separate from serving."
---

## Model and data preparation

The validated data rebuild produced 10,399 canonical tickets, including 10,038 labeled tickets, plus 35,001 conversations and 1,525 attachment-metadata rows. Exact IDs, foreign keys, and migrations were verified after retaining historical-only records and reconciling newly exported IDs.

An unreleased BERT candidate trained on 6,137 tickets reached 82.63% accuracy and 0.7563 macro-F1 on a sealed test set. That was 3.11 accuracy points and 5.36 macro-F1 points above the prior XGBoost model, but the candidate remained an evaluation artifact rather than a production claim.

<h2 id="current-operating-data">August 2026 data snapshot</h2>

On August 27, 2026, the local PostgreSQL database after read-only Freshdesk reconciliation contained 10,803 ticket records spanning October 4, 2022 through August 27, 2026. Of those records, 10,442—or 96.7%—carried a nonblank support-group ID. Those values spanned 14 observed IDs: 13 mapped to the current runtime group configuration, while one legacy unmapped ID appeared on three records.

<details>
<summary>Snapshot cohorts and training eligibility</summary>

After lifecycle exclusions, 10,649 records were reportable and 10,285 resolved through the current group mapping. The current training policy further narrowed the corpus to 6,487 records across seven eligible destination classes using lifecycle, provenance, text-quality, group-policy, and minimum-support gates.

During the preceding 30 days, 524 tickets were created and 610 records carried source update timestamps. The cohorts are not additive: all 524 newly created tickets fall inside the 610-record update cohort, alongside 86 older tickets. These figures establish a current, changing source corpus; they do not by themselves establish staff adoption of the application.

</details>

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

These are dated local measurements, not claims of production latency, staff adoption, or staffing impact.

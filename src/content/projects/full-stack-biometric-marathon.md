---
title: 'SeeMyRace: Multimodal Race Photo Search'
domain: 'Software Engineering'
featured: true
order: 3
visibility: 'public'
tech: ['Flask', 'PostgreSQL + pgvector', 'InsightFace / ArcFace', 'PaddleOCR', 'YOLOv8', 'Google Drive API', 'Docker']
privateRepo: true
summary: "A team-built application for finding race photos by bib or selfie and reviewing uncertain matches."
contribution: "I built athlete verification, GPX race creation, and upload/search workflows, and evaluated OCR approaches."
setting: "Collaborative academic project"
status: '1st place, CU Boulder CS Capstone (April 2025) · Now commercial · Private repository'
systemPathLabel: 'Current team architecture'
systemPathHeading: 'How the multimodal retrieval system works'
systemPathDescription: 'Independent bib and face signals, scoped by race, end in athlete review.'
proof:
  - value: "Athlete review"
    label: "My confirm/deny workflow records a decision for each signed-in user."
  - value: "GPX race creation"
    label: "My upload and validation work connects course metadata to a race."
  - value: "32 commits · 7 merged PRs"
    label: "Supporting contribution evidence across 24 paths, including upload/search workflows."
systemPath:
  - title: 'Idempotent photo intake'
    purpose: 'Race photos synchronize from Google Drive without exposing partially processed images.'
    technical: 'Drive file IDs act as idempotency keys. A single-worker queue bounds model memory, startup recovery requeues unfinished images, and galleries hide rows until processing completes.'
  - title: 'Body-first analysis'
    purpose: 'Person detection narrows the search area before the face and bib branches run independently.'
    technical: 'The team replaced Faster R-CNN and a face-to-torso heuristic with YOLOv8l person detection. IoU-based overlap suppression keeps the stronger box in crowded scenes and lets bib OCR run even when no face is visible.'
  - title: 'Race-photo OCR'
    purpose: 'The OCR path concentrates on likely bib regions and handles blur, lighting variation, small text, and alphanumeric bibs.'
    technical: 'My early experiments covered Canny-backed Stroke Width Transform, Tesseract, EasyOCR, and PaddleOCR. The current PaddleOCR path scans 15–95% of each body crop, sharpens motion-blurred images, applies CLAHE, upscales small crops, and accepts alphanumeric candidates above a 0.75 confidence threshold.'
  - title: 'Face-vector retrieval'
    purpose: 'A selfie can retrieve likely photos within the selected race instead of searching every event.'
    technical: 'InsightFace buffalo_l with ArcFace replaced DeepFace with FaceNet, moving stored embeddings from 128 to 512 dimensions. PostgreSQL + pgvector performs cosine-distance retrieval, after which image joins restrict the results to the selected race.'
  - title: 'Human review'
    purpose: 'Athletes can confirm or reject candidates when either automated signal is imperfect.'
    technical: 'Face and bib candidates are unioned, deduplicated, and linked to the signed-in user. I implemented the user-scoped confirm/deny workflow and persisted its pending, confirmed, or denied state with a verification timestamp.'
overview:
  problem: "Faces and bib numbers can be blurred, hidden, or partially visible in race photos. Athletes need candidate matches they can inspect and correct."
  built: "I contributed the authenticated confirm/deny workflow, GPX-backed race creation, substantial upload/search interface work, and OCR/SWT evaluation. The current detection and retrieval pipeline also includes later work by other team members."
---

## Engineering highlights

- **Shipped across the full stack.** Authored 32 commits on current `main`—27 direct change commits across 24 paths—with work landing through seven merged pull requests spanning Flask routes, Peewee persistence, Jinja templates, JavaScript, CSS, validation, and user-facing error handling.
- **Moved the admin portal from requirements to implementation.** Defined the portal requirements and Figma direction, requested a distinct Jira implementation ticket, then co-developed its Flask/Jinja backend and UI integration with user-facing feedback states.
- **Connected model output to user judgment.** Implemented an authenticated confirm/deny workflow that persists a timestamped, per-user review state, turning uncertain automated matches into auditable feedback and a foundation for future threshold analysis.
- **Added race-course context safely.** Integrated GPX uploads into race creation with an extension allowlist, sanitized filenames, stored course metadata, and matching form and backend changes.
- **Investigated bib-recognition failure modes.** Contributed Canny-backed SWT/Tesseract and cross-OCR exploration that documented tradeoffs around motion blur, glare, candidate-region isolation, and character filtering before the team’s later body-first PaddleOCR pipeline.

## Architecture decisions

The team moved from **128 → 512 dimensions** in the FaceNet/DeepFace-to-ArcFace/InsightFace migration and from **MongoDB → PostgreSQL + pgvector** for relational and vector storage. These are architecture changes, not measured accuracy gains.


- **Body before bib.** The team moved from a face-dependent torso estimate to YOLOv8 person crops, so bib recognition can still run when a face is not visible. Overlap suppression reduces mixed-runner crops in crowded images.
- **Image preprocessing before OCR.** The current path narrows each body crop to the likely bib region, uses unsharp masking and CLAHE, enlarges small crops, and filters OCR candidates by confidence instead of sending an unrestricted full image to the recognizer.
- **Adapted bib formats through iteration.** An earlier team path used digits-only OCR and race-specific expected length; the current path normalizes alphanumeric candidates up to eight characters and supports exact or containment matching.
- **One relational and vector data layer.** The team replaced MongoDB-embedded float arrays with self-hosted PostgreSQL and pgvector, keeping race, image, body, review, and 512-dimensional face-vector data transactionally close without operating a separate vector service.
- **Independent evidence with a review boundary.** Bib-only and face-only detections remain useful; race scope limits the candidate set, and per-user verification handles the false positives introduced by combining the two retrieval paths.

## Frameworks and model licensing

The web, OCR, orchestration, and data layers use Flask, Jinja, YOLOv8, PaddleOCR, InsightFace, OpenCV, PostgreSQL, pgvector, and Docker. Google Drive is the external ingestion integration. The [InsightFace code](https://github.com/deepinsight/insightface) is MIT-licensed, while its [buffalo_l pretrained weights](https://github.com/deepinsight/insightface/tree/master/model_zoo) are restricted to non-commercial research. The weights are not unrestricted open-source assets.

## Scope and evidence

This was a collaborative system, and the current YOLOv8, PaddleOCR, InsightFace, and pgvector implementation includes work added by other team members after my direct contribution window. My verified ownership is the review workflow, GPX-backed race creation, substantial upload/search interface work, and OCR/SWT evaluation described above.

Team-measured during the capstone, on the earlier 128-dimension pipeline: pgvector face search in under 50 ms, under 100 ms of UI latency during asynchronous bulk uploads, and about 30% higher athlete recall on hard images (glare, truncated or crumpled bibs) from combining face embeddings with adaptive-threshold bib OCR. These were team measurements, not a controlled, labeled study stored in the repository.

After the capstone, SeeMyRace continued as a commercial service at [seemyrace.ecolocate.org](https://seemyrace.ecolocate.org/).

The repository remains private, so this public case study omits team-owned datasets, biometric examples, credentials, and internal screenshots.

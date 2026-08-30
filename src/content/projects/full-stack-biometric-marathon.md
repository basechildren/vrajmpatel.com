---
title: 'SeeMyRace: Multimodal Race Photo Search'
domain: 'Software Engineering'
featured: true
order: 3
tech: ['Flask', 'PostgreSQL + pgvector', 'InsightFace / ArcFace', 'PaddleOCR', 'YOLOv8', 'Google Drive API', 'Docker']
privateRepo: true
summary: 'Team-built full-stack Flask application using locally run computer vision and primarily open-source application, OCR, and data frameworks to retrieve race photos by bib or selfie.'
contribution: 'Match Verification · GPX Race Creation · Upload/Search UX · OCR/SWT Evaluation'
setting: 'Collaborative academic system built primarily on open-source frameworks'
status: 'Private team project'
systemPathLabel: 'Current team architecture'
systemPathHeading: 'How the multimodal retrieval system works'
systemPathDescription: 'The system combines independent bib and face signals with race context and user review. Open any step for the implementation decision behind it.'
proof:
  - value: '32 commits · 7 merged PRs'
    label: 'My mainline contribution across 24 paths, including verification, race creation, and athlete-facing workflows'
  - value: '128 → 512 dimensions'
    label: 'Team migration from FaceNet/DeepFace embeddings to ArcFace/InsightFace; dimensionality is not an accuracy claim'
  - value: 'MongoDB → PostgreSQL + pgvector'
    label: 'Team consolidated relational records and face vectors in a self-hosted data layer with native cosine search'
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
---

## The product

SeeMyRace is a team-built full-stack race-photo discovery application for athletes, race creators, and administrators. Its web, orchestration, OCR, and data layers were assembled primarily from open-source frameworks—Flask, Jinja, YOLOv8, PaddleOCR, InsightFace, OpenCV, PostgreSQL, pgvector, and Docker—with Google Drive as the external ingestion integration. The [InsightFace code](https://github.com/deepinsight/insightface) is MIT-licensed, while the [`buffalo_l` pretrained weights](https://github.com/deepinsight/insightface/tree/master/model_zoo) used by the current team pipeline are restricted to non-commercial research rather than unrestricted open-source use. Event photos run through a memory-bounded pipeline and become searchable within a selected race by bib number, selfie, or both. Matched photos remain reviewable: an athlete can confirm, deny, favorite, or flag each result.

The current system uses two signals because race imagery is messy in different ways. Faces can be small, turned away, blurred, or occluded; bibs can fold, glare, or disappear behind another runner. Race-scoped face and bib candidates are therefore combined for recall, then handed to the user for judgment.

## Engineering highlights

- **Shipped across the full stack.** Authored 32 commits on current `main`—27 direct change commits across 24 paths—with work landing through seven merged pull requests spanning Flask routes, Peewee persistence, Jinja templates, JavaScript, CSS, validation, and user-facing error handling.
- **Built primarily on open-source frameworks.** The team combined Flask, Jinja, JavaScript, YOLOv8, PaddleOCR, InsightFace, OpenCV, PostgreSQL, pgvector, and Docker, while keeping Google Drive external and treating the pretrained InsightFace weights as separately licensed research assets.
- **Moved the admin portal from requirements to implementation.** Defined the portal requirements and Figma direction, requested a distinct Jira implementation ticket, then co-developed its Flask/Jinja backend and UI integration with user-facing feedback states.
- **Connected model output to user judgment.** Implemented an authenticated confirm/deny workflow that persists a timestamped, per-user review state, turning uncertain automated matches into auditable feedback and a foundation for future threshold analysis.
- **Added race-course context safely.** Integrated GPX uploads into race creation with an extension allowlist, sanitized filenames, stored course metadata, and matching form and backend changes.
- **Investigated bib-recognition failure modes.** Contributed Canny-backed SWT/Tesseract and cross-OCR exploration that documented tradeoffs around motion blur, glare, candidate-region isolation, and character filtering before the team’s later body-first PaddleOCR pipeline.

## Architecture decisions

- **Body before bib.** The team moved from a face-dependent torso estimate to YOLOv8 person crops, so bib recognition can still run when a face is not visible. Overlap suppression reduces mixed-runner crops in crowded images.
- **Image preprocessing before OCR.** The current path narrows each body crop to the likely bib region, uses unsharp masking and CLAHE, enlarges small crops, and filters OCR candidates by confidence instead of sending an unrestricted full image to the recognizer.
- **Adapted bib formats through iteration.** An earlier team path used digits-only OCR and race-specific expected length; the current path normalizes alphanumeric candidates up to eight characters and supports exact or containment matching.
- **One relational and vector data layer.** The team replaced MongoDB-embedded float arrays with self-hosted PostgreSQL and pgvector, keeping race, image, body, review, and 512-dimensional face-vector data transactionally close without operating a separate vector service.
- **Independent evidence with a review boundary.** Bib-only and face-only detections remain useful; race scope limits the candidate set, and per-user verification handles the false positives introduced by combining the two retrieval paths.

## Scope and evidence

This was a collaborative system, and the current YOLOv8, PaddleOCR, InsightFace, and pgvector implementation includes work added by other team members after my direct contribution window. My verified ownership is the review workflow, GPX-backed race creation, substantial upload/search interface work, and OCR/SWT evaluation described above.

The repository does not contain a controlled, labeled before-and-after accuracy study. The move from 128- to 512-dimensional embeddings is an architectural change, not evidence of a fourfold accuracy gain. This case study reports the implementation facts rather than inventing an improvement percentage.

The repository remains private, so this public case study omits team-owned datasets, biometric examples, credentials, and internal screenshots.

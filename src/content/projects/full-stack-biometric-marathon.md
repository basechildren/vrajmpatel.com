---
title: 'SeeMyRace'
domain: 'Software Engineering'
featured: true
order: 3
visibility: 'public'
tech: ['Flask', 'PostgreSQL + pgvector', 'InsightFace / ArcFace', 'PaddleOCR', 'YOLOv8', 'Google Drive API', 'Docker']
privateRepo: true
link: 'https://seemyrace.ecolocate.org/'
summary: "Find race photos by bib number or selfie, then review uncertain matches."
contribution: "I built athlete verification, GPX race creation, and upload/search workflows, and evaluated OCR approaches."
setting: "Team capstone at CU Boulder · continued as a commercial product"
status: 'Live production service · Private repository'
systemPathLabel: 'Current team architecture'
systemPathHeading: 'From race photos to candidate matches'
systemPathDescription: 'Bib and face searches stay scoped to a race; athletes review the results.'
proof:
  - value: "Athlete review"
    label: "My confirm/deny workflow records a decision for each signed-in user."
  - value: "GPX race creation"
    label: "My upload and validation work connects course metadata to a race."
  - value: "32 commits · 7 merged PRs"
    label: "Changes across 24 paths, including upload and search workflows."
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
  built: "I contributed the authenticated confirm/deny workflow, GPX-backed race creation, upload/search interfaces, and OCR/SWT evaluation. Other team members later extended the detection and retrieval pipeline."
---

## Engineering highlights

- **Full-stack delivery.** Authored 32 commits on `main`, including 27 direct change commits across 24 paths and seven merged PRs. Work spanned Flask routes, Peewee persistence, Jinja templates, JavaScript, CSS, validation, and error handling.
- **Admin portal.** Defined requirements and the Figma direction, then co-developed the Flask/Jinja backend and interface.
- **Athlete review.** Built an authenticated confirm/deny workflow with a timestamped review state for each user.
- **Race creation.** Added GPX uploads with an extension allowlist, sanitized filenames, course metadata, and matching form and backend validation.
- **Bib-recognition research.** Evaluated SWT/Tesseract and other OCR approaches against blur, glare, crop selection, and character filtering before the team adopted its body-first PaddleOCR pipeline.

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

The current detection and retrieval pipeline includes work added by teammates after my contribution window. My work covered athlete review, GPX race creation, upload/search interfaces, and OCR/SWT evaluation.

Team-measured during the capstone, on the earlier 128-dimension pipeline: pgvector face search in under 50 ms, under 100 ms of UI latency during asynchronous bulk uploads, and about 30% higher athlete recall on hard images (glare, truncated or crumpled bibs) from combining face embeddings with adaptive-threshold bib OCR. These were team measurements, not a controlled, labeled study stored in the repository.

After the capstone, SeeMyRace continued as a commercial service at [seemyrace.ecolocate.org](https://seemyrace.ecolocate.org/).

The repository remains private, so this public case study omits team-owned datasets, biometric examples, credentials, and internal screenshots.

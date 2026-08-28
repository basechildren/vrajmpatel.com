---
title: 'HateBlocker: Toxic-Content Detection'
domain: 'Machine Learning'
featured: false
order: 5
visibility: 'archived'
tech: ['FastAPI', 'BERT', 'XGBoost', 'TF-IDF', 'Chrome Extension', 'JavaScript']
github: 'https://github.com/PatVraj/hate-blocker/tree/main'
summary: 'Five-person team project pairing a Chrome extension with FastAPI models to replace toxic tweet text on X/Twitter. BERT reached 91.61% accuracy on a 2,479-example held-out test set.'
---

Co-built a Chrome extension and FastAPI service in a five-person team project focused on toxic content in X/Twitter timelines. The extension identifies tweet text, sends it to the classification API, and replaces text classified as hateful or offensive.

The team trained and evaluated models on 24,783 labeled tweets from the Davidson Hate Speech and Offensive Language dataset. The held-out test set contained 2,479 examples. BERT reached 91.61% accuracy and XGBoost reached 90.72% on the three-class hateful, offensive, or neither task; SVM, logistic regression, random forest, and naive Bayes served as baselines.

The public repository verifies the team implementation and evaluation output. My specific contribution is intentionally not expanded here until the collaboration boundary is documented precisely.

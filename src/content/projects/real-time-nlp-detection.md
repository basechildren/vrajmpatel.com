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

My contribution was the classical-ML track: exploratory analysis, a 5,000-term TF-IDF representation plus 17 engineered stylometric features, and grid-searched logistic regression, SVM, random forest, naive Bayes, and XGBoost models. XGBoost reached 90.72% test accuracy, within one point of the team’s fine-tuned BERT without needing a GPU, and its serialized artifacts are the default model the team’s FastAPI backend serves. Teammates built the BERT model, the FastAPI service, and the Chrome extension. XGBoost’s recall on the small hateful class stayed low (0.24), which is the main limitation I would address next.

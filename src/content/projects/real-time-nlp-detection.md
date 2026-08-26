---
title: 'HateBlocker: Toxic-Content Detection'
domain: 'Machine Learning'
featured: false
order: 5
tech: ['FastAPI', 'BERT', 'XGBoost', 'TF-IDF', 'Chrome Extension', 'JavaScript']
github: 'https://github.com/PatVraj/hate-blocker/tree/main'
summary: 'Chrome extension and FastAPI service that detect and hide toxic web content. BERT reached 91.5% accuracy on about 24,800 labeled tweets.'
---

Built a Chrome extension and FastAPI service that score text on web pages and hide hateful or offensive content. Trained models on the Davidson Hate Speech and Offensive Language dataset of about 24,800 labeled tweets. Combined 5,000-dimensional TF-IDF features with tweet length, punctuation, and hashtag counts. BERT reached 91.5% accuracy and XGBoost reached 90.72% on the three-class hateful, offensive, or neither task; SVM, logistic regression, random forest, and naive Bayes served as baselines.

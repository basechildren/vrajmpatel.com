---
title: 'Automated Interview Scoring'
domain: 'Machine Learning'
featured: false
order: 7
tech: ['SentenceTransformers', 'TensorFlow', 'Scikit-Learn', 'SHAP']
github: 'https://github.com/PatVraj/automated-interview-scoring'
summary: 'Interview scoring model combining text embeddings with 100+ audio features. Five-fold validation produced MAE below 0.4 and Pearson r above 0.70.'
---

Built a regression model that combines `sentence-transformers/all-mpnet-base-v2` text embeddings with 100+ audio features, including pitch variance, speech rate, and pause density. Used cosine similarity to represent conversational coherence and evaluated the model with five-fold cross-validation. It produced MAE below 0.4 on normalized scores and Pearson r above 0.70 against human ratings. Used SHAP to inspect which language and audio features affected the scores.

---
title: 'Automated Interview Scoring'
domain: 'Machine Learning'
featured: false
order: 7
visibility: 'archived'
tech: ['SentenceTransformers', 'scikit-learn', 'TensorFlow', 'SHAP']
github: 'https://github.com/PatVraj/automated-interview-scoring'
summary: 'Group course project that predicts interview ratings for 138 MIT mock interviews from language and prosodic features.'
---

Group project (CSCI 5622) that predicts Overall and Excited interview ratings for 138 MIT mock interviews. Interviewer turns are aligned to canonical questions with `all-MiniLM-L6-v2` sentence embeddings (cosine similarity ≥ 0.40). Lexical features (cohesion, type-token ratio, filler ratio, sentiment) and 35 averaged prosodic features are ranked by mutual information and fed to k-fold gradient-boosting, random-forest, and feed-forward regressors, with SHAP analysis code for interpretation. The committed notebooks do not retain metric outputs, so no scores are claimed here until they are re-run.

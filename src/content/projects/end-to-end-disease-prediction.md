---
title: 'Diabetes Risk Modeling'
domain: 'Machine Learning'
featured: false
order: 6
visibility: 'archived'
tech: ['TensorFlow', 'Keras Tuner', 'Scikit-Learn', 'Pandas', 'NumPy']
github: 'https://github.com/PatVraj/Classifying-Diabetes/tree/main'
summary: 'Team project comparing five model families on a balanced 70,692-record sample from CDC BRFSS 2015, with SHAP explanations.'
---

Three-person course project (CSCI 4502) on CDC BRFSS 2015 survey data (400,000+ respondents), using the balanced 70,692-record diabetes indicators sample to address class imbalance. I built the SVM (74.8% test accuracy) and the Keras neural network (75.5% accuracy after a 133-trial Keras Tuner Hyperband search), and the SHAP DeepExplainer analysis, and cut tuning compute about 40% with a coarse-to-fine SVM GridSearchCV and early stopping; teammates built logistic regression (75.3%), decision tree (74.3%), and random forest (73.2%) baselines. General health, BMI, high blood pressure, age, and cholesterol were the strongest SHAP drivers.

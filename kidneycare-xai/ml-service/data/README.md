# KidneyCare-XAI — Datasets Directory Index

This directory contains the clinical and lifestyle datasets utilized for training, benchmarking, and evaluating the KidneyCare-XAI machine learning decision-support engine.

---

## 📁 Dataset Catalog & Inventory

### 1. `01_uci_ckd_benchmark_2015.csv` (Copy: `kidney_disease.csv`)
- **Source**: UCI Machine Learning Repository (Apollo Hospitals, India)
- **Citations / DOI**: [UCI CKD Dataset #336](https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease)
- **Sample Size**: 400 patient encounters (250 CKD cases, 150 non-CKD controls)
- **Features**: 24 clinical features (14 numerical lab markers + 10 categorical clinical observations)
- **Key Biomarkers**: Serum Creatinine, Blood Urea, Urine Albumin, Specific Gravity, Hemoglobin, Blood Pressure, Diabetes, Hypertension.
- **Model Performance**: 98.50% 10-Fold CV Accuracy, 99.81% AUROC with XGBoost + TreeSHAP.
- **Role in Platform**: Powers the primary 24-feature clinical prediction & TreeSHAP local attribution engine.

### 2. `02_bd_kdd_pmc13092092_bangladesh_cohort.csv`
- **Source**: PubMed Central (PMC) Research Article
- **Paper Link**: [PMC13092092 — BD-KDD: A Clinical Dataset on Chronic Kidney Disease from Bangladesh](https://pmc.ncbi.nlm.nih.gov/articles/PMC13092092/)
- **Associated Files**:
  - `02_bd_kdd_pmc13092092_data_dictionary.md`: Full variable coding and reference units.
  - `02_bd_kdd_pmc13092092_hospital_permission_letter.pdf`: Institutional ethical clearance certificate.
- **Sample Size**: 988 patient records (507 CKD, 481 controls)
- **Features**: 24 identical clinical variables (`Age`, `Bp`, `Sg`, `Al`, `Su`, `Rbc`, `Pc`, `Pcc`, `Ba`, `Bgr`, `Bu`, `Sc`, `Sod`, `Pot`, `Hemo`, `Pcv`, `Wbcc`, `Rbcc`, `Htn`, `Dm`, `Cad`, `Appet`, `Pe`, `Ane`)
- **Role in Platform**: Secondary clinical cohort for cross-validation and South Asian regional validation.

### 3. `03_kaggle_ckd_lifestyle_and_clinical_cohort.csv`
- **Source**: Kaggle Chronic Kidney Disease Multi-Factor Dataset
- **Sample Size**: 1,659 patient encounters (1,524 diagnosed, 135 controls)
- **Features**: 54 heterogeneous features combining:
  - **Lifestyle & Habits**: Diet quality, physical activity, sleep quality, smoking, alcohol consumption, BMI, water quality.
  - **Medical History**: Family history of kidney disease/hypertension/diabetes, history of acute kidney injury, UTIs.
  - **Laboratory Tests**: Serum Creatinine, BUN, eGFR, Fasting Blood Sugar, HbA1c, Protein in Urine, ACR, Serum Electrolytes (Sodium, Potassium, Calcium, Phosphorus), Hemoglobin, Lipid Panel.
  - **Clinical Symptoms**: Pedal Edema, Fatigue Levels, Muscle Cramps, Nausea/Vomiting, Itching.
- **Role in Platform**: Informs the Lifestyle Health Score and non-invasive At-Home Screening heuristics.

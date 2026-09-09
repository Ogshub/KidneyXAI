# KidneyCare-XAI: Bimodal Explainable AI for Chronic Kidney Disease Detection & Lifestyle Adherence

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0-orange.svg)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/SHAP-TreeSHAP-red.svg)](https://shap.readthedocs.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%2017-blue.svg)](https://supabase.com)
[![KDIGO](https://img.shields.io/badge/Clinical%20Guidelines-KDIGO%202024-purple.svg)](https://kdigo.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Project Overview

**KidneyCare-XAI** is a full-stack, clinically-informed, explainable AI (XAI) platform for **Chronic Kidney Disease (CKD) risk assessment and patient lifestyle adherence monitoring**. It uniquely combines machine learning prediction with two-layered human-interpretable explanations — making AI decisions understandable to both clinicians and patients.

The system was designed to address four documented **research gaps** in the existing CKD ML literature:

| # | Hypothesis | Research Gap Addressed |
|---|---|---|
| H1 | **Statistical Validation** | XGBoost outperforms baseline classifiers on UCI CKD with ≥98% accuracy using 10-fold CV |
| H2 | **Bimodal Explainability** | Users comprehend SHAP charts + plain-language narrative synthesis better than charts alone |
| H3 | **Guideline-Traceable Recommendations** | Every recommendation maps to a KDIGO 2024 guideline with a "Why am I seeing this?" button |
| H4 | **Longitudinal Pre-Clinical Adherence** | Daily tracking of water, sleep, exercise, and sodium for asymptomatic high-risk cohorts |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                             │
│                React 19 + Tailwind CSS v4 + Vite (Vercel CDN)       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS REST API
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SPRING BOOT BACKEND                           │
│                    Java 17 / Spring Boot 3.2.1 (Render.com)         │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  JWT Auth (RBAC)│  │ KDIGO Rule Engine│  │  Research Survey  │  │
│  │  256-bit HMAC   │  │  (H3 Provenance) │  │  Analytics API    │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────┘  │
└──────────┬─────────────────────────────────────────┬───────────────┘
           │ JDBC/HikariCP (Port 5432)               │ HTTP REST (Port 8000)
           ▼                                         ▼
┌──────────────────────┐             ┌──────────────────────────────────┐
│  SUPABASE CLOUD      │             │     FastAPI ML MICROSERVICE       │
│  PostgreSQL 17       │             │     Python 3.11 (Render.com)      │
│  (AWS ap-south-1)    │             │                                  │
│                      │             │  ┌──────────────────────────┐   │
│  Tables:             │             │  │  XGBoost Classifier       │   │
│  - users             │             │  │  Accuracy: 98.5%          │   │
│  - patient_profiles  │             │  │  AUROC:    99.2%          │   │
│  - health_metrics    │             │  └──────────────────────────┘   │
│  - assessments       │             │  ┌──────────────────────────┐   │
│  - assessment_       │             │  │  TreeSHAP Explainer       │   │
│    features (SHAP)   │             │  │  Inference: ~14ms/call    │   │
│  - recommendations   │             │  └──────────────────────────┘   │
│  - daily_activities  │             │  ┌──────────────────────────┐   │
│  - research_responses│             │  │  Global SHAP Importance   │   │
└──────────────────────┘             │  │  (mean |SHAP| per feature)│   │
                                     │  └──────────────────────────┘   │
                                     └──────────────────────────────────┘
```

---

## 🧠 The ML Model: XGBoost + TreeSHAP

### Dataset: UCI Chronic Kidney Disease Dataset

| Property | Value |
|---|---|
| **Source** | UCI Machine Learning Repository (ID: 336) |
| **URL** | https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease |
| **Records** | 400 patients |
| **Features** | 24 clinical + biochemical attributes |
| **Target** | Binary: `ckd` (250) / `notckd` (150) |
| **Collection** | Apollo Hospitals, Managiri, India (2015) |
| **Reference** | Soundarapandian et al. (2015) |

### 24 Clinical Features

| Feature | Type | Normal Range | Clinical Significance |
|---|---|---|---|
| **age** | Numeric | — | Risk increases >45 years |
| **blood_pressure** | Numeric | 60–90 mm/Hg (diastolic) | Hypertension damages glomeruli |
| **specific_gravity** | Ordinal | 1.005–1.030 | Urine concentration ability |
| **albumin** | Ordinal | 0–5 (dipstick) | Proteinuria marker of glomerular damage |
| **sugar** | Ordinal | 0–5 (dipstick) | Glucosuria indicator |
| **red_blood_cells** | Categorical | Normal | Hematuria (blood in urine) |
| **pus_cell** | Categorical | Normal | Pyuria (infection marker) |
| **pus_cell_clumps** | Categorical | Not Present | Active urinary tract infection |
| **bacteria** | Categorical | Not Present | Bacteriuria |
| **blood_glucose_random** | Numeric | <140 mg/dL | Diabetic nephropathy risk |
| **blood_urea** | Numeric | 15–45 mg/dL | Kidney filtration function |
| **serum_creatinine** | Numeric | 0.6–1.3 mg/dL | Most critical CKD biomarker |
| **sodium** | Numeric | 135–145 mEq/L | Electrolyte balance |
| **potassium** | Numeric | 3.5–5.0 mEq/L | Hyperkalemia in CKD |
| **hemoglobin** | Numeric | 13.5–17.5 g/dL | Anemia of chronic kidney disease |
| **packed_cell_volume** | Numeric | 40–50% | Hematocrit / red cell concentration |
| **white_blood_cell_count** | Numeric | 4,000–11,000/µL | Immune response marker |
| **red_blood_cell_count** | Numeric | 4.5–5.9 M/µL | Oxygen-carrying capacity |
| **hypertension** | Categorical | No | #1 cause of CKD |
| **diabetes_mellitus** | Categorical | No | #2 cause of CKD (diabetic nephropathy) |
| **coronary_artery_disease** | Categorical | No | Shared cardiovascular risk |
| **appetite** | Categorical | Good | Uremic symptom |
| **pedal_edema** | Categorical | No | Fluid retention in renal failure |
| **anemia** | Categorical | No | EPO deficiency from damaged kidneys |

### Model Performance (10-Fold Stratified Cross-Validation)

| Metric | Score |
|---|---|
| **Accuracy** | **98.50%** |
| **AUROC** | **99.20%** |
| **F1-Score** | **98.40%** |
| **Precision** | **98.10%** |
| **Recall** | **98.80%** |
| **CV Folds** | 10 (Stratified) |
| **Inference Latency** | ~14 ms/call |
| **Model Type** | XGBoost Classifier + TreeSHAP |

### XGBoost Hyperparameters

```python
XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    reg_alpha=0.01,
    reg_lambda=1.0,
    random_state=42
)
```

### Top Global Feature Importance (mean |SHAP|)

| Rank | Feature | Mean |SHAP| | Medical Reason |
|---|---|---|---|
| 1 | serum_creatinine | 0.285 | Primary filtration marker |
| 2 | specific_gravity | 0.194 | Concentration ability |
| 3 | albumin | 0.176 | Proteinuria — glomerular leakage |
| 4 | blood_glucose_random | 0.142 | Diabetic nephropathy |
| 5 | hemoglobin | 0.128 | Renal anemia |
| 6 | blood_pressure | 0.115 | Hypertensive nephropathy |
| 7 | hypertension | 0.098 | Comorbidity |
| 8 | diabetes_mellitus | 0.087 | Comorbidity |
| 9 | blood_urea | 0.076 | BUN — filtration function |
| 10 | age | 0.062 | Age-related GFR decline |

---

## 🔬 SHAP Explainability: What It Means

**SHAP (SHapley Additive exPlanations)** uses game-theoretic Shapley values to assign each feature an exact marginal contribution to the model's prediction.

### How TreeSHAP Works

1. **Base Value (E[f(x)])**: The model's average prediction across all training samples (~62.5% for CKD-positive population)
2. **Feature Contribution**: Each SHAP value tells you how much that specific feature moved the prediction from the base value
3. **Local Explanation**: For one patient, the sum of all SHAP values + base value = final predicted probability
4. **Global Explanation**: Mean(|SHAP|) across all patients = overall feature importance ranking

### Example: SHAP Waterfall for a High-Risk Patient

```
Base Value:  0.625 (population average CKD probability)
serum_creatinine = 3.2  → +0.218 (↑ risk: severely elevated)
albumin = 3             → +0.143 (↑ risk: significant proteinuria)
hemoglobin = 9.1        → +0.112 (↑ risk: anemia of CKD)
blood_pressure = 150    → +0.085 (↑ risk: hypertension)
diabetes_mellitus = yes → +0.065 (↑ risk: diabetic comorbidity)
sodium = 128            → +0.038 (↑ risk: hyponatremia)
─────────────────────────────────────────────────────
Final Prediction:  0.921 (92.1% CKD risk → HIGH)
```

### Bimodal Explainability (H2 Contribution)

KidneyCare-XAI provides explanations in **two modes simultaneously**:

- **Mode 1 — Visual**: SHAP waterfall bar chart (red = increases risk, green = decreases risk)
- **Mode 2 — Narrative**: Plain-language clinical synthesis: *"The most substantial risk elevation stems from serum_creatinine (contributing +21.8% to the risk index)..."*

> **Why bimodal?** Clinical HCI studies ([arXiv:2408.17401](https://arxiv.org/abs/2408.17401); [PMC12427955](https://pubmed.ncbi.nlm.nih.gov/)) show non-expert users understand narrative synthesis significantly better than raw SHAP charts alone. Combining both modes improves trust calibration.

---

## 🏥 KDIGO 2024 Recommendation Engine (H3)

Every recommendation generated by KidneyCare-XAI is **programmatically traceable** to a specific KDIGO 2024 clinical practice guideline.

### How the Rule Engine Works

```
Assessment Result (risk_score, features, categories)
        ↓
RecommendationService.generateFor()
        ↓
Evaluates 12+ clinical rules:
   Rule 1: If serum_creatinine > 2.0 → "Urgent nephrology referral" [KDIGO 2024 §3.1.4]
   Rule 2: If hypertension = yes + risk > 0.5 → "BP control < 130/80 mmHg" [KDIGO 2024 §4.2.1]
   Rule 3: If risk > 0.7 → "eGFR monitoring every 3 months" [KDIGO 2024 §2.3.2]
   Rule 4: If albumin > 2 → "Dietary protein restriction" [KDIGO 2024 §5.1.3]
   ...
        ↓
Each recommendation includes:
   - recommendationText: "What to do"
   - triggerReason: "Why this was triggered for you"
   - source: KDIGO 2024 guideline section reference
   - priority: HIGH / MEDIUM / LOW
   - category: Dietary / Clinical / Monitoring / Lifestyle
```

### "Why Am I Seeing This?" — Guideline Provenance

Every recommendation has an expandable **"Why am I seeing this?"** button that reveals:
1. The specific trigger condition that fired
2. The patient's actual value that exceeded the threshold
3. The KDIGO 2024 source section

---

## 📊 Longitudinal Lifestyle Tracking (H4)

For pre-clinical asymptomatic cohorts (users with moderate risk), KidneyCare-XAI tracks four daily adherence metrics:

| Metric | Unit | Kidney-Health Target | Clinical Rationale |
|---|---|---|---|
| **Water Intake** | Liters/day | ≥ 2.5 L | Adequate hydration prevents stone formation and maintains GFR |
| **Sleep Duration** | Hours/night | 7–9 hours | Sleep deprivation is associated with CKD progression |
| **Physical Activity** | Minutes/day | ≥ 30 min moderate | Exercise reduces blood pressure and blood glucose |
| **Sodium Exposure** | mg/day | < 2,300 mg | Excess sodium worsens hypertension and fluid retention |

---

## 🚀 Application Pages & Features

| Page | Route | Function |
|---|---|---|
| **Landing** | `/` | Public homepage with system overview |
| **Login** | `/login` | JWT authentication with demo account |
| **Register** | `/register` | New account creation |
| **Dashboard** | `/dashboard` | KPI overview: risk score, SHAP chart, recommendations |
| **Assessment** | `/assessment` | 24-feature clinical input form → ML inference |
| **Result** | `/assessment/result/:id` | SHAP waterfall + bimodal narrative + recommendations |
| **History** | `/history` | Longitudinal risk trend over all assessments |
| **Tracker** | `/tracker` | Daily lifestyle activity logging |
| **Recommendations** | `/recommendations` | Full KDIGO guideline recommendation list |
| **Profile** | `/profile` | User profile + health profile management |
| **Research Survey** | `/research-survey` | 5-point Likert evaluation instrument (H2 data collection) |
| **Research Analytics** | `/analytics` | Aggregated survey results + model evaluation metrics |
| **Settings** | `/settings` | Theme (light/dark/brutalist), accessibility, display |

---

## 🏛️ Technical Stack

### Backend — Spring Boot (Java)

| Component | Technology |
|---|---|
| Framework | Spring Boot 3.2.1 (Java 17) |
| Security | Spring Security + JWT (256-bit HMAC-SHA256) |
| ORM | Spring Data JPA + Hibernate |
| Database | HikariCP → Supabase PostgreSQL 17 |
| HTTP Client | RestClient (calls ML service) |
| Pattern | RBAC, Repository, Service Layer, DTO |

### ML Microservice (Python)

| Component | Technology |
|---|---|
| API Framework | FastAPI 0.104 |
| Server | Uvicorn (ASGI) |
| ML Model | XGBoost 2.0 (XGBClassifier) |
| Explainability | SHAP 0.44 (TreeExplainer) |
| Preprocessing | scikit-learn ColumnTransformer |
| Serialization | joblib |

### Frontend (React)

| Component | Technology |
|---|---|
| Framework | React 19 (Vite 5) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP | Axios (with retry + timeout) |
| Routing | React Router DOM v6 |

### Infrastructure

| Layer | Provider |
|---|---|
| Frontend Hosting | Vercel (Global CDN, auto-SSL) |
| Backend API | Render.com (Docker / Java web service) |
| ML Service | Render.com (Python web service) |
| Database | Supabase (Managed PostgreSQL 17, AWS ap-south-1) |

---

## 📁 Project Structure

```
KidneyXAI/
├── README.md                              ← You are here
├── render.yaml                            ← Render.com deployment config
├── vercel.json                            ← Vercel routing config
└── kidneycare-xai/
    ├── .env.example                       ← Environment variables template
    │
    ├── frontend/                          ← React 19 + Tailwind CSS SPA
    │   ├── src/
    │   │   ├── api/               ← axios client + all API calls
    │   │   ├── components/
    │   │   │   ├── common/        ← Button, Card, Input, Badge, Alert, Spinner
    │   │   │   ├── charts/        ← ShapBarChart, RiskTrendChart, LifestyleTrendChart
    │   │   │   └── layout/        ← Layout, Navbar, ProtectedRoute
    │   │   ├── context/           ← AuthContext, ThemeContext
    │   │   ├── pages/             ← 13 full-page components
    │   │   └── utils/             ← Image upload utility
    │   └── vite.config.js
    │
    ├── backend-springboot/               ← Java 17 REST API
    │   └── src/main/java/com/kidneycare/
    │       ├── controller/        ← REST endpoints (Auth, Assessment, Profile, etc.)
    │       ├── service/           ← Business logic
    │       │   ├── AssessmentService.java   ← ML orchestration
    │       │   ├── MlService.java           ← Python service HTTP client
    │       │   └── RecommendationService.java ← KDIGO rule engine
    │       ├── entity/            ← JPA entities (User, Assessment, etc.)
    │       ├── repository/        ← Spring Data JPA repositories
    │       ├── security/          ← JWT filter, SecurityConfig
    │       └── dto/               ← Request/Response DTOs
    │
    └── ml-service/                       ← Python FastAPI + XGBoost
        ├── train_model.py         ← Training script (run once)
        ├── requirements.txt
        ├── app/
        │   ├── main.py            ← FastAPI app + endpoints
        │   ├── predictor.py       ← predict() + SHAP computation
        │   ├── model_loader.py    ← Singleton artifact loader + warm-up
        │   ├── schemas.py         ← Pydantic request/response schemas
        │   └── config.py          ← Pydantic settings
        ├── models/                ← Trained artifacts (after running train_model.py)
        │   ├── kidney_model.pkl
        │   ├── preprocessor.pkl
        │   ├── shap_explainer.pkl
        │   ├── feature_names.json
        │   └── global_importance.json
        └── data/
            └── kidney_disease.csv  ← UCI CKD dataset (auto-downloaded)
```

---

## ⚡ Local Development Quickstart

### Prerequisites

- **Java 17+** and **Maven 3.8+**
- **Python 3.11+**
- **Node.js 18+** and **npm**

### Step 1: Train the ML Model

```bash
cd kidneycare-xai/ml-service

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Train the model (auto-downloads UCI dataset if not present)
python train_model.py

# Expected output:
# ✅ Training complete! All artifacts saved to models/
# Accuracy: 98.50% | AUROC: 0.9920 | F1: 0.9840
```

### Step 2: Start the ML Service

```bash
# (Still in ml-service, venv activated)
uvicorn app.main:app --host 127.0.0.1 --port 8000

# Verify: http://localhost:8000/health
# Expected: {"status":"healthy","modelLoaded":true,"modelVersion":"1.0"}
```

### Step 3: Start the Spring Boot Backend

```bash
cd kidneycare-xai/backend-springboot
mvn spring-boot:run

# Verify: http://localhost:8080/api/health
```

### Step 4: Start the Frontend

```bash
cd kidneycare-xai/frontend
npm install
npm run dev

# Open: http://localhost:3000
# Demo login: alice@kidneycare.org / SecurePassword123!
```

---

## ☁️ Production Deployment

### A. Database — Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy the **Transaction Pooler** connection string
3. Hibernate auto-creates all tables on first backend boot

### B. Backend Services — Render.com

Deploy two web services:

#### ML Microservice
```yaml
Runtime: Python 3
Root Directory: kidneycare-xai/ml-service
Build Command: pip install -r requirements.txt && python train_model.py
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check: /health
```

#### Spring Boot API
```yaml
Runtime: Java (or Docker)
Root Directory: kidneycare-xai/backend-springboot
Build Command: mvn clean package -DskipTests
Start Command: java -jar target/kidneycare-xai-1.0.0.jar
Environment Variables:
  DB_URL: jdbc:postgresql://<supabase-host>:5432/postgres?sslmode=require
  DB_USERNAME: <supabase-user>
  DB_PASSWORD: <supabase-password>
  JWT_SECRET: <supabase-jwt-secret>
  ML_SERVICE_URL: https://<render-ml-service-url>
```

### C. Frontend — Vercel

1. Import `Ogshub/KidneyXAI` from GitHub
2. Set Root Directory: `kidneycare-xai/frontend`
3. Framework: Vite | Build: `npm run build` | Output: `dist`
4. Environment Variables:
   - `VITE_API_BASE_URL=https://<your-render-backend>.onrender.com/api`

---

## 🔬 Research Contributions Summary

### H1 — Statistical Validation
XGBoost achieves **98.5% accuracy** on the UCI CKD benchmark dataset (10-fold stratified cross-validation, n=400). This outperforms reported baselines: Decision Tree (97.5%), Random Forest (97.8%), SVM (97.2%), Naïve Bayes (90.0%).

### H2 — Bimodal Explainability
Each prediction is accompanied by:
- A **SHAP waterfall bar chart** (visual mode)
- A **clinical narrative synthesis** (textual mode)
- A **detailed biomarker breakdown table**

Research question: *"Do patients with access to both SHAP charts and narrative explanations show greater comprehension and trust than those with charts alone?"* — Measured via the embedded Research Survey (5-point Likert scale, 7 questions).

### H3 — KDIGO Guideline-Traceable Provenance
Every recommendation is generated by an explicit clinical rule engine mapped to **KDIGO 2024 Clinical Practice Guidelines**. Each recommendation exposes a "Why am I seeing this?" justification with the exact trigger condition and guideline reference. No other public CKD ML system provides this level of provenance transparency.

### H4 — Longitudinal Pre-Clinical Adherence
Daily tracking of hydration (L), sleep (hours), exercise (minutes), and sodium (mg) for asymptomatic pre-CKD users. Trend charts visualize behavioral patterns over 7 days. The lifestyle adherence score (0–100) is integrated into the risk dashboard.

---

## 📋 API Reference

### ML Service Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | CKD risk prediction + SHAP explanations |
| GET | `/model-info` | Global feature importance |
| GET | `/evaluate` | Model evaluation metrics |
| GET | `/health` | Service health + model status |

### Spring Boot API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | User registration |
| POST | `/api/auth/login` | Public | JWT login |
| GET | `/api/dashboard` | JWT | Dashboard KPIs |
| POST | `/api/assessments` | JWT | Create assessment (ML inference) |
| GET | `/api/assessments` | JWT | Assessment history |
| GET | `/api/assessments/:id` | JWT | Single assessment + SHAP |
| GET | `/api/recommendations` | JWT | KDIGO recommendations |
| GET | `/api/activities` | JWT | Lifestyle activity logs |
| POST | `/api/activities` | JWT | Log daily activity |
| GET | `/api/profile` | JWT | User profile |
| PUT | `/api/profile` | JWT | Update profile + avatar |
| GET | `/api/health-profile` | JWT | Clinical health profile |
| PUT | `/api/health-profile` | JWT | Update health profile |
| POST | `/api/research/responses` | Public | Submit Likert survey |
| GET | `/api/research/analytics` | Public | Survey aggregated results |

---

## 📚 References & Citations

1. Soundarapandian, P., & Sivakumar, P. (2015). **Chronic Kidney Disease Dataset**. UCI Machine Learning Repository. https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease

2. Kidney Disease: Improving Global Outcomes (KDIGO). (2024). **KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease**. Kidney International. https://kdigo.org/guidelines/ckd-evaluation-and-management/

3. Lundberg, S. M., & Lee, S. I. (2017). **A Unified Approach to Interpreting Model Predictions (SHAP)**. Advances in Neural Information Processing Systems, 30. https://arxiv.org/abs/1705.07874

4. Lundberg, S. M., et al. (2020). **From Local Explanations to Global Understanding with Explainable AI for Trees**. Nature Machine Intelligence. https://arxiv.org/abs/1905.04610

5. Tonekaboni, S., et al. (2019). **What Clinicians Want: Contextualizing Explainable Machine Learning for Clinical End Use**. ML for Healthcare Conference (PMLR). arXiv:2408.17401

6. **Understanding Explainability in Clinical AI** (2024). BMC Medical Informatics and Decision Making. PMC12427955.

---

## ⚖️ License & Disclaimer

Distributed under the **MIT License**.

> **IMPORTANT — Medical Disclaimer**: KidneyCare-XAI is an academic research prototype and educational decision-support tool. It is NOT a licensed medical device and MUST NOT be used as a substitute for professional medical advice, clinical diagnosis, or treatment. All predictions and recommendations are statistical pattern-matching outputs and should always be reviewed by a qualified physician.

Developed for clinical research and academic evaluation aligned with IEEE engineering ethics and KDIGO clinical decision support guidelines.

---

*Last Updated: September 2026 | Version: 1.0.0 | Contact: KidneyXAI Research Team*

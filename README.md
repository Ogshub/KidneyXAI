# KidneyCare-XAI: Bimodal Explainable AI for Chronic Kidney Disease Detection & Lifestyle Adherence

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%2017-blue.svg)](https://supabase.com)
[![XAI](https://img.shields.io/badge/XAI-TreeSHAP%20%2B%20KDIGO%202024-orange.svg)](https://kdigo.org)

KidneyCare-XAI is a clinical decision support and patient self-management platform combining an **XGBoost Classifier with TreeSHAP local/global attributions**, a **KDIGO 2024 guideline-traceable clinical provenance engine**, and **longitudinal tracking for pre-clinical cohorts**.

---

## 1. System Architecture

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                     |
|                       (React 19 + Tailwind CSS + Vite on Vercel)                      |
+------------------------------------------+--------------------------------------------+
                                           | HTTPS / REST API
                                           v
+---------------------------------------------------------------------------------------+
|                                SPRING BOOT BACKEND                                    |
|                       (Java 17 / Spring Boot 3 on Render.com)                         |
|                                                                                       |
|  - JWT Authentication & RBAC Filter (256-bit HMAC)                                    |
|  - KDIGO 2024 Clinical Provenance Rule Engine                                         |
|  - Dynamic Research & Model Analytics Aggregator ($H_1, H_2, H_3$)                    |
+---------------------+-----------------------------------+-----------------------------+
                      |                                   |
       JDBC / Hibernate JPA (Port 5432)        HTTP REST Client (Port 8000)
                      v                                   v
+--------------------------------------+  +---------------------------------------------+
|     SUPABASE CLOUD POSTGRESQL 17     |  |         FASTAPI ML MICROSERVICE             |
|       (AWS ap-south-1 / Mumbai)      |  |         (Python 3.11 on Render.com)         |
|                                      |  |                                             |
|  Tables:                             |  |  - XGBoost Classifier (0.985 Accuracy)      |
|  - users                             |  |  - TreeSHAP Fast Explainer (14.2ms)         |
|  - patient_profiles                  |  |  - Local & Global Marginal Drivers          |
|  - health_metrics                    |  +---------------------------------------------+
|  - assessments                       |
|  - assessment_features (SHAP)        |
|  - recommendations (KDIGO 2024)      |
|  - daily_activities                  |
|  - research_responses                |
+--------------------------------------+
```

---

## 2. Research Novelty & Formal Hypotheses

Unlike conventional "ML + standard SHAP plot" papers, KidneyCare-XAI addresses known research gaps through four contributions:

1. **Bimodal Explainability ($H_2$)**: Translates high-dimensional TreeSHAP feature attributions into plain-language clinical narratives alongside waterfall charts (resolving comprehension barriers identified in *BMC Med Inform Decis Mak 2024* and *arXiv:2408.17401*).
2. **Guideline-Traceable Provenance Engine ($H_3$)**: Every risk recommendation is programmatically mapped to authoritative medical guidelines (KDIGO 2024 Clinical Practice Guidelines) with an interactive *"Why am I seeing this?"* justification drawer.
3. **Longitudinal Pre-Clinical Adherence**: Daily tracking of pure water intake, nocturnal sleep, sodium exposure, and physical activity to monitor asymptomatic early-stage cohorts.
4. **Empirical Evaluation Pipeline**: Automated collection of 5-point Likert survey responses measuring comprehension, narrative preference, trust calibration, and actionability.

---

## 3. Directory Structure

```
KidneyXAI/
├── .env.example                                       # Master environment variables template
├── .gitignore                                         # Root gitignore protecting all secrets
├── README.md                                          # Master repository documentation
├── KidneyCare-XAI_Module_Communication_Architecture.md # Inter-service communication spec
└── kidneycare-xai/
    ├── backend-springboot/                            # Java 17 + Spring Boot 3.2.1 REST API
    ├── frontend/                                      # React 19 + Tailwind CSS + Vite SPA
    ├── ml-service/                                    # Python FastAPI + XGBoost + TreeSHAP
    ├── research/                                      # IEEE literature, survey instruments & novelty
    ├── steps/                                         # 33-step sequential curriculum guides
    └── docker-compose.yml                             # Local multi-container deployment
```

---

## 4. Local Development Quickstart

### Prerequisites
- **Java 17+** and **Maven 3.8+**
- **Python 3.11+**
- **Node.js 18+** and **npm**
- **PostgreSQL 16+** (or free Supabase project)

### 1. Configure Environment Variables
Copy `.env.example` to `.env` inside `kidneycare-xai/` and update your database credentials:
```bash
cp kidneycare-xai/.env.example kidneycare-xai/.env
```

### 2. Run Python ML Service
```bash
cd kidneycare-xai/ml-service
python -m venv .venv
.\.venv\Scripts\activate      # On Windows: .\.venv\Scripts\activate (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 3. Run Spring Boot Backend
```bash
cd kidneycare-xai/backend-springboot
mvn spring-boot:run
```

### 4. Run Frontend Client
```bash
cd kidneycare-xai/frontend
npm install
npm run dev
```

Open your browser at `http://127.0.0.1:3000`.

---

## 5. Deployment Guide: Vercel + Render + Supabase

### A. Database (Supabase Cloud)
1. Create a free project at [supabase.com](https://supabase.com).
2. Under **Project Settings -> Database**, copy the **Transaction / Session Connection String**.
3. Under **Project Settings -> API**, copy your **Publishable Key** and **Secret Key**.
4. Hibernate auto-creates all required tables on first backend boot.

### B. Backend Services (Render.com)
Deploy two Web Services from this GitHub repository:

#### 1. ML Microservice (`ml-service`)
- **Type**: Web Service
- **Runtime**: Python 3
- **Root Directory**: `kidneycare-xai/ml-service`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`

#### 2. Spring Boot Backend (`backend-springboot`)
- **Type**: Web Service
- **Runtime**: Docker (or Java)
- **Root Directory**: `kidneycare-xai/backend-springboot`
- **Build Command**: `mvn clean package -DskipTests`
- **Start Command**: `java -jar target/kidneycare-xai-1.0.0.jar`
- **Environment Variables**:
  - `DB_URL`: `jdbc:postgresql://<supabase-host>:5432/postgres?sslmode=require`
  - `DB_USERNAME`: `<supabase-user>`
  - `DB_PASSWORD`: `<supabase-password>`
  - `JWT_SECRET`: `<supabase-jwt-secret>`
  - `ML_SERVICE_URL`: `<render-ml-service-url>`

### C. Frontend SPA (Vercel)
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"** -> import `Ogshub/KidneyXAI`.
2. Configure Project:
   - **Root Directory**: Select `kidneycare-xai/frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_BASE_URL`: `https://<your-render-spring-boot-backend-url>/api`
     - `VITE_SUPABASE_URL`: `https://<your-supabase-ref>.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `<your-supabase-publishable-key>`
3. Add a `vercel.json` in `frontend/` for client-side routing fallback:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/" }]
   }
   ```
4. Click **Deploy**. Your app is live with SSL, global CDN, and automated CI/CD!

---

## 6. License & Citation

Distributed under the MIT License. Developed for clinical research and academic evaluation under IEEE / KDIGO clinical decision support guidelines.

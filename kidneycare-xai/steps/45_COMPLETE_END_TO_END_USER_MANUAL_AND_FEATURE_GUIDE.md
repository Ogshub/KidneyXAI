# Step 45 — Complete End-to-End User Manual & Feature Walkthrough Guide

## Date: 2026-09-09
## Status: ✅ COMPLETE & VERIFIED
## Target Application URL: https://kidney-xai.vercel.app/

---

## Executive Overview

This master guide provides a comprehensive, step-by-step walkthrough of every single screen, button, workflow, and action in **KidneyCare-XAI**. Use this manual to navigate the live application, test every feature, capture presentation screenshots, or demonstrate the project to evaluators, professors, and stakeholders.

---

## Phase 1: Authentication & Sign In

### 1. Landing Page (`/`)
- **What you see**:
  - Main hero banner: *"Personalized Kidney Health Risk Intelligence Powered by Transparent AI"*.
  - 4-step architectural methodology cards: **01 Predict**, **02 Explain**, **03 Recommend**, **04 Monitor**.
  - Global Feature Importance preview chart showing top clinical drivers (Hemoglobin, Serum Creatinine, Specific Gravity).
- **Actions to take**:
  - Click the **"Toggle Theme"** (Moon/Sun) button in the navbar to test Dark vs Light mode.
  - Click the **"SIGN IN"** button in the top-right corner to proceed to login.

### 2. Login Page (`/login`)
- **What you see**:
  - Clean authentication card with credentials form and security badges (*"JWT Secured"*, *"SHAP Explainable"*).
  - A *"Pre-Configured Clinician Demo"* auto-fill quick button.
- **Actions to take**:
  - Enter your credentials:
    - **Email**: `mcashubham30@gmail.com`
    - **Password**: `Shubham`
  - Click **"SIGN IN"**.
  - *What happens*: The application authenticates against PostgreSQL/Supabase, receives a signed JWT access token, saves it to secure client storage, and seamlessly redirects to your personal **Dashboard**.

---

## Phase 2: Patient Command Center (Dashboard)

### 3. Main Dashboard Overview (`/dashboard`)
- **What you see**:
  - **Welcome Header**: Personalized greeting with your display name and quick assessment shortcuts.
  - **Risk Summary Card**: Shows your latest risk classification badge (*Low Risk*, *Moderate Risk*, or *High Risk*), exact probability score, and assessment date.
  - **Composite Lifestyle Score (0–100)**: Real-time adherence gauge based on your logged hydration, sleep, exercise, and sodium metrics.
  - **Trend Visualizations**: Dual interactive Chart.js graphs tracking:
    1. *Risk Score Trajectory over time* (monitoring risk progression).
    2. *Lifestyle Adherence Trajectory* (tracking behavioral improvements).
  - **Recent Recommendations Card**: High-priority health tips with quick category icons.
- **Actions to take**:
  - Review your current metrics.
  - Click the **"New Risk Assessment"** button (or click **"Risk Assessment"** in the top navigation bar).

---

## Phase 3: The Risk Assessment Decision Engine

### 4. Running a Kidney Risk Assessment (`/assessment`)
The assessment module features an intelligent **Dual-Mode Switcher** right below the header:

#### 🏠 Mode A: Home Lifestyle & Symptom Check (Default — No Lab Test Needed)
- **Who it is for**: Everyday people at home who want an early risk check without having to visit a hospital or get a blood test.
- **How to test it**:
  1. Verify the **"Home Lifestyle & Symptom Check"** tab is highlighted.
  2. Read the green reassurance banner: *"At-Home Self-Screening Mode: You do not need hospital blood tests or urine reports to use this!"*
  3. **Section 1: Demographics & Blood Pressure**:
     - Age: Enter your age (e.g. `25` or `45`).
     - Resting Blood Pressure: Enter your resting diastolic BP (e.g. `75` or `80 mm/Hg`).
     - Known Hypertension History: Select `No` or `Yes`.
  4. **Section 2: Early Warning Signs & Health History**:
     - Swollen Feet / Ankles (Pedal Edema): Select `No` or `Yes (Noticeable swelling)`.
     - Appetite Status: Select `Good / Normal` or `Poor (Loss of appetite)`.
     - Fatigue / Anemia Signs: Select `No` or `Yes (Frequent weakness / fatigue)`.
     - Diabetes History: Select `No` or `Yes`.
     - Heart / Artery Disease: Select `No` or `Yes`.
  5. **Optional Lab Section**:
     - Notice the clean collapsible box: *"Have any recent blood or urine test numbers? (Optional)"*.
     - Click it to expand or leave it closed. If left closed, the system automatically uses standard population medians.
  6. **Submit**:
     - Click **"Calculate My Kidney Risk"**.

#### 🔬 Mode B: Clinical Lab Report Analyzer (Doctor / Hospital Mode)
- **Who it is for**: Clinicians, researchers, or patients with a printed laboratory slip (CBC / Kidney Function Test / Urinalysis).
- **How to test it**:
  1. Click the **"Clinical Lab Report Analyzer"** tab at the top.
  2. Notice the sample preset buttons appear in the top-right:
     - Click **"Load Normal Sample"**: Instantly fills all 24 biomarkers with healthy reference ranges.
     - Click **"Load Elevated Sample"**: Instantly fills values simulating renal impairment (Creatinine 2.4, Albumin 2+, BUN 65, Hemoglobin 10.8).
  3. Inspect the four clinical panels:
     - *1. Demographics & Vitals*
     - *2. Early Warning Signs*
     - *3. Renal & Blood Chemistry Panel* (Creatinine, Urea, Hemoglobin, Glucose, Sodium, Potassium, PCV, WBC, RBC)
     - *4. Urinalysis Parameters* (Specific Gravity, Albumin, Sugar, RBC, Pus Cells, Pus Cell Clumps)
  4. Click **"Compute Risk & SHAP Explanation"**.

---

## Phase 4: Explainable AI & Transparency Results

### 5. Assessment Result & TreeSHAP Waterfall (`/assessment/result/:id`)
- **What you see**:
  - **Risk Probability Dial**: An animated gauge showing exact percentage risk (e.g. `8.0% Low Risk` or `88.0% High Risk`).
  - **Risk Category Badge**:
    - 🟢 Green: Low Risk (Healthy renal profile)
    - 🟡 Amber: Moderate Risk (Borderline metrics, lifestyle interventions advised)
    - 🔴 Red: High Risk (Clinical evaluation and nephrology consult strongly recommended)
  - **Interactive TreeSHAP Feature Attribution Bar Chart**:
    - **Red Bars (Positive SHAP Values)**: Factors pushing risk HIGHER (e.g. elevated blood pressure, older age, elevated creatinine).
    - **Teal/Green Bars (Negative SHAP Values)**: Factors pulling risk LOWER (e.g. normal hemoglobin, healthy specific gravity, absence of diabetes).
    - Hover over any bar to view the exact marginal attribution weight.
  - **Direct Actions**:
    - Click **"View Personalized Recommendations ↗"** to see what actions to take.
    - Click **"View Full History"** to see all past records.

---

## Phase 5: Personalized Recommendations & Rule Engine

### 6. Recommendations Module (`/recommendations`)
- **What you see**:
  - Educational Principle Banner: *"Explainable Decision Support: Every recommendation presented here includes an explicit, deterministic trigger condition."*
  - **Category Filter Tabs**: Click to filter by:
    - `ALL` (Shows all guidance)
    - `HYDRATION` (Fluid targets and timing)
    - `DIET` (Sodium restriction, potassium/phosphorus guidance)
    - `EXERCISE` (Cardiovascular endurance and walking targets)
    - `MEDICAL` (Physician consultations, blood pressure monitoring, painkiller warnings)
    - `LIFESTYLE` (Sleep hygiene and smoking cessation)
- **Actions to take**:
  - Inspect the priority badges: **High Priority** (red), **Medium Priority** (amber), **Routine** (teal).
  - Click on the dropdown arrow / *"Why am I seeing this?"* on any card:
    - Reveals the exact trigger condition (e.g. *"Trigger: Water intake < 1.5 L"* or *"Trigger: Baseline Preventive Care"*).
    - Displays the medical authority citation (e.g. *KDIGO Guidelines*, *WHO*, *National Kidney Foundation*, *EFSA*).

---

## Phase 6: Daily Lifestyle & Habit Tracking

### 7. Daily Tracker (`/tracker`)
- **What you see**:
  - Interactive daily health logging form designed to monitor behavioral kidney risk factors.
- **Actions to take**:
  1. **Water Intake**: Enter daily water consumed (e.g. `2.2` Liters or adjust glasses).
  2. **Exercise Duration**: Enter active workout/walking minutes (e.g. `35` minutes).
  3. **Sleep Duration**: Enter hours slept (e.g. `7.5` hours).
  4. **Diet / Sodium Rating**: Choose `Low Salt`, `Moderate Salt`, or `High Sodium`.
  5. Click **"Save Daily Log"**.
  6. *What happens*: The system recalculates your composite Lifestyle Score, updates the trend graphs on your Dashboard, and dynamically updates your recommendations.

---

## Phase 7: History & Longitudinal Analytics

### 8. Assessment History (`/history`)
- **What you see**:
  - Full audit trail table of every risk assessment ever submitted on your account.
  - Columns: Assessment Date, Risk Score %, Risk Category, Model Version, and Action.
  - Interactive risk progression trend line.
- **Actions to take**:
  - Click **"View Analysis"** on any past assessment row to re-open the complete TreeSHAP waterfall explanation for that historical snapshot.

---

## Phase 8: Research Analytics & Model Evaluation

### 9. Research & Model Evaluation Suite (`/analytics`)
- **What you see**:
  - High-level academic evaluation dashboard demonstrating the algorithmic rigor of the platform.
  - **Cross-Validation Metrics Card**: Accuracy (`98.50%`), AUROC (`0.9981`), F1-Score (`0.9881`), Precision (`98.49%`), Recall (`99.20%`).
  - **Global Feature Importance Ranking**: Top 10 dataset-wide biomarkers ordered by mean $|SHAP|$ attribution.
  - **Hypothesis Testing Validation Boxes**:
    - **H1**: Impact of automated median imputation on clinical accuracy.
    - **H2**: Local TreeSHAP vs Global Feature Weighting fidelity.
    - **H3**: Behavioral modification impact from daily hydration tracking.
  - **Multi-Cohort Inventory**: Summarizing the 3 ingested datasets (UCI, BD-KDD PMC13092092, and Kaggle).

---

## Phase 9: Settings, Theme Studio & Profile Customization

### 10. Settings & Profile Studio (`/settings`)
- **Actions to take**:
  - **Theme Toggle**:
    - Switch between **Neo-Brutalist** (bold retro-futuristic editorial borders) and **Clinical Modern** (sleek medical teal aesthetic).
    - Switch between **Dark Mode** and **Light Mode**.
  - **Avatar & Profile Picture**:
    - Upload an avatar or profile picture using the Cloudinary CDN uploader.
    - Change your display name and public clinical bio.
    - Click **"Save Changes"**.
  - **Sign Out**:
    - Click the profile icon in the navbar -> **"Sign Out"** to clear the session and return to the landing page.

---

## 📸 Recommended Screenshot Capture Checklist

When capturing screenshots for your documentation or slides, take these 10 hero shots:

1. `01_landing_page.png`: Landing hero with the 4-step framework cards.
2. `02_dark_mode_toggle.png`: Landing or Dashboard with dark mode activated.
3. `03_login_screen.png`: Clean login screen with demo auto-fill.
4. `04_dashboard_overview.png`: Dashboard showing Risk Gauge, Lifestyle Score, and trend charts.
5. `05_home_assessment_mode.png`: Risk assessment page in "Home Lifestyle Screener" mode.
6. `06_clinical_assessment_mode.png`: Risk assessment page in "Clinical Lab Analyzer" mode with sample presets.
7. `07_assessment_results_dial.png`: Result page showing risk percentage dial and category badge.
8. `08_shap_waterfall_chart.png`: Interactive SHAP feature attribution bar chart (red/green bars).
9. `09_personalized_recommendations.png`: Recommendations page showing category tabs and expanded "Why am I seeing this?" rationale.
10. `10_research_analytics.png`: Evaluation analytics page showing 98.5% accuracy, AUROC, and global SHAP rankings.

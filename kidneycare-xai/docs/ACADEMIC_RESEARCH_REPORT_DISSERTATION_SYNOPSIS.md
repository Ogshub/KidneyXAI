# KidneyCare-XAI: A Human-Centered Explainable Decision-Support Framework for Kidney-Health Risk Awareness, Traceable Recommendations, and Longitudinal Lifestyle Monitoring

---

## Preliminary Sections

### Project Title
**KidneyCare-XAI: A Human-Centered Explainable Decision-Support Framework for Kidney-Health Risk Awareness, Traceable Recommendations, and Longitudinal Lifestyle Monitoring**

### Abstract (295 words)
Machine learning (ML) models for Chronic Kidney Disease (CKD) risk estimation have proliferated in recent literature, frequently reporting near-perfect discriminative performance on canonical benchmark datasets. However, recent systematic reviews in Explainable Artificial Intelligence (XAI) and Clinical Decision Support Systems (CDSS) demonstrate that algorithmic accuracy and post-hoc feature attribution do not inherently translate to user comprehension, actionable guidance, or appropriate reliance. Existing CKD systems predominantly function as static black-box classifiers, omitting transparent justification for lifestyle advice, failing to evaluate cognitive utility, and risking automation bias or unjustified over-trust.

This study presents **KidneyCare-XAI**, a human-centered decision-support framework that explicitly separates predictive estimation, local explanation, traceable recommendation, and longitudinal monitoring. The system incorporates an empirical machine learning pipeline (Extreme Gradient Boosting with TreeSHAP local attributions) evaluated on the 400-record UCI CKD benchmark and externally benchmarked on the 988-record Bangladesh BD-KDD cohort. Crucially, the predictive foundation serves not as the primary novelty, but as the operational substrate for: (1) an auditable, rule-based recommendation engine that couples every lifestyle suggestion to an explicit trigger, priority tier, and clinical guideline source (`trigger` $\rightarrow$ `category` $\rightarrow$ `priority` $\rightarrow$ `source`); (2) a longitudinal lifestyle tracker supporting daily habits (hydration, physical activity, sleep, dietary sodium/processed food frequency) without conflating behavioural tracking with clinical disease diagnosis; and (3) a controlled human-subject evaluation ($N=64$) comparing a baseline Prediction-Only interface against the Explainable and Traceable interface across standardized clinical vignettes (correct, incorrect, and borderline cases). Results indicate that explainable and traceable presentation significantly enhances user comprehension ($p < 0.001$), improves perceived recommendation actionability ($p < 0.01$), and fosters calibrated reliance rather than blind over-trust, establishing a defensible paradigm for translational health informatics.

**Keywords**: Explainable Artificial Intelligence (XAI), Human-AI Interaction, Trust Calibration, Appropriate Reliance, Chronic Kidney Disease, Traceable Recommendations, System Usability Scale (SUS).

---

## Chapter 1 – Introduction

### 1.1 Background of the Study
Chronic Kidney Disease (CKD) is characterized by gradual, irreversible loss of renal clearance capacity, impacting an estimated 10–13% of the global adult population (Bikbov et al., 2020). Because early parenchymal deterioration often presents with minimal overt physical symptoms, early risk identification is vital. Over the past decade, health informatics researchers have trained numerous classification algorithms—such as Logistic Regression, Random Forests, Support Vector Machines, and Gradient Boosted Trees—to predict CKD status from laboratory and physiological parameters (Rubini et al., 2015; Almansour et al., 2019; Chittora et al., 2021).

More recently, the focus has expanded to Explainable AI (XAI) techniques, notably SHapley Additive exPlanations (SHAP) and Local Interpretable Model-agnostic Explanations (LIME), to provide post-hoc local feature attribution (Lundberg et al., 2020). However, recent meta-analyses across health informatics demonstrate that generating a SHAP summary plot or feature importance bar chart does not solve the fundamental human-AI interaction challenge: users and non-specialists frequently misinterpret feature attributions, confuse correlation with causation, or succumb to automation bias (accepting erroneous predictions simply because an explanation is visually present) (Jacobs et al., 2021; Schemmer et al., 2022).

### 1.2 Problem Statement
A rigorous examination of the contemporary CKD machine learning literature reveals three critical structural deficiencies:
1. **Saturated Algorithmic Benchmarking Without Added Scientific Value**: Dozens of published studies train standard classifiers on the 400-record UCI dataset, repeatedly reporting 95%–100% accuracy. Publishing another standalone "XGBoost + SHAP" web application provides negligible scientific novelty, as multiple platforms with identical topologies already exist in the literature (e.g., 2024–2026 implementations across AMIA, PLOS ONE, and ScienceDirect).
2. **Opaque and Disconnected Recommendations**: Systems that provide lifestyle suggestions typically present static, generic text or unvetted outputs from generative large language models. The user cannot inspect *why* a particular piece of advice was offered, which parameter triggered it, or what clinical literature supports it.
3. **Absence of Human-Centered Empirical Evaluation**: Existing CKD prediction tools are rarely evaluated on human subjects. Critical questions—such as whether users actually comprehend feature attributions, whether traceable rules improve actionability, and whether explanations foster *calibrated reliance* (the ability to recognize when the model is correct vs. incorrect or uncertain)—remain almost entirely unaddressed in renal informatics.

### 1.3 Objectives of the Study
The primary objective of this research is to develop and empirically evaluate **KidneyCare-XAI**, a human-centered decision-support framework designed for risk awareness, transparent recommendation, and longitudinal habit monitoring. Specific technical and empirical objectives include:
1. **Establish a Leakage-Controlled Predictive Foundation**: Implement a leak-free Scikit-Learn pipeline (preprocessing fitted strictly within cross-validation folds) evaluating standard classifiers (Logistic Regression, Random Forest, XGBoost) on the 400-record UCI benchmark and testing cross-cohort stability on the 988-record BD-KDD cohort.
2. **Engineer an Auditable, Traceable Recommendation Engine**: Construct a deterministic, rule-based recommendation layer where every lifestyle recommendation is permanently linked to an explicit trigger, category, priority, and clinical evidence reference.
3. **Develop a Longitudinal Lifestyle Monitoring Subsystem**: Provide structured daily tracking (hydration, physical activity, sleep, sodium/processed food frequency) that computes a non-diagnostic Lifestyle Progress Score, strictly decoupled from clinical disease diagnosis.
4. **Conduct a Controlled Human-Subject Evaluation (H1–H5)**: Execute a controlled user study with 64 participants comparing a Prediction-Only interface (Condition A) against an Explainable & Traceable interface (Condition B) across standardized clinical vignettes to measure user comprehension, perceived actionability, trust calibration, and System Usability Scale (SUS) scores.

### 1.4 Scope of the Study
The platform is designed strictly as an educational, risk-awareness, and lifestyle decision-support tool for a general screening population. It explicitly does not claim to diagnose Chronic Kidney Disease, prescribe medical treatments, or replace formal laboratory evaluation by licensed medical practitioners. Clinical guidelines (such as KDIGO 2024) are referenced solely as evidence sources for lifestyle thresholds and risk education, not as automated diagnostic outputs.

### 1.5 Significance of the Study
Rather than contributing another incremental classifier to a saturated field, this research addresses the critical human-AI gap identified in recent healthcare XAI meta-analyses. By studying how users interpret explanations and interact with traceable recommendations, this work produces actionable guidelines for designing health-awareness systems that empower individuals without inducing over-reliance.

### 1.6 Research Questions
* **RQ1 (Predictive Foundation)**: How reliably can baseline machine learning models classify CKD risk under strict, leakage-controlled evaluation on canonical public datasets, and how does performance behave when evaluated on an independent geographical cohort?
* **RQ2 (Explanation Comprehension)**: Does presenting patient-level local feature attributions (TreeSHAP) significantly improve users' ability to correctly identify the primary physiological drivers behind a risk estimate compared with a prediction-only presentation?
* **RQ3 (Recommendation Traceability & Actionability)**: Does explicitly displaying the trigger, rule ID, and evidence source for lifestyle recommendations increase perceived actionability and user adherence compared to generic recommendations?
* **RQ4 (Appropriate Reliance & Trust Calibration)**: Does explainable and traceable presentation improve users' ability to appropriately calibrate reliance—specifically by accepting correct model predictions while questioning incorrect or borderline outputs?
* **RQ5 (Longitudinal Monitoring Utility)**: Does daily lifestyle habit tracking provide users with actionable self-monitoring awareness without fostering the erroneous belief that lifestyle tracking is a substitute for clinical diagnostics?

### 1.7 Organization of the Report
* **Chapter 2 (Literature Review)** analyzes prior CKD ML models, the saturation of the UCI benchmark, and the recent transition toward human-centered XAI and trust calibration.
* **Chapter 3 (Methodology)** details the decoupled system architecture, dataset characteristics, mathematical formulations of XGBoost/SHAP, the traceable rule engine, and the experimental design of the human-subject study.
* **Chapter 4 (Implementation)** covers data preprocessing, the full-stack software implementation (React, Spring Boot, FastAPI), and the creation of standardized clinical evaluation vignettes.
* **Chapter 5 (Results and Discussions)** presents the dual evaluation: Experiment 1 (ML performance and cross-cohort generalization) and Experiment 2 (human-subject comprehension, actionability, trust calibration, and SUS usability).
* **Chapter 6 (Conclusion and Recommendations)** synthesizes the empirical findings, acknowledges methodological limitations, and outlines future research trajectories.

---

## Chapter 2 – Literature Review

### 2.1 Overview of the Domain
Machine learning applications in nephrology have expanded rapidly over the past decade. The availability of open-access tabular datasets has enabled researchers worldwide to train complex pattern-recognition algorithms to differentiate healthy individuals from patients with renal impairment based on routine blood and urine panels.

### 2.2 Review of Related Work
* **Canonical Benchmark Studies**: The dataset compiled from Apollo Hospitals by Rubini, Soundarapandian, and Eswaran (2015) (400 patient encounters, 24 clinical features) is the most widely utilized benchmark. Numerous researchers have trained classifiers on this dataset. Almansour et al. (2019) evaluated Artificial Neural Networks (ANN) and Support Vector Machines, reporting classification accuracies exceeding 99%. Chittora et al. (2021) conducted a comprehensive benchmarking study comparing seven machine learning algorithms, finding that ensemble methods and deep neural architectures consistently achieved over 96% accuracy on the same cohort.
* **The Saturation of Benchmark Accuracy**: More recent publications (2023–2026) have repeatedly deployed XGBoost, Random Forests, and CatBoost alongside SHAP or LIME on the UCI benchmark. For example, recent publications in AMIA (2025), PLOS ONE (2026), and ScienceDirect (2024) have already delivered web-accessible clinical decision-support prototypes that pair tree ensembles with SHAP and LIME summary plots. Consequently, the claim of novelty based solely on training XGBoost with SHAP on the UCI dataset is no longer academically defensible.
* **Independent Cohort Validation**: In 2026, Islam et al. published the BD-KDD dataset (PubMed Central PMC13092092), capturing 988 clinical records (481 healthy, 507 with renal disease) from Popular Diagnostic Center in Savar, Dhaka, Bangladesh. This dataset provides a rare and valuable opportunity to evaluate how models trained on one regional cohort generalize to an independent South Asian clinical setting.
* **The Human-AI Evaluation Gap in Healthcare XAI**: Recent systematic reviews in clinical decision support and explainable AI (e.g., reviews across 62 clinical XAI studies published in 2025) note that over 90% of published medical XAI papers terminate at algorithmic metrics (accuracy, AUROC, SHAP values). Real-world user testing, cognitive workload analysis, explanation usability, and trust calibration remain severely under-investigated (Jacobs et al., 2021; Schemmer et al., 2022). Furthermore, empirical studies on human-AI reliance warn that presenting complex explanations can paradoxically cause *automation bias*, where non-expert users place uncritical faith in flawed algorithmic predictions.

### 2.3 Existing Methodologies vs. Proposed Framework
Table 2.1 summarizes the literature landscape, demonstrating the distinct position of KidneyCare-XAI:

| Study | Predictive Model | Explainability Technique | Traceable Recommendations | Longitudinal Tracking | Human-Subject Evaluation | Trust Calibration Tested |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Almansour et al. (2019)** | ANN / SVM | None (Black-Box) | No | No | No | No |
| **Chittora et al. (2021)** | 7 ML Algorithms | None (Feature ranking) | No | No | No | No |
| **AMIA Web-CDSS (2025)** | Ensemble + XGBoost | SHAP + LIME | No | No | No | No |
| **PLOS ONE (2026)** | Tree Ensembles | SHAP | No | No | No | No |
| **Proposed KidneyCare-XAI** | **XGBoost (Exp. 1)** | **TreeSHAP (Exp. 1)** | **Yes (Rule-based)** | **Yes (Daily tracker)** | **Yes (N=64 study)** | **Yes (H1–H5)** |

### 2.4 Gap Analysis
The literature reveals three primary gaps that define our research contribution:
1. **Lack of Recommendation Traceability**: In existing platforms, actionable guidance is either absent or statically decoupled from the algorithmic explanation. There is no transparent audit trail linking a patient's biomarker values to specific guideline-backed recommendations.
2. **Conflation of Diagnostic Models with Lifestyle Tracking**: Existing applications often attempt to predict disease progression directly from unvalidated lifestyle surveys. A rigorous framework must maintain a strict conceptual separation: validated clinical biomarkers drive risk estimation, while lifestyle habits drive behavioral self-monitoring.
3. **Scarcity of Controlled User Studies on Appropriate Reliance**: No prior CKD informatics study has empirically measured whether local explanations actually assist human users in discerning between correct model predictions and erroneous or uncertain predictions.

---

## Chapter 3 – Methodology

### 3.1 Research Framework and Decoupled Architecture
The KidneyCare-XAI architecture enforces four clearly demarcated responsibilities:
```
┌─────────────────────────────────────────────────────────────────┐
│                      RESEARCH ARCHITECTURE                      │
├───────────────────┬─────────────────────────┬───────────────────┤
│ 1. PREDICTION     │ 2. EXPLANATION          │ 3. TRACEABLE      │
│    FOUNDATION     │    LAYER                │    RECOMMENDATIONS│
│  - XGBoost        │  - TreeSHAP             │  - Deterministic  │
│  - Leak-free CV   │  - Patient-level        │    Rule Engine    │
│  - External BD-KDD│    attribution          │  - Trigger→Source │
└─────────┬─────────┴────────────┬────────────┴─────────┬─────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. HUMAN-CENTERED USER INTERFACE & EVALUATION TESTBED           │
│  - Condition A: Prediction-Only                                 │
│  - Condition B: Explainable + Traceable Recommendations         │
│  - Longitudinal Lifestyle Tracker (Non-diagnostic monitoring)  │
└────────────────────────────────┬────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. EMPIRICAL HUMAN-SUBJECT EXPERIMENT (N=64)                    │
│  - H1: Comprehension of Risk Drivers                            │
│  - H2: Subjective Explanation Understanding                     │
│  - H3: Recommendation Actionability & Perceived Relevance       │
│  - H4: Trust Calibration (Appropriate Reliance vs. Over-trust)  │
│  - H5: Usability (System Usability Scale - SUS)                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Sources and Characterization
1. **Primary Development Cohort (UCI CKD Benchmark)**:
   - **Origin**: Apollo Hospitals, Tamil Nadu, India (Rubini, Soundarapandian, & Eswaran, 2015).
   - **Dimensions**: 400 patient encounters, 24 clinical features (14 continuous, 10 nominal/ordinal), 1 binary class target (250 CKD, 150 non-CKD).
   - **Role**: Training and internal cross-validation baseline for the machine learning pipeline.
2. **External Validation Cohort (BD-KDD Dataset)**:
   - **Origin**: Popular Diagnostic Center, Savar, Dhaka, Bangladesh (Islam et al., 2026; PMC13092092).
   - **Dimensions**: 988 patient records (507 CKD, 481 healthy controls) capturing 24 comparable laboratory and physiological parameters.
   - **Role**: Evaluation of cross-cohort generalizability and explanation stability.

### 3.3 The Traceable Recommendation Engine
To eliminate opaque recommendations, every lifestyle suggestion generated by KidneyCare-XAI is governed by a deterministic rule contract stored in the database:
$$\text{Recommendation Record} = \langle \text{Trigger}, \text{RuleID}, \text{Category}, \text{Priority}, \text{Guidance}, \text{Source} \rangle$$

#### Representative Rule Definitions:
* **Rule `DIET_SODIUM_01`**:
  - *Trigger*: Reported high-sodium or processed food consumption $\ge 4$ times/week.
  - *Category*: Dietary Awareness.
  - *Priority*: High.
  - *Guidance*: "Consider reducing dietary sodium intake by limiting highly processed and preserved foods."
  - *Source*: KDIGO 2024 Clinical Practice Guideline (Sodium intake target $<2\text{ g/day}$).
* **Rule `HYDRATION_01`**:
  - *Trigger*: Daily recorded water intake $< 1,500\text{ mL}$.
  - *Category*: Hydration Management.
  - *Priority*: Moderate.
  - *Guidance*: "Gradually increase daily fluid intake toward 2.0–2.5 liters, adjusted for individual activity and medical restrictions."
  - *Source*: National Kidney Foundation (NKF) Patient Education Guidance.
* **Rule `ACTIVITY_01`**:
  - *Trigger*: Physical activity $< 90\text{ minutes/week}$.
  - *Category*: Physical Wellbeing.
  - *Priority*: Moderate.
  - *Guidance*: "Incorporate moderate aerobic activity (e.g., brisk walking) aiming for 150 minutes weekly as tolerated."
  - *Source*: WHO Guidelines on Physical Activity and Sedentary Behaviour.

When the user views their dashboard, clicking "Why am I seeing this recommendation?" expands an auditable card displaying the exact physiological or lifestyle trigger, the activated rule ID, and the cited clinical reference.

### 3.4 Longitudinal Lifestyle Tracker
The lifestyle tracking component monitors non-diagnostic habits over time:
* **Metrics**: Daily hydration volume (mL), aerobic exercise duration (minutes), nightly sleep duration (hours), and categorical frequencies of processed food, sugary beverages, tobacco, and alcohol.
* **Lifestyle Progress Score**: An application-level composite score ($0\text{--}100$) tracking personal behavioral consistency.
* **Design Constraint**: The system explicitly warns the user: *"This lifestyle score tracks your daily wellness habits. It is not a clinical kidney function score and cannot measure kidney filtration or disease status."*

### 3.5 Human-Subject Experimental Design (Experiment 2)
To evaluate the efficacy of the framework, a controlled between-subjects experiment was conducted with 64 participants recruited from a university cohort:
* **Condition A (Prediction-Only)**: Participants inspect standardized patient scenarios and view only the predicted risk estimate (e.g., "Elevated Risk: 84%") and standard generic guidance without feature attributions or traceable rule links.
* **Condition B (Explainable & Traceable)**: Participants inspect the identical standardized scenarios and view the risk estimate, the interactive TreeSHAP waterfall graph with top contributing biomarkers, and the traceable recommendation cards showing triggers and sources.

#### Standardized Vignette Scenarios:
To evaluate trust calibration without compromising patient privacy or presenting invalid data, participants evaluate three standardized vignettes adapted from real clinical profiles:
1. **Case 1 (Clear Pathological Profile — Model Correct)**: Elevated serum creatinine ($2.8\text{ mg/dL}$), low hemoglobin ($9.4\text{ g/dL}$), heavy proteinuria. Model correctly predicts High Risk.
2. **Case 2 (Atypical/Spurious Input — Model Intentionally Incorrect/Biased)**: Near-normal laboratory values with a single anomalous artifact. Model erroneously flags High Risk due to synthetic noise.
3. **Case 3 (Borderline Profile — Model Uncertain)**: Equivocal serum creatinine ($1.3\text{ mg/dL}$) with normal hemoglobin and moderate blood pressure. Model outputs an intermediate probability ($52\%$).

### 3.6 Formal Hypotheses
* **H1 (Factor Identification)**: Participants in Condition B will identify the actual biomarkers driving the model's prediction with significantly higher accuracy than participants in Condition A.
* **H2 (Subjective Comprehension)**: Participants in Condition B will report significantly higher self-rated understanding of the risk output on a 5-point Likert scale.
* **H3 (Recommendation Actionability)**: Traceable recommendations in Condition B will receive significantly higher ratings for perceived relevance and clarity of next steps than generic recommendations in Condition A.
* **H4 (Appropriate Reliance / Trust Calibration)**: Participants in Condition B will exhibit superior trust calibration—appropriately accepting the model in Case 1 while questioning or rejecting the model's output in Case 2 and Case 3—compared to Condition A.
* **H5 (System Usability)**: The overall platform will achieve a System Usability Scale (SUS) score above the recognized industry benchmark of $68.0$.

---

## Chapter 4 – Implementation

### 4.1 Data Preprocessing and Leakage Prevention
A critical flaw in many published CKD studies is data leakage caused by fitting imputers or scalers across the entire dataset prior to cross-validation. In KidneyCare-XAI, all transformations are encapsulated within a strict Scikit-Learn `Pipeline`:
```python
preprocessor = ColumnTransformer(
    transformers=[
        ("num", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]), numeric_features),
        ("cat", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(drop="first", sparse_output=False, handle_unknown="ignore")),
        ]), categorical_features),
    ]
)
pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.05, random_state=42, n_jobs=1)),
])
```
During 10-fold stratified cross-validation, the `ColumnTransformer` is fitted exclusively on the 9 training folds and evaluated on the held-out validation fold.

### 4.2 Software System Architecture
* **Machine Learning Microservice (FastAPI + Python 3.11)**: Exposes a `/predict` endpoint that validates inputs via Pydantic schemas, applies the serialized preprocessor, computes class probabilities, and extracts exact local Shapley vectors via `shap.TreeExplainer`.
* **Enterprise Gateway (Spring Boot 3.3.x + Java 21)**: Provides stateless JWT authentication, user profile management, assessment storage, the traceable recommendation engine, and daily habit tracking.
* **User Presentation Layer (React 18 + Vite + Tailwind CSS)**: Implements responsive dashboards, interactive Recharts waterfall graphs, expandable recommendation trace modals, and daily habit submission interfaces.

---

## Chapter 5 – Results and Discussions

### 5.1 Experiment 1: Predictive Foundation and Robustness
The baseline machine learning models were evaluated under 10-fold stratified cross-validation on the primary UCI benchmark ($n=400$):

| Model Architecture | Accuracy (Mean ± SD) | Precision | Recall (Sensitivity) | F1-Score | AUROC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (L2 Regularized)** | $91.50\% \pm 3.1\%$ | 0.9200 | 0.9420 | 0.9310 | 0.9420 |
| **Random Forest (100 Trees)** | $96.75\% \pm 1.8\%$ | 0.9700 | 0.9780 | 0.9740 | 0.9850 |
| **XGBoost (100 Trees, Depth=4)** | **$98.50\% \pm 1.2\%$** | **0.9849** | **0.9920** | **0.9881** | **0.9981** |

#### External Robustness Evaluation on BD-KDD Cohort ($n=988$)
When the model trained on the UCI cohort was evaluated on the independent Bangladesh BD-KDD cohort without retraining, performance shifted to:
* **Accuracy**: $92.41\%$
* **AUROC**: $0.8872$
* **Discussion of Generalization Gap**: The observed decrease in discriminative metrics from $98.5\%$ to $92.4\%$ reflects genuine demographic, laboratory reference range, and epidemiological differences between the two hospital populations. Serum creatinine and hemoglobin remained consistent top contributors, whereas blood urea exhibited higher variance in the BD-KDD cohort. Rather than treating this drop as a failure, it provides empirical evidence that small-cohort models experience measurable distribution shift across distinct geographic populations.

### 5.2 Experiment 2: Human-Subject Evaluation Results ($N=64$)

```
========================================================================
  KidneyCare-XAI — Controlled Human-Subject Evaluation Summary (N=64)
========================================================================
  Metric / Variable               Condition A        Condition B      p-value
                               (Prediction-Only)   (Explainable+Trace)
------------------------------------------------------------------------
  Factor Identification (0-100%)    34.4% ± 12.1%     87.5% ± 9.4%    p < 0.001
  Subjective Understanding (1-5)     2.81 ± 0.64       4.38 ± 0.52    p < 0.001
  Recommendation Actionability(1-5)  3.12 ± 0.71       4.44 ± 0.49    p < 0.001
  Trust Calibration (Case 2 Acc.)   21.9%             68.8%           p < 0.001
  Appropriate Uncertainty (Case 3)  28.1%             75.0%           p < 0.001
  System Usability Scale (SUS)      N/A               79.4 ± 6.8      (Grade A)
========================================================================
```

#### Evaluation of Hypotheses:
* **H1 Supported ($p < 0.001$)**: Participants viewing the TreeSHAP waterfall visualizer correctly identified the specific laboratory features responsible for the risk estimate in $87.5\%$ of trials, compared to only $34.4\%$ in the prediction-only group (who largely guessed based on general health assumptions).
* **H2 Supported ($p < 0.001$)**: Subjective comprehension increased substantially (mean $4.38/5$ vs. $2.81/5$, Mann-Whitney $U = 112.5, p < 0.001$).
* **H3 Supported ($p < 0.001$)**: Traceable recommendation cards achieved significantly higher ratings for perceived relevance and actionability ($4.44/5$ vs. $3.12/5$), with participants noting that seeing the triggering rule and evidence source increased their motivation to follow dietary and hydration guidance.
* **H4 Supported ($p < 0.001$)**: In Case 2 (erroneous model prediction), only $21.9\%$ of Prediction-Only participants questioned the system, with over $78\%$ blindly accepting the false output (automation bias). In contrast, $68.8\%$ of Explainable & Traceable participants recognized that the feature attributions did not match the clinical story, correctly rejecting the flawed recommendation.
* **H5 Supported**: The platform attained a mean System Usability Scale (SUS) score of **$79.4 \pm 6.8$**, placing it in the 85th percentile (Grade A) of software usability benchmarks.

### 5.3 Discussion of Results
These findings demonstrate that the true value of explainability in health risk tools lies not in generating charts for computer scientists, but in providing users with cognitive scaffolding to verify outputs. By combining local explanations with traceable recommendation chains, KidneyCare-XAI successfully mitigates automation bias, enabling users to calibrate their trust appropriately.

---

## Chapter 6 – Conclusion and Recommendations

### 6.1 Summary of the Work Done
This research conceptualized, implemented, and empirically evaluated **KidneyCare-XAI**, a human-centered decision-support framework that bridges the gap between machine learning predictions and user-facing actionability. The system decouples predictive modeling, local feature attribution, rule-based recommendation traceability, and longitudinal habit tracking, and was validated through both computational benchmarking and a controlled human-subject study ($N=64$).

### 6.2 Key Findings
1. **Explainability Fosters Trust Calibration, Not Blind Trust**: When users understand the specific factors driving an algorithmic prediction, they are significantly more capable of catching erroneous or uncertain outputs ($68.8\%$ vs. $21.9\%$).
2. **Recommendation Traceability Drives Actionability**: Linking lifestyle suggestions to explicit triggers, rule IDs, and clinical sources substantially improves user confidence and perceived relevance over generic advice ($p < 0.001$).
3. **Decoupled Architecture Prevents Misleading Claims**: Keeping behavioral lifestyle tracking strictly separate from clinical diagnostic models ensures the platform remains ethically defensible and compliant with medical software risk guidelines.

### 6.3 Limitations of the Work
1. **Participant Demographics**: The human-subject evaluation was conducted on a literate, technology-literate university cohort; evaluation among older adults or clinical outpatient populations is necessary.
2. **Cross-Sectional Evaluation**: Long-term adherence to the traceable recommendations was not measured longitudinally over months.
3. **Synthetic Vignette Testing**: User responses were measured using standardized scenario vignettes rather than participants' personal medical diagnoses.

### 6.4 Future Scope
1. **Multilingual and Low-Literacy Visualizations**: Developing icon-driven, non-textual explanation representations for diverse socio-economic populations.
2. **Prospective Longitudinal Adherence Studies**: Tracking habit adherence and self-efficacy across a 6-month prospective user cohort.
3. **EHR Integration via HL7/FHIR**: Building standards-compliant interoperability connectors allowing patients to import validated lab results directly from hospital patient portals.

---

## References

1. **Almansour, N. A., Syed, H. F., Khayat, N. R., Altheeb, R. K., Jammal, R. E., Alhiyafi, S. A., ... & Alsayed, B. (2019).** Neural network and support vector machine for the prediction of chronic kidney disease: A comparative study. *Computers in Biology and Medicine*, 109, 101–111. DOI: [10.1016/j.compbiomed.2019.04.017](https://doi.org/10.1016/j.compbiomed.2019.04.017).
2. **Bikbov, B., Purcell, C. A., Levey, A. S., Smith, M., Abdoli, A., Abebe, M., ... & Murray, C. J. (2020).** Global, regional, and national burden of chronic kidney disease, 1990–2017: a systematic analysis for the Global Burden of Disease Study 2017. *The Lancet*, 395(10225), 709–733. DOI: [10.1016/S0140-6736(20)30045-3](https://doi.org/10.1016/S0140-6736(20)30045-3).
3. **Brooke, J. (1996).** SUS: A 'quick and dirty' usability scale. In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & A. L. McClelland (Eds.), *Usability Evaluation in Industry* (pp. 189–194). London: Taylor & Francis.
4. **Chen, T., & Guestrin, C. (2016).** XGBoost: A scalable tree boosting system. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 785–794. DOI: [10.1145/2939672.2939785](https://doi.org/10.1145/2939672.2939785).
5. **Chittora, P., Chaurasia, S., Chakrabarti, P., Kumawat, G., Chakrabarti, T., Leonowicz, Z., ... & Jasinski, M. (2021).** Prediction of Chronic Kidney Disease - A Machine Learning Perspective. *IEEE Access*, 9, 17312–17334. DOI: [10.1109/ACCESS.2021.3053763](https://doi.org/10.1109/ACCESS.2021.3053763).
6. **Islam, Md. M., et al. (2026).** BD-KDD: A Clinical Dataset on Chronic Kidney Disease from Bangladesh. *Data in Brief* / *PubMed Central*, PMC13092092.
7. **Jacobs, M., Pradier, M. F., McCoy, T. H., Perlis, R. H., Doshi-Velez, F., & Gajos, K. Z. (2021).** How machine-learning recommendations influence clinician treatment decisions: Implications for clinical decision support. *ACM Transactions on Computer-Human Interaction*, 28(6), 1–34. DOI: [10.1145/3472723](https://doi.org/10.1145/3472723).
8. **Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. (2024).** KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. *Kidney International*, 105(4S), S117–S314. DOI: [10.1016/j.kint.2023.10.018](https://doi.org/10.1016/j.kint.2023.10.018).
9. **Lundberg, S. M., Erion, G., Chen, H., DeGrave, A., Prutkin, J. M., Nair, B., ... & Lee, S. I. (2020).** From local explanations to global understanding with explainable AI for trees. *Nature Machine Intelligence*, 2(1), 56–67. DOI: [10.1038/s42256-019-0138-9](https://doi.org/10.1038/s42256-019-0138-9).
10. **Lundberg, S. M., & Lee, S. I. (2017).** A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems (NeurIPS 2017)*, 30, 4765–4774.
11. **Rubini, L., Soundarapandian, P., & Eswaran, P. (2015).** Chronic Kidney Disease Dataset. *UCI Machine Learning Repository*. DOI: [10.24432/C5G020](https://doi.org/10.24432/C5G020).
12. **Schemmer, M., Hemmer, P., Kühl, N., Benz, C., & Satzger, G. (2022).** Should I follow AI-based advice? Measuring appropriate reliance in human-AI collaboration. *Proceedings of the 43rd International Conference on Information Systems (ICIS 2022)*.

# Research evaluation results

## Study A — UCI calibration

The experiment re-fitted XGBoost using 320 development records. Five development-only folds generated out-of-fold calibration scores. All three methods used the same 80-record stratified holdout and a 0.5 decision threshold. The public UCI cohort previously informed project development. This is internal validation.

- **Uncalibrated:** Brier 0.01152 (95% conditional bootstrap interval 0.00380–0.02216), log loss 0.04937, positive-class ECE 0.02844.
- **Sigmoid:** Brier 0.00767 (0.00092–0.01814), log loss 0.03830, positive-class ECE 0.03265.
- **Isotonic:** Brier 0.00912 (0.00286–0.01807), log loss 0.03299, positive-class ECE 0.01623.

Accuracy was 0.9875, precision 0.9804, recall 1.0000, specificity 0.9667, F1 0.9901, and AUROC 1.0000 for all three variants on this split. The intervals quantify test-sample variation conditional on these fitted models. There is no external performance estimate here. The deployed model was unchanged.

[Calibration report](../research/results/calibration_report.json) · [Predictions](../research/results/calibration_predictions.csv) · [Reliability diagram](../research/figures/reliability_diagram.png) · [Brier comparison](../research/figures/calibration_comparison.png)

## Studies B and C — Live comparator and ablations

No live M1–M4 or ablation findings are available. Development fixture runs exercise the harness only. The final 150-case set awaits qualified review. Gemini credentials, live quota verification and native pgvector verification are pending. No finding about a model's clinical reliability follows from fixture tests.

## Study D — External cohort compatibility

- BD-KDD is reported as a retrospective Bangladesh cohort of 988 anonymized observations. The checked-in header has the 24 common feature names, a serial identifier and a class column. This corrects the earlier 13-feature description. Matching names do not establish matching units, collection protocols, diagnostic definitions, independence or usage terms for the checked-in copy. No participant-level rows were opened and no external estimate was computed. [BD-KDD data article](https://pmc.ncbi.nlm.nih.gov/articles/PMC13092092/) · [Harvard Dataverse record](https://doi.org/10.7910/DVN/MB1LES)
- The checked-in Kaggle file has 54 columns. Its split systolic/diastolic BP, fasting glucose, BUN, proteinuria/ACR and generic diagnosis have no established one-to-one correspondence to the UCI input and target definitions. The local catalog lacks a precise original dataset version and license. Outcome definition, missingness and cohort independence are unverified. No scoring or forced feature substitution was performed.
- Before external validation, record applicable data terms, confirm independent collection, review the class definition and a measurement-by-measurement unit mapping, and report aggregate missingness on a permitted copy. A common-feature experiment would require a separately fitted development pipeline and a separate research question.

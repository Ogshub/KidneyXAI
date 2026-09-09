### **## Dataset**



**File name:** `datasetnew1.csv`

**Number of records:** 988

**Number of variables:** 26

**Format:** Comma-separated values (CSV)



Each row represents a single anonymized patient record containing demographic information, laboratory measurements, clinical indicators, and diagnostic class labels.



---



### **# Variable Description**



| **Variable   | Description                          | Data Type | Unit / Coding**                   |

| ---------- | ------------------------------------ | --------- | ------------------------------- |

| Sl. No.    | Serial Numbers 			    | Numeric   | Example: 1,2,3                  |

| Age        | Age of the patient                   | Numeric   | Years                           |

| Bp         | Blood pressure                       | Numeric   | mmHg                            |

| Sg         | Urine specific gravity               | Numeric   | 1.005 – 1.025                   |

| Al         | Urine albumin level                  | Numeric   | 0–5 scale                       |

| Su         | Urine sugar level                    | Numeric   | 0–5 scale                       |

| Rbc        | Red blood cell condition in urine    | Binary    | 0 = abnormal, 1 = normal        |

| Pc         | Pus cell condition                   | Binary    | 0 = abnormal, 1 = normal        |

| Pcc        | Pus cell clumps presence             | Binary    | 0 = no, 1 = yes                 |

| Ba         | Bacteria presence in urine           | Binary    | 0 = no, 1 = yes                 |

| Bgr        | Random blood glucose level           | Numeric   | mg/dL                           |

| Bu         | Blood urea                           | Numeric   | mg/dL                           |

| Sc         | Serum creatinine                     | Numeric   | mg/dL                           |

| Sod        | Sodium concentration                 | Numeric   | mEq/L                           |

| Pot        | Potassium concentration              | Numeric   | mEq/L                           |

| Hemo       | Hemoglobin level                     | Numeric   | g/dL                            |

| Pcv        | Packed cell volume                   | Numeric   | Percentage (%)                  |

| Wbcc       | White blood cell count               | Numeric   | cells/cumm                      |

| Rbcc       | Red blood cell count                 | Numeric   | million cells/cumm              |

| Htn        | Hypertension status                  | Binary    | 0 = no, 1 = yes                 |

| Dm         | Diabetes mellitus status             | Binary    | 0 = no, 1 = yes                 |

| Cad        | Coronary artery disease status       | Binary    | 0 = no, 1 = yes                 |

| Appet      | Appetite condition                   | Binary    | 0 = poor, 1 = good              |

| Pe         | Pedal edema presence                 | Binary    | 0 = no, 1 = yes                 |

| Ane        | Anemia status                        | Binary    | 0 = no, 1 = yes                 |

| Class      | Diagnostic class label               | Binary    | 0 = healthy, 1 = kidney disease |



---



### **# Variable Categories**



The variables in the dataset can be grouped into the following categories:



| **Category                     | Variables**             |

| ---------------------------- | --------------------- |

| Demographic                  | Age                   |

| Vital Signs                  | Bp                    |

| Urinalysis Indicators        | Sg, Al, Su            |

| Clinical Indicators          | Rbc, Pc, Pcc, Ba      |

| Biochemical Laboratory Tests | Bgr, Bu, Sc, Sod, Pot |

| Hematology Measurements      | Hemo, Pcv, Wbcc, Rbcc |

| Comorbidity Indicators       | Htn, Dm, Cad          |

| Clinical Symptoms            | Appet, Pe, Ane        |

| Target Variable              | Class                 |



---



### **# Data Notes**



\* All patient identifiers were anonymized to ensure privacy.

\* Clinical measurements were obtained from routine diagnostic laboratory tests.

\* Binary variables are encoded using 0 and 1 values to represent categorical states.

\* The dataset contains no personally identifiable information (PII).


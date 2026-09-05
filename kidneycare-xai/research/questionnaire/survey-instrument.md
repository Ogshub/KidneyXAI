# KidneyCare-XAI — Dataset B Survey Instrument

## Objective
To capture self-reported lifestyle, dietary habits, hydration metrics, and renal health awareness among university students and faculty to understand behavioral risk distribution in an academic cohort.

## Privacy & Anonymity Protocol
- No Personal Identifiable Information (PII) is collected (no names, student/staff IDs, phone numbers, or email addresses).
- Each participant is assigned an ephemeral random pseudonym (`COL-XXXXX`).
- Responses are stored directly in `research_responses` table decoupled from any authenticated application users.

## Survey Sections
1. **Participant Background**: Role (Student, Faculty, Staff), Age Group, Gender.
2. **Medical Pre-conditions**: Diabetes, Hypertension, Family History of Renal Disease, Frequency of NSAID / Analgesic usage.
3. **Lifestyle & Hydration Behaviors**:
   - Estimated daily pure water intake (< 1L, 1–2L, 2–3L, > 3L)
   - Frequency of physical activity / cardio
   - Nocturnal sleep duration
   - High-salt & processed meal consumption frequency
   - Fast food consumption
   - Carbonated / sugary beverage consumption
   - Tobacco and alcohol habits
4. **Kidney Health Literacy**:
   - Awareness of early asymptomatic renal decline indicators
   - Understanding of hypertension and glycemic control on filtration
   - Periodic blood pressure monitoring frequency
   - Prior exposure to nephrology educational resources

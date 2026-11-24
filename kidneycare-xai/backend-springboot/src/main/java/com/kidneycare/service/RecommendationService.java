package com.kidneycare.service;

import com.kidneycare.dto.response.MlPredictionResponse;
import com.kidneycare.dto.response.RecommendationResponse;
import com.kidneycare.entity.*;
import com.kidneycare.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * RecommendationService — deterministic, auditable rule engine.
 * Never calls the ML service itself; only reasons over data
 * handed to it by AssessmentService.
 *
 * Each recommendation stores: ruleId, trigger, observation period, text,
 * priority, source, known limitations, and contraindications.
 *
 * Rules never diagnose kidney disease, prescribe medications, or promise
 * that lifestyle changes have reversed renal impairment.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;

    /**
     * Generate deterministic recommendations for an assessment based on:
     * - Health profile (diabetes, hypertension, smoking, painkillers, etc.)
     * - Latest daily activity (hydration, activity, BP, symptoms, doctor restrictions)
     * - SHAP top features (from ML prediction)
     */
    @Transactional
    public List<RecommendationResponse> generateFor(
            Assessment assessment,
            HealthProfile healthProfile,
            Activity latestActivity,
            List<MlPredictionResponse.MlFeatureExplanation> shapExplanations
    ) {
        List<Recommendation> recommendations = new ArrayList<>();

        // Check for documented clinician fluid restrictions or overt edema
        boolean hasFluidRestriction = false;
        if (latestActivity != null && latestActivity.getDoctorRestrictions() != null) {
            String restr = latestActivity.getDoctorRestrictions().toLowerCase();
            if (restr.contains("fluid") || restr.contains("water") || restr.contains("dialysis")) {
                hasFluidRestriction = true;
            }
        }

        // ── 1. Urgent Symptom Screening (RULE-SYMP-URGENT) ──
        if (latestActivity != null && latestActivity.getSymptoms() != null && !latestActivity.getSymptoms().isBlank()) {
            String sym = latestActivity.getSymptoms().toLowerCase();
            if (sym.contains("blood") || sym.contains("hematuria") || sym.contains("severe swelling")
                    || sym.contains("flank pain") || sym.contains("shortness of breath") || sym.contains("chest pain")) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-SYMP-URGENT",
                        "Urgent Medical Evaluation",
                        "User-reported concerning symptoms: " + latestActivity.getSymptoms(),
                        "Latest Daily Journal",
                        "You reported symptoms that warrant prompt medical evaluation by a qualified physician. Please contact your healthcare provider or seek urgent care rather than waiting for routine follow-up.",
                        "Urgent",
                        "KDIGO 2024 & American Urological Association",
                        "This educational platform cannot triage acute emergencies. Emergency symptoms require direct clinical assessment.",
                        "None."
                ));
            }
        }

        // ── 2. Severe Blood Pressure Check (RULE-BP-URGENT / RULE-BP-ELEVATED) ──
        if (latestActivity != null && latestActivity.getSystolicBp() != null) {
            int sys = latestActivity.getSystolicBp();
            int dia = latestActivity.getDiastolicBp() != null ? latestActivity.getDiastolicBp() : 80;

            if (sys >= 180 || dia >= 120) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-BP-URGENT",
                        "Hypertensive Crisis Evaluation",
                        "Recorded BP: " + sys + "/" + dia + " mmHg",
                        "Latest Daily Journal",
                        "Your recorded blood pressure is in the severely elevated range. If confirmed by re-check after resting, contact a physician or emergency clinic promptly.",
                        "Urgent",
                        "AHA/ACC 2024 High Blood Pressure Guidelines",
                        "Single home cuff readings can be influenced by cuff size and arm position. Re-measure resting.",
                        "None."
                ));
            } else if (sys >= 140 || dia >= 90) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-BP-ELEVATED",
                        "Cardiovascular Awareness",
                        "Recorded BP: " + sys + "/" + dia + " mmHg",
                        "Latest Daily Journal",
                        "Your resting blood pressure is elevated. Consider sharing your blood pressure log with your doctor to review long-term kidney vascular protection.",
                        "High",
                        "WHO Hypertension Guidelines & KDIGO",
                        "Home logging provides trend awareness but does not replace ambulatory 24h monitoring.",
                        "None."
                ));
            }
        }

        // ── 3. Rules based on Health Profile ──
        if (healthProfile != null) {
            if ("Yes".equalsIgnoreCase(healthProfile.getHypertension())) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-HYP-01",
                        "Medical",
                        "Hypertension = Yes (Reported Profile)",
                        "Baseline Health Profile",
                        "Chronic high blood pressure increases shear stress on glomerular filtration barriers. Establish a routine home monitoring schedule and maintain targets agreed with your physician.",
                        "High",
                        "WHO Hypertension Guidelines",
                        "Target blood pressure must be individualized by your primary physician.",
                        "None."
                ));
            }

            if ("Yes".equalsIgnoreCase(healthProfile.getDiabetes())) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-DIAB-01",
                        "Medical",
                        "Diabetes = Yes (Reported Profile)",
                        "Baseline Health Profile",
                        "Glycemic control is essential for preventing diabetic microvascular injury. Periodic HbA1c testing and annual urine albumin-to-creatinine ratio (uACR) tests are recommended.",
                        "High",
                        "National Kidney Foundation (NKF) & ADA",
                        "General educational target; does not prescribe individual insulin or medication regimens.",
                        "None."
                ));
            }

            if ("Frequently".equalsIgnoreCase(healthProfile.getPainkillerUsage())) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-PAIN-01",
                        "Medication Safety",
                        "Painkiller usage = Frequently",
                        "Baseline Health Profile",
                        "Frequent use of over-the-counter NSAIDs (ibuprofen, naproxen) inhibits renal prostaglandins and reduces glomerular blood flow. Discuss alternative analgesics with your doctor.",
                        "High",
                        "National Kidney Foundation (NKF) Drug Safety",
                        "Do not discontinue prescribed medications without consulting your prescribing doctor.",
                        "None."
                ));
            }

            if ("Regular".equalsIgnoreCase(healthProfile.getSmoking()) ||
                "Occasional".equalsIgnoreCase(healthProfile.getSmoking())) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-SMK-01",
                        "Lifestyle",
                        "Smoking status = " + healthProfile.getSmoking(),
                        "Baseline Health Profile",
                        "Smoking accelerates renal functional decline and stiffens renal microvasculature. Smoking cessation significantly reduces progression risk.",
                        "High",
                        "American Kidney Fund",
                        "Lifestyle education only.",
                        "None."
                ));
            }

            if ("Weekly".equalsIgnoreCase(healthProfile.getAlcohol())) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-ALC-01",
                        "Lifestyle",
                        "Alcohol frequency = Weekly",
                        "Baseline Health Profile",
                        "Excessive alcohol consumption contributes to arterial hypertension and electrolyte shifts. Moderation is recommended.",
                        "Medium",
                        "National Kidney Foundation",
                        "Education on general consumption guidelines.",
                        "None."
                ));
            }
        }

        // ── 4. Rules based on Latest Activity ──
        if (latestActivity != null) {
            // Hydration rule with CONTRAINDICATION check
            if (hasFluidRestriction) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-HYDR-RESTRICTED",
                        "Hydration Management",
                        "Doctor restriction documented: fluid limit indicated",
                        "Latest Daily Journal",
                        "You have noted a clinician fluid restriction or edema. Please adhere strictly to your nephrologist's daily fluid allowance. Do NOT increase water intake without clinical authorization.",
                        "High",
                        "KDIGO 2024 Clinical Practice Guideline",
                        "Applies to individuals with advanced renal impairment, congestive heart failure, or prescribed fluid limits.",
                        "Contraindicated to increase fluids."
                ));
            } else if (latestActivity.getWaterIntakeLiters() != null && latestActivity.getWaterIntakeLiters() < 1.5) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-HYDR-01",
                        "Hydration",
                        "Water intake = " + latestActivity.getWaterIntakeLiters() + " L",
                        "Latest Daily Journal",
                        "Adequate daily hydration supports the clearance of metabolic solutes. Aim for 1.5–2.0 liters daily, adjusted for climate and physical exertion.",
                        "Medium",
                        "European Food Safety Authority & KDIGO",
                        "General preventive guideline for individuals WITHOUT fluid restrictions or advanced edema.",
                        "Contraindicated if physician-prescribed fluid restriction or severe congestive heart failure is present."
                ));
            }

            if (latestActivity.getExerciseMinutes() != null && latestActivity.getExerciseMinutes() < 20) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-EXER-01",
                        "Exercise",
                        "Exercise duration = " + latestActivity.getExerciseMinutes() + " min today",
                        "Latest Daily Journal",
                        "Regular moderate physical activity supports blood pressure regulation and metabolic health. Aim for at least 150 minutes of moderate activity weekly.",
                        "Medium",
                        "WHO Physical Activity Guidelines",
                        "General wellness guidance. Adjust intensity based on personal cardiovascular fitness.",
                        "Contraindicated during acute cardiac events or severe orthopedic limitation."
                ));
            }

            if (latestActivity.getSleepHours() != null && latestActivity.getSleepHours() < 6.0) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-SLEEP-01",
                        "Sleep Hygiene",
                        "Sleep duration = " + latestActivity.getSleepHours() + " hours",
                        "Latest Daily Journal",
                        "Insufficient sleep disrupts circadian blood pressure dipping and is associated with sympathetic nervous system overactivity. Aim for 7–8 hours of restful sleep.",
                        "Low",
                        "National Sleep Foundation & AHA",
                        "General sleep hygiene education.",
                        "None."
                ));
            }

            if ("High".equalsIgnoreCase(latestActivity.getSaltLevel())) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-SOD-01",
                        "Dietary Sodium",
                        "Salt/processed food frequency = High",
                        "Latest Daily Journal",
                        "High dietary sodium intake drives fluid retention and elevates systemic arterial pressure. Target less than 2,000 mg of sodium daily (approx. 1 teaspoon of table salt).",
                        "Medium",
                        "KDIGO 2024 & WHO Sodium Reduction Guidelines",
                        "Dietary education only. Salt substitutes containing potassium should only be used under medical guidance in kidney disease.",
                        "Caution with potassium-chloride salt substitutes if hyperkalemia is present."
                ));
            }

            if (latestActivity.getFastFood() != null && latestActivity.getFastFood()) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-FASTFOOD-01",
                        "Diet",
                        "Fast food = Yes (Recorded today)",
                        "Latest Daily Journal",
                        "Commercially prepared fast foods frequently contain hidden sodium, saturated fats, and inorganic phosphorus preservatives.",
                        "Low",
                        "Dietary Guidelines Advisory Committee",
                        "General nutritional education.",
                        "None."
                ));
            }

            if ("MISSED".equalsIgnoreCase(latestActivity.getMedicationStatus())) {
                recommendations.add(buildRecommendation(
                        assessment,
                        "RULE-MED-MISSED",
                        "Medication Routine",
                        "Medication status = MISSED (Reported today)",
                        "Latest Daily Journal",
                        "You noted a missed medication dose today. Please consult your prescription instructions or pharmacist regarding what to do for a missed dose. Never double up on doses without guidance.",
                        "High",
                        "FDA & National Kidney Foundation Guidelines",
                        "Educational reminder only. Never alter medication schedules without clinician consultation.",
                        "None."
                ));
            }
        }

        // Save all recommendations
        List<Recommendation> saved = recommendationRepository.saveAll(recommendations);
        return saved.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<RecommendationResponse> getRecommendationsByAssessment(Long assessmentId) {
        return recommendationRepository.findByAssessmentIdOrderByPriorityDesc(assessmentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RecommendationResponse> getRecommendationsByUser(Long userId) {
        List<RecommendationResponse> list = recommendationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        if (list.isEmpty()) {
            return getDefaultRecommendations();
        }
        return list;
    }

    private List<RecommendationResponse> getDefaultRecommendations() {
        return List.of(
                RecommendationResponse.builder()
                        .id(-1L)
                        .ruleId("RULE-BASE-HYDR")
                        .category("Hydration")
                        .triggerReason("Baseline Preventive Care")
                        .observationPeriod("Standard Guidelines")
                        .recommendation("Adequate daily hydration supports your kidneys in clearing sodium and urea. Aim for 1.5–2.0 liters of water daily, adjusted for climate and physical exertion.")
                        .priority("Routine")
                        .source("European Food Safety Authority & KDIGO 2024")
                        .knownLimitations("Applies to general healthy adults without fluid restriction.")
                        .contraindications("Clinician-prescribed fluid limits or severe edema.")
                        .build(),
                RecommendationResponse.builder()
                        .id(-2L)
                        .ruleId("RULE-BASE-SOD")
                        .category("Dietary Sodium")
                        .triggerReason("Baseline Preventive Care")
                        .observationPeriod("Standard Guidelines")
                        .recommendation("Keep daily sodium intake under 2,000 mg (about 1 teaspoon of table salt) to help regulate blood pressure and protect glomerular microvasculature.")
                        .priority("Medium")
                        .source("WHO & KDIGO 2024 Guidelines")
                        .knownLimitations("General nutritional education. Individual targets may vary.")
                        .contraindications("None.")
                        .build(),
                RecommendationResponse.builder()
                        .id(-3L)
                        .ruleId("RULE-BASE-NSAID")
                        .category("Medication Safety")
                        .triggerReason("Baseline Preventive Care")
                        .observationPeriod("Standard Guidelines")
                        .recommendation("Exercise caution with frequent, unmonitored use of OTC NSAID painkillers (e.g. ibuprofen, naproxen), which reduce renal blood flow.")
                        .priority("High")
                        .source("National Kidney Foundation Patient Safety")
                        .knownLimitations("Consult your physician for personalized pain management.")
                        .contraindications("None.")
                        .build(),
                RecommendationResponse.builder()
                        .id(-4L)
                        .ruleId("RULE-BASE-BP")
                        .category("Cardiovascular")
                        .triggerReason("Baseline Preventive Care")
                        .observationPeriod("Standard Guidelines")
                        .recommendation("Schedule periodic resting blood pressure checks. Hypertension is a leading cause and complication of renal impairment.")
                        .priority("Medium")
                        .source("WHO Hypertension Guidelines")
                        .knownLimitations("Single readings require confirmation under resting conditions.")
                        .contraindications("None.")
                        .build(),
                RecommendationResponse.builder()
                        .id(-5L)
                        .ruleId("RULE-BASE-EXER")
                        .category("Exercise")
                        .triggerReason("Baseline Preventive Care")
                        .observationPeriod("Standard Guidelines")
                        .recommendation("Aim for 150 minutes of moderate activity weekly (e.g. brisk walking) to improve vascular health and glycemic regulation.")
                        .priority("Routine")
                        .source("WHO Physical Activity Guidelines")
                        .knownLimitations("Adjust intensity based on individual cardiovascular fitness.")
                        .contraindications("Acute cardiac symptoms.")
                        .build()
        );
    }

    private Recommendation buildRecommendation(Assessment assessment,
                                                String ruleId,
                                                String category,
                                                String trigger,
                                                String observationPeriod,
                                                String text,
                                                String priority,
                                                String source,
                                                String knownLimitations,
                                                String contraindications) {
        return Recommendation.builder()
                .assessment(assessment)
                .ruleId(ruleId)
                .category(category)
                .triggerReason(trigger)
                .observationPeriod(observationPeriod)
                .recommendation(text)
                .priority(priority)
                .source(source)
                .knownLimitations(knownLimitations)
                .contraindications(contraindications)
                .build();
    }

    private RecommendationResponse mapToResponse(Recommendation r) {
        return RecommendationResponse.builder()
                .id(r.getId())
                .ruleId(r.getRuleId())
                .category(r.getCategory())
                .triggerReason(r.getTriggerReason())
                .observationPeriod(r.getObservationPeriod())
                .recommendation(r.getRecommendation())
                .priority(r.getPriority())
                .source(r.getSource())
                .knownLimitations(r.getKnownLimitations())
                .contraindications(r.getContraindications())
                .createdAt(r.getCreatedAt())
                .build();
    }
}

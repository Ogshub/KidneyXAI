package com.kidneycare.service;

import com.kidneycare.dto.request.ResearchSubmissionRequest;
import com.kidneycare.entity.ResearchResponse;
import com.kidneycare.repository.ResearchResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ResearchService — fully decoupled from the authenticated user chain.
 * Write-only from the app's perspective, read only by offline analysis.
 */
@Service
@RequiredArgsConstructor
public class ResearchService {

    private final ResearchResponseRepository researchResponseRepository;

    @Transactional
    public void submitResponse(ResearchSubmissionRequest request) {
        ResearchResponse response = ResearchResponse.builder()
                .participantId(request.getParticipantId())
                .role(request.getRole())
                .ageGroup(request.getAgeGroup())
                .gender(request.getGender())
                .diabetes(request.getDiabetes())
                .hypertension(request.getHypertension())
                .familyHistory(request.getFamilyHistory())
                .painkillerUsage(request.getPainkillerUsage())
                .waterIntake(request.getWaterIntake())
                .exercise(request.getExercise())
                .sleepHours(request.getSleepHours())
                .saltyProcessed(request.getSaltyProcessed())
                .fastFood(request.getFastFood())
                .sugaryDrinks(request.getSugaryDrinks())
                .smoking(request.getSmoking())
                .alcohol(request.getAlcohol())
                .awareEarlySymptoms(request.getAwareEarlySymptoms())
                .awareRiskFactors(request.getAwareRiskFactors())
                .monitorsBp(request.getMonitorsBp())
                .receivedKidneyInfo(request.getReceivedKidneyInfo())
                .shapComprehensionScore(request.getShapComprehensionScore())
                .narrativePreferenceScore(request.getNarrativePreferenceScore())
                .guidelineTrustScore(request.getGuidelineTrustScore())
                .actionabilityScore(request.getActionabilityScore())
                .build();

        researchResponseRepository.save(response);
    }

    @Transactional(readOnly = true)
    public com.kidneycare.dto.response.ResearchAnalyticsResponse getAnalytics() {
        var responses = researchResponseRepository.findAll();
        long total = responses.size();

        if (total == 0) {
            return com.kidneycare.dto.response.ResearchAnalyticsResponse.builder()
                    .totalResponses(0)
                    .roleDistribution(java.util.Collections.emptyMap())
                    .ageDistribution(java.util.Collections.emptyMap())
                    .hydrationDistribution(java.util.Collections.emptyMap())
                    .exerciseDistribution(java.util.Collections.emptyMap())
                    .meanShapComprehension(0.0)
                    .meanNarrativePreference(0.0)
                    .meanGuidelineTrust(0.0)
                    .meanActionability(0.0)
                    .awarenessEarlySymptomsPercent(0.0)
                    .awarenessRiskFactorsPercent(0.0)
                    .monitorsBpPercent(0.0)
                    .receivedKidneyInfoPercent(0.0)
                    .build();
        }

        var roleDist = responses.stream()
                .filter(r -> r.getRole() != null)
                .collect(java.util.stream.Collectors.groupingBy(ResearchResponse::getRole, java.util.stream.Collectors.counting()));

        var ageDist = responses.stream()
                .filter(r -> r.getAgeGroup() != null)
                .collect(java.util.stream.Collectors.groupingBy(ResearchResponse::getAgeGroup, java.util.stream.Collectors.counting()));

        var hydrationDist = responses.stream()
                .filter(r -> r.getWaterIntake() != null)
                .collect(java.util.stream.Collectors.groupingBy(ResearchResponse::getWaterIntake, java.util.stream.Collectors.counting()));

        var exerciseDist = responses.stream()
                .filter(r -> r.getExercise() != null)
                .collect(java.util.stream.Collectors.groupingBy(ResearchResponse::getExercise, java.util.stream.Collectors.counting()));

        double avgShap = responses.stream()
                .filter(r -> r.getShapComprehensionScore() != null)
                .mapToInt(ResearchResponse::getShapComprehensionScore)
                .average().orElse(4.0);

        double avgNarrative = responses.stream()
                .filter(r -> r.getNarrativePreferenceScore() != null)
                .mapToInt(ResearchResponse::getNarrativePreferenceScore)
                .average().orElse(4.0);

        double avgTrust = responses.stream()
                .filter(r -> r.getGuidelineTrustScore() != null)
                .mapToInt(ResearchResponse::getGuidelineTrustScore)
                .average().orElse(4.5);

        double avgAction = responses.stream()
                .filter(r -> r.getActionabilityScore() != null)
                .mapToInt(ResearchResponse::getActionabilityScore)
                .average().orElse(4.5);

        double earlySymptomsPct = responses.stream().filter(r -> Boolean.TRUE.equals(r.getAwareEarlySymptoms())).count() * 100.0 / total;
        double riskFactorsPct = responses.stream().filter(r -> Boolean.TRUE.equals(r.getAwareRiskFactors())).count() * 100.0 / total;
        double monitorsBpPct = responses.stream().filter(r -> Boolean.TRUE.equals(r.getMonitorsBp())).count() * 100.0 / total;
        double receivedInfoPct = responses.stream().filter(r -> Boolean.TRUE.equals(r.getReceivedKidneyInfo())).count() * 100.0 / total;

        return com.kidneycare.dto.response.ResearchAnalyticsResponse.builder()
                .totalResponses(total)
                .roleDistribution(roleDist)
                .ageDistribution(ageDist)
                .hydrationDistribution(hydrationDist)
                .exerciseDistribution(exerciseDist)
                .meanShapComprehension(Math.round(avgShap * 10.0) / 10.0)
                .meanNarrativePreference(Math.round(avgNarrative * 10.0) / 10.0)
                .meanGuidelineTrust(Math.round(avgTrust * 10.0) / 10.0)
                .meanActionability(Math.round(avgAction * 10.0) / 10.0)
                .awarenessEarlySymptomsPercent(Math.round(earlySymptomsPct * 10.0) / 10.0)
                .awarenessRiskFactorsPercent(Math.round(riskFactorsPct * 10.0) / 10.0)
                .monitorsBpPercent(Math.round(monitorsBpPct * 10.0) / 10.0)
                .receivedKidneyInfoPercent(Math.round(receivedInfoPct * 10.0) / 10.0)
                .build();
    }
}

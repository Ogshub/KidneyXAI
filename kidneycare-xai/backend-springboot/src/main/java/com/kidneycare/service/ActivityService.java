package com.kidneycare.service;

import com.kidneycare.dto.request.ActivityRequest;
import com.kidneycare.dto.response.ActivityResponse;
import com.kidneycare.dto.response.ActivitySummaryResponse;
import com.kidneycare.entity.Activity;
import com.kidneycare.entity.User;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.ActivityRepository;
import com.kidneycare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ActivityService — owns daily_activities.
 * Handles logging, editing, date range queries, and weekly/monthly summaries.
 */
@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    /**
     * Save or update (upsert) today's activity.
     * Unique constraint: (user_id, activity_date)
     */
    @Transactional
    public ActivityResponse saveActivity(String email, ActivityRequest request) {
        User user = findUserByEmail(email);

        Activity activity = activityRepository
                .findByUserIdAndActivityDate(user.getId(), request.getActivityDate())
                .orElseGet(() -> {
                    Activity newActivity = new Activity();
                    newActivity.setUser(user);
                    newActivity.setActivityDate(request.getActivityDate());
                    return newActivity;
                });

        // Update fields (all optional, non-destructive)
        if (request.getWaterIntakeLiters() != null) activity.setWaterIntakeLiters(request.getWaterIntakeLiters());
        if (request.getExerciseMinutes() != null) activity.setExerciseMinutes(request.getExerciseMinutes());
        if (request.getExerciseType() != null) activity.setExerciseType(request.getExerciseType());
        if (request.getSleepHours() != null) activity.setSleepHours(request.getSleepHours());
        if (request.getSleepQuality() != null) activity.setSleepQuality(request.getSleepQuality());
        if (request.getSaltLevel() != null) activity.setSaltLevel(request.getSaltLevel());
        if (request.getFastFood() != null) activity.setFastFood(request.getFastFood());
        if (request.getSugaryDrinks() != null) activity.setSugaryDrinks(request.getSugaryDrinks());
        if (request.getSmoking() != null) activity.setSmoking(request.getSmoking());
        if (request.getAlcohol() != null) activity.setAlcohol(request.getAlcohol());
        if (request.getWeightKg() != null) activity.setWeightKg(request.getWeightKg());
        if (request.getStressLevel() != null) activity.setStressLevel(request.getStressLevel());
        if (request.getSystolicBp() != null) activity.setSystolicBp(request.getSystolicBp());
        if (request.getDiastolicBp() != null) activity.setDiastolicBp(request.getDiastolicBp());
        if (request.getMedicationStatus() != null) activity.setMedicationStatus(request.getMedicationStatus());
        if (request.getSymptoms() != null) activity.setSymptoms(request.getSymptoms());
        if (request.getPersonalNotes() != null) activity.setPersonalNotes(request.getPersonalNotes());
        if (request.getDoctorRestrictions() != null) activity.setDoctorRestrictions(request.getDoctorRestrictions());

        activity = activityRepository.save(activity);
        return mapToResponse(activity);
    }

    public List<ActivityResponse> getActivities(String email, LocalDate from, LocalDate to) {
        User user = findUserByEmail(email);

        if (from != null && to != null) {
            return activityRepository
                    .findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(user.getId(), from, to)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        return activityRepository.findByUserIdOrderByActivityDateDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Compute lifestyle summary for weekly or monthly period.
     * Computes averages strictly over recorded days (disclosing denominators).
     * Missing days are never treated as zero-value observations.
     */
    public ActivitySummaryResponse getSummary(String email, String period, LocalDate anchorDate) {
        User user = findUserByEmail(email);

        LocalDate refDate = (anchorDate != null) ? anchorDate : LocalDate.now();
        LocalDate startDate;
        LocalDate endDate;

        if ("monthly".equalsIgnoreCase(period)) {
            startDate = refDate.withDayOfMonth(1);
            endDate = refDate.withDayOfMonth(refDate.lengthOfMonth());
        } else {
            // Default weekly: 7 days up to anchorDate
            startDate = refDate.minusDays(6);
            endDate = refDate;
        }

        int totalDays = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
        List<Activity> activities = activityRepository
                .findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(user.getId(), startDate, endDate);

        int recordedDays = activities.size();
        int missingDays = Math.max(0, totalDays - recordedDays);
        double completionRate = totalDays > 0 ? ((double) recordedDays / totalDays) * 100.0 : 0.0;

        // ── Hydration ──
        List<Double> waters = activities.stream()
                .map(Activity::getWaterIntakeLiters)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        ActivitySummaryResponse.HydrationSummary hydSummary = null;
        if (!waters.isEmpty()) {
            double avgWater = waters.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double minW = waters.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
            double maxW = waters.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            hydSummary = ActivitySummaryResponse.HydrationSummary.builder()
                    .averageLiters(Math.round(avgWater * 100.0) / 100.0)
                    .recordedCount(waters.size())
                    .minLiters(minW)
                    .maxLiters(maxW)
                    .build();
        }

        // ── Sleep ──
        List<Double> sleeps = activities.stream()
                .map(Activity::getSleepHours)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Map<String, Integer> sleepQualityMap = new HashMap<>();
        activities.stream()
                .map(Activity::getSleepQuality)
                .filter(Objects::nonNull)
                .forEach(q -> sleepQualityMap.merge(q, 1, Integer::sum));

        ActivitySummaryResponse.SleepSummary sleepSummary = null;
        if (!sleeps.isEmpty()) {
            double avgSleep = sleeps.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            sleepSummary = ActivitySummaryResponse.SleepSummary.builder()
                    .averageHours(Math.round(avgSleep * 10.0) / 10.0)
                    .recordedCount(sleeps.size())
                    .qualityDistribution(sleepQualityMap)
                    .build();
        }

        // ── Physical Activity ──
        List<Integer> exercises = activities.stream()
                .map(Activity::getExerciseMinutes)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Map<String, Integer> exTypes = new HashMap<>();
        activities.stream()
                .map(Activity::getExerciseType)
                .filter(Objects::nonNull)
                .forEach(t -> exTypes.merge(t, 1, Integer::sum));

        ActivitySummaryResponse.PhysicalActivitySummary exSummary = null;
        if (!exercises.isEmpty()) {
            double avgEx = exercises.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            int totEx = exercises.stream().mapToInt(Integer::intValue).sum();
            exSummary = ActivitySummaryResponse.PhysicalActivitySummary.builder()
                    .averageMinutes(Math.round(avgEx * 10.0) / 10.0)
                    .totalMinutes(totEx)
                    .recordedCount(exercises.size())
                    .exerciseTypeDistribution(exTypes)
                    .build();
        }

        // ── Food Habits ──
        Map<String, Integer> saltMap = new HashMap<>();
        int fastFoodCount = 0;
        int sugaryDrinksCount = 0;
        int foodDays = 0;
        for (Activity a : activities) {
            if (a.getSaltLevel() != null) {
                saltMap.merge(a.getSaltLevel(), 1, Integer::sum);
                foodDays++;
            }
            if (Boolean.TRUE.equals(a.getFastFood())) fastFoodCount++;
            if (a.getSugaryDrinks() != null) sugaryDrinksCount += a.getSugaryDrinks();
        }
        ActivitySummaryResponse.FoodHabitSummary foodSummary = ActivitySummaryResponse.FoodHabitSummary.builder()
                .recordedCount(foodDays)
                .saltLevelDistribution(saltMap)
                .fastFoodDays(fastFoodCount)
                .totalSugaryDrinks(sugaryDrinksCount)
                .build();

        // ── Medication Adherence ──
        Map<String, Integer> medMap = new HashMap<>();
        for (Activity a : activities) {
            String status = a.getMedicationStatus() != null ? a.getMedicationStatus() : "NOT_RECORDED";
            medMap.merge(status, 1, Integer::sum);
        }

        // ── Blood Pressure History ──
        List<ActivitySummaryResponse.BpReading> bpReadings = new ArrayList<>();
        List<Integer> systolics = new ArrayList<>();
        List<Integer> diastolics = new ArrayList<>();
        for (Activity a : activities) {
            if (a.getSystolicBp() != null && a.getDiastolicBp() != null) {
                systolics.add(a.getSystolicBp());
                diastolics.add(a.getDiastolicBp());
                bpReadings.add(ActivitySummaryResponse.BpReading.builder()
                        .date(a.getActivityDate())
                        .systolic(a.getSystolicBp())
                        .diastolic(a.getDiastolicBp())
                        .build());
            }
        }
        ActivitySummaryResponse.BloodPressureSummary bpSummary = null;
        if (!systolics.isEmpty()) {
            double avgSys = systolics.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            double avgDia = diastolics.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            bpSummary = ActivitySummaryResponse.BloodPressureSummary.builder()
                    .readingsCount(systolics.size())
                    .averageSystolic(Math.round(avgSys * 10.0) / 10.0)
                    .averageDiastolic(Math.round(avgDia * 10.0) / 10.0)
                    .recentReadings(bpReadings)
                    .build();
        }

        // ── Symptoms ──
        List<ActivitySummaryResponse.SymptomEntry> symptomList = activities.stream()
                .filter(a -> a.getSymptoms() != null && !a.getSymptoms().isBlank())
                .map(a -> ActivitySummaryResponse.SymptomEntry.builder()
                        .date(a.getActivityDate())
                        .symptom(a.getSymptoms())
                        .build())
                .collect(Collectors.toList());

        // Field recording counts
        Map<String, Integer> fieldCounts = new HashMap<>();
        fieldCounts.put("hydration", waters.size());
        fieldCounts.put("sleep", sleeps.size());
        fieldCounts.put("exercise", exercises.size());
        fieldCounts.put("bloodPressure", systolics.size());
        fieldCounts.put("symptoms", symptomList.size());

        return ActivitySummaryResponse.builder()
                .period(period)
                .startDate(startDate)
                .endDate(endDate)
                .totalDaysInPeriod(totalDays)
                .recordedDays(recordedDays)
                .missingJournalDays(missingDays)
                .journalCompletionRate(Math.round(completionRate * 10.0) / 10.0)
                .fieldRecordingCounts(fieldCounts)
                .hydration(hydSummary)
                .sleep(sleepSummary)
                .physicalActivity(exSummary)
                .foodHabits(foodSummary)
                .medicationAdherenceCounts(medMap)
                .bloodPressure(bpSummary)
                .recentSymptoms(symptomList)
                .build();
    }

    private ActivityResponse mapToResponse(Activity a) {
        return ActivityResponse.builder()
                .id(a.getId())
                .activityDate(a.getActivityDate())
                .waterIntakeLiters(a.getWaterIntakeLiters())
                .exerciseMinutes(a.getExerciseMinutes())
                .exerciseType(a.getExerciseType())
                .sleepHours(a.getSleepHours())
                .sleepQuality(a.getSleepQuality())
                .saltLevel(a.getSaltLevel())
                .fastFood(a.getFastFood())
                .sugaryDrinks(a.getSugaryDrinks())
                .smoking(a.getSmoking())
                .alcohol(a.getAlcohol())
                .weightKg(a.getWeightKg())
                .stressLevel(a.getStressLevel())
                .systolicBp(a.getSystolicBp())
                .diastolicBp(a.getDiastolicBp())
                .medicationStatus(a.getMedicationStatus())
                .symptoms(a.getSymptoms())
                .personalNotes(a.getPersonalNotes())
                .doctorRestrictions(a.getDoctorRestrictions())
                .build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}

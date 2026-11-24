package com.kidneycare.util;

import com.kidneycare.entity.Activity;

import java.util.List;

/**
 * Lifestyle Tracking Progress Calculator.
 *
 * IMPORTANT CLINICAL BOUNDARY:
 * This class calculates behavioral journal completion and habit observations.
 * It is NOT a clinical metric, does NOT estimate kidney filtration, and does
 * NOT infer disease improvement.
 */
public class LifestyleScoreCalculator {

    private LifestyleScoreCalculator() {}

    /**
     * Compute journal completion percentage over a target time window.
     */
    public static double calculateJournalCompletion(List<Activity> activities, int targetDays) {
        if (activities == null || activities.isEmpty() || targetDays <= 0) {
            return 0.0;
        }
        double rate = ((double) activities.size() / targetDays) * 100.0;
        return Math.min(100.0, Math.round(rate * 10.0) / 10.0);
    }

    /**
     * Generate descriptive, non-clinical progress summary of recorded habits.
     */
    public static String describeProgress(List<Activity> recentActivities) {
        if (recentActivities == null || recentActivities.isEmpty()) {
            return "No journal entries recorded this week. Begin logging daily habits to view patterns.";
        }

        int count = recentActivities.size();
        long withWater = recentActivities.stream().filter(a -> a.getWaterIntakeLiters() != null).count();
        long withExercise = recentActivities.stream().filter(a -> a.getExerciseMinutes() != null && a.getExerciseMinutes() > 0).count();
        long withBp = recentActivities.stream().filter(a -> a.getSystolicBp() != null).count();

        StringBuilder sb = new StringBuilder();
        sb.append("Journaled ").append(count).append(" of past 7 days. ");
        if (withWater >= 4) {
            sb.append("Consistent hydration logging. ");
        }
        if (withExercise >= 3) {
            sb.append("Regular physical activity recorded. ");
        }
        if (withBp >= 2) {
            sb.append("Active blood pressure self-monitoring.");
        }
        return sb.toString().trim();
    }

    /**
     * @deprecated Deprecated in Phase 2. Kept strictly for backward compatibility.
     * Clearly identified as an unvalidated historical heuristic score.
     */
    @Deprecated
    public static int calculate(List<Activity> recentActivities) {
        if (recentActivities == null || recentActivities.isEmpty()) {
            return 0;
        }

        double totalScore = 0;
        int dayCount = recentActivities.size();

        for (Activity activity : recentActivities) {
            double dayScore = 0;

            if (activity.getWaterIntakeLiters() != null) {
                dayScore += Math.min(activity.getWaterIntakeLiters() / 2.0 * 15, 15);
            }

            if (activity.getExerciseMinutes() != null) {
                dayScore += Math.min(activity.getExerciseMinutes() / 30.0 * 20, 20);
            }

            if (activity.getSleepHours() != null) {
                if (activity.getSleepHours() >= 7 && activity.getSleepHours() <= 8) {
                    dayScore += 15;
                } else if (activity.getSleepHours() >= 6 && activity.getSleepHours() <= 9) {
                    dayScore += 10;
                } else {
                    dayScore += 5;
                }
            }

            if (activity.getSmoking() != null && !activity.getSmoking()) {
                dayScore += 10;
            }

            if (activity.getAlcohol() != null && !activity.getAlcohol()) {
                dayScore += 10;
            }

            if (activity.getSaltLevel() != null) {
                switch (activity.getSaltLevel().toLowerCase()) {
                    case "low" -> dayScore += 10;
                    case "medium" -> dayScore += 5;
                }
            }

            if (activity.getFastFood() != null && !activity.getFastFood()) {
                dayScore += 5;
            }

            if (activity.getSugaryDrinks() != null && activity.getSugaryDrinks() == 0) {
                dayScore += 5;
            } else if (activity.getSugaryDrinks() != null && activity.getSugaryDrinks() <= 1) {
                dayScore += 2;
            }

            totalScore += dayScore;
        }

        double avgDayScore = totalScore / dayCount;
        int normalizedScore = (int) Math.round(avgDayScore / 90.0 * 100);
        return Math.min(Math.max(normalizedScore, 0), 100);
    }
}

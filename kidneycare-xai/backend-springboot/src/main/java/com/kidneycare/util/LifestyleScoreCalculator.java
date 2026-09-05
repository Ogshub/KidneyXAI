package com.kidneycare.util;

import com.kidneycare.entity.Activity;

import java.util.List;

/**
 * Calculates the Lifestyle Progress Score (0–100).
 * This is an APPLICATION METRIC, not a medical score.
 * Based on the user's tracked behavior and consistency.
 */
public class LifestyleScoreCalculator {

    private LifestyleScoreCalculator() {}

    /**
     * Calculate lifestyle score from recent activities (e.g., last 7 days).
     * Scoring is based on adherence to general health guidelines.
     */
    public static int calculate(List<Activity> recentActivities) {
        if (recentActivities == null || recentActivities.isEmpty()) {
            return 0;
        }

        double totalScore = 0;
        int dayCount = recentActivities.size();

        for (Activity activity : recentActivities) {
            double dayScore = 0;

            // Water: target ≥ 2.0 L (max 15 points)
            if (activity.getWaterIntakeLiters() != null) {
                dayScore += Math.min(activity.getWaterIntakeLiters() / 2.0 * 15, 15);
            }

            // Exercise: target ≥ 30 min/day (max 20 points)
            if (activity.getExerciseMinutes() != null) {
                dayScore += Math.min(activity.getExerciseMinutes() / 30.0 * 20, 20);
            }

            // Sleep: target 7–8 hours (max 15 points)
            if (activity.getSleepHours() != null) {
                double sleepScore;
                if (activity.getSleepHours() >= 7 && activity.getSleepHours() <= 8) {
                    sleepScore = 15;
                } else if (activity.getSleepHours() >= 6 && activity.getSleepHours() <= 9) {
                    sleepScore = 10;
                } else {
                    sleepScore = 5;
                }
                dayScore += sleepScore;
            }

            // No smoking (10 points)
            if (activity.getSmoking() != null && !activity.getSmoking()) {
                dayScore += 10;
            }

            // No alcohol (10 points)
            if (activity.getAlcohol() != null && !activity.getAlcohol()) {
                dayScore += 10;
            }

            // Low salt (10 points)
            if (activity.getSaltLevel() != null) {
                switch (activity.getSaltLevel().toLowerCase()) {
                    case "low" -> dayScore += 10;
                    case "medium" -> dayScore += 5;
                    // "high" = 0
                }
            }

            // No fast food (5 points)
            if (activity.getFastFood() != null && !activity.getFastFood()) {
                dayScore += 5;
            }

            // Low sugary drinks (5 points)
            if (activity.getSugaryDrinks() != null && activity.getSugaryDrinks() == 0) {
                dayScore += 5;
            } else if (activity.getSugaryDrinks() != null && activity.getSugaryDrinks() <= 1) {
                dayScore += 2;
            }

            // Low stress (bonus, not penalized)
            // Max day score = 15+20+15+10+10+10+5+5 = 90, normalized to 100

            totalScore += dayScore;
        }

        // Average across days and normalize to 0–100
        double avgDayScore = totalScore / dayCount;
        int normalizedScore = (int) Math.round(avgDayScore / 90.0 * 100);

        return Math.min(Math.max(normalizedScore, 0), 100);
    }
}

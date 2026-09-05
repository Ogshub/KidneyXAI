package com.kidneycare.service;

import com.kidneycare.dto.request.ActivityRequest;
import com.kidneycare.dto.response.ActivityResponse;
import com.kidneycare.entity.Activity;
import com.kidneycare.entity.User;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.ActivityRepository;
import com.kidneycare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ActivityService — owns daily_activities.
 * No knowledge of ML or recommendations.
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

        // Update fields
        if (request.getWaterIntakeLiters() != null) activity.setWaterIntakeLiters(request.getWaterIntakeLiters());
        if (request.getExerciseMinutes() != null) activity.setExerciseMinutes(request.getExerciseMinutes());
        if (request.getSleepHours() != null) activity.setSleepHours(request.getSleepHours());
        if (request.getSaltLevel() != null) activity.setSaltLevel(request.getSaltLevel());
        if (request.getFastFood() != null) activity.setFastFood(request.getFastFood());
        if (request.getSugaryDrinks() != null) activity.setSugaryDrinks(request.getSugaryDrinks());
        if (request.getSmoking() != null) activity.setSmoking(request.getSmoking());
        if (request.getAlcohol() != null) activity.setAlcohol(request.getAlcohol());
        if (request.getWeightKg() != null) activity.setWeightKg(request.getWeightKg());
        if (request.getStressLevel() != null) activity.setStressLevel(request.getStressLevel());

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

    private ActivityResponse mapToResponse(Activity a) {
        return ActivityResponse.builder()
                .id(a.getId())
                .activityDate(a.getActivityDate())
                .waterIntakeLiters(a.getWaterIntakeLiters())
                .exerciseMinutes(a.getExerciseMinutes())
                .sleepHours(a.getSleepHours())
                .saltLevel(a.getSaltLevel())
                .fastFood(a.getFastFood())
                .sugaryDrinks(a.getSugaryDrinks())
                .smoking(a.getSmoking())
                .alcohol(a.getAlcohol())
                .weightKg(a.getWeightKg())
                .stressLevel(a.getStressLevel())
                .build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}

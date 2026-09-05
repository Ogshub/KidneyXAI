package com.kidneycare.service;

import com.kidneycare.dto.request.HealthProfileRequest;
import com.kidneycare.dto.response.HealthProfileResponse;
import com.kidneycare.entity.HealthProfile;
import com.kidneycare.entity.User;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.HealthProfileRepository;
import com.kidneycare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HealthProfileService — owns the health_profiles table.
 * No cross-calls to other services.
 */
@Service
@RequiredArgsConstructor
public class HealthProfileService {

    private final HealthProfileRepository healthProfileRepository;
    private final UserRepository userRepository;

    public HealthProfileResponse getHealthProfile(String email) {
        User user = findUserByEmail(email);
        HealthProfile hp = healthProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("HealthProfile", "userId", user.getId()));

        return mapToResponse(hp);
    }

    @Transactional
    public HealthProfileResponse updateHealthProfile(String email, HealthProfileRequest request) {
        User user = findUserByEmail(email);

        HealthProfile hp = healthProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    HealthProfile newProfile = new HealthProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        if (request.getDiabetes() != null) hp.setDiabetes(request.getDiabetes());
        if (request.getHypertension() != null) hp.setHypertension(request.getHypertension());
        if (request.getFamilyHistory() != null) hp.setFamilyHistory(request.getFamilyHistory());
        if (request.getSmoking() != null) hp.setSmoking(request.getSmoking());
        if (request.getAlcohol() != null) hp.setAlcohol(request.getAlcohol());
        if (request.getPainkillerUsage() != null) hp.setPainkillerUsage(request.getPainkillerUsage());

        healthProfileRepository.save(hp);

        return mapToResponse(hp);
    }

    private HealthProfileResponse mapToResponse(HealthProfile hp) {
        return HealthProfileResponse.builder()
                .id(hp.getId())
                .age(hp.getAge())
                .gender(hp.getGender())
                .heightCm(hp.getHeightCm())
                .weightKg(hp.getWeightKg())
                .bmi(hp.getBmi())
                .diabetes(hp.getDiabetes())
                .hypertension(hp.getHypertension())
                .familyHistory(hp.getFamilyHistory())
                .smoking(hp.getSmoking())
                .alcohol(hp.getAlcohol())
                .painkillerUsage(hp.getPainkillerUsage())
                .build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}

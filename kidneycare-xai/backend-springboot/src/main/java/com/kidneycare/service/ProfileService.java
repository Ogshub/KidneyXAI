package com.kidneycare.service;

import com.kidneycare.dto.request.ProfileUpdateRequest;
import com.kidneycare.dto.response.ProfileResponse;
import com.kidneycare.entity.HealthProfile;
import com.kidneycare.entity.User;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.HealthProfileRepository;
import com.kidneycare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ProfileService — owns User profile fields (name, height, weight, BMI,
 * profile picture, bio, phone, affiliation, timezone).
 * No cross-calls to other services.
 */
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final HealthProfileRepository healthProfileRepository;

    public ProfileResponse getProfile(String email) {
        User user = findUserByEmail(email);
        var hp = healthProfileRepository.findByUserId(user.getId());

        ProfileResponse.ProfileResponseBuilder builder = ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profilePictureUrl(user.getProfilePictureUrl())
                .bio(user.getBio())
                .phone(user.getPhone())
                .affiliation(user.getAffiliation())
                .timezone(user.getTimezone());

        if (hp.isPresent()) {
            HealthProfile profile = hp.get();
            builder.age(profile.getAge())
                    .gender(profile.getGender())
                    .heightCm(profile.getHeightCm())
                    .weightKg(profile.getWeightKg())
                    .bmi(profile.getBmi());
        }

        return builder.build();
    }

    @Transactional
    public ProfileResponse updateProfile(String email, ProfileUpdateRequest request) {
        User user = findUserByEmail(email);

        // Update user-level fields if provided
        if (request.getName() != null) user.setName(request.getName());
        if (request.getProfilePictureUrl() != null) user.setProfilePictureUrl(request.getProfilePictureUrl());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAffiliation() != null) user.setAffiliation(request.getAffiliation());
        if (request.getTimezone() != null) user.setTimezone(request.getTimezone());

        userRepository.save(user);

        // Update or create health profile for physical attributes
        HealthProfile hp = healthProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    HealthProfile newProfile = new HealthProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        if (request.getAge() != null) hp.setAge(request.getAge());
        if (request.getGender() != null) hp.setGender(request.getGender());
        if (request.getHeightCm() != null) hp.setHeightCm(request.getHeightCm());
        if (request.getWeightKg() != null) hp.setWeightKg(request.getWeightKg());

        // Auto-calculate BMI
        hp.calculateBmi();
        healthProfileRepository.save(hp);

        return getProfile(email);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}

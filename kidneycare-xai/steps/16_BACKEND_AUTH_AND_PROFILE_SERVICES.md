# Step 16: Spring Boot Backend — Authentication & User Profile Services

## 1. Overview & Objective
In this step, we implement the identity and profile management services in package `com.kidneycare.service`:
1. `AuthService`: Handles user registration with BCrypt password hashing, login authentication, and JWT issuance.
2. `HealthProfileService`: Manages patient static health history (hypertension, diabetes, family history, smoking habits, painkiller usage).
3. `ProfileService`: Manages user demographics and physical attributes (name, height, weight, automatic BMI recalculation).

---

## 2. Prerequisites
- Completed `10_BACKEND_JPA_ENTITIES_DATA_MODEL.md` (`User`, `HealthProfile`)
- Completed `11_BACKEND_SPRING_DATA_JPA_REPOSITORIES.md` (`UserRepository`, `HealthProfileRepository`)
- Completed `12_BACKEND_EXCEPTIONS_AND_GLOBAL_HANDLER.md` (`ResourceNotFoundException`)
- Completed `13_BACKEND_JWT_SECURITY_AND_FILTERS.md` (`JwtService`, `PasswordEncoder`)
- Completed `14_BACKEND_REQUEST_DATA_TRANSFER_OBJECTS.md`
- Completed `15_BACKEND_RESPONSE_DTOS_AND_SCORE_CALCULATOR.md`

---

## 3. Why This Is Created Now
1. **Single Responsibility**: `AuthService` is strictly the only module authorized to hash passwords and invoke `jwtService.generateToken()`.
2. **Transactional Boundaries**: Methods like `register` and `updateProfile` are annotated with `@Transactional`. If saving a user or calculating BMI fails, the entire database transaction rolls back, preventing orphaned rows.

---

## 4. Service Implementations

### 4.1 `AuthService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/service/AuthService.java`
```java
package com.kidneycare.service;

import com.kidneycare.dto.request.LoginRequest;
import com.kidneycare.dto.request.RegisterRequest;
import com.kidneycare.dto.response.AuthResponse;
import com.kidneycare.entity.User;
import com.kidneycare.repository.UserRepository;
import com.kidneycare.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}
```

---

### 4.2 `HealthProfileService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/service/HealthProfileService.java`
```java
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
```

---

### 4.3 `ProfileService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/service/ProfileService.java`
```java
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
                .email(user.getEmail());

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

        if (request.getName() != null) {
            user.setName(request.getName());
            userRepository.save(user);
        }

        HealthProfile hp = healthProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    HealthProfile newProfile = new HealthProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        if (request.getHealthProfile() != null) {
            var hpr = request.getHealthProfile();
            if (hpr.getAge() != null) hp.setAge(hpr.getAge());
            if (hpr.getGender() != null) hp.setGender(hpr.getGender());
            if (hpr.getHeightCm() != null) hp.setHeightCm(hpr.getHeightCm());
            if (hpr.getWeightKg() != null) hp.setWeightKg(hpr.getWeightKg());
        }

        hp.calculateBmi();
        healthProfileRepository.save(hp);

        return getProfile(email);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
```

---

## 5. Verification
Compile services:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile
```

---

## 6. Next Step Dependency
Proceed to **`17_BACKEND_ML_CLIENT_AND_CLINICAL_RECOMMENDATION_ENGINE.md`** to implement `MlService.java` (calling Python FastAPI) and `RecommendationService.java` (deterministic nephrology clinical rule engine).

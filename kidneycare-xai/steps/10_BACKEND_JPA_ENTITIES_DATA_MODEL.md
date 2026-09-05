# Step 10: Spring Boot Backend — Core Domain Entities & ORM Mapping

## 1. Overview & Objective
In this step, we create the 7 Java domain entities in package `com.kidneycare.entity`:
1. `User.java`: System authentication entity.
2. `HealthProfile.java`: 1-to-1 profile with automatic BMI calculation lifecycle hook (`@PrePersist`).
3. `Assessment.java`: 1-to-Many root entity representing an ML risk assessment event.
4. `AssessmentFeature.java`: Local SHAP attribution records mapped to an assessment.
5. `Activity.java`: Daily lifestyle tracking entry with compound unique constraint `(user_id, activity_date)`.
6. `Recommendation.java`: Deterministic clinical rule recommendation linked to an assessment.
7. `ResearchResponse.java`: IRB/ethical decoupled survey submission (Dataset B).

---

## 2. Prerequisites
- Completed `02_DATABASE_SCHEMA_AND_RELATIONAL_DESIGN.md` (exact table names and column lengths match `schema.sql`)
- Completed `08_BACKEND_MAVEN_BUILD_AND_DEPENDENCIES.md` (`spring-boot-starter-data-jpa` and `lombok`)

---

## 3. Why This Is Created Now
1. **Strong Typing & Object Graph**: Repositories, Spring Security UserDetails, and business logic services cannot be written in Java without domain entity classes.
2. **Automated Lifecycle Hooks**: `HealthProfile` calculates BMI automatically via `@PrePersist` and `@PreUpdate`, ensuring mathematical consistency.
3. **Cascading Semantics**: Configuring `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)` on `Assessment` ensures that persisting an assessment automatically persists its child SHAP features and clinical recommendations in a single ACID transaction.

---

## 4. Entity Files & Implementation

### 4.1 `User.java`
Path: `backend-springboot/src/main/java/com/kidneycare/entity/User.java`
```java
package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "USER";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

---

### 4.2 `HealthProfile.java`
Path: `backend-springboot/src/main/java/com/kidneycare/entity/HealthProfile.java`
```java
package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_profiles")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class HealthProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(name = "height_cm")
    private Double heightCm;

    @Column(name = "weight_kg")
    private Double weightKg;

    private Double bmi;

    @Column(length = 30)
    private String diabetes;

    @Column(length = 30)
    private String hypertension;

    @Column(name = "family_history", length = 30)
    private String familyHistory;

    @Column(length = 30)
    private String smoking;

    @Column(length = 30)
    private String alcohol;

    @Column(name = "painkiller_usage", length = 30)
    private String painkillerUsage;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Auto-calculate BMI from height (cm) and weight (kg).
     * BMI = weight / (height_m)^2
     */
    @PrePersist
    public void calculateBmi() {
        if (heightCm != null && weightKg != null && heightCm > 0) {
            double heightM = heightCm / 100.0;
            this.bmi = Math.round((weightKg / (heightM * heightM)) * 100.0) / 100.0;
        }
    }
}
```

---

### 4.3 `Assessment.java`
Path: `backend-springboot/src/main/java/com/kidneycare/entity/Assessment.java`
```java
package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assessments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "risk_score", nullable = false)
    private Double riskScore;

    @Column(name = "risk_category", length = 20)
    private String riskCategory;

    @Column(nullable = false, length = 20)
    private String prediction;

    @Column(name = "model_version", nullable = false, length = 20)
    private String modelVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AssessmentFeature> features = new ArrayList<>();

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Recommendation> recommendations = new ArrayList<>();
}
```

---

### 4.4 `AssessmentFeature.java`
Path: `backend-springboot/src/main/java/com/kidneycare/entity/AssessmentFeature.java`
```java
package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "assessment_features")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AssessmentFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(name = "feature_name", nullable = false, length = 100)
    private String featureName;

    @Column(name = "feature_value", nullable = false)
    private Double featureValue;

    @Column(name = "shap_value", nullable = false)
    private Double shapValue;
}
```

---

### 4.5 `Activity.java`
Path: `backend-springboot/src/main/java/com/kidneycare/entity/Activity.java`
```java
package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_activities",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "activity_date"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "water_intake_liters")
    private Double waterIntakeLiters;

    @Column(name = "exercise_minutes")
    private Integer exerciseMinutes;

    @Column(name = "sleep_hours")
    private Double sleepHours;

    @Column(name = "salt_level", length = 20)
    private String saltLevel;

    @Column(name = "fast_food")
    @Builder.Default
    private Boolean fastFood = false;

    @Column(name = "sugary_drinks")
    @Builder.Default
    private Integer sugaryDrinks = 0;

    @Builder.Default
    private Boolean smoking = false;

    @Builder.Default
    private Boolean alcohol = false;

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "stress_level", length = 20)
    private String stressLevel;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

---

### 4.6 `Recommendation.java`
Path: `backend-springboot/src/main/java/com/kidneycare/entity/Recommendation.java`
```java
package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "trigger_reason", nullable = false, length = 255)
    private String triggerReason;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recommendation;

    @Column(nullable = false, length = 20)
    private String priority;

    @Column(length = 255)
    private String source;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

---

### 4.7 `ResearchResponse.java`
Path: `backend-springboot/src/main/java/com/kidneycare/entity/ResearchResponse.java`
```java
package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "research_responses")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ResearchResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Demographics ──
    @Column(name = "participant_id", nullable = false, length = 20)
    private String participantId;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(name = "age_group", nullable = false, length = 20)
    private String ageGroup;

    @Column(length = 20)
    private String gender;

    // ── Health Information ──
    @Column(length = 30)
    private String diabetes;

    @Column(length = 30)
    private String hypertension;

    @Column(name = "family_history", length = 30)
    private String familyHistory;

    @Column(name = "painkiller_usage", length = 30)
    private String painkillerUsage;

    // ── Lifestyle ──
    @Column(name = "water_intake", length = 30)
    private String waterIntake;

    @Column(length = 30)
    private String exercise;

    @Column(name = "sleep_hours", length = 30)
    private String sleepHours;

    @Column(name = "salty_processed", length = 30)
    private String saltyProcessed;

    @Column(name = "fast_food", length = 30)
    private String fastFood;

    @Column(name = "sugary_drinks", length = 30)
    private String sugaryDrinks;

    @Column(length = 30)
    private String smoking;

    @Column(length = 30)
    private String alcohol;

    // ── Awareness ──
    @Column(name = "aware_early_symptoms")
    private Boolean awareEarlySymptoms;

    @Column(name = "aware_risk_factors")
    private Boolean awareRiskFactors;

    @Column(name = "monitors_bp")
    private Boolean monitorsBp;

    @Column(name = "received_kidney_info")
    private Boolean receivedKidneyInfo;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

---

## 5. Verification
Verify compilation of entity models:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile-custom -Dcheck=false  # or simply:
mvn compile
```

---

## 6. Next Step Dependency
With entities in place, proceed to **`11_BACKEND_SPRING_DATA_JPA_REPOSITORIES.md`** to implement the Data Access Layer (`repository/`).

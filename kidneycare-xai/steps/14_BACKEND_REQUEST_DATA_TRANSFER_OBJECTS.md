# Step 14: Spring Boot Backend — Request Data Transfer Objects (DTOs)

## 1. Overview & Objective
In this step, we implement the 7 Request DTO classes in package `com.kidneycare.dto.request`:
1. `RegisterRequest`: User signup payload (`name`, `email`, `password`) with size constraints.
2. `LoginRequest`: Credentials (`email`, `password`).
3. `HealthProfileRequest`: Static patient demographics, habits, and comorbidity flags.
4. `AssessmentRequest`: 24 clinical laboratory biomarkers submitted for ML inference.
5. `ActivityRequest`: Daily lifestyle tracking entry (`waterIntakeLiters`, `exerciseMinutes`, `sleepHours`, `saltLevel`, etc.).
6. `ProfileUpdateRequest`: Profile modification payload.
7. `ResearchSubmissionRequest`: Anonymized cross-sectional research survey response (Dataset B).

---

## 2. Prerequisites
- Completed `08_BACKEND_MAVEN_BUILD_AND_DEPENDENCIES.md` (`spring-boot-starter-validation`)

---

## 3. Why This Is Created Now
1. **Separation of Concerns**: Never expose JPA `@Entity` classes directly as request bodies in REST controllers. Exposing entities invites mass-assignment attacks (e.g. an attacker injecting `"role": "ADMIN"` or modifying `id`).
2. **Jakarta Bean Validation**: Annotations like `@NotBlank`, `@Email`, `@Min(0)` catch invalid payloads at the HTTP layer, rejecting bad requests before any database connections or service logic execute.

---

## 4. DTO Files & Implementation

### 4.1 `RegisterRequest.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/request/RegisterRequest.java`
```java
package com.kidneycare.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;
}
```

---

### 4.2 `LoginRequest.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/request/LoginRequest.java`
```java
package com.kidneycare.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
```

---

### 4.3 `HealthProfileRequest.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/request/HealthProfileRequest.java`
```java
package com.kidneycare.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthProfileRequest {

    @Min(value = 0, message = "Age must be non-negative")
    @Max(value = 120, message = "Age must be at most 120")
    private Integer age;

    private String gender;

    @Min(value = 50, message = "Height must be at least 50 cm")
    @Max(value = 250, message = "Height must be at most 250 cm")
    private Double heightCm;

    @Min(value = 10, message = "Weight must be at least 10 kg")
    @Max(value = 300, message = "Weight must be at most 300 kg")
    private Double weightKg;

    private String diabetes;
    private String hypertension;
    private String familyHistory;
    private String smoking;
    private String alcohol;
    private String painkillerUsage;
}
```

---

### 4.4 `AssessmentRequest.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/request/AssessmentRequest.java`
```java
package com.kidneycare.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Clinical features submitted for ML risk assessment.
 * Field names match the Spring Boot → Python ML contract.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentRequest {

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age must be non-negative")
    private Double age;

    @NotNull(message = "Blood pressure is required")
    @Min(value = 0, message = "Blood pressure must be non-negative")
    private Double bloodPressure;

    private Double specificGravity;
    private Double albumin;
    private Double sugar;
    private String redBloodCells;
    private String pusCell;
    private String pusCellClumps;
    private String bacteria;
    private Double bloodGlucoseRandom;
    private Double bloodUrea;
    private Double serumCreatinine;
    private Double sodium;
    private Double potassium;
    private Double hemoglobin;
    private Double packedCellVolume;
    private Double whiteBloodCellCount;
    private Double redBloodCellCount;
    private String hypertension;
    private String diabetesMellitus;
    private String coronaryArteryDisease;
    private String appetite;
    private String pedalEdema;
    private String anemia;
}
```

---

### 4.5 `ActivityRequest.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/request/ActivityRequest.java`
```java
package com.kidneycare.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityRequest {

    @NotNull(message = "Activity date is required")
    private LocalDate activityDate;

    @Min(value = 0, message = "Water intake must be non-negative")
    private Double waterIntakeLiters;

    @Min(value = 0, message = "Exercise minutes must be non-negative")
    private Integer exerciseMinutes;

    @Min(value = 0, message = "Sleep hours must be non-negative")
    private Double sleepHours;

    private String saltLevel;
    private Boolean fastFood;
    private Integer sugaryDrinks;
    private Boolean smoking;
    private Boolean alcohol;

    @Min(value = 10, message = "Weight must be at least 10 kg")
    private Double weightKg;

    private String stressLevel;
}
```

---

### 4.6 `ProfileUpdateRequest.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/request/ProfileUpdateRequest.java`
```java
package com.kidneycare.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    private HealthProfileRequest healthProfile;
}
```

---

### 4.7 `ResearchSubmissionRequest.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/request/ResearchSubmissionRequest.java`
```java
package com.kidneycare.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResearchSubmissionRequest {

    private String participantId;

    @NotBlank(message = "Role is required")
    private String role;

    @NotBlank(message = "Age group is required")
    private String ageGroup;

    private String gender;
    private String diabetes;
    private String hypertension;
    private String familyHistory;
    private String painkillerUsage;
    private String waterIntake;
    private String exercise;
    private String sleepHours;
    private String saltyProcessed;
    private String fastFood;
    private String sugaryDrinks;
    private String smoking;
    private String alcohol;
    private Boolean awareEarlySymptoms;
    private Boolean awareRiskFactors;
    private Boolean monitorsBp;
    private Boolean receivedKidneyInfo;
}
```

---

## 5. Verification
Compile the request DTOs:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile
```

---

## 6. Next Step Dependency
Proceed to **`15_BACKEND_RESPONSE_DTOS_AND_SCORE_CALCULATOR.md`** to implement Response DTOs and the algorithmic utility `LifestyleScoreCalculator.java`.

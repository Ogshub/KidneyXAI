# Step 19: Spring Boot Backend — REST Controllers & API Layer

## 1. Overview & Objective
In this step, we implement the 8 REST controllers in package `com.kidneycare.controller`:
1. `AuthController`: Public endpoints `POST /api/auth/register` and `POST /api/auth/login`.
2. `HealthProfileController`: `GET` and `PUT /api/health-profile`.
3. `AssessmentController`: `POST /api/assessments` (triggers ML pipeline), `GET /api/assessments`, and `GET /api/assessments/{id}`.
4. `ActivityController`: `POST /api/activities` (daily habit logging) and `GET /api/activities?from=...&to=...`.
5. `RecommendationController`: `GET /api/recommendations` and `GET /api/recommendations/assessment/{id}`.
6. `DashboardController`: `GET /api/dashboard`.
7. `ProfileController`: `GET` and `PUT /api/profile`.
8. `ResearchController`: Public endpoint `POST /api/research/submit` for Dataset B survey responses.

---

## 2. Prerequisites
- Completed `13_BACKEND_JWT_SECURITY_AND_FILTERS.md` (SecurityConfig defines URL access policies)
- Completed `14_BACKEND_REQUEST_DATA_TRANSFER_OBJECTS.md`
- Completed `15_BACKEND_RESPONSE_DTOS_AND_SCORE_CALCULATOR.md`
- Completed `16_BACKEND_AUTH_AND_PROFILE_SERVICES.md`
- Completed `18_BACKEND_ASSESSMENT_ACTIVITY_DASHBOARD_RESEARCH_SERVICES.md`

---

## 3. Why This Is Created Now
1. **HTTP Parameter & Identity Extraction**: Controllers do not accept raw user IDs in the request path or body. They inject Spring Security's `Authentication auth` parameter (`auth.getName()` = authenticated user's email). This prevents ID-enumeration and horizontal privilege escalation vulnerabilities.
2. **Payload Validation Enforcement**: Decorating `@RequestBody` with `@Valid` triggers Jakarta validation, ensuring that bad data is rejected before executing service methods.

---

## 4. Key Controller Implementations

### 4.1 `AuthController.java`
Path: `backend-springboot/src/main/java/com/kidneycare/controller/AuthController.java`
```java
package com.kidneycare.controller;

import com.kidneycare.dto.request.LoginRequest;
import com.kidneycare.dto.request.RegisterRequest;
import com.kidneycare.dto.response.AuthResponse;
import com.kidneycare.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
```

---

### 4.2 `AssessmentController.java`
Path: `backend-springboot/src/main/java/com/kidneycare/controller/AssessmentController.java`
```java
package com.kidneycare.controller;

import com.kidneycare.dto.request.AssessmentRequest;
import com.kidneycare.dto.response.AssessmentResponse;
import com.kidneycare.service.AssessmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AssessmentService assessmentService;

    @PostMapping
    public ResponseEntity<AssessmentResponse> createAssessment(
            Authentication auth,
            @Valid @RequestBody AssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.createAssessment(auth.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<AssessmentResponse>> getAssessments(Authentication auth) {
        return ResponseEntity.ok(assessmentService.getAssessmentHistory(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssessmentResponse> getAssessment(
            Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(assessmentService.getAssessmentById(auth.getName(), id));
    }
}
```

---

### 4.3 `DashboardController.java`
Path: `backend-springboot/src/main/java/com/kidneycare/controller/DashboardController.java`
```java
package com.kidneycare.controller;

import com.kidneycare.dto.response.DashboardResponse;
import com.kidneycare.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(Authentication auth) {
        return ResponseEntity.ok(dashboardService.getDashboard(auth.getName()));
    }
}
```

---

### 4.4 `ActivityController.java`, `RecommendationController.java`, `HealthProfileController.java`, `ProfileController.java`, `ResearchController.java`
- `ActivityController`: Exposes `POST /api/activities` (logs activity) and `GET /api/activities` (query by date range).
- `RecommendationController`: Exposes `GET /api/recommendations` and `GET /api/recommendations/assessment/{id}`.
- `HealthProfileController`: Exposes `GET` and `PUT /api/health-profile`.
- `ProfileController`: Exposes `GET` and `PUT /api/profile`.
- `ResearchController`: Exposes public `POST /api/research/submit`.

---

## 5. Verification
Compile all controllers:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile
```

---

## 6. Next Step Dependency
Proceed to **`20_BACKEND_MAIN_APPLICATION_AND_DOCKERFILE.md`** to implement the main class `KidneyCareApplication.java` and multi-stage container build in `Dockerfile`.

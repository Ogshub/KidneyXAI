# Step 11: Spring Boot Backend — Data Access Layer (Spring Data JPA Repositories)

## 1. Overview & Objective
In this step, we implement the 7 repository interfaces in package `com.kidneycare.repository`:
1. `UserRepository`: Lookup by email for authentication and email uniqueness checks.
2. `HealthProfileRepository`: Fetching and checking existence of a user's health profile.
3. `AssessmentRepository`: Retrieving user assessment history and latest assessment via custom JPQL.
4. `AssessmentFeatureRepository`: Fetching SHAP attribution features ordered by impact magnitude.
5. `ActivityRepository`: Fetching date-specific logs, date-range slices (7-day, 30-day), and full user history.
6. `RecommendationRepository`: Retrieving actionable clinical guidance and recent priority advice.
7. `ResearchResponseRepository`: Cohort slicing (`role = 'Student'` vs `'Faculty'`) and population statistics.

---

## 2. Prerequisites
- Completed `10_BACKEND_JPA_ENTITIES_DATA_MODEL.md` (all entities imported)

---

## 3. Why This Is Created Now
1. **Spring Data JPA Dynamic Proxies**: Developers do not need to write error-prone raw SQL queries or JDBC statements. Spring automatically derives optimal SQL execution plans directly from method signatures (e.g. `findByUserIdAndActivityDateBetweenOrderByActivityDateAsc`).
2. **Security Isolation**: Repository queries like `findByIdAndUserId(Long id, Long userId)` enforce row-level tenant security, preventing one user from accessing another user's assessment ID.

---

## 4. Repository Files & Implementation

### 4.1 `UserRepository.java`
Path: `backend-springboot/src/main/java/com/kidneycare/repository/UserRepository.java`
```java
package com.kidneycare.repository;

import com.kidneycare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
```

---

### 4.2 `HealthProfileRepository.java`
Path: `backend-springboot/src/main/java/com/kidneycare/repository/HealthProfileRepository.java`
```java
package com.kidneycare.repository;

import com.kidneycare.entity.HealthProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HealthProfileRepository extends JpaRepository<HealthProfile, Long> {

    Optional<HealthProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
```

---

### 4.3 `AssessmentRepository.java`
Path: `backend-springboot/src/main/java/com/kidneycare/repository/AssessmentRepository.java`
```java
package com.kidneycare.repository;

import com.kidneycare.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {

    List<Assessment> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT a FROM Assessment a WHERE a.user.id = :userId ORDER BY a.createdAt DESC LIMIT 1")
    Optional<Assessment> findLatestByUserId(@Param("userId") Long userId);

    Optional<Assessment> findByIdAndUserId(Long id, Long userId);
}
```

---

### 4.4 `AssessmentFeatureRepository.java`
Path: `backend-springboot/src/main/java/com/kidneycare/repository/AssessmentFeatureRepository.java`
```java
package com.kidneycare.repository;

import com.kidneycare.entity.AssessmentFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentFeatureRepository extends JpaRepository<AssessmentFeature, Long> {

    List<AssessmentFeature> findByAssessmentIdOrderByShapValueDesc(Long assessmentId);
}
```

---

### 4.5 `ActivityRepository.java`
Path: `backend-springboot/src/main/java/com/kidneycare/repository/ActivityRepository.java`
```java
package com.kidneycare.repository;

import com.kidneycare.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    Optional<Activity> findByUserIdAndActivityDate(Long userId, LocalDate activityDate);

    List<Activity> findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(
            Long userId, LocalDate from, LocalDate to);

    List<Activity> findByUserIdOrderByActivityDateDesc(Long userId);
}
```

---

### 4.6 `RecommendationRepository.java`
Path: `backend-springboot/src/main/java/com/kidneycare/repository/RecommendationRepository.java`
```java
package com.kidneycare.repository;

import com.kidneycare.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByAssessmentIdOrderByPriorityDesc(Long assessmentId);

    @Query("SELECT r FROM Recommendation r WHERE r.assessment.user.id = :userId " +
           "ORDER BY r.createdAt DESC")
    List<Recommendation> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query(value = "SELECT r.* FROM recommendations r " +
           "JOIN assessments a ON r.assessment_id = a.id " +
           "WHERE a.user_id = :userId ORDER BY r.created_at DESC LIMIT :limit",
           nativeQuery = true)
    List<Recommendation> findRecentByUserId(@Param("userId") Long userId,
                                            @Param("limit") int limit);
}
```

---

### 4.7 `ResearchResponseRepository.java`
Path: `backend-springboot/src/main/java/com/kidneycare/repository/ResearchResponseRepository.java`
```java
package com.kidneycare.repository;

import com.kidneycare.entity.ResearchResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResearchResponseRepository extends JpaRepository<ResearchResponse, Long> {

    List<ResearchResponse> findByRole(String role);

    long countByRole(String role);
}
```

---

## 5. Verification
Compile the repository layer:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile
```
Ensure all 7 interfaces compile and bind correctly to their entity types.

---

## 6. Next Step Dependency
Proceed to **`12_BACKEND_EXCEPTIONS_AND_GLOBAL_HANDLER.md`** to construct custom business exceptions and Spring's `@RestControllerAdvice` global error handler.

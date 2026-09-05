# Step 12: Spring Boot Backend — Custom Exceptions & Global Error Handler

## 1. Overview & Objective
In this step, we establish robust error management in package `com.kidneycare.exception`:
1. `ResourceNotFoundException`: Specific runtime exception for missing users, profiles, or assessments (HTTP 404).
2. `MlServiceException`: Thrown when upstream Python inference fails, times out, or returns bad data (HTTP 503 Service Unavailable).
3. `GlobalExceptionHandler`: Centralized `@ControllerAdvice` intercepting all exceptions and returning a consistent JSON error schema to the frontend.

---

## 2. Prerequisites
- Completed `08_BACKEND_MAVEN_BUILD_AND_DEPENDENCIES.md` (`spring-boot-starter-web` and `validation`)

---

## 3. Why This Is Created Now
1. **Frontend Predictability**: When validation fails or a service crashes, default Spring Boot HTML error pages or stack traces crash frontend React components. A uniform JSON contract (`{timestamp, status, error, message, fieldErrors}`) ensures Axios interceptors can display clean toasts and form warnings.
2. **Microservice Fault Tolerance**: If the Python ML microservice is restarting, `MlServiceException` cleanly catches connection timeouts and returns HTTP 503 with a graceful message instead of dropping the user connection.

---

## 4. Exception Files & Implementation

### 4.1 `ResourceNotFoundException.java`
Path: `backend-springboot/src/main/java/com/kidneycare/exception/ResourceNotFoundException.java`
```java
package com.kidneycare.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, String field, Object value) {
        super(String.format("%s not found with %s: '%s'", resource, field, value));
    }
}
```

---

### 4.2 `MlServiceException.java`
Path: `backend-springboot/src/main/java/com/kidneycare/exception/MlServiceException.java`
```java
package com.kidneycare.exception;

/**
 * Thrown when the Python ML service is unreachable,
 * times out, or returns a malformed response.
 */
public class MlServiceException extends RuntimeException {

    public MlServiceException(String message) {
        super(message);
    }

    public MlServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

---

### 4.3 `GlobalExceptionHandler.java`
Path: `backend-springboot/src/main/java/com/kidneycare/exception/GlobalExceptionHandler.java`
```java
package com.kidneycare.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Single @ControllerAdvice translating exceptions from ANY module
 * into a consistent JSON error shape for the React client.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MlServiceException.class)
    public ResponseEntity<Map<String, Object>> handleMlServiceError(MlServiceException ex) {
        return buildResponse(HttpStatus.SERVICE_UNAVAILABLE,
                "Risk assessment temporarily unavailable: " + ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Failed");
        body.put("fieldErrors", fieldErrors);

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred: " + ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return new ResponseEntity<>(body, status);
    }
}
```

---

## 5. Verification
Run Maven compile to verify that all exception handlers and HTTP status bindings are valid:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile
```

---

## 6. Next Step Dependency
Proceed to **`13_BACKEND_JWT_SECURITY_AND_FILTERS.md`** to implement stateless JWT token generation, header authentication filters, and Spring Security 6 filter chain configuration.

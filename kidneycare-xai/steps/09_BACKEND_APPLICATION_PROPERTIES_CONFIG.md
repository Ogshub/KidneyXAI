# Step 09: Spring Boot Backend — Application Configuration & Properties

## 1. Overview & Objective
In this step, we write `backend-springboot/src/main/resources/application.properties`.

This file acts as the configuration hub for:
- Connecting to the PostgreSQL relational database created in Step 02.
- Configuring Hibernate 6 ORM dialect and schema synchronization mode (`ddl-auto=update`).
- Injecting the HMAC-SHA secret key and token expiration window ($86,400,000\text{ ms} = 24\text{ hours}$) for JWT authentication.
- Designating the upstream HTTP endpoint for the Python FastAPI ML microservice created in Step 07 (`http://localhost:8000`).
- Providing 12-factor environment variable overrides (`${ENV_VAR:default_value}`) for seamless Docker container deployment.

---

## 2. Prerequisites
- Completed `02_DATABASE_SCHEMA_AND_RELATIONAL_DESIGN.md`
- Completed `07_ML_SERVICE_FASTAPI_APP_AND_ENDPOINTS.md`
- Completed `08_BACKEND_MAVEN_BUILD_AND_DEPENDENCIES.md`

---

## 3. Why This Is Created Now
1. **Dynamic Environment Binding**: Hardcoding database passwords or service URLs breaks Docker deployments. By using `${DB_URL:jdbc:postgresql://localhost:5432/kidneycare}`, the application works identically on a local developer machine without environment variables, while automatically reading Docker Compose network aliases (`db:5432`, `ml-service:8000`) in production.
2. **JPA Dialect Alignment**: PostgreSQL has specific data types (such as `TIMESTAMP WITHOUT TIME ZONE`, `DOUBLE PRECISION`, `BOOLEAN`). Explicitly configuring `org.hibernate.dialect.PostgreSQLDialect` ensures Hibernate generates optimized PostgreSQL SQL queries.

---

## 4. File Content: `backend-springboot/src/main/resources/application.properties`

Create `kidneycare-xai/backend-springboot/src/main/resources/application.properties`:

```properties
# ============================================
# KidneyCare-XAI — Application Properties
# ============================================

spring.application.name=kidneycare-xai

# ── Database ──
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/kidneycare}
spring.datasource.username=${DB_USERNAME:kidneycare}
spring.datasource.password=${DB_PASSWORD:kidneycare_secret}
spring.datasource.driver-class-name=org.postgresql.Driver

# ── JPA / Hibernate ──
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# ── JWT ──
jwt.secret=${JWT_SECRET:kidneycare-xai-default-secret-key-change-in-production-2026}
jwt.expiration-ms=86400000

# ── ML Service ──
ml.service.url=${ML_SERVICE_URL:http://localhost:8000}
ml.service.timeout-ms=10000

# ── Server ──
server.port=8080

# ── Logging ──
logging.level.com.kidneycare=DEBUG
logging.level.org.hibernate.SQL=WARN
```

---

## 5. Parameter Details

| Property | Default Value | Description |
|---|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/kidneycare` | JDBC connection string to the PostgreSQL database |
| `spring.jpa.hibernate.ddl-auto` | `update` | Automatically aligns JPA entities with relational tables on startup |
| `jwt.secret` | `kidneycare-xai-default...` | Secret key used to sign HMAC-SHA256 JWT tokens |
| `jwt.expiration-ms` | `86400000` | Token lifetime (24 hours in milliseconds) |
| `ml.service.url` | `http://localhost:8000` | Target URL for ML inference microservice |
| `ml.service.timeout-ms` | `10000` | Socket read timeout (10 seconds) for ML inference |
| `server.port` | `8080` | Port on which the Spring Boot Tomcat container listens |

---

## 6. Verification
Inspect the file syntax:
```powershell
Get-Content kidneycare-xai/backend-springboot/src/main/resources/application.properties
```
Ensure there are no trailing whitespace characters or unescaped characters in the properties keys.

---

## 7. Next Step Dependency
Proceed to **`10_BACKEND_JPA_ENTITIES_DATA_MODEL.md`** to create the 7 Java domain entities (`User.java`, `HealthProfile.java`, `Assessment.java`, `AssessmentFeature.java`, `Activity.java`, `Recommendation.java`, `ResearchResponse.java`).

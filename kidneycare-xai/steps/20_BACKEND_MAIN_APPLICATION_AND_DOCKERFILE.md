# Step 20: Spring Boot Backend — Main Application Entry & Multi-Stage Dockerfile

## 1. Overview & Objective
In this step, we finalize the backend service:
1. `KidneycareApplication.java`: The `@SpringBootApplication` entry point launching embedded Tomcat, component scanning (`com.kidneycare.*`), auto-configuration, and JPA repository bootstrapping.
2. `backend-springboot/Dockerfile`: A production-grade multi-stage container build that compiles Java source files in an isolated Maven container and packages the resulting fat JAR into a lightweight Alpine JRE runtime.

---

## 2. Prerequisites
- Completed Steps 08 through 19 (entire backend layer compiled)

---

## 3. Why This Is Created Now
1. **Component Scanning Anchor**: In Spring Boot, `@SpringBootApplication` scans only the package it is located in (`com.kidneycare`) and its sub-packages. Placing it at the root package anchors scanning across `entity`, `repository`, `service`, `controller`, `security`, `exception`, and `dto`.
2. **Multi-Stage Container Optimization**: Compiling inside a 500MB Maven JDK container but copying only the resulting `.jar` into a tiny 150MB Alpine JRE runner minimizes the final image size and strips build tools, reducing CVE attack surface.

---

## 4. File Implementations

### 4.1 `KidneycareApplication.java`
Path: `backend-springboot/src/main/java/com/kidneycare/KidneycareApplication.java`
```java
package com.kidneycare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class KidneycareApplication {

    public static void main(String[] args) {
        SpringApplication.run(KidneycareApplication.class, args);
    }
}
```

---

### 4.2 `backend-springboot/Dockerfile`
Path: `backend-springboot/Dockerfile`
```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 5. Verification
Package the entire backend application into a runnable executable JAR:
```powershell
cd kidneycare-xai/backend-springboot
mvn clean package -DskipTests
```
Verify that `BUILD SUCCESS` appears and `target/kidneycare-xai-1.0.0.jar` is generated.

---

## 6. Next Step Dependency
Phase 3 (Spring Boot Backend) is complete! Proceed to Phase 4: Frontend Web Client, starting with **`21_FRONTEND_VITE_SETUP_AND_TAILWIND_DESIGN_SYSTEM.md`** to configure Vite, Tailwind CSS, and global styles.

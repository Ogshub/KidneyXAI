# Step 08: Spring Boot Backend — Maven Build Specification & Dependencies

## 1. Overview & Objective
In this step, we configure the Maven project object model in `backend-springboot/pom.xml`.

This file establishes:
- **Parent BOM**: Spring Boot 3.2.1 managing dependency versions, compiler plugins, and packaging.
- **Java Runtime Target**: Java 17 LTS (using modern sealed classes, records, and pattern matching).
- **Enterprise Starters**:
  - `spring-boot-starter-web`: Embedded Tomcat and Spring MVC REST controller infrastructure.
  - `spring-boot-starter-data-jpa`: Hibernate 6 ORM, connection pooling (HikariCP), and transactional repository abstractions.
  - `spring-boot-starter-security`: BCrypt password encoding, security context filters, and stateless authorization.
  - `spring-boot-starter-validation`: Jakarta Bean Validation (`@NotNull`, `@Min`, `@Max`, `@Email`).
  - `postgresql`: PostgreSQL JDBC Driver for runtime relational connectivity.
  - `jjwt` (version 0.12.3): JSON Web Token signing, parsing, and cryptographic verification (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`).
  - `lombok`: Boilerplate reduction for entity getters, setters, constructors, and builder patterns.

---

## 2. Prerequisites
- Java Development Kit (JDK 17 or higher) installed and configured on `PATH`
- Apache Maven (>= 3.8) or Maven Wrapper installed

---

## 3. Why This Is Created Now
In Java, dependencies and build plugins must precede all class declarations. Without `pom.xml`:
- JPA annotations like `@Entity`, `@Table`, `@Id` cannot resolve.
- Jakarta validation annotations like `@NotBlank`, `@Size` will throw compiler errors.
- Lombok code generators will not attach during AST compilation.

---

## 4. File Content: `backend-springboot/pom.xml`

Create `kidneycare-xai/backend-springboot/pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.1</version>
        <relativePath/>
    </parent>

    <groupId>com.kidneycare</groupId>
    <artifactId>kidneycare-xai</artifactId>
    <version>1.0.0</version>
    <name>KidneyCare-XAI Backend</name>
    <description>Spring Boot backend for KidneyCare-XAI decision support system</description>

    <properties>
        <java.version>17</java.version>
        <jjwt.version>0.12.3</jjwt.version>
    </properties>

    <dependencies>
        <!-- ── Spring Boot Starters ── -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- ── Database ── -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- ── JWT ── -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- ── Lombok ── -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- ── Testing ── -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
```

---

## 5. Verification
Run Maven dependency resolution in terminal:
```powershell
cd kidneycare-xai/backend-springboot
mvn dependency:resolve
```
Verify that `BUILD SUCCESS` is printed and all dependencies download without conflict.

---

## 6. Next Step Dependency
Proceed to **`09_BACKEND_APPLICATION_PROPERTIES_CONFIG.md`** to configure database connections, JWT secret keys, and Python ML microservice HTTP URLs in `src/main/resources/application.properties`.

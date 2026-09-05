# Step 13: Spring Boot Backend — JWT Security & Authentication Filters

## 1. Overview & Objective
In this step, we construct the stateless security infrastructure in package `com.kidneycare.security`:
1. `JwtService`: Encapsulates HMAC-SHA256 token creation, extraction of claims, and cryptographic validation.
2. `JwtAuthenticationFilter`: Extends Spring's `OncePerRequestFilter`. Intercepts incoming HTTP requests, extracts the `Authorization: Bearer <token>` header, verifies the signature, and sets the authenticated identity in the `SecurityContextHolder`.
3. `SecurityConfig`: Configures Spring Security 6, defines CSRF bypass for REST, registers BCrypt password hashing, allows CORS for Vite (`localhost:5173`) and Docker Nginx (`localhost:3000`), and declares public whitelist routes (`/api/auth/**`, `/api/research/**`).

---

## 2. Prerequisites
- Completed `08_BACKEND_MAVEN_BUILD_AND_DEPENDENCIES.md` (JJWT 0.12.3 and `spring-boot-starter-security`)
- Completed `09_BACKEND_APPLICATION_PROPERTIES_CONFIG.md` (`jwt.secret`, `jwt.expiration-ms`)
- Completed `10_BACKEND_JPA_ENTITIES_DATA_MODEL.md` (`User.java`)
- Completed `11_BACKEND_SPRING_DATA_JPA_REPOSITORIES.md` (`UserRepository.java`)

---

## 3. Why This Is Created Now
1. **Stateless Scalability**: Medical web applications must not store server-side HTTP sessions in memory. JWT tokens allow horizontally scaling backend replicas behind a load balancer without sticky sessions.
2. **Deterministic Route Protection**: By setting up `SecurityConfig` before developing controllers, every subsequent endpoint is secured by default. Unauthorized callers are denied before executing expensive database or ML inference logic.

---

## 4. Security Files & Implementation

### 4.1 `JwtService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/security/JwtService.java`
```java
package com.kidneycare.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT token generation and validation service.
 * The only module allowed to issue/validate JWTs.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(String email) {
        return generateToken(new HashMap<>(), email);
    }

    public String generateToken(Map<String, Object> extraClaims, String email) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(email)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, String email) {
        final String tokenEmail = extractEmail(token);
        return (tokenEmail.equals(email)) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(
                java.util.Base64.getEncoder().encodeToString(secretKey.getBytes())
        );
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

---

### 4.2 `JwtAuthenticationFilter.java`
Path: `backend-springboot/src/main/java/com/kidneycare/security/JwtAuthenticationFilter.java`
```java
package com.kidneycare.security;

import com.kidneycare.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT authentication filter.
 * Runs once per request ahead of any controller.
 * Validates the JWT signature/expiry and populates the Spring Security context.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // No Bearer token → skip filter
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            final String email = jwtService.extractEmail(jwt);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                var userEntity = userRepository.findByEmail(email);

                if (userEntity.isPresent() && jwtService.isTokenValid(jwt, email)) {
                    UserDetails userDetails = User.builder()
                            .username(email)
                            .password(userEntity.get().getPasswordHash())
                            .authorities(Collections.emptyList())
                            .build();

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities()
                            );
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            logger.debug("JWT validation failed: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
```

---

### 4.3 `SecurityConfig.java`
Path: `backend-springboot/src/main/java/com/kidneycare/security/SecurityConfig.java`
```java
package com.kidneycare.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration.
 * - JWT-based stateless authentication
 * - Public routes: /api/auth/**, /api/research/**
 * - All other /api/** routes require authentication
 * - CORS configured for React frontend
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints (no JWT required)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/research/**").permitAll()
                        // Everything else requires authentication
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

---

## 5. Verification
Verify compilation:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile
```

---

## 6. Next Step Dependency
Proceed to **`14_BACKEND_REQUEST_DATA_TRANSFER_OBJECTS.md`** to implement the Request DTO classes validated with Jakarta Bean Validation.

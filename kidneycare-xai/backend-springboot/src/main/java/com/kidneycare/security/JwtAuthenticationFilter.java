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

    static final String INVALID_SESSION = JwtAuthenticationFilter.class.getName() + ".invalidSession";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // No Bearer token → skip
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String email;
        try {
            email = jwtService.authenticatedEmail(authHeader.substring(7));
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            request.setAttribute(INVALID_SESSION, true);
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            var userEntity = userRepository.findByEmail(email);
            if (userEntity.isPresent()) {
                UserDetails userDetails = User.builder()
                        .username(email)
                        .password(userEntity.get().getPasswordHash())
                        .authorities(Collections.emptyList())
                        .build();
                var authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                request.setAttribute(INVALID_SESSION, true);
            }
        }
        filterChain.doFilter(request, response);
    }
}

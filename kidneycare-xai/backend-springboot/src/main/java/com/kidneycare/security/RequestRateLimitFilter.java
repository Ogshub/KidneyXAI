package com.kidneycare.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/** Per-instance limits. Only the socket peer is trusted, never forwarded client headers. */
@Component
public class RequestRateLimitFilter extends OncePerRequestFilter {
    private record Window(long expiresAt, int count) {}
    private final Map<String, Window> windows = new HashMap<>();

    private synchronized boolean accept(String key, int limit) {
        long now = System.currentTimeMillis();
        windows.entrySet().removeIf(entry -> entry.getValue().expiresAt() <= now);
        Window previous = windows.get(key);
        if (previous == null) {
            if (windows.size() >= 10000) return false;
            windows.put(key, new Window(now + 60000, 1));
            return true;
        }
        if (previous.count() >= limit) return false;
        windows.put(key, new Window(previous.expiresAt(), previous.count() + 1));
        return true;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String path = request.getServletPath();
        boolean auth = "POST".equals(request.getMethod()) && path.startsWith("/api/auth/");
        boolean survey = "POST".equals(request.getMethod()) && path.equals("/api/research/responses");
        boolean deletion = "DELETE".equals(request.getMethod()) && path.equals("/api/profile");
        if ((auth || survey || deletion) && !accept(request.getRemoteAddr() + path, auth ? 60 : 10)) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Too many requests. Please wait a minute and try again.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}

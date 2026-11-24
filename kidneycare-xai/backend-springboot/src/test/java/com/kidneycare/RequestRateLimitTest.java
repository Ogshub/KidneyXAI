package com.kidneycare;

import com.kidneycare.security.RequestRateLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import static org.junit.jupiter.api.Assertions.assertEquals;

class RequestRateLimitTest {
    @Test
    void limitsDeletionAndIgnoresForgedForwardingHeaders() throws Exception {
        var filter = new RequestRateLimitFilter();
        for (int attempt = 0; attempt < 11; attempt++) {
            var request = new MockHttpServletRequest("DELETE", "/api/profile");
            request.setServletPath("/api/profile");
            request.setRemoteAddr("127.0.0.1");
            request.addHeader("X-Forwarded-For", "192.0.2." + attempt);
            var response = new MockHttpServletResponse();
            filter.doFilter(request, response, (req, res) -> {});
            assertEquals(attempt < 10 ? 200 : 429, response.getStatus());
        }
    }
}

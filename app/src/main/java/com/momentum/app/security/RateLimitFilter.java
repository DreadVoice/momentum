package com.momentum.app.security;

import java.io.IOException;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.momentum.app.exception.ErrorResponse;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of("/api/auth/login", "/api/auth/register");
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final Map<String, Bucket> buckets = Collections.synchronizedMap(
            new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Bucket> eldest) {
                    return size() > MAX_TRACKED_CLIENTS;
                }
            });

    private final ObjectMapper objectMapper;
    private final int capacity;
    private final Duration period;

    public RateLimitFilter(ObjectMapper objectMapper,
            @Value("${app.ratelimit.capacity:5}") int capacity,
            @Value("${app.ratelimit.period-seconds:60}") long periodSeconds) {
        this.objectMapper = objectMapper;
        this.capacity = capacity;
        this.period = Duration.ofSeconds(periodSeconds);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !LIMITED_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String client = clientAddress(request);
        if (buckets.computeIfAbsent(client, key -> newBucket()).tryConsume(1)) {
            filterChain.doFilter(request, response);
            return;
        }

        log.warn("Rate limit exceeded for {} on {}", client, request.getRequestURI());

        ErrorResponse body = new ErrorResponse(
                HttpStatus.TOO_MANY_REQUESTS.value(),
                HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                "Too many requests. Try again later.");

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), body);
    }

    private Bucket newBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(capacity).refillGreedy(capacity, period).build())
                .build();
    }

    /** Behind a proxy the peer address is the proxy, so prefer the first forwarded hop. */
    private String clientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

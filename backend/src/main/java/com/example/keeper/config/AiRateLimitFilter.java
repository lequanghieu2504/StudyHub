package com.example.keeper.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class AiRateLimitFilter extends OncePerRequestFilter {

    private static final List<String> AI_ENDPOINT_PREFIXES = List.of(
            "/api/ai/ask",
            "/api/ai/shared/ask",
            "/api/ai_flashcard/generate",
            "/api/v1/mindmaps/generate",
            "/api/quizzes/generate",
            "/api/embedding"
    );

    private final ConcurrentMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Value("${app.ai.rate-limit.capacity:20}")
    private int capacity;

    @Value("${app.ai.rate-limit.refill-tokens:20}")
    private int refillTokens;

    @Value("${app.ai.rate-limit.refill-period-seconds:60}")
    private long refillPeriodSeconds;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if (!shouldRateLimit(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = resolveClientKey(request);
        TokenBucket bucket = buckets.computeIfAbsent(
                key,
                ignored -> new TokenBucket(capacity, refillTokens, Duration.ofSeconds(refillPeriodSeconds))
        );

        if (!bucket.tryConsume()) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(Math.max(1, refillPeriodSeconds)));
            response.getWriter().write("{\"message\":\"Too many AI requests. Please try again later.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean shouldRateLimit(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String path = request.getRequestURI();
        return AI_ENDPOINT_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private String resolveClientKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getName() != null && !"anonymousUser".equals(authentication.getName())) {
            return "user:" + authentication.getName();
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return "ip:" + forwardedFor.split(",")[0].trim();
        }

        return "ip:" + request.getRemoteAddr();
    }

    private static class TokenBucket {
        private final int capacity;
        private final int refillTokens;
        private final Duration refillPeriod;
        private int tokens;
        private Instant lastRefill;

        private TokenBucket(int capacity, int refillTokens, Duration refillPeriod) {
            this.capacity = Math.max(1, capacity);
            this.refillTokens = Math.max(1, refillTokens);
            this.refillPeriod = refillPeriod.isNegative() || refillPeriod.isZero()
                    ? Duration.ofMinutes(1)
                    : refillPeriod;
            this.tokens = this.capacity;
            this.lastRefill = Instant.now();
        }

        private synchronized boolean tryConsume() {
            refill();
            if (tokens <= 0) {
                return false;
            }

            tokens--;
            return true;
        }

        private void refill() {
            Instant now = Instant.now();
            long periods = Duration.between(lastRefill, now).toMillis() / refillPeriod.toMillis();
            if (periods <= 0) {
                return;
            }

            long newTokens = (long) tokens + periods * refillTokens;
            tokens = (int) Math.min(capacity, newTokens);
            lastRefill = lastRefill.plus(refillPeriod.multipliedBy(periods));
        }
    }
}

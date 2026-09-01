package com.example.dms.auth;

import com.example.dms.user.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.Date;
import java.util.Set;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final int MIN_SECRET_LENGTH = 32;

    private static final String DEFAULT_SECRET = "dms-lite-secret-key-must-be-at-least-32-characters";

    private static final Set<String> UNSAFE_PRODUCTION_SECRETS = Set.of(
        DEFAULT_SECRET,
        "change-me-minimum-32-characters",
        "replace-with-strong-random-64-char-secret"
    );

    private final Environment environment;

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.minutes}")
    private long minutes;

    public JwtService(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("APP_JWT_SECRET must be at least 32 characters");
        }

        if (minutes <= 0) {
            throw new IllegalStateException("APP_JWT_MINUTES must be greater than zero");
        }

        boolean productionProfile = Arrays.stream(environment.getActiveProfiles())
            .anyMatch(profile -> "prod".equalsIgnoreCase(profile) || "docker".equalsIgnoreCase(profile));
        if (productionProfile && UNSAFE_PRODUCTION_SECRETS.contains(secret)) {
            throw new IllegalStateException("APP_JWT_SECRET must be changed for docker/production deployments");
        }
    }

    SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String token(AppUser appUser) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(appUser.getUsername())
            .claim("tenantId", appUser.getTenantId())
            .claim("userId", appUser.getId())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(minutes * 60)))
            .signWith(key())
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith(key())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
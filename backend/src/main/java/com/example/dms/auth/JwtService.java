package com.example.dms.auth;

import com.example.dms.user.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.minutes}")
    private long minutes;

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

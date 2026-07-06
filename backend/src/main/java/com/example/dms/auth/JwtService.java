package com.example.dms.auth;
import com.example.dms.user.AppUser;import io.jsonwebtoken.*;import io.jsonwebtoken.security.Keys;import org.springframework.beans.factory.annotation.Value;import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;import java.nio.charset.StandardCharsets;import java.time.Instant;import java.util.Date;
@Service
public class JwtService {
 @Value("${app.jwt.secret}") String secret; @Value("${app.jwt.minutes}") long minutes;
 SecretKey key(){return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));}
 public String token(AppUser u){Instant now=Instant.now();return Jwts.builder().subject(u.getUsername()).claim("tenantId",u.getTenantId()).claim("userId",u.getId()).issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(minutes*60))).signWith(key()).compact();}
 public Claims parse(String t){return Jwts.parser().verifyWith(key()).build().parseSignedClaims(t).getPayload();}
}

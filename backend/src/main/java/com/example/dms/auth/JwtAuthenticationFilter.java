package com.example.dms.auth;

import com.example.dms.common.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.filter.OncePerRequestFilter;

@Service
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final DmsUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                if (!tryAuthenticate(authorizationHeader.substring(7))) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private boolean tryAuthenticate(String token) {
        try {
            Claims claims = jwt.parse(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(claims.getSubject());
            if (!userDetails.isEnabled()) {
                return false;
            }

            SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
                )
            );
            TenantContext.set(
                claims.get("tenantId", Long.class),
                claims.get("userId", Long.class)
            );
            return true;
        } catch (Exception exception) {
            SecurityContextHolder.clearContext();
            TenantContext.clear();
            return false;
        }
    }
}

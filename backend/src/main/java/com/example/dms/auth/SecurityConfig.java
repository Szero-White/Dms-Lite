package com.example.dms.auth;
import com.example.dms.common.TenantContext;import com.example.dms.user.*;import io.jsonwebtoken.Claims;import jakarta.servlet.*;import jakarta.servlet.http.*;import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;import org.springframework.security.authentication.*;import org.springframework.security.authentication.dao.*;import org.springframework.security.config.annotation.authentication.configuration.*;import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;import org.springframework.security.config.annotation.web.builders.HttpSecurity;import org.springframework.security.config.http.SessionCreationPolicy;import org.springframework.security.core.authority.SimpleGrantedAuthority;import org.springframework.security.core.context.SecurityContextHolder;import org.springframework.security.core.userdetails.*;import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;import org.springframework.security.crypto.password.PasswordEncoder;import org.springframework.security.web.*;import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;import org.springframework.stereotype.Service;import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;import java.util.stream.Collectors;
@Configuration @EnableMethodSecurity @RequiredArgsConstructor
public class SecurityConfig {
 private final JwtFilter jwtFilter; private final DmsUserDetailsService userDetailsService;
 @Bean SecurityFilterChain chain(HttpSecurity http)throws Exception{return http.csrf(c->c.disable()).cors(c->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(a->a.requestMatchers("/api/auth/**","/swagger-ui/**","/swagger-ui.html","/v3/api-docs/**","/actuator/**").permitAll().anyRequest().authenticated()).authenticationProvider(provider()).addFilterBefore(jwtFilter,UsernamePasswordAuthenticationFilter.class).build();}
 @Bean AuthenticationProvider provider(){DaoAuthenticationProvider p=new DaoAuthenticationProvider();p.setUserDetailsService(userDetailsService);p.setPasswordEncoder(passwordEncoder());return p;}
 @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
 @Bean AuthenticationManager authManager(AuthenticationConfiguration c)throws Exception{return c.getAuthenticationManager();}
}
@Service @RequiredArgsConstructor
class DmsUserDetailsService implements UserDetailsService {
 private final AppUserRepository users;
 public UserDetails loadUserByUsername(String username){AppUser u=users.findByUsername(username).orElseThrow();var auth=u.getRoles().stream().flatMap(r->r.getPermissions().stream()).map(Permission::getName).distinct().map(SimpleGrantedAuthority::new).collect(Collectors.toSet());u.getRoles().forEach(r->auth.add(new SimpleGrantedAuthority("ROLE_"+r.getName())));return User.withUsername(u.getUsername()).password(u.getPasswordHash()).authorities(auth).disabled(!u.isActive()).build();}
}
@Service @RequiredArgsConstructor
class JwtFilter extends OncePerRequestFilter {
 private final JwtService jwt; private final DmsUserDetailsService uds;
 protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{try{String h=req.getHeader("Authorization");if(h!=null&&h.startsWith("Bearer ")){String t=h.substring(7);Claims c=jwt.parse(t);var details=uds.loadUserByUsername(c.getSubject());SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(details,null,details.getAuthorities()));TenantContext.set(c.get("tenantId",Long.class),c.get("userId",Long.class));}chain.doFilter(req,res);}catch(Exception e){res.setStatus(401);}finally{TenantContext.clear();}}
}

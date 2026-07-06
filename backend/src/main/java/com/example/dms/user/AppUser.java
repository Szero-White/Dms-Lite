package com.example.dms.user;
import jakarta.persistence.*;import lombok.*;import java.util.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="app_users")
public class AppUser { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; @Column(unique=true) String username; String passwordHash; String fullName; Long tenantId; boolean active; @ManyToMany(fetch=FetchType.EAGER) @JoinTable(name="user_roles",joinColumns=@JoinColumn(name="user_id"),inverseJoinColumns=@JoinColumn(name="role_id")) @Builder.Default Set<Role> roles=new HashSet<>(); }

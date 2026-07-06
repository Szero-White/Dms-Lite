package com.example.dms.user;
import jakarta.persistence.*;import lombok.*;import java.util.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="roles")
public class Role { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; @Column(unique=true) String name; @ManyToMany(fetch=FetchType.EAGER) @JoinTable(name="role_permissions",joinColumns=@JoinColumn(name="role_id"),inverseJoinColumns=@JoinColumn(name="permission_id")) @Builder.Default Set<Permission> permissions=new HashSet<>(); }

package com.example.dms.user;
import jakarta.persistence.*;import lombok.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="permissions")
public class Permission { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; @Column(unique=true) String name; }

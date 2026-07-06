package com.example.dms.tenant;
import jakarta.persistence.*;import lombok.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="tenants")
public class Tenant { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; String name; boolean active; }

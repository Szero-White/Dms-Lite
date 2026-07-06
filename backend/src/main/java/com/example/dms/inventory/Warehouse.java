package com.example.dms.inventory;
import jakarta.persistence.*;import lombok.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="warehouses")
public class Warehouse { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; String name; }

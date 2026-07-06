package com.example.dms.product;
import jakarta.persistence.*;import lombok.*;import java.math.BigDecimal;import java.time.Instant;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="products")
public class Product { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; String name; String sku; String barcode; BigDecimal costPrice; BigDecimal sellingPrice; Integer minStock; boolean active; Instant deletedAt; }

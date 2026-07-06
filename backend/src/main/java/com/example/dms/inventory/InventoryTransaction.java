package com.example.dms.inventory;
import jakarta.persistence.*;import lombok.*;import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="inventory_transactions")
public class InventoryTransaction { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; Long warehouseId; Long productId; String sourceType; Long sourceId; String direction; Integer quantity; Integer beforeQuantity; Integer afterQuantity; String note; Long createdBy; Instant createdAt; @PrePersist void pre(){createdAt=Instant.now();} }

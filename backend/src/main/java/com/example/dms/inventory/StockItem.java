package com.example.dms.inventory;
import jakarta.persistence.*;import lombok.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="stock_items")
public class StockItem { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; Long warehouseId; Long productId; Integer quantityOnHand; @Version Long version; }

package com.example.dms.sales;
import jakarta.persistence.*;import lombok.*;import java.math.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="sales_order_items")
public class SalesOrderItem { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="sales_order_id") SalesOrder order; Long productId; Integer quantity; BigDecimal unitPrice; BigDecimal discountAmount; BigDecimal lineTotal; }

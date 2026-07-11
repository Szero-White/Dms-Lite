package com.example.dms.sales;

import java.math.BigDecimal;

public record SalesOrderItemResponse(
    Long id,
    Long productId,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal discountAmount,
    BigDecimal lineTotal
) {
}

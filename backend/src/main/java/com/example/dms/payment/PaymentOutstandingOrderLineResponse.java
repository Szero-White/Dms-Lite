package com.example.dms.payment;

import java.math.BigDecimal;

public record PaymentOutstandingOrderLineResponse(
    Long id,
    Long productId,
    String productName,
    String productSku,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal discountAmount,
    BigDecimal lineTotal
) {
}

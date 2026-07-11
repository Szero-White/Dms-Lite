package com.example.dms.customer;

import java.math.BigDecimal;

public record CustomerResponse(
    Long id,
    String name,
    String phone,
    String address,
    BigDecimal creditLimit,
    Integer paymentTermDays,
    BigDecimal debtBalance,
    boolean active
) {
}

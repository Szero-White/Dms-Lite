package com.example.dms.sales;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import org.junit.jupiter.api.Test;

class SalesOrderMapperTest {

    private final SalesOrderMapper mapper = new SalesOrderMapper();

    @Test
    void redactsFinancialFieldsWhenCallerCannotViewOrderFinancials() {
        SalesOrder salesOrder = sampleSalesOrder();

        SalesOrderDetailResponse response = mapper.toDetailResponse(salesOrder, false);

        assertThat(response.totalAmount()).isNull();
        assertThat(response.paidAmount()).isNull();
        assertThat(response.debtAmount()).isNull();
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).unitPrice()).isNull();
        assertThat(response.items().get(0).discountAmount()).isNull();
        assertThat(response.items().get(0).lineTotal()).isNull();
    }

    @Test
    void keepsFinancialFieldsWhenCallerCanViewOrderFinancials() {
        SalesOrder salesOrder = sampleSalesOrder();

        SalesOrderDetailResponse response = mapper.toDetailResponse(salesOrder, true);

        assertThat(response.totalAmount()).isEqualByComparingTo("24000");
        assertThat(response.paidAmount()).isEqualByComparingTo("10000");
        assertThat(response.debtAmount()).isEqualByComparingTo("14000");
        assertThat(response.items().get(0).unitPrice()).isEqualByComparingTo("12000");
        assertThat(response.items().get(0).discountAmount()).isEqualByComparingTo("0");
        assertThat(response.items().get(0).lineTotal()).isEqualByComparingTo("24000");
    }

    private SalesOrder sampleSalesOrder() {
        SalesOrder salesOrder = SalesOrder.builder()
            .id(10L)
            .tenantId(1L)
            .customerId(2L)
            .warehouseId(3L)
            .code("SO-TEST")
            .status("DRAFT")
            .totalAmount(new BigDecimal("24000"))
            .paidAmount(new BigDecimal("10000"))
            .debtAmount(new BigDecimal("14000"))
            .createdAt(Instant.parse("2026-08-01T00:00:00Z"))
            .items(new ArrayList<>())
            .build();

        SalesOrderItem item = SalesOrderItem.builder()
            .id(20L)
            .order(salesOrder)
            .productId(30L)
            .quantity(2)
            .unitPrice(new BigDecimal("12000"))
            .discountAmount(BigDecimal.ZERO)
            .lineTotal(new BigDecimal("24000"))
            .build();

        salesOrder.getItems().add(item);
        return salesOrder;
    }
}

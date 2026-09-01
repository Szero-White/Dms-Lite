package com.example.dms.debt;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ReceivableBalanceIntegrationTest {

    @Autowired
    private CustomerDebtRepository customerDebtRepository;

    @Test
    void paymentLedgerEntryMustNotBeSubtractedTwiceFromRemainingReceivable() {
        long tenantId = 999_001L;
        long customerId = 999_002L;

        customerDebtRepository.save(
            CustomerDebtTransaction.builder()
                .tenantId(tenantId)
                .customerId(customerId)
                .sourceType("SALES_ORDER")
                .sourceId(1L)
                .direction("INCREASE")
                .amount(new BigDecimal("100.00"))
                .remainingAmount(new BigDecimal("60.00"))
                .createdBy(1L)
                .build()
        );
        customerDebtRepository.save(
            CustomerDebtTransaction.builder()
                .tenantId(tenantId)
                .customerId(customerId)
                .sourceType("PAYMENT")
                .sourceId(2L)
                .direction("DECREASE")
                .amount(new BigDecimal("40.00"))
                .remainingAmount(BigDecimal.ZERO)
                .createdBy(1L)
                .build()
        );
        customerDebtRepository.flush();

        assertThat(customerDebtRepository.balance(tenantId, customerId))
            .isEqualByComparingTo("60.00");
    }
}

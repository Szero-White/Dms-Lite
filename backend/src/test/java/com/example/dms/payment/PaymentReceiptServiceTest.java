package com.example.dms.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentReceiptServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void returnsTenantScopedOrderSpecificImmutablePaymentSnapshot() {
        TenantContext.set(1L, 10L);
        Payment payment = Payment.builder()
            .id(99L)
            .tenantId(1L)
            .customerId(2L)
            .salesOrderId(11L)
            .salesOrderCodeSnapshot("SO-20260907-0011")
            .salesOrderTotalSnapshot(new BigDecimal("520000"))
            .code("PAY-20260907-0001")
            .amount(new BigDecimal("500000"))
            .debtBefore(new BigDecimal("520000"))
            .debtAfter(new BigDecimal("20000"))
            .customerNameSnapshot("Cua hang Ca phe Anh Duong")
            .companyNameSnapshot("Demo Distributor")
            .recordedBySnapshot("Accountant")
            .createdAt(Instant.parse("2026-09-07T01:12:00Z"))
            .build();
        when(paymentRepository.findByIdAndTenantId(99L, 1L)).thenReturn(Optional.of(payment));

        PaymentReceiptResponse result = new PaymentReceiptService(paymentRepository).getReceipt(99L);

        assertThat(result.paymentCode()).isEqualTo("PAY-20260907-0001");
        assertThat(result.salesOrderCode()).isEqualTo("SO-20260907-0011");
        assertThat(result.salesOrderTotal()).isEqualByComparingTo("520000");
        assertThat(result.amountReceived()).isEqualByComparingTo("500000");
        assertThat(result.debtBefore()).isEqualByComparingTo("520000");
        assertThat(result.debtAfter()).isEqualByComparingTo("20000");
        assertThat(result.recordedBy()).isEqualTo("Accountant");
        assertThat(result.legacy()).isFalse();
    }

    @Test
    void keepsLegacyPaymentWithoutGuessingSalesOrder() {
        TenantContext.set(1L, 10L);
        Payment payment = Payment.builder()
            .id(100L)
            .tenantId(1L)
            .customerId(2L)
            .code("PAY-20260906-0001")
            .amount(new BigDecimal("4000000"))
            .debtBefore(new BigDecimal("4680000"))
            .debtAfter(new BigDecimal("680000"))
            .build();
        when(paymentRepository.findByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(payment));

        PaymentReceiptResponse result = new PaymentReceiptService(paymentRepository).getReceipt(100L);

        assertThat(result.legacy()).isTrue();
        assertThat(result.salesOrderId()).isNull();
        assertThat(result.debtAfter()).isEqualByComparingTo("680000");
    }

    @Test
    void rejectsPaymentFromAnotherTenant() {
        TenantContext.set(1L, 10L);
        when(paymentRepository.findByIdAndTenantId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> new PaymentReceiptService(paymentRepository).getReceipt(99L))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Payment not found");
    }
}

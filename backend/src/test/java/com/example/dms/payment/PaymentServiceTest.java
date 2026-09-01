package com.example.dms.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private CustomerDebtRepository customerDebtRepository;
    @Mock
    private AuditService auditService;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
            paymentRepository,
            customerRepository,
            customerDebtRepository,
            auditService
        );
        TenantContext.set(1L, 10L);
        when(customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(2L, 1L))
            .thenReturn(Optional.of(Customer.builder().id(2L).tenantId(1L).build()));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void appliesPartialPaymentToOldestOpenReceivable() {
        CustomerDebtTransaction first = receivable(60);
        CustomerDebtTransaction second = receivable(40);
        when(customerDebtRepository.lockOpenReceivables(1L, 2L))
            .thenReturn(List.of(first, second));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(99L);
            return payment;
        });

        PaymentResponse response = paymentService.recordCustomerPayment(
            new CustomerPaymentRequest(2L, new BigDecimal("50"), "partial")
        );

        assertThat(first.getRemainingAmount()).isEqualByComparingTo("10");
        assertThat(second.getRemainingAmount()).isEqualByComparingTo("40");
        assertThat(response.amount()).isEqualByComparingTo("50");
        verify(customerDebtRepository).save(any(CustomerDebtTransaction.class));
    }

    @Test
    void rejectsPaymentGreaterThanLockedOpenReceivableBalance() {
        when(customerDebtRepository.lockOpenReceivables(1L, 2L))
            .thenReturn(List.of(receivable(30)));

        assertThatThrownBy(() -> paymentService.recordCustomerPayment(
            new CustomerPaymentRequest(2L, new BigDecimal("40"), null)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Payment exceeds debt");

        verify(paymentRepository, never()).save(any());
    }

    private CustomerDebtTransaction receivable(int remaining) {
        return CustomerDebtTransaction.builder()
            .tenantId(1L)
            .customerId(2L)
            .direction("INCREASE")
            .amount(BigDecimal.valueOf(remaining))
            .remainingAmount(BigDecimal.valueOf(remaining))
            .build();
    }
}

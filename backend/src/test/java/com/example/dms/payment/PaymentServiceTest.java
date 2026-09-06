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
import com.example.dms.document.DocumentNumberService;
import com.example.dms.document.DocumentNumberType;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderRepository;
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
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private AuditService auditService;
    @Mock
    private DocumentNumberService documentNumberService;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
            paymentRepository,
            customerRepository,
            customerDebtRepository,
            salesOrderRepository,
            auditService,
            documentNumberService
        );
        TenantContext.set(1L, 10L);
        when(customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(2L, 1L))
            .thenReturn(Optional.of(Customer.builder().id(2L).tenantId(1L).build()));
        org.mockito.Mockito.lenient()
            .when(documentNumberService.next(DocumentNumberType.PAYMENT, 1L))
            .thenReturn("PAY-20260906-0004");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void appliesPartialPaymentToOldestOpenReceivable() {
        CustomerDebtTransaction first = receivable(101L, 60);
        CustomerDebtTransaction second = receivable(102L, 40);
        SalesOrder firstOrder = salesOrder(101L, 60);
        when(customerDebtRepository.lockOpenReceivables(1L, 2L))
            .thenReturn(List.of(first, second));
        when(salesOrderRepository.findByIdAndTenantId(101L, 1L))
            .thenReturn(Optional.of(firstOrder));
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
        assertThat(response.code()).isEqualTo("PAY-20260906-0004");
        assertThat(response.amount()).isEqualByComparingTo("50");
        assertThat(firstOrder.getPaidAmount()).isEqualByComparingTo("50");
        assertThat(firstOrder.getDebtAmount()).isEqualByComparingTo("10");
        verify(salesOrderRepository, never()).findByIdAndTenantId(102L, 1L);
        verify(customerDebtRepository).save(any(CustomerDebtTransaction.class));
        verify(auditService).log("PAYMENT_RECORDED", "Payment", 99L, "PAY-20260906-0004");
    }

    @Test
    void synchronizesLegacyNullOrderSnapshotsFromCanonicalReceivableBalance() {
        CustomerDebtTransaction debtTransaction = receivable(104L, 80);

        SalesOrder legacyOrder = SalesOrder.builder()
            .id(104L)
            .tenantId(1L)
            .totalAmount(new BigDecimal("100"))
            .paidAmount(null)
            .debtAmount(null)
            .build();

        when(customerDebtRepository.lockOpenReceivables(1L, 2L))
            .thenReturn(List.of(debtTransaction));

        when(salesOrderRepository.findByIdAndTenantId(104L, 1L))
            .thenReturn(Optional.of(legacyOrder));

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(100L);
            return payment;
        });

        paymentService.recordCustomerPayment(
            new CustomerPaymentRequest(
                2L,
                new BigDecimal("30"),
                "legacy snapshot"
            )
        );

        assertThat(debtTransaction.getRemainingAmount())
            .isEqualByComparingTo("50");

        assertThat(legacyOrder.getPaidAmount())
            .isEqualByComparingTo("50");

        assertThat(legacyOrder.getDebtAmount())
            .isEqualByComparingTo("50");
    }
    @Test
    void rejectsPaymentGreaterThanLockedOpenReceivableBalance() {
        when(customerDebtRepository.lockOpenReceivables(1L, 2L))
            .thenReturn(List.of(receivable(103L, 30)));

        assertThatThrownBy(() -> paymentService.recordCustomerPayment(
            new CustomerPaymentRequest(2L, new BigDecimal("40"), null)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Payment exceeds debt");

        verify(paymentRepository, never()).save(any());
    }

    private CustomerDebtTransaction receivable(Long orderId, int remaining) {
        return CustomerDebtTransaction.builder()
            .tenantId(1L)
            .customerId(2L)
            .sourceType("SALES_ORDER")
            .sourceId(orderId)
            .direction("INCREASE")
            .amount(BigDecimal.valueOf(remaining))
            .remainingAmount(BigDecimal.valueOf(remaining))
            .build();
    }

    private SalesOrder salesOrder(Long id, int debtAmount) {
        return SalesOrder.builder()
            .id(id)
            .tenantId(1L)
            .paidAmount(BigDecimal.ZERO)
            .debtAmount(BigDecimal.valueOf(debtAmount))
            .build();
    }
}

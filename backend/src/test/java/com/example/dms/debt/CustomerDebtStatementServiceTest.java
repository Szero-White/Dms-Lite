package com.example.dms.debt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.payment.Payment;
import com.example.dms.payment.PaymentRepository;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerDebtStatementServiceTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private CustomerDebtRepository customerDebtRepository;
    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private PaymentRepository paymentRepository;

    private CustomerDebtStatementService service;

    @BeforeEach
    void setUp() {
        service = new CustomerDebtStatementService(
            customerRepository,
            customerDebtRepository,
            salesOrderRepository,
            paymentRepository
        );
        TenantContext.set(1L, 10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void resolvesBusinessCodesForSalesOrderAndPaymentEntries() {
        when(customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(2L, 1L))
            .thenReturn(Optional.of(Customer.builder().id(2L).tenantId(1L).build()));

        CustomerDebtTransaction receivable = CustomerDebtTransaction.builder()
            .id(11L)
            .customerId(2L)
            .sourceType("SALES_ORDER")
            .sourceId(101L)
            .direction("INCREASE")
            .amount(new BigDecimal("80000"))
            .remainingAmount(new BigDecimal("60000"))
            .note("SO-legacy-note")
            .build();
        CustomerDebtTransaction payment = CustomerDebtTransaction.builder()
            .id(12L)
            .customerId(2L)
            .sourceType("PAYMENT")
            .sourceId(201L)
            .direction("DECREASE")
            .amount(new BigDecimal("20000"))
            .remainingAmount(BigDecimal.ZERO)
            .note("Bank transfer")
            .build();

        when(customerDebtRepository.findByTenantIdAndCustomerIdOrderByCreatedAtDesc(1L, 2L))
            .thenReturn(List.of(payment, receivable));
        when(salesOrderRepository.findByTenantIdAndIdIn(1L, Set.of(101L)))
            .thenReturn(List.of(SalesOrder.builder().id(101L).tenantId(1L).code("SO-20260906-0001").build()));
        when(paymentRepository.findByTenantIdAndIdIn(1L, Set.of(201L)))
            .thenReturn(List.of(Payment.builder().id(201L).tenantId(1L).code("PAY-20260906-0002").build()));

        List<CustomerDebtStatementResponse> result = service.statement(2L);

        assertThat(result).extracting(CustomerDebtStatementResponse::sourceCode)
            .containsExactly("PAY-20260906-0002", "SO-20260906-0001");
        assertThat(result.get(0).note()).isEqualTo("Bank transfer");
        assertThat(result.get(1).remainingAmount()).isEqualByComparingTo("60000");
    }
}

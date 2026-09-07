package com.example.dms.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.BusinessTimeProvider;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.document.DocumentNumberService;
import com.example.dms.document.DocumentNumberType;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderRepository;
import com.example.dms.sales.SalesOrderStatus;
import com.example.dms.tenant.Tenant;
import com.example.dms.tenant.TenantRepository;
import com.example.dms.user.AppUser;
import com.example.dms.user.AppUserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.data.domain.PageImpl;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private BusinessTimeProvider businessTimeProvider;
    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerDebtRepository customerDebtRepository;
    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private AuditService auditService;
    @Mock private DocumentNumberService documentNumberService;
    @Mock private TenantRepository tenantRepository;
    @Mock private AppUserRepository appUserRepository;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
            paymentRepository,
            businessTimeProvider,
            customerRepository,
            customerDebtRepository,
            salesOrderRepository,
            auditService,
            documentNumberService,
            tenantRepository,
            appUserRepository
        );
        TenantContext.set(1L, 10L);

        org.mockito.Mockito.lenient()
            .when(customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(2L, 1L))
            .thenReturn(Optional.of(Customer.builder()
                .id(2L)
                .tenantId(1L)
                .name("Cua hang Anh Duong")
                .phone("0909000001")
                .address("Quan 1")
                .build()));
        org.mockito.Mockito.lenient()
            .when(documentNumberService.next(DocumentNumberType.PAYMENT, 1L))
            .thenReturn("PAY-20260907-0001");
        org.mockito.Mockito.lenient()
            .when(tenantRepository.findById(1L))
            .thenReturn(Optional.of(Tenant.builder().id(1L).name("Demo Distributor").active(true).build()));
        org.mockito.Mockito.lenient()
            .when(appUserRepository.findByIdAndTenantId(10L, 1L))
            .thenReturn(Optional.of(AppUser.builder().id(10L).tenantId(1L).username("accountant").fullName("Accountant").build()));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }


    @Test
    void listsOutstandingReceivablesAsOneRowPerSalesOrder() {
        CustomerDebtRepository.OutstandingReceivableView view = org.mockito.Mockito.mock(
            CustomerDebtRepository.OutstandingReceivableView.class
        );
        when(view.getSalesOrderId()).thenReturn(201L);
        when(view.getSalesOrderCode()).thenReturn("SO-20260907-0201");
        when(view.getCustomerId()).thenReturn(2L);
        when(view.getCustomerName()).thenReturn("Cua hang Anh Duong");
        when(view.getTotalAmount()).thenReturn(new BigDecimal("520000"));
        when(view.getRemainingAmount()).thenReturn(new BigDecimal("20000"));
        when(view.getDueDate()).thenReturn(LocalDate.of(2026, 9, 21));
        when(view.getConfirmedAt()).thenReturn(Instant.parse("2026-09-07T01:00:00Z"));
        when(customerDebtRepository.findOutstandingSalesOrderReceivables(
            any(),
            any(),
            any(),
            any()
        )).thenReturn(new PageImpl<>(List.of(view)));

        PaymentOutstandingOrderResponse result = paymentService.listOutstandingOrders(0, "Anh Duong")
            .getContent()
            .get(0);

        assertThat(result.salesOrderCode()).isEqualTo("SO-20260907-0201");
        assertThat(result.totalAmount()).isEqualByComparingTo("520000");
        assertThat(result.paidAmount()).isEqualByComparingTo("500000");
        assertThat(result.remainingAmount()).isEqualByComparingTo("20000");
        assertThat(result.dueDate()).isEqualTo(LocalDate.of(2026, 9, 21));
    }

    @Test
    void filtersPaymentHistoryByBusinessDateRange() {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 7);
        Instant fromInclusive = Instant.parse("2026-08-31T17:00:00Z");
        Instant toExclusive = Instant.parse("2026-09-07T17:00:00Z");

        when(businessTimeProvider.startOfDay(from)).thenReturn(fromInclusive);
        when(businessTimeProvider.startOfDay(to.plusDays(1))).thenReturn(toExclusive);
        when(paymentRepository.searchHistory(
            eq(1L),
            eq("PAY-0001"),
            eq(fromInclusive),
            eq(toExclusive),
            any()
        )).thenReturn(new PageImpl<>(List.of()));

        paymentService.listHistory(0, "  PAY-0001  ", from, to);

        verify(paymentRepository).searchHistory(
            eq(1L),
            eq("PAY-0001"),
            eq(fromInclusive),
            eq(toExclusive),
            any()
        );
    }

    @Test
    void rejectsReversedPaymentHistoryDateRange() {
        assertThatThrownBy(() -> paymentService.listHistory(
            0,
            "",
            LocalDate.of(2026, 9, 8),
            LocalDate.of(2026, 9, 7)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Payment history start date must be on or before end date");

        verify(paymentRepository, never()).searchHistory(any(), any(), any(), any(), any());
    }

    @Test
    void appliesPartialPaymentOnlyToSelectedSalesOrder() {
        SalesOrder order = completedOrder(101L, 320, 80, 240);
        CustomerDebtTransaction receivable = receivable(101L, 320, 240);
        when(paymentRepository.findByTenantIdAndRequestKey(1L, "req-1")).thenReturn(Optional.empty());
        when(salesOrderRepository.lockByIdAndTenantId(101L, 1L)).thenReturn(Optional.of(order));
        when(customerDebtRepository.lockSalesOrderReceivables(1L, 101L)).thenReturn(List.of(receivable));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(99L);
            return payment;
        });

        PaymentResponse response = paymentService.recordSalesOrderPayment(
            new RecordSalesOrderPaymentRequest(101L, new BigDecimal("200"), "tra them", "req-1")
        );

        assertThat(receivable.getRemainingAmount()).isEqualByComparingTo("40");
        assertThat(order.getPaidAmount()).isEqualByComparingTo("280");
        assertThat(order.getDebtAmount()).isEqualByComparingTo("40");
        assertThat(response.salesOrderId()).isEqualTo(101L);
        assertThat(response.salesOrderCode()).isEqualTo("SO-20260907-0101");
        assertThat(response.amount()).isEqualByComparingTo("200");
        assertThat(response.debtBefore()).isEqualByComparingTo("240");
        assertThat(response.debtAfter()).isEqualByComparingTo("40");
        assertThat(response.legacy()).isFalse();
        verify(customerDebtRepository).save(any(CustomerDebtTransaction.class));
        verify(auditService).log("PAYMENT_RECORDED", "Payment", 99L, "PAY-20260907-0001 / SO-20260907-0101");
    }

    @Test
    void exactPaymentSettlesSelectedSalesOrder() {
        SalesOrder order = completedOrder(102L, 520, 500, 20);
        CustomerDebtTransaction receivable = receivable(102L, 520, 20);
        when(paymentRepository.findByTenantIdAndRequestKey(1L, "req-exact")).thenReturn(Optional.empty());
        when(salesOrderRepository.lockByIdAndTenantId(102L, 1L)).thenReturn(Optional.of(order));
        when(customerDebtRepository.lockSalesOrderReceivables(1L, 102L)).thenReturn(List.of(receivable));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(100L);
            return payment;
        });

        PaymentResponse response = paymentService.recordSalesOrderPayment(
            new RecordSalesOrderPaymentRequest(102L, new BigDecimal("20"), "tat toan", "req-exact")
        );

        assertThat(receivable.getRemainingAmount()).isEqualByComparingTo("0");
        assertThat(order.getPaidAmount()).isEqualByComparingTo("520");
        assertThat(order.getDebtAmount()).isEqualByComparingTo("0");
        assertThat(response.debtAfter()).isEqualByComparingTo("0");
    }

    @Test
    void rejectsPaymentAboveSelectedOrderRemainingDebtEvenIfCustomerCouldOweMoreElsewhere() {
        SalesOrder order = completedOrder(103L, 520, 0, 520);
        CustomerDebtTransaction receivable = receivable(103L, 520, 520);
        when(paymentRepository.findByTenantIdAndRequestKey(1L, "req-overpay")).thenReturn(Optional.empty());
        when(salesOrderRepository.lockByIdAndTenantId(103L, 1L)).thenReturn(Optional.of(order));
        when(customerDebtRepository.lockSalesOrderReceivables(1L, 103L)).thenReturn(List.of(receivable));

        assertThatThrownBy(() -> paymentService.recordSalesOrderPayment(
            new RecordSalesOrderPaymentRequest(103L, new BigDecimal("520.01"), null, "req-overpay")
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Payment exceeds sales order remaining debt");

        verify(paymentRepository, never()).save(any());
        assertThat(receivable.getRemainingAmount()).isEqualByComparingTo("520");
    }

    @Test
    void rejectsPaymentForNonCompletedOrder() {
        SalesOrder draft = completedOrder(104L, 100, 0, 100);
        draft.setStatus(SalesOrderStatus.DRAFT);
        when(paymentRepository.findByTenantIdAndRequestKey(1L, "req-draft")).thenReturn(Optional.empty());
        when(salesOrderRepository.lockByIdAndTenantId(104L, 1L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> paymentService.recordSalesOrderPayment(
            new RecordSalesOrderPaymentRequest(104L, new BigDecimal("50"), null, "req-draft")
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Payment requires a completed sales order");

        verify(customerDebtRepository, never()).lockSalesOrderReceivables(any(), any());
    }

    @Test
    void sameRequestKeyReturnsSamePaymentWithoutSecondMutation() {
        Payment existing = Payment.builder()
            .id(120L)
            .tenantId(1L)
            .customerId(2L)
            .salesOrderId(105L)
            .salesOrderCodeSnapshot("SO-20260907-0105")
            .code("PAY-20260907-0012")
            .amount(new BigDecimal("100"))
            .note("dot 1")
            .requestKey("same-key")
            .debtBefore(new BigDecimal("200"))
            .debtAfter(new BigDecimal("100"))
            .build();
        when(paymentRepository.findByTenantIdAndRequestKey(1L, "same-key")).thenReturn(Optional.of(existing));

        PaymentResponse response = paymentService.recordSalesOrderPayment(
            new RecordSalesOrderPaymentRequest(105L, new BigDecimal("100"), "dot 1", "same-key")
        );

        assertThat(response.id()).isEqualTo(120L);
        verify(salesOrderRepository, never()).lockByIdAndTenantId(any(), any());
        verify(customerDebtRepository, never()).save(any());
    }

    @Test
    void rejectsReuseOfRequestKeyForDifferentPayment() {
        Payment existing = Payment.builder()
            .id(121L)
            .tenantId(1L)
            .salesOrderId(106L)
            .code("PAY-20260907-0013")
            .amount(new BigDecimal("100"))
            .note("dot 1")
            .requestKey("used-key")
            .build();
        when(paymentRepository.findByTenantIdAndRequestKey(1L, "used-key")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> paymentService.recordSalesOrderPayment(
            new RecordSalesOrderPaymentRequest(107L, new BigDecimal("100"), "dot 1", "used-key")
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Payment request key was already used for another payment");
    }

    private CustomerDebtTransaction receivable(Long orderId, int amount, int remaining) {
        return CustomerDebtTransaction.builder()
            .tenantId(1L)
            .customerId(2L)
            .sourceType("SALES_ORDER")
            .sourceId(orderId)
            .direction("INCREASE")
            .amount(BigDecimal.valueOf(amount))
            .remainingAmount(BigDecimal.valueOf(remaining))
            .build();
    }

    private SalesOrder completedOrder(Long id, int total, int paid, int debt) {
        return SalesOrder.builder()
            .id(id)
            .tenantId(1L)
            .customerId(2L)
            .code("SO-20260907-" + String.format("%04d", id))
            .status(SalesOrderStatus.COMPLETED)
            .totalAmount(BigDecimal.valueOf(total))
            .paidAmount(BigDecimal.valueOf(paid))
            .debtAmount(BigDecimal.valueOf(debt))
            .build();
    }
}

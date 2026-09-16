package com.example.dms.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.common.BusinessException;
import com.example.dms.common.BusinessTimeProvider;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.debt.ReceivableDueStatus;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderItem;
import com.example.dms.sales.SalesOrderRepository;
import com.example.dms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class PaymentQueryServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private BusinessTimeProvider businessTimeProvider;
    @Mock private CustomerDebtRepository customerDebtRepository;
    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ProductRepository productRepository;

    private PaymentQueryService paymentQueryService;

    @BeforeEach
    void setUp() {
        paymentQueryService = new PaymentQueryService(
            paymentRepository,
            businessTimeProvider,
            customerDebtRepository,
            salesOrderRepository,
            customerRepository,
            productRepository
        );
        TenantContext.set(1L, 10L);
        org.mockito.Mockito.lenient()
            .when(businessTimeProvider.today())
            .thenReturn(LocalDate.of(2026, 9, 8));
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
            any(), any(), any(), anyBoolean(), anyBoolean(), anyBoolean(), anyBoolean(), anyBoolean(),
            any(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(new PageImpl<>(List.of(view)));

        PaymentOutstandingOrderResponse result = paymentQueryService
            .listOutstandingOrders(0, "Anh Duong")
            .getContent()
            .get(0);

        assertThat(result.salesOrderCode()).isEqualTo("SO-20260907-0201");
        assertThat(result.totalAmount()).isEqualByComparingTo("520000");
        assertThat(result.paidAmount()).isEqualByComparingTo("500000");
        assertThat(result.remainingAmount()).isEqualByComparingTo("20000");
        assertThat(result.dueDate()).isEqualTo(LocalDate.of(2026, 9, 21));
        assertThat(result.dueStatus()).isEqualTo(ReceivableDueStatus.CURRENT);
        assertThat(result.daysUntilDue()).isEqualTo(13);
    }


    @Test
    void loadsOutstandingOrderDetailWithLineItemsForPaymentReview() {
        SalesOrderItem item = SalesOrderItem.builder()
            .id(31L)
            .productId(5L)
            .quantity(3)
            .unitPrice(new BigDecimal("200000"))
            .discountAmount(new BigDecimal("15000"))
            .lineTotal(new BigDecimal("585000"))
            .build();
        SalesOrder salesOrder = SalesOrder.builder()
            .id(201L)
            .tenantId(1L)
            .customerId(2L)
            .code("SO-20260916-0002")
            .status(SalesOrderStatus.COMPLETED)
            .totalAmount(new BigDecimal("585000"))
            .confirmedAt(Instant.parse("2026-09-16T06:00:00Z"))
            .items(new java.util.ArrayList<>(List.of(item)))
            .build();
        item.setOrder(salesOrder);

        CustomerDebtTransaction receivable = CustomerDebtTransaction.builder()
            .tenantId(1L)
            .customerId(2L)
            .sourceType("SALES_ORDER")
            .sourceId(201L)
            .direction("INCREASE")
            .remainingAmount(new BigDecimal("85000"))
            .dueDate(LocalDate.of(2026, 9, 26))
            .build();
        Customer customer = Customer.builder()
            .id(2L)
            .tenantId(1L)
            .name("Tap hoa Minh Phat")
            .build();
        Product product = Product.builder()
            .id(5L)
            .tenantId(1L)
            .name("Nuoc ngot thung 24 lon")
            .sku("NG-24")
            .build();

        when(salesOrderRepository.findDetailByIdAndTenantId(201L, 1L))
            .thenReturn(Optional.of(salesOrder));
        when(customerDebtRepository
            .findFirstByTenantIdAndSourceTypeAndSourceIdAndDirectionOrderByCreatedAtDesc(
                1L, "SALES_ORDER", 201L, "INCREASE"
            ))
            .thenReturn(Optional.of(receivable));
        when(customerRepository.findByIdAndTenantId(2L, 1L)).thenReturn(Optional.of(customer));
        when(productRepository.findByTenantIdAndIdIn(1L, Set.of(5L))).thenReturn(List.of(product));

        PaymentOutstandingOrderDetailResponse result =
            paymentQueryService.getOutstandingOrderDetail(201L);

        assertThat(result.salesOrderCode()).isEqualTo("SO-20260916-0002");
        assertThat(result.customerName()).isEqualTo("Tap hoa Minh Phat");
        assertThat(result.totalAmount()).isEqualByComparingTo("585000");
        assertThat(result.paidAmount()).isEqualByComparingTo("500000");
        assertThat(result.remainingAmount()).isEqualByComparingTo("85000");
        assertThat(result.items()).singleElement().satisfies(line -> {
            assertThat(line.productName()).isEqualTo("Nuoc ngot thung 24 lon");
            assertThat(line.productSku()).isEqualTo("NG-24");
            assertThat(line.quantity()).isEqualTo(3);
            assertThat(line.unitPrice()).isEqualByComparingTo("200000");
            assertThat(line.discountAmount()).isEqualByComparingTo("15000");
            assertThat(line.lineTotal()).isEqualByComparingTo("585000");
        });
    }

    @Test
    void appliesRequestedOutstandingOrderSort() {
        when(customerDebtRepository.findOutstandingSalesOrderReceivables(
            any(), any(), any(), anyBoolean(), anyBoolean(), anyBoolean(), anyBoolean(), anyBoolean(),
            any(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(new PageImpl<>(List.of()));

        paymentQueryService.listOutstandingOrders(
            0,
            "",
            "",
            null,
            null,
            null,
            null,
            OutstandingOrderSort.DUE_DATE,
            Sort.Direction.ASC
        );

        verify(customerDebtRepository).findOutstandingSalesOrderReceivables(
            eq(1L),
            eq(""),
            eq(com.example.dms.sales.SalesOrderStatus.COMPLETED),
            eq(false),
            eq(true),
            eq(true),
            eq(true),
            eq(true),
            eq(LocalDate.of(2026, 9, 8)),
            eq(LocalDate.of(2026, 9, 11)),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            eq("DUE_DATE"),
            eq("ASC"),
            any()
        );
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

        paymentQueryService.listHistory(0, "  PAY-0001  ", from, to);

        verify(paymentRepository).searchHistory(
            eq(1L),
            eq("PAY-0001"),
            eq(fromInclusive),
            eq(toExclusive),
            any()
        );
    }

    @Test
    void paymentHistoryAppliesRequestedServerSort() {
        when(paymentRepository.searchHistory(any(), any(), any(), any(), any()))
            .thenReturn(new PageImpl<>(List.of()));

        paymentQueryService.listHistory(
            0,
            "",
            null,
            null,
            PaymentHistorySort.AMOUNT,
            Sort.Direction.ASC
        );

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(paymentRepository).searchHistory(eq(1L), eq(""), isNull(), isNull(), pageable.capture());
        assertThat(pageable.getValue().getSort().getOrderFor("amount")).isNotNull();
        assertThat(pageable.getValue().getSort().getOrderFor("amount").getDirection())
            .isEqualTo(Sort.Direction.ASC);
    }

    @Test
    void rejectsReversedPaymentHistoryDateRange() {
        assertThatThrownBy(() -> paymentQueryService.listHistory(
            0,
            "",
            LocalDate.of(2026, 9, 8),
            LocalDate.of(2026, 9, 7)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Payment history start date must be on or before end date");

        verify(paymentRepository, never()).searchHistory(any(), any(), any(), any(), any());
    }
}

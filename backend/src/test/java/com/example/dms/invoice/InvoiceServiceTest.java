package com.example.dms.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
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
import com.example.dms.notification.NotificationProducer;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderItem;
import com.example.dms.sales.SalesOrderRepository;
import com.example.dms.sales.SalesOrderStatus;
import com.example.dms.tenant.Tenant;
import com.example.dms.tenant.TenantRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock private InvoiceRepository invoiceRepository;
    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CustomerDebtRepository customerDebtRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private AuditService auditService;
    @Mock private DocumentNumberService documentNumberService;
    @Mock private BusinessTimeProvider businessTimeProvider;
    @Mock private NotificationProducer notificationProducer;

    private InvoiceService service;

    @BeforeEach
    void setUp() {
        service = new InvoiceService(
            invoiceRepository,
            salesOrderRepository,
            customerRepository,
            productRepository,
            customerDebtRepository,
            tenantRepository,
            auditService,
            documentNumberService,
            businessTimeProvider,
            notificationProducer
        );
        TenantContext.set(1L, 10L);
        lenient().when(businessTimeProvider.today()).thenReturn(LocalDate.of(2026, 9, 6));
        lenient().when(businessTimeProvider.startOfDay(any(LocalDate.class))).thenAnswer(invocation ->
            invocation.<LocalDate>getArgument(0).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant()
        );
        setAuthorities("SALES_ORDER_CREATE");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void autoCreatesOneDraftInvoiceWhenCompletedOrderIsFullyPaid() {
        SalesOrder order = completedOrder();
        order.setPaidAmount(new BigDecimal("160000"));
        order.setDebtAmount(BigDecimal.ZERO);
        Customer customer = customer();
        Product product = product();
        CustomerDebtTransaction debt = CustomerDebtTransaction.builder()
            .tenantId(1L).customerId(2L).sourceType("SALES_ORDER").sourceId(100L)
            .direction("INCREASE").dueDate(LocalDate.of(2026, 9, 19)).build();

        when(invoiceRepository.findByTenantIdAndSalesOrderId(1L, 100L)).thenReturn(Optional.empty());
        when(customerRepository.findByIdAndTenantId(2L, 1L)).thenReturn(Optional.of(customer));
        when(productRepository.findByTenantIdAndIdIn(1L, java.util.Set.of(4L))).thenReturn(List.of(product));
        when(customerDebtRepository.findFirstByTenantIdAndSourceTypeAndSourceIdAndDirectionOrderByCreatedAtDesc(
            1L, "SALES_ORDER", 100L, "INCREASE"
        )).thenReturn(Optional.of(debt));
        when(tenantRepository.findById(1L)).thenReturn(Optional.of(Tenant.builder().id(1L).name("Demo Distributor").active(true).build()));
        when(documentNumberService.next(DocumentNumberType.INVOICE, 1L)).thenReturn("INV-20260906-0001");
        when(invoiceRepository.saveAndFlush(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice invoice = invocation.getArgument(0);
            invoice.setId(77L);
            return invoice;
        });

        service.ensureDraftForFullyPaidSalesOrder(order);

        verify(invoiceRepository).saveAndFlush(any(Invoice.class));
        verify(auditService).log("INVOICE_CREATED", "Invoice", 77L, "INV-20260906-0001");
    }

    @Test
    void doesNotCreateInvoiceBeforeOrderIsFullyPaid() {
        SalesOrder order = completedOrder();

        service.ensureDraftForFullyPaidSalesOrder(order);

        verify(invoiceRepository, never()).saveAndFlush(any());
        verify(documentNumberService, never()).next(any(), any());
    }

    @Test
    void autoCreationIsIdempotentWhenInvoiceAlreadyExists() {
        SalesOrder order = completedOrder();
        order.setPaidAmount(new BigDecimal("160000"));
        order.setDebtAmount(BigDecimal.ZERO);
        Invoice existing = Invoice.builder().id(77L).tenantId(1L).salesOrderId(100L).invoiceNumber("INV-1-77").status("DRAFT").build();
        when(invoiceRepository.findByTenantIdAndSalesOrderId(1L, 100L)).thenReturn(Optional.of(existing));

        service.ensureDraftForFullyPaidSalesOrder(order);

        verify(invoiceRepository, never()).saveAndFlush(any());
    }

    @Test
    void listUsesServerSideSearchAndBusinessDateRange() {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 7);
        Instant fromInclusive = Instant.parse("2026-08-31T17:00:00Z");
        Instant toExclusive = Instant.parse("2026-09-07T17:00:00Z");
        when(businessTimeProvider.startOfDay(from)).thenReturn(fromInclusive);
        when(businessTimeProvider.startOfDay(to.plusDays(1))).thenReturn(toExclusive);
        when(invoiceRepository.searchPaidInvoices(any(), any(), any(), any(), any())).thenReturn(new PageImpl<>(List.of()));

        service.listInvoices(0, "  INV-0001  ", from, to);

        verify(invoiceRepository).searchPaidInvoices(
            eq(1L),
            eq("  INV-0001  "),
            eq(fromInclusive),
            eq(toExclusive),
            any()
        );
    }

    @Test
    void listAppliesRequestedServerSort() {
        when(invoiceRepository.searchPaidInvoices(any(), any(), any(), any(), any()))
            .thenReturn(new PageImpl<>(List.of()));

        service.listInvoices(0, "", null, null, InvoiceSort.TOTAL_AMOUNT, Sort.Direction.ASC);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(invoiceRepository).searchPaidInvoices(eq(1L), eq(""), isNull(), isNull(), pageable.capture());
        assertThat(pageable.getValue().getSort().getOrderFor("totalAmount")).isNotNull();
        assertThat(pageable.getValue().getSort().getOrderFor("totalAmount").getDirection())
            .isEqualTo(Sort.Direction.ASC);
    }

    @Test
    void rejectsReversedInvoiceDateRange() {
        assertThatThrownBy(() -> service.listInvoices(0, "", LocalDate.of(2026, 9, 8), LocalDate.of(2026, 9, 7)))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Invoice start date must be on or before end date");

        verify(invoiceRepository, never()).searchPaidInvoices(any(), any(), any(), any(), any());
    }

    @Test
    void issuingInvoicePublishesPermissionFilteredNotification() {
        SalesOrder order = completedOrder();
        Invoice invoice = Invoice.builder()
            .id(77L).tenantId(1L).salesOrderId(100L).invoiceNumber("INV-1-77")
            .status("DRAFT").items(new ArrayList<>()).build();
        when(invoiceRepository.lockByIdAndTenantId(77L, 1L)).thenReturn(Optional.of(invoice));
        when(salesOrderRepository.findByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));

        InvoiceResponse response = service.issueInvoice(77L);

        assertThat(response.status()).isEqualTo("ISSUED");
        verify(notificationProducer).publish(
            1L,
            "INVOICE_ISSUED",
            "Invoice issued",
            "Invoice INV-1-77 has been issued"
        );
    }

    @Test
    void issuedInvoiceBecomesOverdueOnlyAfterBusinessDueDateEnds() {
        SalesOrder order = completedOrder();
        Invoice invoice = Invoice.builder()
            .id(77L).tenantId(1L).customerId(2L).salesOrderId(100L)
            .invoiceNumber("INV-1-77").status("ISSUED")
            .dueDate(Instant.parse("2026-09-05T17:00:00Z"))
            .subtotal(new BigDecimal("160000")).taxAmount(BigDecimal.ZERO)
            .discountAmount(BigDecimal.ZERO).totalAmount(new BigDecimal("160000"))
            .paidAmount(new BigDecimal("40000")).remainingAmount(new BigDecimal("120000"))
            .customerName("Bach hoa Hong Phuc").items(new ArrayList<>()).build();

        when(invoiceRepository.findDetailByIdAndTenantId(77L, 1L)).thenReturn(Optional.of(invoice));
        when(salesOrderRepository.findByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));

        assertThat(service.getInvoice(77L).status()).isEqualTo("ISSUED");
        when(businessTimeProvider.today()).thenReturn(LocalDate.of(2026, 9, 7));
        assertThat(service.getInvoice(77L).status()).isEqualTo("OVERDUE");
    }

    @Test
    void redactsReceivableStateForInvoiceViewerWithoutFinancialPermission() {
        SalesOrder order = completedOrder();
        Invoice existing = Invoice.builder()
            .id(77L).tenantId(1L).customerId(2L).salesOrderId(100L)
            .invoiceNumber("INV-1-77").status("ISSUED")
            .subtotal(new BigDecimal("160000")).taxAmount(BigDecimal.ZERO)
            .discountAmount(BigDecimal.ZERO).totalAmount(new BigDecimal("160000"))
            .paidAmount(new BigDecimal("40000")).remainingAmount(new BigDecimal("120000"))
            .customerName("Bach hoa Hong Phuc").items(new ArrayList<>()).build();

        setAuthorities("INVOICE_VIEW");
        when(invoiceRepository.findDetailByIdAndTenantId(77L, 1L)).thenReturn(Optional.of(existing));
        when(salesOrderRepository.findByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));

        InvoiceResponse response = service.getInvoice(77L);

        assertThat(response.totalAmount()).isEqualByComparingTo("160000");
        assertThat(response.paidAmount()).isNull();
        assertThat(response.remainingAmount()).isNull();
        assertThat(response.status()).isEqualTo("ISSUED");
    }

    private void setAuthorities(String... authorities) {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                "test-user",
                "n/a",
                java.util.Arrays.stream(authorities).map(SimpleGrantedAuthority::new).toList()
            )
        );
    }

    private Customer customer() {
        return Customer.builder().id(2L).tenantId(1L).name("Bach hoa Hong Phuc").address("Da Nang").paymentTermDays(14).active(true).build();
    }

    private Product product() {
        return Product.builder().id(4L).tenantId(1L).name("Nuoc suoi").sku("WATER-24").active(true).build();
    }

    private SalesOrder completedOrder() {
        SalesOrder order = SalesOrder.builder()
            .id(100L).tenantId(1L).customerId(2L).warehouseId(3L).code("SO-100")
            .status(SalesOrderStatus.COMPLETED)
            .totalAmount(new BigDecimal("160000"))
            .paidAmount(new BigDecimal("40000"))
            .debtAmount(new BigDecimal("120000"))
            .items(new ArrayList<>())
            .build();
        order.getItems().add(SalesOrderItem.builder()
            .id(200L).order(order).productId(4L).quantity(2)
            .unitPrice(new BigDecimal("80000")).discountAmount(BigDecimal.ZERO)
            .lineTotal(new BigDecimal("160000")).build());
        return order;
    }
}

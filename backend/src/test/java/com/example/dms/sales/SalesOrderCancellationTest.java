package com.example.dms.sales;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.BusinessTimeProvider;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.document.DocumentNumberService;
import com.example.dms.inventory.InventoryService;
import com.example.dms.inventory.WarehouseRepository;
import com.example.dms.notification.NotificationProducer;
import com.example.dms.product.ProductRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SalesOrderCancellationTest {

    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private InventoryService inventoryService;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private CustomerDebtRepository customerDebtRepository;
    @Mock private AuditService auditService;
    @Mock private NotificationProducer notificationProducer;
    @Mock private SalesOrderMapper salesOrderMapper;
    @Mock private DocumentNumberService documentNumberService;
    @Mock private BusinessTimeProvider businessTimeProvider;

    private SalesOrderService service;

    @BeforeEach
    void setUp() {
        service = new SalesOrderService(
            salesOrderRepository,
            productRepository,
            customerRepository,
            inventoryService,
            warehouseRepository,
            customerDebtRepository,
            auditService,
            notificationProducer,
            salesOrderMapper,
            documentNumberService,
            businessTimeProvider
        );
        TenantContext.set(1L, 10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void cancellationRequiresReasonBeforeChangingOrderState() {
        SalesOrder order = draftOrder();
        when(salesOrderRepository.lockByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.cancelOrder(100L, "   "))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Cancellation reason is required");

        assertThat(order.getStatus()).isEqualTo(SalesOrderStatus.DRAFT);
        verify(auditService, never()).log(eq("SALES_ORDER_CANCELLED"), eq("SalesOrder"), eq(100L), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void cancellationStoresTrimmedReasonAndTimestampForTraceability() {
        SalesOrder order = draftOrder();
        when(salesOrderRepository.lockByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));
        when(customerRepository.findByIdAndTenantId(2L, 1L)).thenReturn(Optional.empty());
        when(warehouseRepository.findByIdAndTenantId(3L, 1L)).thenReturn(Optional.empty());

        service.cancelOrder(100L, "  Không đủ tồn kho thực tế  ");

        assertThat(order.getStatus()).isEqualTo(SalesOrderStatus.CANCELLED);
        assertThat(order.getCancellationReason()).isEqualTo("Không đủ tồn kho thực tế");
        assertThat(order.getCancelledAt()).isNotNull();
        verify(auditService).log(
            eq("SALES_ORDER_CANCELLED"),
            eq("SalesOrder"),
            eq(100L),
            contains("Không đủ tồn kho thực tế")
        );
    }

    private SalesOrder draftOrder() {
        return SalesOrder.builder()
            .id(100L)
            .tenantId(1L)
            .customerId(2L)
            .warehouseId(3L)
            .code("SO-CANCEL")
            .status(SalesOrderStatus.DRAFT)
            .totalAmount(new BigDecimal("100000"))
            .paidAmount(BigDecimal.ZERO)
            .debtAmount(new BigDecimal("100000"))
            .items(new ArrayList<>())
            .build();
    }
}

package com.example.dms.sales;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
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
class SalesOrderServiceCreditLimitTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private InventoryService inventoryService;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private CustomerDebtRepository customerDebtRepository;
    @Mock
    private AuditService auditService;
    @Mock
    private NotificationProducer notificationProducer;
    @Mock
    private SalesOrderMapper salesOrderMapper;

    private SalesOrderService salesOrderService;

    @BeforeEach
    void setUp() {
        salesOrderService = new SalesOrderService(
            salesOrderRepository,
            productRepository,
            customerRepository,
            inventoryService,
            warehouseRepository,
            customerDebtRepository,
            auditService,
            notificationProducer,
            salesOrderMapper
        );
        TenantContext.set(1L, 10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void rejectsFulfillmentBeforeStockMutationWhenProjectedDebtExceedsLimit() {
        SalesOrder order = draftOrder(new BigDecimal("40"));
        Customer customer = customerWithLimit("100");

        when(salesOrderRepository.lockByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));
        when(customerRepository.lockByIdAndTenantIdAndDeletedAtIsNull(2L, 1L))
            .thenReturn(Optional.of(customer));
        when(customerDebtRepository.balance(1L, 2L)).thenReturn(new BigDecimal("70"));

        assertThatThrownBy(() -> salesOrderService.confirmOrder(100L))
            .isInstanceOf(BusinessException.class)
            .hasMessage(
                "Credit limit exceeded. Limit: 100, current debt: 70, "
                    + "order debt: 40, projected debt: 110"
            );

        assertThat(order.getStatus()).isEqualTo(SalesOrderStatus.DRAFT);
        verify(inventoryService, never()).deduct(
            anyLong(), anyLong(), anyLong(), anyInt(), anyString(), anyLong(), anyString()
        );
        verify(customerDebtRepository, never()).save(any(CustomerDebtTransaction.class));
        verify(auditService, never()).log(anyString(), anyString(), anyLong(), anyString());
    }

    @Test
    void allowsFulfillmentWhenProjectedDebtEqualsLimit() {
        SalesOrder order = draftOrder(new BigDecimal("40"));
        Customer customer = customerWithLimit("100");

        when(salesOrderRepository.lockByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));
        when(customerRepository.lockByIdAndTenantIdAndDeletedAtIsNull(2L, 1L))
            .thenReturn(Optional.of(customer));
        when(customerDebtRepository.balance(1L, 2L)).thenReturn(new BigDecimal("60"));

        salesOrderService.confirmOrder(100L);

        assertThat(order.getStatus()).isEqualTo(SalesOrderStatus.COMPLETED);
        verify(inventoryService).deduct(1L, 3L, 4L, 2, "SALES_ORDER", 100L, "Confirm SO-CREDIT");
        verify(customerDebtRepository).save(any(CustomerDebtTransaction.class));
    }

    @Test
    void zeroCreditLimitMeansNoHardLimitConfigured() {
        SalesOrder order = draftOrder(new BigDecimal("500"));
        Customer customer = customerWithLimit("0");

        when(salesOrderRepository.lockByIdAndTenantId(100L, 1L)).thenReturn(Optional.of(order));
        when(customerRepository.lockByIdAndTenantIdAndDeletedAtIsNull(2L, 1L))
            .thenReturn(Optional.of(customer));

        salesOrderService.confirmOrder(100L);

        assertThat(order.getStatus()).isEqualTo(SalesOrderStatus.COMPLETED);
        verify(customerDebtRepository, never()).balance(1L, 2L);
    }

    private SalesOrder draftOrder(BigDecimal debtAmount) {
        SalesOrder order = SalesOrder.builder()
            .id(100L)
            .tenantId(1L)
            .customerId(2L)
            .warehouseId(3L)
            .code("SO-CREDIT")
            .status(SalesOrderStatus.DRAFT)
            .totalAmount(debtAmount)
            .paidAmount(BigDecimal.ZERO)
            .debtAmount(debtAmount)
            .items(new ArrayList<>())
            .build();

        order.getItems().add(
            SalesOrderItem.builder()
                .id(200L)
                .order(order)
                .productId(4L)
                .quantity(2)
                .unitPrice(debtAmount.divide(BigDecimal.valueOf(2)))
                .discountAmount(BigDecimal.ZERO)
                .lineTotal(debtAmount)
                .build()
        );
        return order;
    }

    private Customer customerWithLimit(String creditLimit) {
        return Customer.builder()
            .id(2L)
            .tenantId(1L)
            .creditLimit(new BigDecimal(creditLimit))
            .paymentTermDays(14)
            .active(true)
            .build();
    }
}

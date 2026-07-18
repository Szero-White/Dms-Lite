package com.example.dms.sales;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.inventory.InventoryService;
import com.example.dms.notification.NotificationProducer;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_CANCELLED = "CANCELLED";
    private static final String SALES_ORDER_ENTITY = "SalesOrder";
    private static final String SALES_ORDER_SOURCE = "SALES_ORDER";
    private static final String DEBT_DIRECTION_INCREASE = "INCREASE";
    private static final String NOTIFICATION_TYPE_CONFIRMED = "SALES_ORDER_CONFIRMED";
    private static final String NOTIFICATION_TYPE_CANCELLED = "SALES_ORDER_CANCELLED";

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryService inventoryService;
    private final CustomerDebtRepository customerDebtRepository;
    private final AuditService auditService;
    private final NotificationProducer notificationProducer;
    private final SalesOrderMapper salesOrderMapper;

    @Transactional(readOnly = true)
    public Page<SalesOrderResponse> listOrders(int page) {
        Long tenantId = TenantContext.tenantRequired();
        return salesOrderRepository.findByTenantIdOrderByCreatedAtDesc(
            tenantId,
            PageRequest.of(page, 20)
        ).map(salesOrderMapper::toResponse);
    }

    @Transactional
    public SalesOrderDetailResponse createOrder(CreateSalesOrderRequest request) {
        Long tenantId = TenantContext.tenantRequired();
        validateCustomerExists(request.customerId(), tenantId);

        SalesOrder salesOrder = buildDraftOrder(request, tenantId);
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SalesOrderItemRequest itemRequest : request.items()) {
            SalesOrderItem salesOrderItem = buildSalesOrderItem(
                salesOrder,
                itemRequest,
                tenantId
            );
            salesOrder.getItems().add(salesOrderItem);
            totalAmount = totalAmount.add(salesOrderItem.getLineTotal());
        }

        applyOrderAmounts(salesOrder, totalAmount);

        SalesOrder savedSalesOrder = salesOrderRepository.save(salesOrder);
        auditService.log(
            "SALES_ORDER_CREATED",
            SALES_ORDER_ENTITY,
            savedSalesOrder.getId(),
            savedSalesOrder.getCode()
        );

        return salesOrderMapper.toDetailResponse(savedSalesOrder);
    }

    @Transactional
    @CacheEvict(value = "dashboard", allEntries = true)
    public SalesOrderDetailResponse confirmOrder(Long salesOrderId) {
        Long tenantId = TenantContext.tenantRequired();
        SalesOrder salesOrder = findSalesOrder(salesOrderId, tenantId);

        if (!STATUS_DRAFT.equals(salesOrder.getStatus())) {
            throw new BusinessException("Only DRAFT can be confirmed");
        }

        for (SalesOrderItem salesOrderItem : salesOrder.getItems()) {
            inventoryService.deduct(
                tenantId,
                salesOrder.getWarehouseId(),
                salesOrderItem.getProductId(),
                salesOrderItem.getQuantity(),
                SALES_ORDER_SOURCE,
                salesOrder.getId(),
                "Confirm " + salesOrder.getCode()
            );
        }

        salesOrder.setStatus(STATUS_COMPLETED);
        salesOrder.setConfirmedAt(Instant.now());

        if (salesOrder.getDebtAmount().signum() > 0) {
            customerDebtRepository.save(buildDebtTransaction(salesOrder, tenantId));
        }

        auditService.log("SALES_ORDER_CONFIRMED", SALES_ORDER_ENTITY, salesOrder.getId(), salesOrder.getCode());
        notificationProducer.publish(
            tenantId,
            NOTIFICATION_TYPE_CONFIRMED,
            "Order confirmed",
            "Order " + salesOrder.getCode() + " has been confirmed"
        );

        return salesOrderMapper.toDetailResponse(salesOrder);
    }

    @Transactional
    @CacheEvict(value = "dashboard", allEntries = true)
    public SalesOrderDetailResponse cancelOrder(Long salesOrderId) {
        Long tenantId = TenantContext.tenantRequired();
        SalesOrder salesOrder = findSalesOrder(salesOrderId, tenantId);

        if (!STATUS_DRAFT.equals(salesOrder.getStatus())) {
            throw new BusinessException("Only DRAFT can be cancelled");
        }

        salesOrder.setStatus(STATUS_CANCELLED);

        auditService.log("SALES_ORDER_CANCELLED", SALES_ORDER_ENTITY, salesOrder.getId(), salesOrder.getCode());
        notificationProducer.publish(
            tenantId,
            NOTIFICATION_TYPE_CANCELLED,
            "Order cancelled",
            "Order " + salesOrder.getCode() + " has been cancelled"
        );
        return salesOrderMapper.toDetailResponse(salesOrder);
    }

    private SalesOrder buildDraftOrder(CreateSalesOrderRequest request, Long tenantId) {
        return SalesOrder.builder()
            .tenantId(tenantId)
            .customerId(request.customerId())
            .warehouseId(request.warehouseId())
            .code("SO-" + tenantId + "-" + (salesOrderRepository.countByTenantId(tenantId) + 1))
            .status(STATUS_DRAFT)
            .paidAmount(defaultIfNull(request.paidAmount()))
            .totalAmount(BigDecimal.ZERO)
            .debtAmount(BigDecimal.ZERO)
            .items(new ArrayList<>())
            .build();
    }

    private SalesOrderItem buildSalesOrderItem(
        SalesOrder salesOrder,
        SalesOrderItemRequest itemRequest,
        Long tenantId
    ) {
        Product product = findProduct(itemRequest.productId(), tenantId);
        BigDecimal discountAmount = defaultIfNull(itemRequest.discountAmount());
        BigDecimal lineTotal = product.getSellingPrice()
            .multiply(BigDecimal.valueOf(itemRequest.quantity()))
            .subtract(discountAmount);

        return SalesOrderItem.builder()
            .order(salesOrder)
            .productId(product.getId())
            .quantity(itemRequest.quantity())
            .unitPrice(product.getSellingPrice())
            .discountAmount(discountAmount)
            .lineTotal(lineTotal)
            .build();
    }

    private void applyOrderAmounts(SalesOrder salesOrder, BigDecimal totalAmount) {
        if (salesOrder.getPaidAmount().compareTo(totalAmount) > 0) {
            throw new BusinessException("Paid exceeds total");
        }

        salesOrder.setTotalAmount(totalAmount);
        salesOrder.setDebtAmount(totalAmount.subtract(salesOrder.getPaidAmount()));
    }

    private CustomerDebtTransaction buildDebtTransaction(SalesOrder salesOrder, Long tenantId) {
        Customer customer = findCustomer(salesOrder.getCustomerId(), tenantId);

        return CustomerDebtTransaction.builder()
            .tenantId(tenantId)
            .customerId(customer.getId())
            .sourceType(SALES_ORDER_SOURCE)
            .sourceId(salesOrder.getId())
            .direction(DEBT_DIRECTION_INCREASE)
            .amount(salesOrder.getDebtAmount())
            .remainingAmount(salesOrder.getDebtAmount())
            .dueDate(LocalDate.now().plusDays(customer.getPaymentTermDays()))
            .note(salesOrder.getCode())
            .createdBy(TenantContext.userOrZero())
            .build();
    }

    private void validateCustomerExists(Long customerId, Long tenantId) {
        customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));
    }

    private Customer findCustomer(Long customerId, Long tenantId) {
        return customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));
    }

    private Product findProduct(Long productId, Long tenantId) {
        return productRepository.findByIdAndTenantIdAndDeletedAtIsNull(productId, tenantId)
            .orElseThrow(() -> new BusinessException("Product not found"));
    }

    private SalesOrder findSalesOrder(Long salesOrderId, Long tenantId) {
        return salesOrderRepository.findByIdAndTenantId(salesOrderId, tenantId)
            .orElseThrow(() -> new BusinessException("Order not found"));
    }

    private BigDecimal defaultIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

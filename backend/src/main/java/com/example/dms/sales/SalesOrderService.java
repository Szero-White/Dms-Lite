package com.example.dms.sales;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.inventory.InventoryService;
import com.example.dms.inventory.Warehouse;
import com.example.dms.inventory.WarehouseRepository;
import com.example.dms.notification.NotificationProducer;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final String SALES_ORDER_ENTITY = "SalesOrder";
    private static final String SALES_ORDER_SOURCE = "SALES_ORDER";
    private static final String DEBT_DIRECTION_INCREASE = "INCREASE";
    private static final String NOTIFICATION_TYPE_CONFIRMED = "SALES_ORDER_CONFIRMED";
    private static final String NOTIFICATION_TYPE_CANCELLED = "SALES_ORDER_CANCELLED";
    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryService inventoryService;
    private final WarehouseRepository warehouseRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final AuditService auditService;
    private final NotificationProducer notificationProducer;
    private final SalesOrderMapper salesOrderMapper;

    @Transactional(readOnly = true)
    public Page<SalesOrderResponse> listOrders(int page, Long customerId) {
        Long tenantId = TenantContext.tenantRequired();
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), DEFAULT_PAGE_SIZE);
        Page<SalesOrder> orders = customerId == null
            ? salesOrderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageRequest)
            : salesOrderRepository.findByTenantIdAndCustomerIdOrderByCreatedAtDesc(
                tenantId,
                customerId,
                pageRequest
            );

        boolean includeFinancials = canViewOrderFinancials();
        Map<Long, String> customerNames = loadCustomerNames(orders.getContent(), tenantId);
        Map<Long, String> warehouseNames = loadWarehouseNames(orders.getContent(), tenantId);
        return orders.map(order -> salesOrderMapper.toResponse(
            order,
            includeFinancials,
            customerNames.get(order.getCustomerId()),
            warehouseNames.get(order.getWarehouseId())
        ));
    }

    @Transactional(readOnly = true)
    public SalesOrderDetailResponse getOrder(Long salesOrderId) {
        SalesOrder salesOrder = salesOrderRepository.findDetailByIdAndTenantId(
            salesOrderId,
            TenantContext.tenantRequired()
        ).orElseThrow(() -> new BusinessException("Order not found"));

        return toDetailResponseWithDisplayNames(
            salesOrder,
            TenantContext.tenantRequired(),
            canViewOrderFinancials()
        );
    }

    @Transactional
    public SalesOrderDetailResponse createOrder(CreateSalesOrderRequest request) {
        Long tenantId = TenantContext.tenantRequired();
        findCustomer(request.customerId(), tenantId);
        inventoryService.validateWarehouse(tenantId, request.warehouseId());

        SalesOrder salesOrder = buildDraftOrder(request, tenantId);
        Map<Long, Product> productsById = loadProducts(request.items(), tenantId);
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SalesOrderItemRequest itemRequest : request.items()) {
            SalesOrderItem salesOrderItem = buildSalesOrderItem(
                salesOrder,
                itemRequest,
                productsById
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

        return toDetailResponseWithDisplayNames(
            savedSalesOrder,
            tenantId,
            canViewOrderFinancials()
        );
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public SalesOrderDetailResponse confirmOrder(Long salesOrderId) {
        Long tenantId = TenantContext.tenantRequired();
        SalesOrder salesOrder = findSalesOrderForUpdate(salesOrderId, tenantId);

        if (salesOrder.getStatus() != SalesOrderStatus.DRAFT) {
            throw new BusinessException("Only DRAFT can be confirmed");
        }

        Customer customer = lockCustomer(salesOrder.getCustomerId(), tenantId);
        validateCreditLimit(salesOrder, customer, tenantId);

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

        // Current MVP combines confirmation and warehouse fulfillment in one transaction.
        salesOrder.setStatus(SalesOrderStatus.COMPLETED);
        salesOrder.setConfirmedAt(Instant.now());

        if (salesOrder.getDebtAmount().signum() > 0) {
            customerDebtRepository.save(buildDebtTransaction(salesOrder, tenantId, customer));
        }

        auditService.log(
            "SALES_ORDER_CONFIRMED",
            SALES_ORDER_ENTITY,
            salesOrder.getId(),
            salesOrder.getCode()
        );
        notificationProducer.publish(
            tenantId,
            NOTIFICATION_TYPE_CONFIRMED,
            "Order confirmed",
            "Order " + salesOrder.getCode() + " has been confirmed"
        );

        return toDetailResponseWithDisplayNames(
            salesOrder,
            tenantId,
            canViewOrderFinancials()
        );
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public SalesOrderDetailResponse cancelOrder(Long salesOrderId) {
        Long tenantId = TenantContext.tenantRequired();
        SalesOrder salesOrder = findSalesOrderForUpdate(salesOrderId, tenantId);

        if (salesOrder.getStatus() != SalesOrderStatus.DRAFT) {
            throw new BusinessException("Only DRAFT can be cancelled");
        }

        salesOrder.setStatus(SalesOrderStatus.CANCELLED);

        auditService.log(
            "SALES_ORDER_CANCELLED",
            SALES_ORDER_ENTITY,
            salesOrder.getId(),
            salesOrder.getCode()
        );
        notificationProducer.publish(
            tenantId,
            NOTIFICATION_TYPE_CANCELLED,
            "Order cancelled",
            "Order " + salesOrder.getCode() + " has been cancelled"
        );
        return toDetailResponseWithDisplayNames(
            salesOrder,
            tenantId,
            canViewOrderFinancials()
        );
    }

    private boolean canViewOrderFinancials() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication != null && SalesOrderAccessPolicy.canViewFinancials(
            authentication.getAuthorities().stream().map(authority -> authority.getAuthority()).toList()
        );
    }

    private SalesOrder buildDraftOrder(CreateSalesOrderRequest request, Long tenantId) {
        return SalesOrder.builder()
            .tenantId(tenantId)
            .customerId(request.customerId())
            .warehouseId(request.warehouseId())
            .code(generateOrderCode(tenantId))
            .status(SalesOrderStatus.DRAFT)
            .paidAmount(BigDecimal.ZERO)
            .totalAmount(BigDecimal.ZERO)
            .debtAmount(BigDecimal.ZERO)
            .items(new ArrayList<>())
            .build();
    }

    private String generateOrderCode(Long tenantId) {
        String suffix = UUID.randomUUID()
            .toString()
            .replace("-", "")
            .substring(0, 8)
            .toUpperCase(Locale.ROOT);
        return "SO-" + tenantId + "-" + suffix;
    }

    private SalesOrderItem buildSalesOrderItem(
        SalesOrder salesOrder,
        SalesOrderItemRequest itemRequest,
        Map<Long, Product> productsById
    ) {
        Product product = productsById.get(itemRequest.productId());
        if (product == null) {
            throw new BusinessException("Product not found: " + itemRequest.productId());
        }
        BigDecimal discountAmount = defaultIfNull(itemRequest.discountAmount());
        BigDecimal grossAmount = product.getSellingPrice()
            .multiply(BigDecimal.valueOf(itemRequest.quantity()));

        if (discountAmount.compareTo(grossAmount) > 0) {
            throw new BusinessException("Discount exceeds line amount");
        }

        BigDecimal lineTotal = grossAmount.subtract(discountAmount);
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

    private CustomerDebtTransaction buildDebtTransaction(
        SalesOrder salesOrder,
        Long tenantId,
        Customer customer
    ) {
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

    private SalesOrderDetailResponse toDetailResponseWithDisplayNames(
        SalesOrder salesOrder,
        Long tenantId,
        boolean includeFinancials
    ) {
        String customerName = customerRepository
            .findByIdAndTenantId(salesOrder.getCustomerId(), tenantId)
            .map(Customer::getName)
            .orElse(null);
        String warehouseName = warehouseRepository
            .findByIdAndTenantId(salesOrder.getWarehouseId(), tenantId)
            .map(Warehouse::getName)
            .orElse(null);

        return salesOrderMapper.toDetailResponse(
            salesOrder,
            includeFinancials,
            customerName,
            warehouseName
        );
    }

    private Map<Long, String> loadCustomerNames(List<SalesOrder> orders, Long tenantId) {
        Set<Long> customerIds = orders.stream()
            .map(SalesOrder::getCustomerId)
            .collect(Collectors.toSet());
        if (customerIds.isEmpty()) {
            return Map.of();
        }

        return customerRepository
            .findByTenantIdAndIdIn(tenantId, customerIds)
            .stream()
            .collect(Collectors.toMap(Customer::getId, Customer::getName));
    }

    private Map<Long, String> loadWarehouseNames(List<SalesOrder> orders, Long tenantId) {
        Set<Long> warehouseIds = orders.stream()
            .map(SalesOrder::getWarehouseId)
            .collect(Collectors.toSet());
        if (warehouseIds.isEmpty()) {
            return Map.of();
        }

        return warehouseRepository
            .findByTenantIdAndIdIn(tenantId, warehouseIds)
            .stream()
            .collect(Collectors.toMap(Warehouse::getId, Warehouse::getName));
    }

    private Customer findCustomer(Long customerId, Long tenantId) {
        return customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));
    }

    private void validateCreditLimit(SalesOrder salesOrder, Customer customer, Long tenantId) {
        BigDecimal creditLimit = defaultIfNull(customer.getCreditLimit());
        BigDecimal orderDebt = defaultIfNull(salesOrder.getDebtAmount());

        // Zero means no hard credit limit is configured for this customer.
        if (creditLimit.signum() <= 0 || orderDebt.signum() <= 0) {
            return;
        }

        BigDecimal currentDebt = customerDebtRepository.balance(tenantId, customer.getId());
        BigDecimal projectedDebt = currentDebt.add(orderDebt);

        if (projectedDebt.compareTo(creditLimit) > 0) {
            throw new BusinessException(
                "Credit limit exceeded. Limit: " + creditLimit.toPlainString()
                    + ", current debt: " + currentDebt.toPlainString()
                    + ", order debt: " + orderDebt.toPlainString()
                    + ", projected debt: " + projectedDebt.toPlainString()
            );
        }
    }

    private Customer lockCustomer(Long customerId, Long tenantId) {
        return customerRepository.lockByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));
    }

    private Map<Long, Product> loadProducts(
        List<SalesOrderItemRequest> itemRequests,
        Long tenantId
    ) {
        Set<Long> productIds = itemRequests.stream()
            .map(SalesOrderItemRequest::productId)
            .collect(Collectors.toSet());

        Map<Long, Product> productsById = productRepository
            .findByTenantIdAndIdInAndDeletedAtIsNull(tenantId, productIds)
            .stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));

        if (productsById.size() != productIds.size()) {
            throw new BusinessException("One or more products were not found");
        }
        return productsById;
    }

    private SalesOrder findSalesOrderForUpdate(Long salesOrderId, Long tenantId) {
        return salesOrderRepository.lockByIdAndTenantId(salesOrderId, tenantId)
            .orElseThrow(() -> new BusinessException("Order not found"));
    }

    private BigDecimal defaultIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

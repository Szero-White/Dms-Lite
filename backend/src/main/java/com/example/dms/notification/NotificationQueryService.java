package com.example.dms.notification;

import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.inventory.InventoryTransactionRepository;
import com.example.dms.inventory.StockItem;
import com.example.dms.inventory.StockItemRepository;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.user.PermissionNames;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationQueryService {

    private static final int MAX_FEED_SIZE = 50;

    private static final int API_NOTIFICATION_LIMIT = 20;

    private static final int DERIVED_GROUP_LIMIT = 4;

    private static final int STOCK_MOVEMENT_LIMIT = 3;

    private static final String DERIVED_SOURCE = "derived";

    private static final String API_SOURCE = "api";

    private static final String SALES_ORDER_SOURCE = "SALES_ORDER";

    private static final String PAYMENT_SOURCE = "PAYMENT";

    private final NotificationRepository notificationRepository;

    private final StockItemRepository stockItems;

    private final ProductRepository products;

    private final CustomerDebtRepository debts;

    private final CustomerRepository customers;

    private final InventoryTransactionRepository inventoryTransactions;

    public List<NotificationFeedItem> listRecent(int size, Authentication authentication) {
        Long tenantId = TenantContext.tenantRequired();
        Set<String> permissions = authentication.getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toSet());
        int boundedSize = Math.min(Math.max(size, 1), MAX_FEED_SIZE);
        List<NotificationFeedItem> feed = new ArrayList<>();

        feed.addAll(apiNotifications(tenantId));
        if (canBuildStockNotifications(permissions)) {
            feed.addAll(lowStockNotifications(tenantId));
        }
        if (permissions.contains(PermissionNames.INVENTORY_VIEW)) {
            feed.addAll(stockMovementNotifications(tenantId));
        }
        if (canBuildDebtNotifications(permissions)) {
            feed.addAll(overdueDebtNotifications(tenantId));
        }
        if (canBuildPaymentNotifications(permissions)) {
            feed.addAll(paymentNotifications(tenantId));
        }

        return feed.stream()
            .sorted(Comparator.comparing(NotificationFeedItem::createdAt).reversed())
            .limit(boundedSize)
            .toList();
    }

    private List<NotificationFeedItem> apiNotifications(Long tenantId) {
        return notificationRepository.findByTenantIdOrderByCreatedAtDesc(
                tenantId,
                PageRequest.of(0, API_NOTIFICATION_LIMIT, Sort.by(Sort.Direction.DESC, "createdAt"))
            )
            .stream()
            .map(notification -> new NotificationFeedItem(
                String.valueOf(notification.getId()),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isReadFlag(),
                notification.getCreatedAt(),
                API_SOURCE
            ))
            .toList();
    }

    private List<NotificationFeedItem> lowStockNotifications(Long tenantId) {
        List<StockItem> lowStockItems = stockItems.lowStock(
            tenantId,
            PageRequest.of(0, DERIVED_GROUP_LIMIT)
        );
        Map<Long, Product> productMap = productsById(tenantId, lowStockItems.stream()
            .map(StockItem::getProductId)
            .collect(Collectors.toSet()));
        Instant createdAt = Instant.now();

        return lowStockItems.stream()
            .map(stockItem -> {
                Product product = productMap.get(stockItem.getProductId());
                String productName = product == null ? "Product #" + stockItem.getProductId() : product.getName();
                int minStock = product == null ? 0 : product.getMinStock();

                return new NotificationFeedItem(
                    "low-stock-" + stockItem.getId(),
                    "LOW_STOCK",
                    "Low stock alert",
                    productName + " is at " + stockItem.getQuantityOnHand() +
                        " units, below minimum " + minStock + ".",
                    false,
                    createdAt,
                    DERIVED_SOURCE
                );
            })
            .toList();
    }

    private List<NotificationFeedItem> overdueDebtNotifications(Long tenantId) {
        List<CustomerDebtTransaction> overdueDebts = debts.overdue(
            tenantId,
            LocalDate.now(),
            PageRequest.of(0, DERIVED_GROUP_LIMIT)
        );
        Map<Long, Customer> customerMap = customersById(tenantId, overdueDebts.stream()
            .map(CustomerDebtTransaction::getCustomerId)
            .collect(Collectors.toSet()));

        return overdueDebts.stream()
            .map(debt -> new NotificationFeedItem(
                "overdue-" + debt.getId(),
                "OVERDUE_DEBT",
                "Overdue debt",
                customerName(customerMap, debt.getCustomerId()) + " has overdue receivable of " +
                    formatMoney(debt.getRemainingAmount()) + " VND.",
                false,
                debt.getCreatedAt(),
                DERIVED_SOURCE
            ))
            .toList();
    }

    private List<NotificationFeedItem> paymentNotifications(Long tenantId) {
        List<CustomerDebtTransaction> payments = debts.findByTenantIdAndSourceTypeOrderByCreatedAtDesc(
            tenantId,
            PAYMENT_SOURCE,
            PageRequest.of(0, DERIVED_GROUP_LIMIT)
        );
        Map<Long, Customer> customerMap = customersById(tenantId, payments.stream()
            .map(CustomerDebtTransaction::getCustomerId)
            .collect(Collectors.toSet()));

        return payments.stream()
            .map(payment -> new NotificationFeedItem(
                "payment-" + payment.getId(),
                "PAYMENT_RECORDED",
                "Payment recorded",
                customerName(customerMap, payment.getCustomerId()) + " paid " +
                    formatMoney(payment.getAmount()) + " VND.",
                false,
                payment.getCreatedAt(),
                DERIVED_SOURCE
            ))
            .toList();
    }

    private List<NotificationFeedItem> stockMovementNotifications(Long tenantId) {
        return inventoryTransactions.findByTenantIdAndSourceTypeOrderByCreatedAtDesc(
                tenantId,
                SALES_ORDER_SOURCE,
                PageRequest.of(0, STOCK_MOVEMENT_LIMIT)
            )
            .stream()
            .map(transaction -> new NotificationFeedItem(
                "sales-order-" + transaction.getId(),
                "SALES_ORDER_CONFIRMED",
                "Sales order confirmed",
                "Inventory updated for product #" + transaction.getProductId() +
                    " after sales order confirmation.",
                false,
                transaction.getCreatedAt(),
                DERIVED_SOURCE
            ))
            .toList();
    }

    private Map<Long, Product> productsById(Long tenantId, Set<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }

        return products.findAllById(productIds)
            .stream()
            .filter(product -> tenantId.equals(product.getTenantId()) && product.getDeletedAt() == null)
            .collect(Collectors.toMap(Product::getId, Function.identity()));
    }

    private Map<Long, Customer> customersById(Long tenantId, Set<Long> customerIds) {
        if (customerIds.isEmpty()) {
            return Map.of();
        }

        return customers.findAllById(customerIds)
            .stream()
            .filter(customer -> tenantId.equals(customer.getTenantId()) && customer.getDeletedAt() == null)
            .collect(Collectors.toMap(Customer::getId, Function.identity()));
    }

    private boolean canBuildStockNotifications(Set<String> permissions) {
        return permissions.contains(PermissionNames.PRODUCT_VIEW)
            && permissions.contains(PermissionNames.INVENTORY_VIEW);
    }

    private boolean canBuildDebtNotifications(Set<String> permissions) {
        return permissions.contains(PermissionNames.CUSTOMER_VIEW)
            && permissions.contains(PermissionNames.DEBT_VIEW);
    }

    private boolean canBuildPaymentNotifications(Set<String> permissions) {
        return permissions.contains(PermissionNames.CUSTOMER_VIEW)
            && permissions.contains(PermissionNames.PAYMENT_CREATE);
    }

    private String customerName(Map<Long, Customer> customerMap, Long customerId) {
        Customer customer = customerMap.get(customerId);
        return customer == null ? "Customer #" + customerId : customer.getName();
    }

    private String formatMoney(BigDecimal amount) {
        return NumberFormat.getNumberInstance(Locale.US).format(amount == null ? BigDecimal.ZERO : amount);
    }
}

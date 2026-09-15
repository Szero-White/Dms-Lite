package com.example.dms.notification;

import com.example.dms.common.BusinessTimeProvider;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.inventory.InventoryTransaction;
import com.example.dms.inventory.InventoryTransactionRepository;
import com.example.dms.inventory.StockItem;
import com.example.dms.inventory.StockItemRepository;
import com.example.dms.payment.Payment;
import com.example.dms.payment.PaymentRepository;
import com.example.dms.payment.PaymentWorkspaceAccessPolicy;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.user.PermissionNames;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

/**
 * Builds notification feed entries that are projected from current business state
 * rather than persisted notification events.
 *
 * <p>This service owns the repository reads and permission prerequisites for low
 * stock, overdue receivables, and payment activity. Keeping these projections out
 * of {@link NotificationQueryService} prevents the feed orchestration layer from
 * becoming a second business-data access layer.</p>
 */
@Service
@RequiredArgsConstructor
public class DerivedNotificationService {

    static final String SOURCE = "derived";

    private static final int GROUP_LIMIT = 4;

    private static final int SCAN_LIMIT = 20;

    private static final String PAYMENT_SOURCE = "PAYMENT";

    private final StockItemRepository stockItems;

    private final InventoryTransactionRepository inventoryTransactions;

    private final ProductRepository products;

    private final CustomerDebtRepository debts;

    private final CustomerRepository customers;

    private final PaymentRepository payments;

    private final BusinessTimeProvider businessTimeProvider;

    public List<NotificationFeedItem> listVisible(Long tenantId, Set<String> permissions) {
        List<NotificationFeedItem> feed = new ArrayList<>();
        if (canBuildStockNotifications(permissions)) {
            feed.addAll(lowStockNotifications(tenantId));
        }
        if (canBuildDebtNotifications(permissions)) {
            feed.addAll(overdueDebtNotifications(tenantId));
        }
        if (canBuildPaymentNotifications(permissions)) {
            feed.addAll(paymentNotifications(tenantId));
        }
        return feed;
    }

    private List<NotificationFeedItem> lowStockNotifications(Long tenantId) {
        List<StockItem> lowStockItems = stockItems.lowStock(
            tenantId,
            PageRequest.of(0, GROUP_LIMIT)
        );
        Map<Long, Product> productMap = productsById(
            tenantId,
            lowStockItems.stream()
                .map(StockItem::getProductId)
                .collect(Collectors.toSet())
        );

        return lowStockItems.stream()
            .map(stockItem -> {
                Product product = productMap.get(stockItem.getProductId());
                String productName = product == null
                    ? "Product #" + stockItem.getProductId()
                    : product.getName();
                int minStock = product == null ? 0 : product.getMinStock();
                Instant eventAt = inventoryTransactions
                    .findFirstByTenantIdAndWarehouseIdAndProductIdOrderByCreatedAtDesc(
                        tenantId,
                        stockItem.getWarehouseId(),
                        stockItem.getProductId()
                    )
                    .map(InventoryTransaction::getCreatedAt)
                    .orElse(Instant.EPOCH);

                return new NotificationFeedItem(
                    "low-stock-" + stockItem.getId(),
                    "LOW_STOCK",
                    "Low stock alert",
                    productName + " is at " + stockItem.getQuantityOnHand()
                        + " units, at or below minimum " + minStock + ".",
                    false,
                    eventAt,
                    SOURCE
                );
            })
            .toList();
    }

    private List<NotificationFeedItem> overdueDebtNotifications(Long tenantId) {
        List<CustomerDebtTransaction> overdueDebts = debts.overdue(
            tenantId,
            businessTimeProvider.today(),
            PageRequest.of(0, SCAN_LIMIT)
        );

        // One actionable row per customer avoids flooding the feed when one customer
        // has multiple overdue sales orders.
        Map<Long, OverdueDebtSummary> summaries = new LinkedHashMap<>();
        for (CustomerDebtTransaction debt : overdueDebts) {
            Long customerId = debt.getCustomerId();
            if (customerId == null) {
                continue;
            }

            BigDecimal remaining = debt.getRemainingAmount() == null
                ? BigDecimal.ZERO
                : debt.getRemainingAmount();
            Instant eventAt = overdueEventAt(debt);

            summaries.merge(
                customerId,
                new OverdueDebtSummary(customerId, remaining, eventAt),
                (current, incoming) -> new OverdueDebtSummary(
                    customerId,
                    current.amount().add(incoming.amount()),
                    current.eventAt().isAfter(incoming.eventAt())
                        ? current.eventAt()
                        : incoming.eventAt()
                )
            );
        }

        List<OverdueDebtSummary> limitedSummaries = summaries.values()
            .stream()
            .sorted(
                Comparator.comparing(OverdueDebtSummary::eventAt)
                    .reversed()
                    .thenComparing(OverdueDebtSummary::customerId)
            )
            .limit(GROUP_LIMIT)
            .toList();
        Map<Long, Customer> customerMap = customersById(
            tenantId,
            limitedSummaries.stream()
                .map(OverdueDebtSummary::customerId)
                .collect(Collectors.toSet())
        );

        return limitedSummaries.stream()
            .map(summary -> new NotificationFeedItem(
                "overdue-customer-" + summary.customerId(),
                "OVERDUE_DEBT",
                "Overdue debt",
                customerName(customerMap, summary.customerId()) + " has overdue receivable of "
                    + formatMoney(summary.amount()) + " VND.",
                false,
                summary.eventAt(),
                SOURCE
            ))
            .toList();
    }

    private Instant overdueEventAt(CustomerDebtTransaction debt) {
        if (debt.getDueDate() != null) {
            return businessTimeProvider.startOfDay(debt.getDueDate().plusDays(1));
        }
        return debt.getCreatedAt() == null ? Instant.EPOCH : debt.getCreatedAt();
    }

    private List<NotificationFeedItem> paymentNotifications(Long tenantId) {
        List<CustomerDebtTransaction> paymentEntries = debts.findByTenantIdAndSourceTypeOrderByCreatedAtDesc(
            tenantId,
            PAYMENT_SOURCE,
            PageRequest.of(0, GROUP_LIMIT)
        );
        Map<Long, Customer> customerMap = customersById(
            tenantId,
            paymentEntries.stream()
                .map(CustomerDebtTransaction::getCustomerId)
                .collect(Collectors.toSet())
        );
        Set<Long> paymentIds = paymentEntries.stream()
            .map(CustomerDebtTransaction::getSourceId)
            .filter(java.util.Objects::nonNull)
            .collect(Collectors.toSet());
        Map<Long, Payment> paymentMap = paymentIds.isEmpty()
            ? Map.of()
            : payments.findByTenantIdAndIdIn(tenantId, paymentIds)
                .stream()
                .collect(Collectors.toMap(Payment::getId, Function.identity()));

        return paymentEntries.stream()
            .map(paymentEntry -> {
                Payment payment = paymentMap.get(paymentEntry.getSourceId());
                String customer = customerName(customerMap, paymentEntry.getCustomerId());
                String amount = formatMoney(paymentEntry.getAmount());
                String orderCode = payment == null ? null : payment.getSalesOrderCodeSnapshot();
                String message = orderCode == null || orderCode.isBlank()
                    ? customer + " paid " + amount + " VND."
                    : customer + " paid " + amount + " VND for order " + orderCode + ".";

                return new NotificationFeedItem(
                    "payment-" + paymentEntry.getId(),
                    "PAYMENT_RECORDED",
                    "Payment recorded",
                    message,
                    false,
                    paymentEntry.getCreatedAt(),
                    SOURCE
                );
            })
            .toList();
    }

    private Map<Long, Product> productsById(Long tenantId, Set<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }

        return products.findByTenantIdAndIdInAndDeletedAtIsNullAndActiveTrue(tenantId, productIds)
            .stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));
    }

    private Map<Long, Customer> customersById(Long tenantId, Set<Long> customerIds) {
        if (customerIds.isEmpty()) {
            return Map.of();
        }

        return customers.findByTenantIdAndIdInAndDeletedAtIsNull(tenantId, customerIds)
            .stream()
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
        return PaymentWorkspaceAccessPolicy.canAccess(permissions);
    }

    private String customerName(Map<Long, Customer> customerMap, Long customerId) {
        Customer customer = customerMap.get(customerId);
        return customer == null ? "Customer #" + customerId : customer.getName();
    }

    private String formatMoney(BigDecimal amount) {
        return NumberFormat.getNumberInstance(Locale.US)
            .format(amount == null ? BigDecimal.ZERO : amount);
    }

    private record OverdueDebtSummary(
        Long customerId,
        BigDecimal amount,
        Instant eventAt
    ) {
    }
}

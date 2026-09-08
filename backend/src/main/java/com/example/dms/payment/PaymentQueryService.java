package com.example.dms.payment;

import com.example.dms.common.BusinessException;
import com.example.dms.common.BusinessTimeProvider;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.ReceivableDueStatus;
import com.example.dms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentQueryService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final PaymentRepository paymentRepository;
    private final BusinessTimeProvider businessTimeProvider;
    private final CustomerDebtRepository customerDebtRepository;

    @Transactional(readOnly = true)
    public Page<PaymentOutstandingOrderResponse> listOutstandingOrders(int page, String search) {
        return listOutstandingOrders(page, search, "", null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PaymentOutstandingOrderResponse> listOutstandingOrders(
        int page,
        String search,
        String dueStatuses,
        LocalDate dueFrom,
        LocalDate dueTo,
        BigDecimal minRemaining,
        BigDecimal maxRemaining
    ) {
        return listOutstandingOrders(
            page,
            search,
            dueStatuses,
            dueFrom,
            dueTo,
            minRemaining,
            maxRemaining,
            OutstandingOrderSort.NEWEST,
            Sort.Direction.DESC
        );
    }

    @Transactional(readOnly = true)
    public Page<PaymentOutstandingOrderResponse> listOutstandingOrders(
        int page,
        String search,
        String dueStatuses,
        LocalDate dueFrom,
        LocalDate dueTo,
        BigDecimal minRemaining,
        BigDecimal maxRemaining,
        OutstandingOrderSort sortBy,
        Sort.Direction sortDirection
    ) {
        validateOutstandingFilters(dueFrom, dueTo, minRemaining, maxRemaining);

        Long tenantId = TenantContext.tenantRequired();
        LocalDate today = businessTimeProvider.today();
        Set<ReceivableDueStatus> selectedStatuses = parseDueStatuses(dueStatuses);
        boolean dueFilterEnabled = selectedStatuses.size() < ReceivableDueStatus.values().length;

        return customerDebtRepository.findOutstandingSalesOrderReceivables(
            tenantId,
            normalizeSearch(search),
            SalesOrderStatus.COMPLETED,
            dueFilterEnabled,
            selectedStatuses.contains(ReceivableDueStatus.CURRENT),
            selectedStatuses.contains(ReceivableDueStatus.DUE_SOON),
            selectedStatuses.contains(ReceivableDueStatus.DUE_TODAY),
            selectedStatuses.contains(ReceivableDueStatus.OVERDUE),
            today,
            today.plusDays(ReceivableDueStatus.DUE_SOON_DAYS),
            dueFrom,
            dueTo,
            minRemaining,
            maxRemaining,
            (sortBy == null ? OutstandingOrderSort.NEWEST : sortBy).name(),
            (sortDirection == null ? Sort.Direction.DESC : sortDirection).name(),
            PageRequest.of(Math.max(page, 0), DEFAULT_PAGE_SIZE)
        ).map(view -> toOutstandingOrder(view, today));
    }

    @Transactional(readOnly = true)
    public Page<PaymentResponse> listHistory(
        int page,
        String search,
        LocalDate from,
        LocalDate to
    ) {
        return listHistory(page, search, from, to, PaymentHistorySort.NEWEST, Sort.Direction.DESC);
    }

    @Transactional(readOnly = true)
    public Page<PaymentResponse> listHistory(
        int page,
        String search,
        LocalDate from,
        LocalDate to,
        PaymentHistorySort sortBy,
        Sort.Direction sortDirection
    ) {
        validateHistoryDateRange(from, to);

        Long tenantId = TenantContext.tenantRequired();
        Instant fromInclusive = from == null ? null : businessTimeProvider.startOfDay(from);
        Instant toExclusive = to == null ? null : businessTimeProvider.startOfDay(to.plusDays(1));

        PaymentHistorySort resolvedSort = sortBy == null ? PaymentHistorySort.NEWEST : sortBy;
        Sort.Direction resolvedDirection = sortDirection == null ? Sort.Direction.DESC : sortDirection;

        return paymentRepository.searchHistory(
            tenantId,
            normalizeSearch(search),
            fromInclusive,
            toExclusive,
            PageRequest.of(
                Math.max(page, 0),
                DEFAULT_PAGE_SIZE,
                Sort.by(new Sort.Order(resolvedDirection, resolvedSort.property()).nullsLast())
            )
        ).map(PaymentResponse::from);
    }

    private PaymentOutstandingOrderResponse toOutstandingOrder(
        CustomerDebtRepository.OutstandingReceivableView view,
        LocalDate today
    ) {
        BigDecimal total = zeroIfNull(view.getTotalAmount());
        BigDecimal remaining = zeroIfNull(view.getRemainingAmount());
        BigDecimal paid = total.subtract(remaining).max(BigDecimal.ZERO);

        return new PaymentOutstandingOrderResponse(
            view.getSalesOrderId(),
            view.getSalesOrderCode(),
            view.getCustomerId(),
            view.getCustomerName(),
            total,
            paid,
            remaining,
            view.getDueDate(),
            view.getConfirmedAt(),
            ReceivableDueStatus.from(view.getDueDate(), today),
            ReceivableDueStatus.daysUntilDue(view.getDueDate(), today)
        );
    }

    private Set<ReceivableDueStatus> parseDueStatuses(String rawStatuses) {
        if (rawStatuses == null || rawStatuses.isBlank()) {
            return EnumSet.allOf(ReceivableDueStatus.class);
        }
        if ("NONE".equalsIgnoreCase(rawStatuses.trim())) {
            return EnumSet.noneOf(ReceivableDueStatus.class);
        }

        EnumSet<ReceivableDueStatus> statuses = EnumSet.noneOf(ReceivableDueStatus.class);
        for (String rawStatus : rawStatuses.split(",")) {
            String normalized = rawStatus.trim();
            if (normalized.isEmpty()) {
                continue;
            }
            try {
                statuses.add(ReceivableDueStatus.valueOf(normalized.toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException exception) {
                throw new BusinessException("Unsupported receivable due status: " + normalized);
            }
        }

        return statuses.isEmpty() ? EnumSet.allOf(ReceivableDueStatus.class) : statuses;
    }

    private void validateOutstandingFilters(
        LocalDate dueFrom,
        LocalDate dueTo,
        BigDecimal minRemaining,
        BigDecimal maxRemaining
    ) {
        if (dueFrom != null && dueTo != null && dueFrom.isAfter(dueTo)) {
            throw new BusinessException("Due date start must be on or before end date");
        }
        if (minRemaining != null && minRemaining.signum() < 0) {
            throw new BusinessException("Minimum remaining amount cannot be negative");
        }
        if (maxRemaining != null && maxRemaining.signum() < 0) {
            throw new BusinessException("Maximum remaining amount cannot be negative");
        }
        if (minRemaining != null && maxRemaining != null && minRemaining.compareTo(maxRemaining) > 0) {
            throw new BusinessException("Minimum remaining amount cannot exceed maximum remaining amount");
        }
    }

    private void validateHistoryDateRange(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessException("Payment history start date must be on or before end date");
        }
    }

    private String normalizeSearch(String search) {
        return search == null ? "" : search.trim();
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

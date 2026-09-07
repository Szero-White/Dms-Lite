package com.example.dms.payment;

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
import com.example.dms.invoice.InvoiceService;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderRepository;
import com.example.dms.sales.SalesOrderStatus;
import com.example.dms.tenant.TenantRepository;
import com.example.dms.user.AppUserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final String DEBT_DIRECTION_DECREASE = "DECREASE";
    private static final String SOURCE_TYPE_PAYMENT = "PAYMENT";
    private static final String AUDIT_ACTION_PAYMENT_RECORDED = "PAYMENT_RECORDED";

    private final PaymentRepository paymentRepository;
    private final BusinessTimeProvider businessTimeProvider;
    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final AuditService auditService;
    private final DocumentNumberService documentNumberService;
    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final InvoiceService invoiceService;

    @Transactional(readOnly = true)
    public Page<PaymentOutstandingOrderResponse> listOutstandingOrders(int page, String search) {
        Long tenantId = TenantContext.tenantRequired();
        String normalizedSearch = normalizeSearch(search);

        return customerDebtRepository.findOutstandingSalesOrderReceivables(
            tenantId,
            normalizedSearch,
            SalesOrderStatus.COMPLETED,
            PageRequest.of(Math.max(page, 0), DEFAULT_PAGE_SIZE)
        ).map(view -> {
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
                view.getConfirmedAt()
            );
        });
    }

    @Transactional(readOnly = true)
    public Page<PaymentResponse> listHistory(
        int page,
        String search,
        LocalDate from,
        LocalDate to
    ) {
        validateHistoryDateRange(from, to);

        Long tenantId = TenantContext.tenantRequired();
        Instant fromInclusive = from == null ? null : businessTimeProvider.startOfDay(from);
        Instant toExclusive = to == null ? null : businessTimeProvider.startOfDay(to.plusDays(1));

        return paymentRepository.searchHistory(
            tenantId,
            normalizeSearch(search),
            fromInclusive,
            toExclusive,
            PageRequest.of(Math.max(page, 0), DEFAULT_PAGE_SIZE)
        ).map(PaymentResponse::from);
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public PaymentResponse recordSalesOrderPayment(RecordSalesOrderPaymentRequest request) {
        Long tenantId = TenantContext.tenantRequired();
        Long userId = TenantContext.userOrZero();
        String requestKey = request.requestKey().trim();

        Payment existing = paymentRepository.findByTenantIdAndRequestKey(tenantId, requestKey).orElse(null);
        if (existing != null) {
            return idempotentResponse(existing, request);
        }

        SalesOrder salesOrder = salesOrderRepository.lockByIdAndTenantId(request.salesOrderId(), tenantId)
            .orElseThrow(() -> new BusinessException("Sales order not found"));

        if (salesOrder.getStatus() != SalesOrderStatus.COMPLETED) {
            throw new BusinessException("Payment requires a completed sales order");
        }

        // A concurrent retry with the same request key waits on the same order lock.
        // Re-check after acquiring the lock so a committed first request is returned safely.
        existing = paymentRepository.findByTenantIdAndRequestKey(tenantId, requestKey).orElse(null);
        if (existing != null) {
            return idempotentResponse(existing, request);
        }

        CustomerDebtTransaction receivable = lockSingleSalesOrderReceivable(tenantId, salesOrder.getId());
        BigDecimal debtBefore = zeroIfNull(receivable.getRemainingAmount());
        if (debtBefore.signum() <= 0) {
            throw new BusinessException("Sales order is already fully paid");
        }
        if (request.amount().compareTo(debtBefore) > 0) {
            throw new BusinessException("Payment exceeds sales order remaining debt");
        }

        Customer customer = findCustomer(salesOrder.getCustomerId(), tenantId);
        BigDecimal debtAfter = debtBefore.subtract(request.amount());
        receivable.setRemainingAmount(debtAfter);
        synchronizeSalesOrderAmounts(salesOrder, debtAfter, request.amount());

        Payment savedPayment = paymentRepository.save(
            Payment.builder()
                .tenantId(tenantId)
                .customerId(customer.getId())
                .salesOrderId(salesOrder.getId())
                .code(documentNumberService.next(DocumentNumberType.PAYMENT, tenantId))
                .amount(request.amount())
                .note(normalizeNote(request.note()))
                .debtBefore(debtBefore)
                .debtAfter(debtAfter)
                .customerNameSnapshot(customer.getName())
                .customerPhoneSnapshot(customer.getPhone())
                .customerAddressSnapshot(customer.getAddress())
                .salesOrderCodeSnapshot(salesOrder.getCode())
                .salesOrderTotalSnapshot(salesOrder.getTotalAmount())
                .companyNameSnapshot(resolveCompanyName(tenantId))
                .recordedBySnapshot(resolveRecordedBy(tenantId, userId))
                .requestKey(requestKey)
                .createdBy(userId)
                .build()
        );

        customerDebtRepository.save(
            CustomerDebtTransaction.builder()
                .tenantId(tenantId)
                .customerId(customer.getId())
                .sourceType(SOURCE_TYPE_PAYMENT)
                .sourceId(savedPayment.getId())
                .direction(DEBT_DIRECTION_DECREASE)
                .amount(request.amount())
                .remainingAmount(BigDecimal.ZERO)
                .note(normalizeNote(request.note()))
                .createdBy(userId)
                .build()
        );

        auditService.log(
            AUDIT_ACTION_PAYMENT_RECORDED,
            "Payment",
            savedPayment.getId(),
            savedPayment.getCode() + " / " + salesOrder.getCode()
        );

        if (debtAfter.signum() == 0) {
            invoiceService.ensureDraftForFullyPaidSalesOrder(salesOrder);
        }

        return PaymentResponse.from(savedPayment);
    }

    private PaymentResponse idempotentResponse(
        Payment existing,
        RecordSalesOrderPaymentRequest request
    ) {
        boolean sameOrder = Objects.equals(existing.getSalesOrderId(), request.salesOrderId());
        boolean sameAmount = existing.getAmount() != null && existing.getAmount().compareTo(request.amount()) == 0;
        boolean sameNote = Objects.equals(normalizeNote(existing.getNote()), normalizeNote(request.note()));

        if (!sameOrder || !sameAmount || !sameNote) {
            throw new BusinessException("Payment request key was already used for another payment");
        }
        return PaymentResponse.from(existing);
    }

    private CustomerDebtTransaction lockSingleSalesOrderReceivable(Long tenantId, Long salesOrderId) {
        List<CustomerDebtTransaction> receivables = customerDebtRepository.lockSalesOrderReceivables(
            tenantId,
            salesOrderId
        );
        if (receivables.isEmpty()) {
            throw new BusinessException("Sales order receivable not found");
        }
        if (receivables.size() > 1) {
            throw new BusinessException("Sales order has inconsistent receivable records");
        }
        return receivables.get(0);
    }

    private void synchronizeSalesOrderAmounts(
        SalesOrder salesOrder,
        BigDecimal remainingDebt,
        BigDecimal appliedAmount
    ) {
        BigDecimal total = salesOrder.getTotalAmount();
        BigDecimal paid = total == null
            ? zeroIfNull(salesOrder.getPaidAmount()).add(appliedAmount)
            : total.subtract(remainingDebt);

        salesOrder.setPaidAmount(paid.max(BigDecimal.ZERO));
        salesOrder.setDebtAmount(remainingDebt.max(BigDecimal.ZERO));
    }

    private Customer findCustomer(Long customerId, Long tenantId) {
        return customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));
    }

    private String resolveCompanyName(Long tenantId) {
        return tenantRepository.findById(tenantId)
            .map(tenant -> tenant.getName())
            .filter(name -> !name.isBlank())
            .orElse("DMS Lite");
    }

    private String resolveRecordedBy(Long tenantId, Long userId) {
        if (userId == null || userId <= 0) {
            return "System";
        }
        return appUserRepository.findByIdAndTenantId(userId, tenantId)
            .map(user -> user.getFullName() == null || user.getFullName().isBlank()
                ? user.getUsername()
                : user.getFullName())
            .orElse("User #" + userId);
    }

    private void validateHistoryDateRange(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessException("Payment history start date must be on or before end date");
        }
    }

    private String normalizeSearch(String search) {
        return search == null ? "" : search.trim();
    }

    private String normalizeNote(String note) {
        if (note == null) {
            return null;
        }
        String normalized = note.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

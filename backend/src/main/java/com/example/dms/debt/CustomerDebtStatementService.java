package com.example.dms.debt;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.payment.Payment;
import com.example.dms.payment.PaymentRepository;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderRepository;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerDebtStatementService {

    private static final String SOURCE_TYPE_SALES_ORDER = "SALES_ORDER";
    private static final String SOURCE_TYPE_PAYMENT = "PAYMENT";

    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public List<CustomerDebtStatementResponse> statement(Long customerId) {
        Long tenantId = TenantContext.tenantRequired();
        customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));

        List<CustomerDebtTransaction> transactions =
            customerDebtRepository.findByTenantIdAndCustomerIdOrderByCreatedAtDesc(
                tenantId,
                customerId
            );

        Map<Long, String> salesOrderCodes = loadSalesOrderCodes(tenantId, transactions);
        Map<Long, String> paymentCodes = loadPaymentCodes(tenantId, transactions);

        return transactions.stream()
            .map(transaction -> new CustomerDebtStatementResponse(
                transaction.getId(),
                transaction.getCustomerId(),
                transaction.getSourceType(),
                transaction.getSourceId(),
                resolveSourceCode(transaction, salesOrderCodes, paymentCodes),
                transaction.getDirection(),
                transaction.getAmount(),
                transaction.getRemainingAmount(),
                transaction.getDueDate(),
                transaction.getNote(),
                transaction.getCreatedAt()
            ))
            .toList();
    }

    private Map<Long, String> loadSalesOrderCodes(
        Long tenantId,
        List<CustomerDebtTransaction> transactions
    ) {
        Set<Long> ids = sourceIds(transactions, SOURCE_TYPE_SALES_ORDER);
        if (ids.isEmpty()) {
            return Map.of();
        }

        return salesOrderRepository.findByTenantIdAndIdIn(tenantId, ids)
            .stream()
            .collect(Collectors.toMap(SalesOrder::getId, SalesOrder::getCode));
    }

    private Map<Long, String> loadPaymentCodes(
        Long tenantId,
        List<CustomerDebtTransaction> transactions
    ) {
        Set<Long> ids = sourceIds(transactions, SOURCE_TYPE_PAYMENT);
        if (ids.isEmpty()) {
            return Map.of();
        }

        return paymentRepository.findByTenantIdAndIdIn(tenantId, ids)
            .stream()
            .collect(Collectors.toMap(Payment::getId, Payment::getCode));
    }

    private Set<Long> sourceIds(
        Collection<CustomerDebtTransaction> transactions,
        String sourceType
    ) {
        return transactions.stream()
            .filter(transaction -> sourceType.equals(transaction.getSourceType()))
            .map(CustomerDebtTransaction::getSourceId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
    }

    private String resolveSourceCode(
        CustomerDebtTransaction transaction,
        Map<Long, String> salesOrderCodes,
        Map<Long, String> paymentCodes
    ) {
        if (transaction.getSourceId() == null) {
            return null;
        }
        if (SOURCE_TYPE_SALES_ORDER.equals(transaction.getSourceType())) {
            return salesOrderCodes.get(transaction.getSourceId());
        }
        if (SOURCE_TYPE_PAYMENT.equals(transaction.getSourceType())) {
            return paymentCodes.get(transaction.getSourceId());
        }
        return null;
    }
}

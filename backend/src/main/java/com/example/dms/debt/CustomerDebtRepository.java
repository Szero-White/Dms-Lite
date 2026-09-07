package com.example.dms.debt;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerDebtRepository extends JpaRepository<CustomerDebtTransaction, Long> {

    interface CustomerDebtBalanceView {
        Long getCustomerId();
        BigDecimal getBalance();
    }

    interface CustomerDebtLeaderView {
        Long getCustomerId();
        String getCustomerName();
        BigDecimal getBalance();
    }

    interface SalesOrderReceivableView {
        Long getSourceId();
        BigDecimal getRemainingAmount();
    }

    interface OutstandingReceivableView {
        Long getReceivableId();
        Long getSalesOrderId();
        String getSalesOrderCode();
        Long getCustomerId();
        String getCustomerName();
        BigDecimal getTotalAmount();
        BigDecimal getRemainingAmount();
        LocalDate getDueDate();
        java.time.Instant getConfirmedAt();
    }

    List<CustomerDebtTransaction> findByTenantIdAndCustomerIdOrderByCreatedAtDesc(
        Long tenantId,
        Long customerId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        "select debt from CustomerDebtTransaction debt " +
        "where debt.tenantId=:tenantId and debt.sourceType='SALES_ORDER' " +
        "and debt.sourceId=:salesOrderId and debt.direction='INCREASE' " +
        "order by debt.createdAt desc, debt.id desc"
    )
    List<CustomerDebtTransaction> lockSalesOrderReceivables(
        @Param("tenantId") Long tenantId,
        @Param("salesOrderId") Long salesOrderId
    );

    @Query(
        value = "select debt.id as receivableId, salesOrder.id as salesOrderId, " +
            "salesOrder.code as salesOrderCode, customer.id as customerId, customer.name as customerName, " +
            "salesOrder.totalAmount as totalAmount, debt.remainingAmount as remainingAmount, " +
            "debt.dueDate as dueDate, salesOrder.confirmedAt as confirmedAt " +
            "from CustomerDebtTransaction debt, SalesOrder salesOrder, Customer customer " +
            "where debt.tenantId=:tenantId and salesOrder.tenantId=:tenantId and customer.tenantId=:tenantId " +
            "and debt.sourceType='SALES_ORDER' and debt.direction='INCREASE' and debt.remainingAmount>0 " +
            "and salesOrder.id=debt.sourceId and salesOrder.status=:status " +
            "and customer.id=salesOrder.customerId and customer.deletedAt is null " +
            "and (:search='' or lower(salesOrder.code) like lower(concat('%', :search, '%')) " +
            "or lower(customer.name) like lower(concat('%', :search, '%'))) " +
            "order by debt.dueDate asc, salesOrder.confirmedAt asc, salesOrder.id asc",
        countQuery = "select count(debt) from CustomerDebtTransaction debt, SalesOrder salesOrder, Customer customer " +
            "where debt.tenantId=:tenantId and salesOrder.tenantId=:tenantId and customer.tenantId=:tenantId " +
            "and debt.sourceType='SALES_ORDER' and debt.direction='INCREASE' and debt.remainingAmount>0 " +
            "and salesOrder.id=debt.sourceId and salesOrder.status=:status " +
            "and customer.id=salesOrder.customerId and customer.deletedAt is null " +
            "and (:search='' or lower(salesOrder.code) like lower(concat('%', :search, '%')) " +
            "or lower(customer.name) like lower(concat('%', :search, '%')))"
    )
    org.springframework.data.domain.Page<OutstandingReceivableView> findOutstandingSalesOrderReceivables(
        @Param("tenantId") Long tenantId,
        @Param("search") String search,
        @Param("status") com.example.dms.sales.SalesOrderStatus status,
        Pageable pageable
    );

    @Query(
        "select coalesce(sum(debt.remainingAmount),0) " +
        "from CustomerDebtTransaction debt " +
        "where debt.tenantId=:tenantId and debt.customerId=:customerId " +
        "and debt.direction='INCREASE' and debt.remainingAmount>0"
    )
    BigDecimal balance(
        @Param("tenantId") Long tenantId,
        @Param("customerId") Long customerId
    );

    @Query(
        "select debt.customerId as customerId, coalesce(sum(debt.remainingAmount),0) as balance " +
        "from CustomerDebtTransaction debt " +
        "where debt.tenantId=:tenantId and debt.customerId in :customerIds " +
        "and debt.direction='INCREASE' and debt.remainingAmount>0 " +
        "group by debt.customerId"
    )
    List<CustomerDebtBalanceView> balancesForCustomers(
        @Param("tenantId") Long tenantId,
        @Param("customerIds") Collection<Long> customerIds
    );

    @Query(
        "select coalesce(sum(debt.remainingAmount),0) " +
        "from CustomerDebtTransaction debt " +
        "where debt.tenantId=:tenantId and debt.direction='INCREASE' and debt.remainingAmount>0"
    )
    BigDecimal totalReceivable(@Param("tenantId") Long tenantId);

    @Query(
        "select debt.customerId as customerId, customer.name as customerName, " +
        "coalesce(sum(debt.remainingAmount),0) as balance " +
        "from CustomerDebtTransaction debt, Customer customer " +
        "where debt.tenantId=:tenantId and customer.tenantId=:tenantId " +
        "and customer.id=debt.customerId and customer.deletedAt is null " +
        "and debt.direction='INCREASE' and debt.remainingAmount>0 " +
        "group by debt.customerId, customer.name " +
        "order by coalesce(sum(debt.remainingAmount),0) desc"
    )
    List<CustomerDebtLeaderView> topDebtLeaders(
        @Param("tenantId") Long tenantId,
        Pageable pageable
    );


    @Query(
        "select debt.sourceId as sourceId, coalesce(sum(debt.remainingAmount),0) as remainingAmount " +
        "from CustomerDebtTransaction debt " +
        "where debt.tenantId=:tenantId and debt.sourceType='SALES_ORDER' " +
        "and debt.direction='INCREASE' and debt.sourceId in :salesOrderIds " +
        "group by debt.sourceId"
    )
    List<SalesOrderReceivableView> remainingForSalesOrders(
        @Param("tenantId") Long tenantId,
        @Param("salesOrderIds") Collection<Long> salesOrderIds
    );

    @Query(
        "select debt " +
        "from CustomerDebtTransaction debt " +
        "where debt.tenantId=:tenantId and debt.direction='INCREASE' " +
        "and debt.remainingAmount>0 and debt.dueDate<:today " +
        "order by debt.dueDate asc, debt.createdAt asc"
    )
    List<CustomerDebtTransaction> overdue(
        @Param("tenantId") Long tenantId,
        @Param("today") LocalDate today,
        Pageable pageable
    );

    List<CustomerDebtTransaction> findByTenantIdAndSourceTypeOrderByCreatedAtDesc(
        Long tenantId,
        String sourceType,
        Pageable pageable
    );

    java.util.Optional<CustomerDebtTransaction> findFirstByTenantIdAndSourceTypeAndSourceIdAndDirectionOrderByCreatedAtDesc(
        Long tenantId,
        String sourceType,
        Long sourceId,
        String direction
    );
}

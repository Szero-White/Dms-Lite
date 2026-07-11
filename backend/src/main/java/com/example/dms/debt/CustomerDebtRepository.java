package com.example.dms.debt;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerDebtRepository extends JpaRepository<CustomerDebtTransaction, Long> {

    List<CustomerDebtTransaction> findByTenantIdAndCustomerIdOrderByCreatedAtDesc(
        Long tenantId,
        Long customerId
    );

    List<CustomerDebtTransaction>
        findByTenantIdAndCustomerIdAndDirectionAndRemainingAmountGreaterThanOrderByDueDateAscCreatedAtAsc(
            Long tenantId,
            Long customerId,
            String direction,
            BigDecimal minimumAmount
        );

    @Query(
        "select coalesce(sum(case when debt.direction='INCREASE' then debt.remainingAmount else -debt.amount end),0) " +
        "from CustomerDebtTransaction debt " +
        "where debt.tenantId=:tenantId and debt.customerId=:customerId"
    )
    BigDecimal balance(
        @Param("tenantId") Long tenantId,
        @Param("customerId") Long customerId
    );

    @Query(
        "select coalesce(sum(debt.remainingAmount),0) " +
        "from CustomerDebtTransaction debt " +
        "where debt.tenantId=:tenantId and debt.direction='INCREASE' and debt.remainingAmount>0"
    )
    BigDecimal totalReceivable(@Param("tenantId") Long tenantId);

    @Query(
        "select debt " +
        "from CustomerDebtTransaction debt " +
        "where debt.tenantId=:tenantId and debt.direction='INCREASE' and debt.remainingAmount>0 and debt.dueDate<:today"
    )
    List<CustomerDebtTransaction> overdue(
        @Param("tenantId") Long tenantId,
        @Param("today") LocalDate today
    );
}

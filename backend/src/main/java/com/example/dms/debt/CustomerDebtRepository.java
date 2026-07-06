package com.example.dms.debt;
import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import java.math.*;import java.time.*;import java.util.*;
public interface CustomerDebtRepository extends JpaRepository<CustomerDebtTransaction,Long>{
 List<CustomerDebtTransaction> findByTenantIdAndCustomerIdOrderByCreatedAtDesc(Long tenantId,Long customerId);
 List<CustomerDebtTransaction> findByTenantIdAndCustomerIdAndDirectionAndRemainingAmountGreaterThanOrderByDueDateAscCreatedAtAsc(Long tenantId,Long customerId,String direction,BigDecimal min);
 @Query("select coalesce(sum(case when d.direction='INCREASE' then d.remainingAmount else -d.amount end),0) from CustomerDebtTransaction d where d.tenantId=:t and d.customerId=:c") BigDecimal balance(@Param("t")Long t,@Param("c")Long c);
 @Query("select coalesce(sum(d.remainingAmount),0) from CustomerDebtTransaction d where d.tenantId=:t and d.direction='INCREASE' and d.remainingAmount>0") BigDecimal totalReceivable(@Param("t")Long t);
 @Query("select d from CustomerDebtTransaction d where d.tenantId=:t and d.direction='INCREASE' and d.remainingAmount>0 and d.dueDate<:today") List<CustomerDebtTransaction> overdue(@Param("t")Long t,@Param("today")LocalDate today);
}

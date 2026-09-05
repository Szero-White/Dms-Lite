package com.example.dms.sales;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    Optional<SalesOrder> findByIdAndTenantId(Long id, Long tenantId);

    @EntityGraph(attributePaths = "items")
    Optional<SalesOrder> findDetailByIdAndTenantId(Long id, Long tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select salesOrder from SalesOrder salesOrder where salesOrder.id = :id and salesOrder.tenantId = :tenantId")
    Optional<SalesOrder> lockByIdAndTenantId(
        @Param("id") Long id,
        @Param("tenantId") Long tenantId
    );

    Page<SalesOrder> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);

    List<SalesOrder> findByTenantIdAndIdIn(Long tenantId, Collection<Long> ids);

    Page<SalesOrder> findByTenantIdAndCustomerIdOrderByCreatedAtDesc(
        Long tenantId,
        Long customerId,
        Pageable pageable
    );

    long countByTenantId(Long tenantId);

    Optional<SalesOrder> findFirstByTenantIdAndCodeIgnoreCase(Long tenantId, String code);
}

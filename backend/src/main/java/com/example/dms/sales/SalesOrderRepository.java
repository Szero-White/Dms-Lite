package com.example.dms.sales;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    Optional<SalesOrder> findByIdAndTenantId(Long id, Long tenantId);

    Page<SalesOrder> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);

    long countByTenantId(Long tenantId);
}

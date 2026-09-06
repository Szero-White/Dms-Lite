package com.example.dms.invoice;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Page<Invoice> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);

    @EntityGraph(attributePaths = "items")
    Optional<Invoice> findDetailByIdAndTenantId(Long id, Long tenantId);

    Optional<Invoice> findByTenantIdAndSalesOrderId(Long tenantId, Long salesOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select invoice from Invoice invoice where invoice.id = :id and invoice.tenantId = :tenantId")
    Optional<Invoice> lockByIdAndTenantId(@Param("id") Long id, @Param("tenantId") Long tenantId);
}

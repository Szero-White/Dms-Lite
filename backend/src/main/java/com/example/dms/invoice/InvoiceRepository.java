package com.example.dms.invoice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Page<Invoice> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);

    Optional<Invoice> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Invoice> findByInvoiceNumberAndTenantId(String invoiceNumber, Long tenantId);

    long countByTenantId(Long tenantId);

    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.customerId = :customerId ORDER BY i.createdAt DESC")
    Page<Invoice> findByTenantIdAndCustomerId(@Param("tenantId") Long tenantId, @Param("customerId") Long customerId, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.salesOrderId = :salesOrderId")
    Optional<Invoice> findByTenantIdAndSalesOrderId(@Param("tenantId") Long tenantId, @Param("salesOrderId") Long salesOrderId);

    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.salesOrderId IN :salesOrderIds")
    List<Invoice> findByTenantIdAndSalesOrderIdIn(@Param("tenantId") Long tenantId, @Param("salesOrderIds") List<Long> salesOrderIds);

    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.status = :status ORDER BY i.createdAt DESC")
    Page<Invoice> findByTenantIdAndStatus(@Param("tenantId") Long tenantId, @Param("status") String status, Pageable pageable);
}
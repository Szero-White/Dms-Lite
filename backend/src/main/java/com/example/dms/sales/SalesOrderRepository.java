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


    @Query(
        value = "select salesOrder from SalesOrder salesOrder " +
            "where salesOrder.tenantId=:tenantId " +
            "and salesOrder.status=:status " +
            "and not exists (select invoice.id from Invoice invoice where invoice.tenantId=:tenantId and invoice.salesOrderId=salesOrder.id) " +
            "and (:search='' or lower(salesOrder.code) like lower(concat('%', :search, '%')) " +
            "or exists (select customer.id from Customer customer where customer.tenantId=:tenantId " +
            "and customer.id=salesOrder.customerId and customer.deletedAt is null " +
            "and lower(customer.name) like lower(concat('%', :search, '%')))) " +
            "order by salesOrder.confirmedAt desc, salesOrder.id desc",
        countQuery = "select count(salesOrder) from SalesOrder salesOrder " +
            "where salesOrder.tenantId=:tenantId " +
            "and salesOrder.status=:status " +
            "and not exists (select invoice.id from Invoice invoice where invoice.tenantId=:tenantId and invoice.salesOrderId=salesOrder.id) " +
            "and (:search='' or lower(salesOrder.code) like lower(concat('%', :search, '%')) " +
            "or exists (select customer.id from Customer customer where customer.tenantId=:tenantId " +
            "and customer.id=salesOrder.customerId and customer.deletedAt is null " +
            "and lower(customer.name) like lower(concat('%', :search, '%'))))"
    )
    Page<SalesOrder> findInvoiceEligibleOrders(
        @Param("tenantId") Long tenantId,
        @Param("search") String search,
        @Param("status") SalesOrderStatus status,
        Pageable pageable
    );

    long countByTenantId(Long tenantId);

    boolean existsByTenantIdAndCustomerIdAndStatus(
        Long tenantId,
        Long customerId,
        SalesOrderStatus status
    );

    Optional<SalesOrder> findFirstByTenantIdAndCodeIgnoreCase(Long tenantId, String code);
}

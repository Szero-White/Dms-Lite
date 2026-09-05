package com.example.dms.customer;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Page<Customer> findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
        Long tenantId,
        String keyword,
        Pageable pageable
    );

    Optional<Customer> findByIdAndTenantIdAndDeletedAtIsNull(Long id, Long tenantId);

    List<Customer> findByTenantIdAndIdIn(Long tenantId, Collection<Long> ids);

    Optional<Customer> findByIdAndTenantId(Long id, Long tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select customer from Customer customer where customer.id = :id and customer.tenantId = :tenantId and customer.deletedAt is null")
    Optional<Customer> lockByIdAndTenantIdAndDeletedAtIsNull(
        @Param("id") Long id,
        @Param("tenantId") Long tenantId
    );

    long countByTenantIdAndDeletedAtIsNull(Long tenantId);
}

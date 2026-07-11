package com.example.dms.customer;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Page<Customer> findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
        Long tenantId,
        String keyword,
        Pageable pageable
    );

    Optional<Customer> findByIdAndTenantIdAndDeletedAtIsNull(Long id, Long tenantId);
}

package com.example.dms.customer;
import org.springframework.data.domain.*;import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface CustomerRepository extends JpaRepository<Customer,Long>{Page<Customer> findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(Long tenantId,String keyword,Pageable p);Optional<Customer> findByIdAndTenantIdAndDeletedAtIsNull(Long id,Long tenantId);}

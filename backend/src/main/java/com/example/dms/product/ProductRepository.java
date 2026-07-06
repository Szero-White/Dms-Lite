package com.example.dms.product;
import org.springframework.data.domain.*;import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface ProductRepository extends JpaRepository<Product,Long>{Page<Product> findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(Long tenantId,String keyword,Pageable p);Optional<Product> findByIdAndTenantIdAndDeletedAtIsNull(Long id,Long tenantId);}

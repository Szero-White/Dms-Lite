package com.example.dms.sales;
import org.springframework.data.domain.*;import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface SalesOrderRepository extends JpaRepository<SalesOrder,Long>{Optional<SalesOrder> findByIdAndTenantId(Long id,Long t);Page<SalesOrder> findByTenantIdOrderByCreatedAtDesc(Long t,Pageable p);long countByTenantId(Long t);}

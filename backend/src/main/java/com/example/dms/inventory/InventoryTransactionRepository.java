package com.example.dms.inventory;
import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction,Long>{List<InventoryTransaction> findByTenantIdOrderByCreatedAtDesc(Long t);}

package com.example.dms.audit;
import org.springframework.data.domain.*;import org.springframework.data.jpa.repository.JpaRepository;
public interface AuditLogRepository extends JpaRepository<AuditLog,Long>{Page<AuditLog> findByTenantIdOrderByCreatedAtDesc(Long t,Pageable p);}

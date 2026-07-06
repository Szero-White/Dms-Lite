package com.example.dms.notification;
import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface NotificationRepository extends JpaRepository<Notification,Long>{List<Notification> findByTenantIdOrderByCreatedAtDesc(Long tenantId);}

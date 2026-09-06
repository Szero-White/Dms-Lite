package com.example.dms.payment;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByTenantIdAndIdIn(Long tenantId, Collection<Long> ids);
}

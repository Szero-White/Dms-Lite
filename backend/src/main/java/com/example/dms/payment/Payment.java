package com.example.dms.payment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tenantId;

    private Long customerId;

    /**
     * Null only for legacy payments created before order-specific payments were introduced.
     */
    private Long salesOrderId;

    @Column(nullable = false)
    private String code;

    private BigDecimal amount;

    private String note;

    /** Order receivable immediately before this payment for new payments; legacy customer balance for old rows. */
    private BigDecimal debtBefore;

    /** Order receivable immediately after this payment for new payments; legacy customer balance for old rows. */
    private BigDecimal debtAfter;

    private String customerNameSnapshot;

    private String customerPhoneSnapshot;

    private String customerAddressSnapshot;

    private String salesOrderCodeSnapshot;

    private BigDecimal salesOrderTotalSnapshot;

    private String companyNameSnapshot;

    private String recordedBySnapshot;

    /** Client-generated idempotency key. Null for legacy payments. */
    private String requestKey;

    private Long createdBy;

    private Instant createdAt;

    @PrePersist
    void onPrePersist() {
        createdAt = Instant.now();
    }
}

package com.example.dms.payment;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentReceiptService {

    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public PaymentReceiptResponse getReceipt(Long paymentId) {
        Payment payment = paymentRepository.findByIdAndTenantId(
                paymentId,
                TenantContext.tenantRequired()
            )
            .orElseThrow(() -> new BusinessException("Payment not found"));

        return PaymentReceiptResponse.from(payment);
    }
}

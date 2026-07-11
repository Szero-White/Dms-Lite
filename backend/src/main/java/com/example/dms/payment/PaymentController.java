package com.example.dms.payment;

import com.example.dms.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/customer")
    @PreAuthorize("hasAuthority('PAYMENT_CREATE')")
    public ApiResponse<PaymentResponse> pay(
        @Valid @RequestBody CustomerPaymentRequest request
    ) {
        return ApiResponse.ok(paymentService.recordCustomerPayment(request));
    }
}

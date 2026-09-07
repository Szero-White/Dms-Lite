package com.example.dms.payment;

import com.example.dms.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private static final String PAYMENT_WORKSPACE =
        "hasAuthority('PAYMENT_CREATE') and hasAuthority('CUSTOMER_VIEW') " +
        "and hasAuthority('SALES_ORDER_VIEW') and hasAuthority('DEBT_VIEW')";

    private final PaymentService paymentService;
    private final PaymentReceiptService paymentReceiptService;
    private final PaymentReceiptPdfService paymentReceiptPdfService;

    @GetMapping("/outstanding-orders")
    @PreAuthorize(PAYMENT_WORKSPACE)
    public ApiResponse<Page<PaymentOutstandingOrderResponse>> outstandingOrders(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "") String search
    ) {
        return ApiResponse.ok(paymentService.listOutstandingOrders(page, search));
    }

    @GetMapping("/history")
    @PreAuthorize(PAYMENT_WORKSPACE)
    public ApiResponse<Page<PaymentResponse>> history(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "") String search,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ApiResponse.ok(paymentService.listHistory(page, search, from, to));
    }

    @PostMapping
    @PreAuthorize(PAYMENT_WORKSPACE)
    public ApiResponse<PaymentResponse> pay(
        @Valid @RequestBody RecordSalesOrderPaymentRequest request
    ) {
        return ApiResponse.ok(paymentService.recordSalesOrderPayment(request));
    }

    @GetMapping("/{id}/receipt.pdf")
    @PreAuthorize(PAYMENT_WORKSPACE)
    public ResponseEntity<ByteArrayResource> receiptPdf(
        @PathVariable Long id,
        @RequestHeader(value = HttpHeaders.ACCEPT_LANGUAGE, required = false) String acceptLanguage
    ) {
        PaymentReceiptResponse receipt = paymentReceiptService.getReceipt(id);
        PaymentReceiptLanguage language = PaymentReceiptLanguage.fromAcceptLanguage(acceptLanguage);
        byte[] bytes = paymentReceiptPdfService.generate(receipt, language);

        return ResponseEntity.ok()
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + receipt.paymentCode() + "-receipt.pdf\""
            )
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(bytes.length)
            .body(new ByteArrayResource(bytes));
    }
}

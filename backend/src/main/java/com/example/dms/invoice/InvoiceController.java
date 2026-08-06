package com.example.dms.invoice;

import com.example.dms.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;

    @GetMapping
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
    public ApiResponse<Page<InvoiceResponse>> list(
        @RequestParam(defaultValue = "0") int page
    ) {
        return ApiResponse.ok(invoiceService.listInvoices(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
    public ApiResponse<InvoiceResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.getInvoice(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('INVOICE_CREATE')")
    public ApiResponse<InvoiceResponse> create(
        @Valid @RequestBody CreateInvoiceRequest request
    ) {
        return ApiResponse.ok(invoiceService.createInvoice(request));
    }

    @PostMapping("/from-sales-order/{salesOrderId}")
    @PreAuthorize("hasAuthority('INVOICE_CREATE')")
    public ApiResponse<InvoiceResponse> createFromSalesOrder(@PathVariable Long salesOrderId) {
        return ApiResponse.ok(invoiceService.createInvoiceFromSalesOrder(salesOrderId));
    }

    @PostMapping("/{id}/issue")
    @PreAuthorize("hasAuthority('INVOICE_ISSUE')")
    public ApiResponse<InvoiceResponse> issue(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.issueInvoice(id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('INVOICE_CANCEL')")
    public ApiResponse<InvoiceResponse> cancel(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.cancelInvoice(id));
    }

    @PostMapping("/{id}/payment")
    @PreAuthorize("hasAuthority('INVOICE_RECORD_PAYMENT')")
    public ApiResponse<InvoiceResponse> recordPayment(
        @PathVariable Long id,
        @RequestParam BigDecimal amount
    ) {
        return ApiResponse.ok(invoiceService.recordPayment(id, amount));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
    public ResponseEntity<ByteArrayResource> generatePdf(@PathVariable Long id) {
        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(id);
        
        Invoice invoice = invoiceService.getInvoiceInternal(id);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + invoice.getInvoiceNumber() + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(pdfBytes.length)
            .body(new ByteArrayResource(pdfBytes));
    }
}
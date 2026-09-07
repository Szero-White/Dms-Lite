package com.example.dms.invoice;

import com.example.dms.common.ApiResponse;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;

    @GetMapping
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
    public ApiResponse<Page<InvoiceResponse>> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "") String search,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ApiResponse.ok(invoiceService.listInvoices(page, search, from, to));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
    public ApiResponse<InvoiceResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.getInvoice(id));
    }

    @PostMapping("/{id}/issue")
    @PreAuthorize("hasAuthority('INVOICE_ISSUE')")
    public ApiResponse<InvoiceResponse> issue(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.issueInvoice(id));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
    public ResponseEntity<ByteArrayResource> generatePdf(
        @PathVariable Long id,
        @RequestHeader(value = HttpHeaders.ACCEPT_LANGUAGE, required = false) String acceptLanguage
    ) {
        InvoiceResponse invoice = invoiceService.getInvoice(id);
        InvoicePdfLanguage language = InvoicePdfLanguage.fromAcceptLanguage(acceptLanguage);
        byte[] bytes = invoicePdfService.generateInvoicePdf(invoice, language);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + invoice.invoiceNumber() + ".pdf\"")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(bytes.length)
            .body(new ByteArrayResource(bytes));
    }
}

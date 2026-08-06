package com.example.dms.invoice;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.notification.NotificationProducer;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderItem;
import com.example.dms.sales.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_ISSUED = "ISSUED";
    private static final String STATUS_PAID = "PAID";
    private static final String STATUS_CANCELLED = "CANCELLED";
    private static final String STATUS_OVERDUE = "OVERDUE";

    private static final String INVOICE_ENTITY = "Invoice";
    private static final String NOTIFICATION_TYPE_ISSUED = "INVOICE_ISSUED";
    private static final String NOTIFICATION_TYPE_PAID = "INVOICE_PAID";
    private static final String NOTIFICATION_TYPE_CANCELLED = "INVOICE_CANCELLED";

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final AuditService auditService;
    private final NotificationProducer notificationProducer;

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> listInvoices(int page) {
        Long tenantId = TenantContext.tenantRequired();
        return invoiceRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(page, 20))
            .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(Long invoiceId) {
        Long tenantId = TenantContext.tenantRequired();
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
            .orElseThrow(() -> new BusinessException("Invoice not found"));
        return toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public Invoice getInvoiceInternal(Long invoiceId) {
        Long tenantId = TenantContext.tenantRequired();
        return invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
            .orElseThrow(() -> new BusinessException("Invoice not found"));
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        Long tenantId = TenantContext.tenantRequired();
        validateCustomerExists(request.getCustomerId(), tenantId);

        if (request.getSalesOrderId() != null) {
            validateSalesOrderExists(request.getSalesOrderId(), tenantId);
        }

        Invoice invoice = buildInvoice(request, tenantId);
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;

        for (CreateInvoiceRequest.InvoiceItemRequest itemRequest : request.getItems()) {
            InvoiceItem item = buildInvoiceItem(invoice, itemRequest, tenantId);
            invoice.getItems().add(item);
            subtotal = subtotal.add(calculateItemSubtotal(item));
            totalTax = totalTax.add(item.getTaxAmount() != null ? item.getTaxAmount() : BigDecimal.ZERO);
            totalDiscount = totalDiscount.add(item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO);
        }

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(totalTax);
        invoice.setDiscountAmount(totalDiscount);
        invoice.setTotalAmount(subtotal.add(totalTax).subtract(totalDiscount));
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setRemainingAmount(invoice.getTotalAmount());

        Invoice savedInvoice = invoiceRepository.save(invoice);
        auditService.log(
            "INVOICE_CREATED",
            INVOICE_ENTITY,
            savedInvoice.getId(),
            savedInvoice.getInvoiceNumber()
        );

        return toResponse(savedInvoice);
    }

    @Transactional
    public InvoiceResponse createInvoiceFromSalesOrder(Long salesOrderId) {
        Long tenantId = TenantContext.tenantRequired();
        SalesOrder salesOrder = salesOrderRepository.findByIdAndTenantId(salesOrderId, tenantId)
            .orElseThrow(() -> new BusinessException("Sales order not found"));

        if (!"COMPLETED".equals(salesOrder.getStatus())) {
            throw new BusinessException("Can only create invoice from completed sales order");
        }

        if (invoiceRepository.findByTenantIdAndSalesOrderId(tenantId, salesOrderId).isPresent()) {
            throw new BusinessException("Invoice already exists for this sales order");
        }

        Customer customer = customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(salesOrder.getCustomerId(), tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));

        CreateInvoiceRequest request = buildInvoiceRequestFromSalesOrder(salesOrder, customer);
        return createInvoice(request);
    }

    @Transactional
    public InvoiceResponse issueInvoice(Long invoiceId) {
        Long tenantId = TenantContext.tenantRequired();
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
            .orElseThrow(() -> new BusinessException("Invoice not found"));

        if (!STATUS_DRAFT.equals(invoice.getStatus())) {
            throw new BusinessException("Only DRAFT invoices can be issued");
        }

        invoice.setStatus(STATUS_ISSUED);
        invoice.setIssueDate(Instant.now());

        if (invoice.getDueDate() == null) {
            invoice.setDueDate(Instant.now().plusSeconds(30 * 24 * 60 * 60)); // 30 days default
        }

        auditService.log("INVOICE_ISSUED", INVOICE_ENTITY, invoice.getId(), invoice.getInvoiceNumber());
        notificationProducer.publish(
            tenantId,
            NOTIFICATION_TYPE_ISSUED,
            "Invoice issued",
            "Invoice " + invoice.getInvoiceNumber() + " has been issued"
        );

        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse cancelInvoice(Long invoiceId) {
        Long tenantId = TenantContext.tenantRequired();
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
            .orElseThrow(() -> new BusinessException("Invoice not found"));

        if (STATUS_CANCELLED.equals(invoice.getStatus())) {
            throw new BusinessException("Invoice is already cancelled");
        }

        if (STATUS_PAID.equals(invoice.getStatus())) {
            throw new BusinessException("Cannot cancel paid invoice");
        }

        invoice.setStatus(STATUS_CANCELLED);

        auditService.log("INVOICE_CANCELLED", INVOICE_ENTITY, invoice.getId(), invoice.getInvoiceNumber());
        notificationProducer.publish(
            tenantId,
            NOTIFICATION_TYPE_CANCELLED,
            "Invoice cancelled",
            "Invoice " + invoice.getInvoiceNumber() + " has been cancelled"
        );

        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse recordPayment(Long invoiceId, BigDecimal amount) {
        Long tenantId = TenantContext.tenantRequired();
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
            .orElseThrow(() -> new BusinessException("Invoice not found"));

        if (!STATUS_ISSUED.equals(invoice.getStatus()) && !STATUS_OVERDUE.equals(invoice.getStatus())) {
            throw new BusinessException("Can only record payment for ISSUED or OVERDUE invoices");
        }

        if (amount.compareTo(invoice.getRemainingAmount()) > 0) {
            throw new BusinessException("Payment exceeds remaining amount");
        }

        invoice.setPaidAmount(invoice.getPaidAmount().add(amount));
        invoice.setRemainingAmount(invoice.getRemainingAmount().subtract(amount));

        if (invoice.getRemainingAmount().compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(STATUS_PAID);
            notificationProducer.publish(
                tenantId,
                NOTIFICATION_TYPE_PAID,
                "Invoice paid",
                "Invoice " + invoice.getInvoiceNumber() + " has been fully paid"
            );
        }

        auditService.log("INVOICE_PAYMENT_RECORDED", INVOICE_ENTITY, invoice.getId(), amount.toPlainString());

        return toResponse(invoice);
    }

    private Invoice buildInvoice(CreateInvoiceRequest request, Long tenantId) {
        String invoiceNumber = "INV-" + tenantId + "-" + (invoiceRepository.countByTenantId(tenantId) + 1);

        return Invoice.builder()
            .tenantId(tenantId)
            .customerId(request.getCustomerId())
            .salesOrderId(request.getSalesOrderId())
            .invoiceNumber(invoiceNumber)
            .status(STATUS_DRAFT)
            .issueDate(request.getIssueDate())
            .dueDate(request.getDueDate())
            .taxRate(request.getTaxRate())
            .notes(request.getNotes())
            .companyName(request.getCompanyName())
            .companyAddress(request.getCompanyAddress())
            .companyTaxCode(request.getCompanyTaxCode())
            .customerName(request.getCustomerName())
            .customerAddress(request.getCustomerAddress())
            .customerTaxCode(request.getCustomerTaxCode())
            .createdBy(TenantContext.userOrZero())
            .items(new ArrayList<>())
            .build();
    }

    private InvoiceItem buildInvoiceItem(Invoice invoice, CreateInvoiceRequest.InvoiceItemRequest request, Long tenantId) {
        Product product = productRepository.findByIdAndTenantIdAndDeletedAtIsNull(request.getProductId(), tenantId)
            .orElseThrow(() -> new BusinessException("Product not found"));

        BigDecimal taxAmount = calculateTaxAmount(
            request.getUnitPrice(),
            request.getQuantity(),
            request.getDiscountAmount(),
            request.getTaxRate() != null ? request.getTaxRate().toString() : null
        );

        return InvoiceItem.builder()
            .tenantId(tenantId)
            .productId(product.getId())
            .productName(request.getProductName() != null ? request.getProductName() : product.getName())
            .productCode(request.getProductCode() != null ? request.getProductCode() : product.getSku())
            .description(request.getDescription())
            .quantity(request.getQuantity())
            .unitPrice(request.getUnitPrice())
            .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
            .taxRate(request.getTaxRate() != null ? request.getTaxRate().toString() : null)
            .taxAmount(taxAmount)
            .invoice(invoice)
            .build();
    }

    private BigDecimal calculateItemSubtotal(InvoiceItem item) {
        return item.getUnitPrice()
            .multiply(item.getQuantity())
            .subtract(item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO);
    }

    private BigDecimal calculateTaxAmount(BigDecimal unitPrice, BigDecimal quantity, BigDecimal discountAmount, String taxRate) {
        if (taxRate == null || taxRate.isEmpty()) {
            return BigDecimal.ZERO;
        }

        try {
            BigDecimal rate = new BigDecimal(taxRate.replace("%", ""));
            BigDecimal subtotal = unitPrice.multiply(quantity)
                .subtract(discountAmount != null ? discountAmount : BigDecimal.ZERO);
            return subtotal.multiply(rate).divide(new BigDecimal("100"));
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private CreateInvoiceRequest buildInvoiceRequestFromSalesOrder(SalesOrder salesOrder, Customer customer) {
        List<CreateInvoiceRequest.InvoiceItemRequest> items = new ArrayList<>();
        for (SalesOrderItem orderItem : salesOrder.getItems()) {
            items.add(CreateInvoiceRequest.InvoiceItemRequest.builder()
                .productId(orderItem.getProductId())
                .quantity(new BigDecimal(orderItem.getQuantity()))
                .unitPrice(orderItem.getUnitPrice())
                .discountAmount(orderItem.getDiscountAmount())
                .build());
        }

        return CreateInvoiceRequest.builder()
            .customerId(salesOrder.getCustomerId())
            .salesOrderId(salesOrder.getId())
            .issueDate(Instant.now())
            .customerName(customer.getName())
            .customerAddress(customer.getAddress())
            .items(items)
            .build();
    }

    private void validateCustomerExists(Long customerId, Long tenantId) {
        customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));
    }

    private void validateSalesOrderExists(Long salesOrderId, Long tenantId) {
        salesOrderRepository.findByIdAndTenantId(salesOrderId, tenantId)
            .orElseThrow(() -> new BusinessException("Sales order not found"));
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        List<InvoiceResponse.InvoiceItemResponse> itemResponses = invoice.getItems().stream()
            .map(item -> InvoiceResponse.InvoiceItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .productCode(item.getProductCode())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountAmount(item.getDiscountAmount())
                .taxRate(item.getTaxRate())
                .taxAmount(item.getTaxAmount())
                .lineTotal(item.getLineTotal())
                .build())
            .collect(java.util.stream.Collectors.toList());

        return InvoiceResponse.builder()
            .id(invoice.getId())
            .invoiceNumber(invoice.getInvoiceNumber())
            .customerId(invoice.getCustomerId())
            .salesOrderId(invoice.getSalesOrderId())
            .status(invoice.getStatus())
            .issueDate(invoice.getIssueDate())
            .dueDate(invoice.getDueDate())
            .subtotal(invoice.getSubtotal())
            .taxAmount(invoice.getTaxAmount())
            .discountAmount(invoice.getDiscountAmount())
            .totalAmount(invoice.getTotalAmount())
            .paidAmount(invoice.getPaidAmount())
            .remainingAmount(invoice.getRemainingAmount())
            .taxRate(invoice.getTaxRate())
            .notes(invoice.getNotes())
            .companyName(invoice.getCompanyName())
            .customerName(invoice.getCustomerName())
            .createdAt(invoice.getCreatedAt())
            .updatedAt(invoice.getUpdatedAt())
            .items(itemResponses)
            .build();
    }
}
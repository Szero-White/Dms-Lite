package com.example.dms.invoice;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.BusinessTimeProvider;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.document.DocumentNumberService;
import com.example.dms.document.DocumentNumberType;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderItem;
import com.example.dms.sales.SalesOrderRepository;
import com.example.dms.sales.SalesOrderStatus;
import com.example.dms.tenant.TenantRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_ISSUED = "ISSUED";
    private static final String STATUS_CANCELLED = "CANCELLED";
    private static final String SOURCE_TYPE_SALES_ORDER = "SALES_ORDER";
    private static final String DIRECTION_INCREASE = "INCREASE";

    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final TenantRepository tenantRepository;
    private final AuditService auditService;
    private final DocumentNumberService documentNumberService;
    private final BusinessTimeProvider businessTimeProvider;

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> listInvoices(int page) {
        Long tenantId = TenantContext.tenantRequired();
        Page<Invoice> invoices = invoiceRepository.findByTenantIdOrderByCreatedAtDesc(
            tenantId,
            PageRequest.of(Math.max(page, 0), 20)
        );

        Map<Long, SalesOrder> ordersById = loadOrders(
            tenantId,
            invoices.getContent().stream().map(Invoice::getSalesOrderId).filter(Objects::nonNull).toList()
        );

        boolean includeReceivableState = canViewReceivableState();
        return invoices.map(invoice -> toResponse(
            invoice,
            ordersById.get(invoice.getSalesOrderId()),
            false,
            includeReceivableState
        ));
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(Long invoiceId) {
        Long tenantId = TenantContext.tenantRequired();
        Invoice invoice = invoiceRepository.findDetailByIdAndTenantId(invoiceId, tenantId)
            .orElseThrow(() -> new BusinessException("Invoice not found"));
        SalesOrder order = invoice.getSalesOrderId() == null
            ? null
            : salesOrderRepository.findByIdAndTenantId(invoice.getSalesOrderId(), tenantId).orElse(null);
        return toResponse(invoice, order, true, canViewReceivableState());
    }

    @Transactional
    public InvoiceResponse createFromSalesOrder(Long salesOrderId) {
        Long tenantId = TenantContext.tenantRequired();
        SalesOrder order = salesOrderRepository.lockByIdAndTenantId(salesOrderId, tenantId)
            .orElseThrow(() -> new BusinessException("Sales order not found"));

        if (order.getStatus() != SalesOrderStatus.COMPLETED) {
            throw new BusinessException("Invoice requires a completed sales order");
        }

        Invoice existing = invoiceRepository.findByTenantIdAndSalesOrderId(tenantId, salesOrderId).orElse(null);
        if (existing != null) {
            return toResponse(existing, order, true, canViewReceivableState());
        }

        Customer customer = customerRepository.findByIdAndTenantId(order.getCustomerId(), tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));

        Map<Long, Product> productsById = productRepository.findByTenantIdAndIdIn(
                tenantId,
                order.getItems().stream().map(SalesOrderItem::getProductId).collect(Collectors.toSet())
            )
            .stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));

        BigDecimal grossSubtotal = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        Invoice invoice = Invoice.builder()
            .tenantId(tenantId)
            .customerId(customer.getId())
            .salesOrderId(order.getId())
            .invoiceNumber(documentNumberService.next(DocumentNumberType.INVOICE, tenantId))
            .status(STATUS_DRAFT)
            .dueDate(resolveDueDate(tenantId, order, customer))
            .taxRate("0")
            .taxAmount(BigDecimal.ZERO)
            .paidAmount(zeroIfNull(order.getPaidAmount()))
            .remainingAmount(zeroIfNull(order.getDebtAmount()))
            .companyName(tenantRepository.findById(tenantId).map(tenant -> tenant.getName()).orElse("DMS Lite"))
            .customerName(customer.getName())
            .customerAddress(customer.getAddress())
            .createdBy(TenantContext.userOrZero())
            .build();

        for (SalesOrderItem orderItem : order.getItems()) {
            Product product = productsById.get(orderItem.getProductId());
            if (product == null) {
                throw new BusinessException("Product not found: " + orderItem.getProductId());
            }

            BigDecimal lineGross = orderItem.getUnitPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity()));
            BigDecimal lineDiscount = zeroIfNull(orderItem.getDiscountAmount());
            grossSubtotal = grossSubtotal.add(lineGross);
            discountAmount = discountAmount.add(lineDiscount);

            InvoiceItem item = InvoiceItem.builder()
                .tenantId(tenantId)
                .productId(product.getId())
                .productName(product.getName())
                .productCode(product.getSku())
                .quantity(BigDecimal.valueOf(orderItem.getQuantity()))
                .unitPrice(orderItem.getUnitPrice())
                .discountAmount(lineDiscount)
                .taxRate("0")
                .taxAmount(BigDecimal.ZERO)
                .lineTotal(orderItem.getLineTotal())
                .invoice(invoice)
                .build();
            invoice.getItems().add(item);
        }

        invoice.setSubtotal(grossSubtotal);
        invoice.setDiscountAmount(discountAmount);
        invoice.setTotalAmount(zeroIfNull(order.getTotalAmount()));

        Invoice saved = invoiceRepository.saveAndFlush(invoice);

        auditService.log("INVOICE_CREATED", "Invoice", saved.getId(), saved.getInvoiceNumber());
        return toResponse(saved, order, true, canViewReceivableState());
    }

    @Transactional
    public InvoiceResponse issueInvoice(Long invoiceId) {
        Long tenantId = TenantContext.tenantRequired();
        Invoice invoice = invoiceRepository.lockByIdAndTenantId(invoiceId, tenantId)
            .orElseThrow(() -> new BusinessException("Invoice not found"));

        if (STATUS_CANCELLED.equals(invoice.getStatus())) {
            throw new BusinessException("Cancelled invoice cannot be issued");
        }
        if (STATUS_ISSUED.equals(invoice.getStatus())) {
            return toResponse(invoice, loadOrder(tenantId, invoice), true, canViewReceivableState());
        }
        if (!STATUS_DRAFT.equals(invoice.getStatus())) {
            throw new BusinessException("Only draft invoices can be issued");
        }

        invoice.setStatus(STATUS_ISSUED);
        invoice.setIssueDate(Instant.now());
        auditService.log("INVOICE_ISSUED", "Invoice", invoice.getId(), invoice.getInvoiceNumber());
        return toResponse(invoice, loadOrder(tenantId, invoice), true, canViewReceivableState());
    }

    @Transactional
    public InvoiceResponse cancelInvoice(Long invoiceId) {
        Long tenantId = TenantContext.tenantRequired();
        Invoice invoice = invoiceRepository.lockByIdAndTenantId(invoiceId, tenantId)
            .orElseThrow(() -> new BusinessException("Invoice not found"));
        SalesOrder order = loadOrder(tenantId, invoice);

        if (STATUS_CANCELLED.equals(invoice.getStatus())) {
            return toResponse(invoice, order, true, canViewReceivableState());
        }
        if (order != null && zeroIfNull(order.getPaidAmount()).signum() > 0) {
            throw new BusinessException("Cannot cancel an invoice after payment has been recorded");
        }

        invoice.setStatus(STATUS_CANCELLED);
        auditService.log("INVOICE_CANCELLED", "Invoice", invoice.getId(), invoice.getInvoiceNumber());
        return toResponse(invoice, order, true, canViewReceivableState());
    }

    private Map<Long, SalesOrder> loadOrders(Long tenantId, Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return salesOrderRepository.findByTenantIdAndIdIn(tenantId, ids)
            .stream()
            .collect(Collectors.toMap(SalesOrder::getId, Function.identity()));
    }

    private SalesOrder loadOrder(Long tenantId, Invoice invoice) {
        if (invoice.getSalesOrderId() == null) {
            return null;
        }
        return salesOrderRepository.findByIdAndTenantId(invoice.getSalesOrderId(), tenantId).orElse(null);
    }

    private Instant resolveDueDate(Long tenantId, SalesOrder order, Customer customer) {
        LocalDate dueDate = customerDebtRepository
            .findFirstByTenantIdAndSourceTypeAndSourceIdAndDirectionOrderByCreatedAtDesc(
                tenantId,
                SOURCE_TYPE_SALES_ORDER,
                order.getId(),
                DIRECTION_INCREASE
            )
            .map(debt -> debt.getDueDate())
            .orElseGet(() -> businessTimeProvider.today().plusDays(Math.max(customer.getPaymentTermDays() == null ? 0 : customer.getPaymentTermDays(), 0)));
        return businessTimeProvider.startOfDay(dueDate);
    }

    private InvoiceResponse toResponse(
        Invoice invoice,
        SalesOrder order,
        boolean includeItems,
        boolean includeReceivableState
    ) {
        BigDecimal total = order == null ? zeroIfNull(invoice.getTotalAmount()) : zeroIfNull(order.getTotalAmount());
        BigDecimal paid = order == null ? zeroIfNull(invoice.getPaidAmount()) : zeroIfNull(order.getPaidAmount());
        BigDecimal remaining = order == null ? zeroIfNull(invoice.getRemainingAmount()) : zeroIfNull(order.getDebtAmount());
        String effectiveStatus = effectiveStatus(invoice, remaining, includeReceivableState);

        List<InvoiceResponse.InvoiceItemResponse> items = includeItems
            ? invoice.getItems().stream()
                .map(item -> new InvoiceResponse.InvoiceItemResponse(
                    item.getId(),
                    item.getProductId(),
                    item.getProductName(),
                    item.getProductCode(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    zeroIfNull(item.getDiscountAmount()),
                    zeroIfNull(item.getTaxAmount()),
                    item.getLineTotal()
                ))
                .toList()
            : List.of();

        return new InvoiceResponse(
            invoice.getId(),
            invoice.getInvoiceNumber(),
            invoice.getCustomerId(),
            invoice.getCustomerName(),
            invoice.getCustomerAddress(),
            invoice.getSalesOrderId(),
            order == null ? null : order.getCode(),
            effectiveStatus,
            invoice.getIssueDate(),
            invoice.getDueDate(),
            zeroIfNull(invoice.getSubtotal()),
            zeroIfNull(invoice.getTaxAmount()),
            zeroIfNull(invoice.getDiscountAmount()),
            total,
            includeReceivableState ? paid : null,
            includeReceivableState ? remaining : null,
            invoice.getNotes(),
            invoice.getCompanyName(),
            invoice.getCreatedAt(),
            invoice.getUpdatedAt(),
            items
        );
    }

    private String effectiveStatus(
        Invoice invoice,
        BigDecimal remaining,
        boolean includeReceivableState
    ) {
        if (STATUS_CANCELLED.equals(invoice.getStatus()) || STATUS_DRAFT.equals(invoice.getStatus())) {
            return invoice.getStatus();
        }
        if (!includeReceivableState) {
            return STATUS_ISSUED;
        }
        if (remaining.signum() <= 0) {
            return "PAID";
        }
        if (invoice.getDueDate() != null && invoice.getDueDate().isBefore(Instant.now())) {
            return "OVERDUE";
        }
        return STATUS_ISSUED;
    }

    private boolean canViewReceivableState() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && InvoiceAccessPolicy.canViewReceivableState(
            authentication.getAuthorities().stream().map(authority -> authority.getAuthority()).toList()
        );
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

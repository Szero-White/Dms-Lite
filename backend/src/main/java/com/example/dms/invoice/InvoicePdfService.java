package com.example.dms.invoice;

import com.example.dms.common.BusinessException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

@Service
public class InvoicePdfService {

    private static final PDFont NORMAL = PDType1Font.HELVETICA;
    private static final PDFont BOLD = PDType1Font.HELVETICA_BOLD;
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy")
        .withZone(ZoneId.systemDefault());
    private static final int ITEMS_PER_PAGE = 16;

    public byte[] generateInvoicePdf(InvoiceResponse invoice) {
        if ("DRAFT".equals(invoice.status()) || "CANCELLED".equals(invoice.status())) {
            throw new BusinessException("Only active issued invoices can be downloaded");
        }

        List<InvoiceResponse.InvoiceItemResponse> items = invoice.items() == null ? List.of() : invoice.items();
        int totalPages = Math.max(1, (items.size() + ITEMS_PER_PAGE - 1) / ITEMS_PER_PAGE);

        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            for (int pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                PDPage page = new PDPage();
                document.addPage(page);
                int from = pageIndex * ITEMS_PER_PAGE;
                int to = Math.min(items.size(), from + ITEMS_PER_PAGE);
                List<InvoiceResponse.InvoiceItemResponse> pageItems = items.subList(from, to);

                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    float y = drawHeader(content, page, invoice, pageIndex + 1, totalPages);
                    y = drawItems(content, y, pageItems, from);
                    if (pageIndex == totalPages - 1) {
                        drawSummary(content, y - 12, invoice);
                    }
                    text(content, NORMAL, 8, 50, 34, "Page " + (pageIndex + 1) + " / " + totalPages);
                }
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new BusinessException("Failed to generate invoice PDF");
        }
    }

    private float drawHeader(
        PDPageContentStream content,
        PDPage page,
        InvoiceResponse invoice,
        int pageNumber,
        int totalPages
    ) throws IOException {
        float y = page.getMediaBox().getHeight() - 50;
        text(content, BOLD, 22, 50, y, "INVOICE");
        if (totalPages > 1) {
            text(content, NORMAL, 9, 500, y + 4, pageNumber + " / " + totalPages);
        }
        y -= 34;
        text(content, BOLD, 11, 50, y, ascii(invoice.companyName() == null ? "DMS Lite" : invoice.companyName()));
        text(content, BOLD, 11, 350, y, truncate(ascii(invoice.customerName()), 31));
        y -= 22;
        text(content, NORMAL, 10, 50, y, "Invoice: " + invoice.invoiceNumber());
        text(content, NORMAL, 10, 350, y, "Order: " + safe(invoice.salesOrderCode()));
        y -= 18;
        text(content, NORMAL, 10, 50, y, "Issue date: " + formatDate(invoice.issueDate()));
        text(content, NORMAL, 10, 350, y, "Due date: " + formatDate(invoice.dueDate()));
        y -= 30;
        return y;
    }

    private float drawItems(
        PDPageContentStream content,
        float y,
        List<InvoiceResponse.InvoiceItemResponse> items,
        int firstItemIndex
    ) throws IOException {
        text(content, BOLD, 9, 50, y, "#");
        text(content, BOLD, 9, 75, y, "Product");
        text(content, BOLD, 9, 305, y, "Qty");
        text(content, BOLD, 9, 350, y, "Unit price");
        text(content, BOLD, 9, 430, y, "Discount");
        text(content, BOLD, 9, 505, y, "Total");
        y -= 14;
        content.moveTo(50, y);
        content.lineTo(562, y);
        content.stroke();
        y -= 18;

        for (int i = 0; i < items.size(); i++) {
            InvoiceResponse.InvoiceItemResponse item = items.get(i);
            text(content, NORMAL, 9, 50, y, Integer.toString(firstItemIndex + i + 1));
            text(content, NORMAL, 9, 75, y, truncate(ascii(item.productName()), 34));
            text(content, NORMAL, 9, 305, y, safeNumber(item.quantity()));
            text(content, NORMAL, 9, 350, y, money(item.unitPrice()));
            text(content, NORMAL, 9, 430, y, money(item.discountAmount()));
            text(content, NORMAL, 9, 505, y, money(item.lineTotal()));
            y -= 18;
        }
        return y;
    }

    private void drawSummary(PDPageContentStream content, float y, InvoiceResponse invoice) throws IOException {
        text(content, NORMAL, 10, 350, y, "Subtotal:");
        text(content, NORMAL, 10, 470, y, money(invoice.subtotal()));
        y -= 18;
        text(content, NORMAL, 10, 350, y, "Discount:");
        text(content, NORMAL, 10, 470, y, money(invoice.discountAmount()));
        y -= 18;
        text(content, BOLD, 11, 350, y, "Total:");
        text(content, BOLD, 11, 470, y, money(invoice.totalAmount()));
        if (invoice.paidAmount() != null && invoice.remainingAmount() != null) {
            y -= 18;
            text(content, NORMAL, 10, 350, y, "Paid:");
            text(content, NORMAL, 10, 470, y, money(invoice.paidAmount()));
            y -= 18;
            text(content, BOLD, 10, 350, y, "Remaining:");
            text(content, BOLD, 10, 470, y, money(invoice.remainingAmount()));
            y -= 30;
            text(content, NORMAL, 8, 50, y, "Amounts are synchronized with the sales-order receivable workflow.");
        }
    }

    private void text(PDPageContentStream content, PDFont font, float size, float x, float y, String value)
        throws IOException {
        content.beginText();
        content.setFont(font, size);
        content.newLineAtOffset(x, y);
        content.showText(ascii(value));
        content.endText();
    }

    private String formatDate(java.time.Instant value) {
        return value == null ? "-" : DATE.format(value);
    }

    private String money(BigDecimal value) {
        BigDecimal safe = value == null ? BigDecimal.ZERO : value;
        return safe.stripTrailingZeros().toPlainString() + " VND";
    }

    private String safeNumber(BigDecimal value) {
        return value == null ? "0" : value.stripTrailingZeros().toPlainString();
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : ascii(value);
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return "-";
        }
        return value.length() <= maxLength ? value : value.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String ascii(String value) {
        if (value == null) {
            return "-";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "")
            .replace('đ', 'd')
            .replace('Đ', 'D');
        return normalized.replaceAll("[^\\x20-\\x7E]", "?");
    }
}

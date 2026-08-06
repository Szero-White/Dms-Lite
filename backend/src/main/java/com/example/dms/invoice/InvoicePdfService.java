package com.example.dms.invoice;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final float MARGIN = 50;
    private static final float LINE_HEIGHT = 20;
    private final InvoiceRepository invoiceRepository;

    public byte[] generateInvoicePdf(Long invoiceId) {
        Long tenantId = TenantContext.tenantRequired();
        
        try {
            Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new BusinessException("Invoice not found"));

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            try (PDDocument document = new PDDocument()) {
                PDPage page = new PDPage();
                document.addPage(page);
                
                try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                    generateInvoiceContent(contentStream, invoice, page.getMediaBox().getWidth());
                }
                
                document.save(outputStream);
            }
            
            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new BusinessException("Failed to generate PDF: " + e.getMessage());
        }
    }

    private void generateInvoiceContent(PDPageContentStream contentStream, Invoice invoice, float pageWidth) throws IOException {
        PDFont fontBold = PDType1Font.HELVETICA_BOLD;
        PDFont fontNormal = PDType1Font.HELVETICA;
        
        float yPosition = pageWidth - MARGIN;
        float leftX = MARGIN;
        float rightX = pageWidth - MARGIN;
        
        // Title
        contentStream.setFont(fontBold, 24);
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX + 100, yPosition);
        contentStream.showText("INVOICE");
        contentStream.endText();
        yPosition -= 40;
        
        // Company info
        contentStream.setFont(fontBold, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX, yPosition);
        contentStream.showText("From:");
        contentStream.endText();
        
        contentStream.beginText();
        contentStream.newLineAtOffset(rightX - 200, yPosition);
        contentStream.showText("To:");
        contentStream.endText();
        yPosition -= 20;
        
        contentStream.setFont(fontNormal, 10);
        String companyName = invoice.getCompanyName() != null ? invoice.getCompanyName() : "Your Company";
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX, yPosition);
        contentStream.showText(companyName);
        contentStream.endText();
        
        String customerName = invoice.getCustomerName() != null ? invoice.getCustomerName() : "Customer";
        contentStream.beginText();
        contentStream.newLineAtOffset(rightX - 200, yPosition);
        contentStream.showText(customerName);
        contentStream.endText();
        yPosition -= 20;
        
        if (invoice.getCompanyAddress() != null) {
            contentStream.beginText();
            contentStream.newLineAtOffset(leftX, yPosition);
            contentStream.showText(invoice.getCompanyAddress());
            contentStream.endText();
            yPosition -= 20;
        }
        
        if (invoice.getCustomerAddress() != null) {
            contentStream.beginText();
            contentStream.newLineAtOffset(rightX - 200, yPosition);
            contentStream.showText(invoice.getCustomerAddress());
            contentStream.endText();
            yPosition -= 20;
        }
        
        yPosition -= 20;
        
        // Invoice details
        contentStream.setFont(fontBold, 10);
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX, yPosition);
        contentStream.showText("Invoice Number:");
        contentStream.endText();
        
        contentStream.setFont(fontNormal, 10);
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX + 120, yPosition);
        contentStream.showText(invoice.getInvoiceNumber());
        contentStream.endText();
        yPosition -= 20;
        
        contentStream.setFont(fontBold, 10);
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX, yPosition);
        contentStream.showText("Issue Date:");
        contentStream.endText();
        
        contentStream.setFont(fontNormal, 10);
        String issueDate = invoice.getIssueDate() != null ? DATE_FORMATTER.format(invoice.getIssueDate()) : "N/A";
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX + 120, yPosition);
        contentStream.showText(issueDate);
        contentStream.endText();
        yPosition -= 20;
        
        contentStream.setFont(fontBold, 10);
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX, yPosition);
        contentStream.showText("Due Date:");
        contentStream.endText();
        
        contentStream.setFont(fontNormal, 10);
        String dueDate = invoice.getDueDate() != null ? DATE_FORMATTER.format(invoice.getDueDate()) : "N/A";
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX + 120, yPosition);
        contentStream.showText(dueDate);
        contentStream.endText();
        yPosition -= 30;
        
        // Table header
        contentStream.setFont(fontBold, 10);
        float[] columnWidths = {30, 200, 80, 80, 80, 100};
        float[] columnX = {leftX, leftX + 30, leftX + 230, leftX + 310, leftX + 390, leftX + 470};
        
        String[] headers = {"No.", "Description", "Quantity", "Unit Price", "Discount", "Total"};
        for (int i = 0; i < headers.length; i++) {
            contentStream.beginText();
            contentStream.newLineAtOffset(columnX[i], yPosition);
            contentStream.showText(headers[i]);
            contentStream.endText();
        }
        yPosition -= 20;
        
        // Draw line
        contentStream.moveTo(leftX, yPosition);
        contentStream.lineTo(rightX, yPosition);
        contentStream.stroke();
        yPosition -= 20;
        
        // Items
        contentStream.setFont(fontNormal, 9);
        int itemNumber = 1;
        for (InvoiceItem item : invoice.getItems()) {
            contentStream.beginText();
            contentStream.newLineAtOffset(columnX[0], yPosition);
            contentStream.showText(String.valueOf(itemNumber));
            contentStream.endText();
            
            String productName = item.getProductName() != null ? item.getProductName() : "Product";
            contentStream.beginText();
            contentStream.newLineAtOffset(columnX[1], yPosition);
            contentStream.showText(productName.length() > 25 ? productName.substring(0, 25) : productName);
            contentStream.endText();
            
            String quantity = item.getQuantity() != null ? item.getQuantity().toString() : "0";
            contentStream.beginText();
            contentStream.newLineAtOffset(columnX[2], yPosition);
            contentStream.showText(quantity);
            contentStream.endText();
            
            String unitPrice = item.getUnitPrice() != null ? "$" + item.getUnitPrice().toString() : "$0.00";
            contentStream.beginText();
            contentStream.newLineAtOffset(columnX[3], yPosition);
            contentStream.showText(unitPrice);
            contentStream.endText();
            
            String discount = item.getDiscountAmount() != null ? "$" + item.getDiscountAmount().toString() : "$0.00";
            contentStream.beginText();
            contentStream.newLineAtOffset(columnX[4], yPosition);
            contentStream.showText(discount);
            contentStream.endText();
            
            String lineTotal = item.getLineTotal() != null ? "$" + item.getLineTotal().toString() : "$0.00";
            contentStream.beginText();
            contentStream.newLineAtOffset(columnX[5], yPosition);
            contentStream.showText(lineTotal);
            contentStream.endText();
            
            yPosition -= 20;
            itemNumber++;
        }
        
        yPosition -= 20;
        
        // Summary
        contentStream.setFont(fontNormal, 10);
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX, yPosition);
        contentStream.showText("Subtotal:");
        contentStream.endText();
        
        String subtotal = invoice.getSubtotal() != null ? "$" + invoice.getSubtotal().toString() : "$0.00";
        contentStream.beginText();
        contentStream.newLineAtOffset(rightX - 100, yPosition);
        contentStream.showText(subtotal);
        contentStream.endText();
        yPosition -= 20;
        
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX, yPosition);
        contentStream.showText("Tax:");
        contentStream.endText();
        
        String taxAmount = invoice.getTaxAmount() != null ? "$" + invoice.getTaxAmount().toString() : "$0.00";
        contentStream.beginText();
        contentStream.newLineAtOffset(rightX - 100, yPosition);
        contentStream.showText(taxAmount);
        contentStream.endText();
        yPosition -= 20;
        
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX, yPosition);
        contentStream.showText("Discount:");
        contentStream.endText();
        
        String discountAmount = invoice.getDiscountAmount() != null ? "-$" + invoice.getDiscountAmount().toString() : "$0.00";
        contentStream.beginText();
        contentStream.newLineAtOffset(rightX - 100, yPosition);
        contentStream.showText(discountAmount);
        contentStream.endText();
        yPosition -= 20;
        
        contentStream.setFont(fontBold, 12);
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX, yPosition);
        contentStream.showText("Total:");
        contentStream.endText();
        
        String totalAmount = invoice.getTotalAmount() != null ? "$" + invoice.getTotalAmount().toString() : "$0.00";
        contentStream.beginText();
        contentStream.newLineAtOffset(rightX - 100, yPosition);
        contentStream.showText(totalAmount);
        contentStream.endText();
        yPosition -= 40;
        
        // Footer
        contentStream.setFont(fontNormal, 10);
        contentStream.beginText();
        contentStream.newLineAtOffset(leftX + 150, yPosition);
        contentStream.showText("Thank you for your business!");
        contentStream.endText();
    }
}
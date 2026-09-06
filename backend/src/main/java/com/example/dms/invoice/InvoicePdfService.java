package com.example.dms.invoice;

import com.example.dms.common.BusinessException;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class InvoicePdfService {

    private static final int ITEMS_PER_PAGE = 16;
    private static final String ENV_REGULAR_FONT = "APP_INVOICE_PDF_FONT_REGULAR";
    private static final String ENV_BOLD_FONT = "APP_INVOICE_PDF_FONT_BOLD";

    private final ZoneId businessZone;

    public InvoicePdfService(@Value("${app.business-zone:Asia/Ho_Chi_Minh}") String businessZone) {
        this.businessZone = ZoneId.of(businessZone);
    }

    public byte[] generateInvoicePdf(InvoiceResponse invoice, InvoicePdfLanguage language) {
        if ("DRAFT".equals(invoice.status()) || "CANCELLED".equals(invoice.status())) {
            throw new BusinessException("Only active issued invoices can be downloaded");
        }

        InvoicePdfLanguage effectiveLanguage = language == null ? InvoicePdfLanguage.EN : language;
        InvoicePdfText copy = InvoicePdfText.forLanguage(effectiveLanguage);
        List<InvoiceResponse.InvoiceItemResponse> items = invoice.items() == null ? List.of() : invoice.items();
        int totalPages = Math.max(1, (items.size() + ITEMS_PER_PAGE - 1) / ITEMS_PER_PAGE);

        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfFonts fonts = loadFonts(document);

            for (int pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                PDPage page = new PDPage();
                document.addPage(page);
                int from = pageIndex * ITEMS_PER_PAGE;
                int to = Math.min(items.size(), from + ITEMS_PER_PAGE);
                List<InvoiceResponse.InvoiceItemResponse> pageItems = items.subList(from, to);

                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    float y = drawHeader(content, page, invoice, effectiveLanguage, copy, fonts, pageIndex + 1, totalPages);
                    y = drawItems(content, y, pageItems, from, effectiveLanguage, copy, fonts);
                    if (pageIndex == totalPages - 1) {
                        drawSummary(content, y - 12, invoice, effectiveLanguage, copy, fonts);
                    }
                    text(content, fonts.normal(), 8, 50, 34, copy.page() + " " + (pageIndex + 1) + " / " + totalPages);
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
        InvoicePdfLanguage language,
        InvoicePdfText copy,
        PdfFonts fonts,
        int pageNumber,
        int totalPages
    ) throws IOException {
        float y = page.getMediaBox().getHeight() - 50;
        text(content, fonts.bold(), 20, 50, y, copy.title());
        if (totalPages > 1) {
            text(content, fonts.normal(), 9, 500, y + 4, pageNumber + " / " + totalPages);
        }

        y -= 30;
        text(content, fonts.normal(), 8, 50, y, copy.seller());
        text(content, fonts.normal(), 8, 350, y, copy.customer());
        y -= 16;
        text(content, fonts.bold(), 11, 50, y, safe(invoice.companyName() == null ? "DMS Lite" : invoice.companyName()));
        text(content, fonts.bold(), 11, 350, y, truncate(safe(invoice.customerName()), 31));

        if (hasText(invoice.customerAddress())) {
            y -= 16;
            text(content, fonts.normal(), 8, 350, y, copy.address() + ": " + truncate(safe(invoice.customerAddress()), 38));
        }

        y -= 24;
        text(content, fonts.normal(), 10, 50, y, copy.invoice() + ": " + safe(invoice.invoiceNumber()));
        text(content, fonts.normal(), 10, 350, y, copy.order() + ": " + safe(invoice.salesOrderCode()));
        y -= 18;
        text(content, fonts.normal(), 10, 50, y, copy.issueDate() + ": " + formatDate(invoice.issueDate(), language));
        text(content, fonts.normal(), 10, 350, y, copy.dueDate() + ": " + formatDate(invoice.dueDate(), language));
        y -= 30;
        return y;
    }

    private float drawItems(
        PDPageContentStream content,
        float y,
        List<InvoiceResponse.InvoiceItemResponse> items,
        int firstItemIndex,
        InvoicePdfLanguage language,
        InvoicePdfText copy,
        PdfFonts fonts
    ) throws IOException {
        text(content, fonts.bold(), 9, 50, y, "#");
        text(content, fonts.bold(), 9, 75, y, copy.product());
        text(content, fonts.bold(), 9, 305, y, copy.quantity());
        text(content, fonts.bold(), 9, 350, y, copy.unitPrice());
        text(content, fonts.bold(), 9, 430, y, copy.discount());
        text(content, fonts.bold(), 9, 505, y, copy.total());
        y -= 14;
        content.moveTo(50, y);
        content.lineTo(562, y);
        content.stroke();
        y -= 18;

        for (int i = 0; i < items.size(); i++) {
            InvoiceResponse.InvoiceItemResponse item = items.get(i);
            text(content, fonts.normal(), 9, 50, y, Integer.toString(firstItemIndex + i + 1));
            text(content, fonts.normal(), 9, 75, y, truncate(productLabel(item), 34));
            text(content, fonts.normal(), 9, 305, y, safeNumber(item.quantity()));
            text(content, fonts.normal(), 9, 350, y, money(item.unitPrice(), language));
            text(content, fonts.normal(), 9, 430, y, money(item.discountAmount(), language));
            text(content, fonts.normal(), 9, 505, y, money(item.lineTotal(), language));
            y -= 18;
        }
        return y;
    }

    private void drawSummary(
        PDPageContentStream content,
        float y,
        InvoiceResponse invoice,
        InvoicePdfLanguage language,
        InvoicePdfText copy,
        PdfFonts fonts
    ) throws IOException {
        text(content, fonts.normal(), 10, 350, y, copy.subtotal() + ":");
        text(content, fonts.normal(), 10, 470, y, money(invoice.subtotal(), language));
        y -= 18;
        text(content, fonts.normal(), 10, 350, y, copy.discount() + ":");
        text(content, fonts.normal(), 10, 470, y, money(invoice.discountAmount(), language));
        y -= 18;
        text(content, fonts.bold(), 11, 350, y, copy.total() + ":");
        text(content, fonts.bold(), 11, 470, y, money(invoice.totalAmount(), language));
        if (invoice.paidAmount() != null && invoice.remainingAmount() != null) {
            y -= 18;
            text(content, fonts.normal(), 10, 350, y, copy.paid() + ":");
            text(content, fonts.normal(), 10, 470, y, money(invoice.paidAmount(), language));
            y -= 18;
            text(content, fonts.bold(), 10, 350, y, copy.remaining() + ":");
            text(content, fonts.bold(), 10, 470, y, money(invoice.remainingAmount(), language));
            y -= 30;
            text(content, fonts.normal(), 8, 50, y, copy.paymentSnapshot());
        }
    }

    private PdfFonts loadFonts(PDDocument document) throws IOException {
        File regularFile = findFont(ENV_REGULAR_FONT, regularFontCandidates());
        if (regularFile == null) {
            throw new BusinessException("Unicode font required for invoice PDF is not available");
        }
        File boldFile = findFont(ENV_BOLD_FONT, boldFontCandidates());

        PDFont normal = PDType0Font.load(document, regularFile);
        PDFont bold = boldFile == null ? normal : PDType0Font.load(document, boldFile);
        return new PdfFonts(normal, bold);
    }

    private File findFont(String environmentVariable, List<String> candidates) {
        String configured = System.getenv(environmentVariable);
        if (configured != null && !configured.isBlank()) {
            File configuredFile = new File(configured);
            if (configuredFile.isFile()) {
                return configuredFile;
            }
        }

        for (String candidate : candidates) {
            File file = new File(candidate);
            if (file.isFile()) {
                return file;
            }
        }
        return null;
    }

    private List<String> regularFontCandidates() {
        List<String> candidates = new ArrayList<>();
        String windows = System.getenv("WINDIR");
        if (windows != null && !windows.isBlank()) {
            candidates.add(windows + File.separator + "Fonts" + File.separator + "arial.ttf");
            candidates.add(windows + File.separator + "Fonts" + File.separator + "segoeui.ttf");
        }
        candidates.add("C:\\Windows\\Fonts\\arial.ttf");
        candidates.add("C:\\Windows\\Fonts\\segoeui.ttf");
        candidates.add("/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf");
        candidates.add("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
        candidates.add("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf");
        candidates.add("/System/Library/Fonts/Supplemental/Arial.ttf");
        return candidates;
    }

    private List<String> boldFontCandidates() {
        List<String> candidates = new ArrayList<>();
        String windows = System.getenv("WINDIR");
        if (windows != null && !windows.isBlank()) {
            candidates.add(windows + File.separator + "Fonts" + File.separator + "arialbd.ttf");
            candidates.add(windows + File.separator + "Fonts" + File.separator + "segoeuib.ttf");
        }
        candidates.add("C:\\Windows\\Fonts\\arialbd.ttf");
        candidates.add("C:\\Windows\\Fonts\\segoeuib.ttf");
        candidates.add("/usr/share/fonts/ttf-dejavu/DejaVuSans-Bold.ttf");
        candidates.add("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf");
        candidates.add("/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf");
        candidates.add("/System/Library/Fonts/Supplemental/Arial Bold.ttf");
        return candidates;
    }

    private void text(PDPageContentStream content, PDFont font, float size, float x, float y, String value)
        throws IOException {
        content.beginText();
        content.setFont(font, size);
        content.newLineAtOffset(x, y);
        content.showText(singleLine(value));
        content.endText();
    }

    private String formatDate(Instant value, InvoicePdfLanguage language) {
        if (value == null) {
            return "-";
        }
        String pattern = language == InvoicePdfLanguage.VI ? "dd/MM/yyyy" : "dd MMM yyyy";
        return DateTimeFormatter.ofPattern(pattern, language.locale())
            .withZone(businessZone)
            .format(value);
    }

    private String money(BigDecimal value, InvoicePdfLanguage language) {
        BigDecimal safe = value == null ? BigDecimal.ZERO : value;
        NumberFormat numberFormat = NumberFormat.getNumberInstance(language.locale());
        numberFormat.setGroupingUsed(true);
        numberFormat.setMinimumFractionDigits(0);
        numberFormat.setMaximumFractionDigits(2);
        String formatted = numberFormat.format(safe.stripTrailingZeros());
        return language == InvoicePdfLanguage.VI ? formatted + " ₫" : formatted + " VND";
    }

    private String safeNumber(BigDecimal value) {
        return value == null ? "0" : value.stripTrailingZeros().toPlainString();
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : singleLine(value);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String productLabel(InvoiceResponse.InvoiceItemResponse item) {
        String name = safe(item.productName());
        return hasText(item.productCode()) ? name + " (" + singleLine(item.productCode()) + ")" : name;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return "-";
        }
        return value.length() <= maxLength ? value : value.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String singleLine(String value) {
        return value == null ? "-" : value.replace('\r', ' ').replace('\n', ' ').trim();
    }

    private record PdfFonts(PDFont normal, PDFont bold) {
    }
}

package com.example.dms.payment;

import com.example.dms.common.BusinessException;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
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
public class PaymentReceiptPdfService {

    private static final String ENV_REGULAR_FONT = "APP_INVOICE_PDF_FONT_REGULAR";
    private static final String ENV_BOLD_FONT = "APP_INVOICE_PDF_FONT_BOLD";

    private final ZoneId businessZone;

    public PaymentReceiptPdfService(@Value("${app.business-zone:Asia/Ho_Chi_Minh}") String businessZone) {
        this.businessZone = ZoneId.of(businessZone);
    }

    public byte[] generate(PaymentReceiptResponse receipt, PaymentReceiptLanguage language) {
        PaymentReceiptLanguage effectiveLanguage = language == null ? PaymentReceiptLanguage.EN : language;
        PaymentReceiptText copy = PaymentReceiptText.forLanguage(effectiveLanguage);

        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            PdfFonts fonts = loadFonts(document);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = page.getMediaBox().getHeight() - 56;
                text(content, fonts.bold(), 19, 50, y, copy.title());
                y -= 23;
                text(content, fonts.normal(), 10, 50, y, safe(receipt.companyName(), "DMS Lite"));

                y -= 34;
                y = line(content, fonts, y, copy.paymentCode(), receipt.paymentCode(), true);
                if (!receipt.legacy()) {
                    y = line(content, fonts, y, copy.salesOrder(), safe(receipt.salesOrderCode(), "-"), true);
                    y = moneyLine(content, fonts, y, copy.orderTotal(), receipt.salesOrderTotal(), effectiveLanguage, false);
                }
                y = line(content, fonts, y, copy.receivedAt(), formatDateTime(receipt, effectiveLanguage), false);
                y = line(content, fonts, y, copy.recordedBy(), safe(receipt.recordedBy(), "-"), false);

                y -= 15;
                text(content, fonts.bold(), 11, 50, y, copy.customer());
                y -= 20;
                text(content, fonts.normal(), 10, 50, y, safe(receipt.customerName(), "Customer #" + receipt.customerId()));
                y = optionalLine(content, fonts, y - 18, copy.phone(), receipt.customerPhone());
                y = optionalLine(content, fonts, y, copy.address(), receipt.customerAddress());

                y -= 18;
                content.moveTo(50, y);
                content.lineTo(562, y);
                content.stroke();

                y -= 28;
                y = moneyLine(content, fonts, y, copy.debtBefore(), receipt.debtBefore(), effectiveLanguage, false);
                y = moneyLine(content, fonts, y, copy.amountReceived(), receipt.amountReceived(), effectiveLanguage, true);
                y = moneyLine(content, fonts, y, copy.debtAfter(), receipt.debtAfter(), effectiveLanguage, true);

                if (hasText(receipt.note())) {
                    y -= 14;
                    text(content, fonts.bold(), 10, 50, y, copy.note());
                    y -= 18;
                    text(content, fonts.normal(), 9, 50, y, truncate(receipt.note(), 88));
                }

                y -= 34;
                if (receipt.legacy()) {
                    text(content, fonts.normal(), 9, 50, y, copy.legacyNotice());
                } else {
                    boolean stillOwes = receipt.debtAfter() != null && receipt.debtAfter().signum() > 0;
                    text(content, fonts.normal(), 9, 50, y, stillOwes ? copy.partialNotice() : copy.fullNotice());
                }
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new BusinessException("Failed to generate payment receipt PDF");
        }
    }

    private float line(PDPageContentStream content, PdfFonts fonts, float y, String label, String value, boolean boldValue)
        throws IOException {
        text(content, fonts.normal(), 9, 50, y, label + ":");
        text(content, boldValue ? fonts.bold() : fonts.normal(), 10, 210, y, safe(value, "-"));
        return y - 20;
    }

    private float optionalLine(PDPageContentStream content, PdfFonts fonts, float y, String label, String value)
        throws IOException {
        if (!hasText(value)) {
            return y;
        }
        text(content, fonts.normal(), 9, 50, y, label + ": " + truncate(value, 76));
        return y - 18;
    }

    private float moneyLine(
        PDPageContentStream content,
        PdfFonts fonts,
        float y,
        String label,
        BigDecimal amount,
        PaymentReceiptLanguage language,
        boolean emphasize
    ) throws IOException {
        text(content, emphasize ? fonts.bold() : fonts.normal(), emphasize ? 11 : 10, 50, y, label + ":");
        text(content, emphasize ? fonts.bold() : fonts.normal(), emphasize ? 12 : 10, 390, y, money(amount, language));
        return y - 24;
    }

    private String formatDateTime(PaymentReceiptResponse receipt, PaymentReceiptLanguage language) {
        if (receipt.receivedAt() == null) {
            return "-";
        }
        String pattern = language == PaymentReceiptLanguage.VI ? "dd/MM/yyyy HH:mm" : "dd MMM yyyy HH:mm";
        return DateTimeFormatter.ofPattern(pattern, language.locale())
            .withZone(businessZone)
            .format(receipt.receivedAt());
    }

    private String money(BigDecimal value, PaymentReceiptLanguage language) {
        if (value == null) {
            return "-";
        }
        NumberFormat numberFormat = NumberFormat.getNumberInstance(language.locale());
        numberFormat.setGroupingUsed(true);
        numberFormat.setMinimumFractionDigits(0);
        numberFormat.setMaximumFractionDigits(2);
        String formatted = numberFormat.format(value.stripTrailingZeros());
        return language == PaymentReceiptLanguage.VI ? formatted + " ₫" : formatted + " VND";
    }

    private PdfFonts loadFonts(PDDocument document) throws IOException {
        File regularFile = findFont(ENV_REGULAR_FONT, regularFontCandidates());
        if (regularFile == null) {
            throw new BusinessException("Unicode font required for payment receipt PDF is not available");
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
        candidates.add("/usr/share/fonts/dejavu/DejaVuSans.ttf");
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
        candidates.add("/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf");
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

    private String safe(String value, String fallback) {
        return hasText(value) ? singleLine(value) : fallback;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String truncate(String value, int maxLength) {
        String safe = singleLine(value);
        return safe.length() <= maxLength ? safe : safe.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String singleLine(String value) {
        return value == null ? "" : value.replace('\r', ' ').replace('\n', ' ').trim();
    }

    private record PdfFonts(PDFont normal, PDFont bold) {
    }
}

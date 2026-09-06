package com.example.dms.help;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class HelpDataResponseFactory {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    public HelpAnswerResponse blocked(HelpPermissionScope scope, String requestedArea, HelpLocale locale) {
        String requestedAreaLabel = HelpDisplayNames.module(requestedArea, locale);
        return response(
            locale == HelpLocale.VI
                ? "Mình không thể tra dữ liệu " + requestedAreaLabel + " vì tài khoản hiện tại chưa có quyền phù hợp."
                : "I cannot look up " + requestedArea + " data because this account does not have the required permission.",
            List.of(
                locale == HelpLocale.VI ? "Chỉ dùng các màn hình đang hiển thị với tài khoản của bạn." : "Use only the screens visible to your account.",
                locale == HelpLocale.VI ? "Nhờ Chủ doanh nghiệp cấp thêm quyền nếu nhiệm vụ này thuộc công việc của bạn." : "Ask Owner to grant access if this task belongs to your job.",
                locale == HelpLocale.VI ? "Không dùng tài khoản người khác để xem dữ liệu bị giới hạn." : "Do not use another account to view restricted data."
            ),
            scope.visibleModules(locale),
            List.of(locale == HelpLocale.VI ? "Câu hỏi dữ liệu thật được chặn ở máy chủ trước khi gọi dịch vụ AI bên ngoài." : "Real data questions are blocked in the backend before any external AI call."),
            locale,
            true
        );
    }

    public HelpAnswerResponse notFound(String answer, List<String> modules, HelpLocale locale) {
        return response(
            answer,
            List.of(
                locale == HelpLocale.VI ? "Kiểm tra lại mã hàng, mã đơn hoặc tên khách hàng." : "Check the product code, order code or customer name again.",
                locale == HelpLocale.VI ? "Dùng ô tìm kiếm trong màn hình tương ứng để đối chiếu." : "Use search in the related screen to verify it.",
                locale == HelpLocale.VI ? "Nếu dữ liệu chưa có, hãy tạo hoặc yêu cầu người có quyền cập nhật." : "If the data is missing, create it or ask an authorized user to update it."
            ),
            modules,
            List.of(locale == HelpLocale.VI ? "Không tìm thấy bản ghi phù hợp trong doanh nghiệp hiện tại." : "No matching record was found in the current tenant."),
            locale
        );
    }

    public HelpAnswerResponse response(
        String answer,
        List<String> steps,
        List<String> modules,
        List<String> guardrails,
        HelpLocale locale
    ) {
        return response(answer, steps, modules, guardrails, locale, false);
    }

    public HelpAnswerResponse response(
        String answer,
        List<String> steps,
        List<String> modules,
        List<String> guardrails,
        HelpLocale locale,
        boolean blocked
    ) {
        return new HelpAnswerResponse(
            answer,
            steps,
            modules,
            guardrails,
            locale == HelpLocale.VI
                ? "Câu trả lời này chỉ dựa trên quyền được cấp cho tài khoản hiện tại."
                : "This answer is limited to the current account permissions.",
            blocked,
            HelpAnswerSource.LIVE_DATA,
            HelpGenerationProvider.NONE
        );
    }

    public String money(BigDecimal value, HelpLocale locale) {
        BigDecimal amount = value == null ? ZERO : value;
        NumberFormat formatter = NumberFormat.getNumberInstance(
            locale == HelpLocale.VI ? Locale.forLanguageTag("vi-VN") : Locale.US
        );
        return formatter.format(amount) + (locale == HelpLocale.VI ? " ₫" : " VND");
    }
}

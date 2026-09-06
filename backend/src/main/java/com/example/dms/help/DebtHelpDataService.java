package com.example.dms.help;

import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.user.PermissionNames;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DebtHelpDataService {

    private static final Pattern CUSTOMER_MARKER = Pattern.compile(
        "(?iu)\\b(?:khách\\s+hàng|khach\\s+hang|customer)\\b"
    );

    private static final Pattern CUSTOMER_DEBT_SUFFIX = Pattern.compile(
        "(?iu)\\b(?:hiện\\s+(?:còn|tại)|hien\\s+(?:con|tai)|đang\\s+nợ|dang\\s+no|"
            + "còn\\s+nợ|con\\s+no|công\\s+nợ|cong\\s+no|nợ\\s+bao\\s+nhiêu|no\\s+bao\\s+nhieu|"
            + "bao\\s+nhiêu|bao\\s+nhieu|debt|receivable|balance|how\\s+much|current|"
            + "still\\s+owes?|owes?)\\b.*$"
    );

    private final CustomerRepository customers;
    private final CustomerDebtRepository customerDebts;
    private final HelpDataQuestionClassifier classifier;
    private final HelpDataResponseFactory responses;

    public HelpAnswerResponse answer(
        String question,
        String normalizedQuestion,
        HelpPermissionScope scope,
        HelpLocale locale
    ) {
        if (!scope.canViewDebtData()) {
            return responses.blocked(scope, "Payments/Debt", locale);
        }

        Long tenantId = TenantContext.tenantRequired();
        String keyword = extractCustomerKeyword(question);
        if (!keyword.isBlank()) {
            List<Customer> matches = customers.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
                tenantId,
                keyword,
                PageRequest.of(0, 2)
            ).getContent();

            if (matches.size() == 1) {
                Customer customer = matches.get(0);
                BigDecimal balance = customerDebts.balance(tenantId, customer.getId());
                List<String> debtSteps = new ArrayList<>();
                debtSteps.add(locale == HelpLocale.VI
                    ? "Mở Khách hàng để xem hồ sơ và sao kê công nợ chi tiết."
                    : "Open Customers to review the profile and receivable statement.");
                if (scope.has(PermissionNames.PAYMENT_CREATE)) {
                    debtSteps.add(locale == HelpLocale.VI
                        ? "Kiểm tra sao kê trước khi ghi nhận thanh toán và chỉ ghi nhận khi tiền thực tế đã nhận."
                        : "Review the statement before recording payment and only post money actually received.");
                } else {
                    debtSteps.add(locale == HelpLocale.VI
                        ? "Nếu cần ghi nhận thanh toán, chuyển cho vai trò có quyền Thanh toán thay vì dùng tài khoản khác."
                        : "If payment must be recorded, hand it to a role with payment permission instead of using another account.");
                }

                return responses.response(
                    locale == HelpLocale.VI
                        ? "Khách hàng " + customer.getName() + " hiện còn công nợ " + responses.money(balance, locale) + "."
                        : customer.getName() + " currently has " + responses.money(balance, locale) + " in receivables.",
                    debtSteps,
                    scope.relatedModules(locale, "Payments", "Customers"),
                    List.of(locale == HelpLocale.VI ? "Công nợ là dữ liệu nhạy cảm và chỉ trả về cho tài khoản có quyền tài chính." : "Receivables are sensitive and only returned to finance-authorized accounts."),
                    locale
                );
            }

            return responses.notFound(
                locale == HelpLocale.VI
                    ? "Mình chưa xác định được duy nhất khách hàng từ câu hỏi. Hãy dùng đúng tên khách hàng như trên màn Khách hàng."
                    : "I could not resolve exactly one customer from the question. Use the customer name shown on the Customers screen.",
                scope.relatedModules(locale, "Customers", "Payments"),
                locale
            );
        }

        if (!classifier.isAggregateDebtQuestion(normalizedQuestion)) {
            return responses.notFound(
                locale == HelpLocale.VI
                    ? "Câu hỏi công nợ chưa đủ rõ. Hãy hỏi “Tổng công nợ hiện tại là bao nhiêu?” hoặc “Khách hàng <tên> còn nợ bao nhiêu?”."
                    : "The receivable question is ambiguous. Ask either “What is the current total receivable?” or “How much does customer <name> owe?”.",
                scope.relatedModules(locale, "Customers", "Payments"),
                locale
            );
        }

        BigDecimal total = customerDebts.totalReceivable(tenantId);
        List<String> totalDebtSteps = new ArrayList<>();
        if (scope.has(PermissionNames.PAYMENT_CREATE) && scope.canUseReports()) {
            totalDebtSteps.add(locale == HelpLocale.VI
                ? "Mở Thanh toán hoặc Báo cáo để đối soát chi tiết."
                : "Open Payments or Reports for detailed reconciliation.");
        } else if (scope.has(PermissionNames.PAYMENT_CREATE)) {
            totalDebtSteps.add(locale == HelpLocale.VI
                ? "Mở Thanh toán để đối soát các khoản phải thu trong phạm vi được cấp."
                : "Open Payments to reconcile receivables within your assigned scope.");
        } else if (scope.canUseReports()) {
            totalDebtSteps.add(locale == HelpLocale.VI
                ? "Mở Báo cáo để đối soát công nợ trong phạm vi được cấp."
                : "Open Reports to reconcile receivables within your assigned scope.");
        } else {
            totalDebtSteps.add(locale == HelpLocale.VI
                ? "Mở Khách hàng và sao kê công nợ để đối soát trong phạm vi được cấp."
                : "Open Customers and receivable statements to reconcile within your assigned scope.");
        }
        totalDebtSteps.add(locale == HelpLocale.VI
            ? "Dùng tên khách hàng cụ thể nếu bạn muốn hỏi công nợ của một khách hàng."
            : "Use a specific customer name if you want one customer's balance.");
        totalDebtSteps.add(locale == HelpLocale.VI
            ? "Không chia sẻ công nợ cho vai trò không liên quan."
            : "Do not share receivables with unrelated roles.");

        return responses.response(
            locale == HelpLocale.VI
                ? "Tổng công nợ phải thu hiện tại là " + responses.money(total, locale) + "."
                : "Current total receivables are " + responses.money(total, locale) + ".",
            totalDebtSteps,
            scope.relatedModules(locale, "Payments", "Customers", "Reports"),
            List.of(locale == HelpLocale.VI ? "Máy chủ tự tra công nợ theo quyền, không gửi số liệu này sang dịch vụ AI bên ngoài." : "The backend looked up receivables by permission without sending these numbers to Gemini."),
            locale
        );
    }

    private String extractCustomerKeyword(String question) {
        if (question == null || question.isBlank()) {
            return "";
        }

        Matcher marker = CUSTOMER_MARKER.matcher(question);
        if (!marker.find()) {
            return "";
        }

        String value = question.substring(marker.end()).trim();
        value = CUSTOMER_DEBT_SUFFIX.matcher(value).replaceFirst("").trim();
        value = value.replaceAll("[?!.:,;]+$", "").trim();
        return value.length() > 80 ? value.substring(0, 80) : value;
    }
}

package com.example.dms.help;

import com.example.dms.user.PermissionNames;
import java.util.ArrayList;
import java.util.List;
import static com.example.dms.help.HelpWorkflowResponses.EN_SCOPE_NOTICE;
import static com.example.dms.help.HelpWorkflowResponses.VI_SCOPE_NOTICE;
import static com.example.dms.help.HelpWorkflowResponses.response;

final class GeneralWorkflowKnowledge {

    public HelpAnswerResponse testingGuideAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (scope.canManageTeam()) {
            if (locale == HelpLocale.VI) {
                return response(
                    "Để kiểm tra toàn bộ hệ thống, hãy đi theo luồng vận hành thật từ dữ liệu gốc đến bán hàng, kho, thanh toán, báo cáo và phân quyền.",
                    List.of(
                        "Dùng tài khoản Chủ doanh nghiệp để kiểm tra Tổng quan, Quản lý truy cập và các chức năng nghiệp vụ được cấp.",
                        "Kiểm tra dữ liệu gốc như sản phẩm, khách hàng, hạn mức, điều khoản công nợ và tồn kho.",
                        "Chạy luồng bán hàng từ đơn Nháp đến kho hoàn tất, rồi kiểm tra tồn kho và khoản phải thu phát sinh.",
                        "Chạy luồng hóa đơn và thanh toán, sau đó đối chiếu số còn phải thu với báo cáo.",
                        "Đăng nhập từng vai trò để kiểm tra menu, nút thao tác, dữ liệu nhạy cảm, thông báo và Trợ lý AI đều tuân theo quyền.",
                        "Kiểm tra Nhật ký hoạt động sau các thao tác quan trọng để chắc hệ thống có thể truy vết."
                    ),
                    scope.visibleModules(locale),
                    List.of(
                        "Dùng dữ liệu demo, không dùng dữ liệu khách hàng thật trong môi trường kiểm thử.",
                        "Một chức năng bị ẩn phải tiếp tục bị chặn ở API; không chỉ dựa vào giao diện.",
                        "Sau khi đổi quyền của vai trò, đăng xuất rồi đăng nhập lại để kiểm tra giao diện với quyền mới."
                    ),
                    locale
                );
            }

            return response(
                "To test the whole system, follow the real operating flow from master data through sales, inventory, payment, reporting and access control.",
                List.of(
                    "Use Owner to review Dashboard, Team Access and the operational modules assigned to that account.",
                    "Verify master data such as products, customers, credit terms and stock.",
                    "Run sales from Draft through warehouse fulfillment, then verify stock and receivable recognition.",
                    "Run invoice and payment flows, then reconcile the remaining receivable with reports.",
                    "Sign in with each role to verify menus, actions, sensitive fields, notifications and AI all follow permissions.",
                    "Review Audit Logs after important actions to confirm traceability."
                ),
                scope.visibleModules(locale),
                List.of(
                    "Use demo data instead of real customer data in test environments.",
                    "A hidden function must also be denied by the backend API; UI hiding alone is not security.",
                    "After changing a role, sign out and sign in again to verify the refreshed UI permissions."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add(locale == HelpLocale.VI
            ? "Kiểm thử đúng các chức năng đang hiển thị với tài khoản hiện tại và thực hiện một thao tác hợp lệ trong từng phần được giao."
            : "Test only the functions visible to the current account and perform one valid action in each assigned area.");
        steps.addAll(assignedWorkSteps(scope, locale));
        if (scope.has(PermissionNames.NOTIFICATION_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra Thông báo chỉ chứa sự kiện thuộc dữ liệu mà vai trò này được phép xem."
                : "Check that Notifications only contain events for data this role is allowed to view.");
        }
        if (scope.has(PermissionNames.AI_HELP_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Hỏi Trợ lý AI một câu trong phạm vi được cấp và một câu ngoài phạm vi để chắc dữ liệu bị giới hạn đúng quyền."
                : "Ask AI one in-scope question and one out-of-scope question to verify permission boundaries.");
        }

        return response(
            locale == HelpLocale.VI
                ? "Tài khoản này nên kiểm thử theo đúng phạm vi quyền được giao; kiểm thử toàn hệ thống phải do Chủ doanh nghiệp thực hiện."
                : "This account should test only its assigned permission scope; full-system UAT should be run by Owner.",
            steps.stream().limit(6).toList(),
            scope.visibleModules(locale),
            List.of(
                locale == HelpLocale.VI
                    ? "Không dùng tài khoản khác để kiểm thử chức năng đang bị giới hạn."
                    : "Do not use another employee account to test restricted functions.",
                locale == HelpLocale.VI
                    ? "Nếu cần mở rộng phạm vi kiểm thử, hãy nhờ Chủ doanh nghiệp cấp quyền phù hợp."
                    : "If the test scope must expand, ask Owner to grant the required permission."
            ),
            locale
        );
    }

    public HelpAnswerResponse onboardingAnswer(HelpPermissionScope scope, HelpLocale locale) {
        List<String> steps = new ArrayList<>();
        steps.add(locale == HelpLocale.VI
            ? "Nhìn thanh điều hướng để biết chính xác những chức năng tài khoản hiện tại được phép dùng."
            : "Check the sidebar to see exactly which functions the current account is allowed to use.");
        steps.addAll(assignedWorkSteps(scope, locale));
        if (!scope.canManageTeam()) {
            steps.add(locale == HelpLocale.VI
                ? "Nếu thiếu chức năng cần cho công việc, hãy nhờ Chủ doanh nghiệp kiểm tra vai trò và quyền; không dùng tài khoản của người khác."
                : "If a required function is missing, ask Owner to review your role and permissions instead of using another account.");
        }

        return response(
            locale == HelpLocale.VI
                ? "Hãy bắt đầu từ các chức năng được cấp cho tài khoản hiện tại và làm đúng phần việc của vai trò này."
                : "Start with the functions assigned to the current account and stay within this role's responsibility.",
            steps.stream().distinct().limit(6).toList(),
            scope.visibleModules(locale),
            List.of(
                locale == HelpLocale.VI
                    ? "Trợ lý chỉ hướng dẫn trong phạm vi quyền hiện tại."
                    : "The assistant only guides within the current permission scope.",
                locale == HelpLocale.VI
                    ? "Không chia sẻ tài khoản giữa nhiều nhân viên vì nhật ký hoạt động sẽ mất ý nghĩa."
                    : "Do not share accounts between employees because audit logs will become unreliable."
            ),
            locale
        );
    }

    public HelpAnswerResponse assignedWorkAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return response(
            locale == HelpLocale.VI
                ? "Nhiệm vụ tiếp theo được xác định từ đúng các quyền đang cấp cho tài khoản của bạn."
                : "Your next tasks are derived from the permissions currently assigned to your account.",
            assignedWorkSteps(scope, locale),
            scope.visibleModules(locale),
            List.of(
                locale == HelpLocale.VI
                    ? "Chỉ thao tác trên dữ liệu thuộc công việc được giao."
                    : "Only work with data related to your assigned responsibility.",
                locale == HelpLocale.VI
                    ? "Nếu cần làm việc ngoài phạm vi đang thấy, hãy yêu cầu Chủ doanh nghiệp cấp quyền thay vì dùng tài khoản khác."
                    : "If work falls outside your visible scope, ask Owner for access instead of using another account."
            ),
            locale
        );
    }

    public HelpAnswerResponse generalAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return onboardingAnswer(scope, locale);
    }

    private List<String> assignedWorkSteps(HelpPermissionScope scope, HelpLocale locale) {
        List<String> steps = new ArrayList<>();

        if (scope.canManageTeam()) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra Quản lý truy cập để chắc mỗi nhân viên có đúng vai trò và quyền cần cho công việc."
                : "Review Team Access to confirm each employee has the role and permissions required for their job.");
        }

        if (scope.has(PermissionNames.SALES_ORDER_CONFIRM)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra các đơn Nháp cần kho xác nhận và hoàn tất sau khi tồn kho, khách hàng và hạn mức đều hợp lệ."
                : "Review Draft orders awaiting warehouse fulfillment after stock, customer and credit checks pass.");
        } else if (scope.has(PermissionNames.SALES_ORDER_CREATE)) {
            steps.add(locale == HelpLocale.VI
                ? "Tạo và kiểm tra đơn bán hàng Nháp đúng khách hàng, sản phẩm, số lượng và kho xuất; không tự hoàn tất nếu không có quyền kho."
                : "Create and review Draft sales orders with the correct customer, products, quantities and warehouse; do not fulfill them without warehouse permission.");
        } else if (scope.has(PermissionNames.SALES_ORDER_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Theo dõi trạng thái các đơn bán hàng được phép xem và chuyển việc xử lý cho vai trò có quyền thao tác tương ứng."
                : "Monitor the sales orders you are allowed to view and hand actions to the role with the matching permission.");
        }

        if (scope.has(PermissionNames.INVOICE_ISSUE) || scope.has(PermissionNames.INVOICE_CANCEL)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra hóa đơn Nháp/Đã phát hành và chỉ phát hành hoặc hủy khi đúng điều kiện nghiệp vụ."
                : "Review Draft/Issued invoices and only issue or cancel them when business rules allow it.");
        } else if (scope.has(PermissionNames.INVOICE_CREATE)) {
            steps.add(locale == HelpLocale.VI
                ? "Tạo hóa đơn từ đơn bán hàng đã Hoàn tất; không tạo thêm công nợ lần thứ hai."
                : "Create invoices from Completed sales orders without creating a second receivable.");
        } else if (scope.has(PermissionNames.INVOICE_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra các hóa đơn được phép xem và chuyển thao tác phát hành/hủy cho vai trò có quyền."
                : "Review visible invoices and hand issue/cancel actions to an authorized role.");
        }

        if (scope.has(PermissionNames.INVENTORY_MANAGE)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra Kho hàng, cảnh báo sắp hết và lịch sử nhập/xuất; chỉ nhập hoặc điều chỉnh khi có phát sinh thật."
                : "Review Inventory, low-stock alerts and movement history; receive or adjust stock only for real movements.");
        } else if (scope.has(PermissionNames.INVENTORY_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Theo dõi tồn kho và cảnh báo sắp hết; báo cho vai trò quản lý kho nếu cần điều chỉnh."
                : "Monitor stock and low-stock alerts, and hand adjustments to a role with inventory management permission.");
        }

        if (scope.has(PermissionNames.PAYMENT_CREATE) && scope.has(PermissionNames.DEBT_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Đối chiếu công nợ rồi ghi nhận đúng khoản tiền thực nhận của khách hàng."
                : "Reconcile receivables and record the exact amount actually received from the customer.");
        } else if (scope.has(PermissionNames.PAYMENT_CREATE)) {
            steps.add(locale == HelpLocale.VI
                ? "Ghi nhận khoản tiền thực nhận trong Thanh toán theo phạm vi dữ liệu được cấp."
                : "Record money actually received in Payments within your assigned data scope.");
        } else if (scope.has(PermissionNames.DEBT_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Theo dõi công nợ và khoản quá hạn; việc ghi nhận tiền phải do vai trò có quyền Thanh toán thực hiện."
                : "Monitor receivables and overdue balances; payment posting must be handled by a role with payment permission.");
        }

        if (scope.has(PermissionNames.PRODUCT_MANAGE)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra và cập nhật danh mục sản phẩm, SKU, giá và mức tồn tối thiểu từ thông tin đã xác minh."
                : "Review and update product catalog data, SKU, prices and minimum stock from verified information.");
        } else if (scope.has(PermissionNames.PRODUCT_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra danh mục sản phẩm được phép xem; báo người có quyền quản lý nếu dữ liệu cần sửa."
                : "Review the product catalog you can access and report corrections to a role with product management permission.");
        }

        if (scope.has(PermissionNames.CUSTOMER_MANAGE)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra và cập nhật hồ sơ khách hàng, hạn mức và điều khoản thanh toán từ thông tin đã xác minh."
                : "Review and update customer profiles, credit limits and payment terms from verified information.");
        } else if (scope.has(PermissionNames.CUSTOMER_DEACTIVATE)) {
            steps.add(locale == HelpLocale.VI
                ? "Theo dõi khách hàng và chỉ thay đổi trạng thái khi thỏa điều kiện công nợ và đơn Nháp."
                : "Monitor customers and change status only when receivable and Draft-order rules allow it.");
        } else if (scope.has(PermissionNames.CUSTOMER_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra hồ sơ khách hàng được phép xem và chuyển yêu cầu chỉnh sửa cho vai trò quản lý khách hàng."
                : "Review customer profiles you can access and hand corrections to a role with customer management permission.");
        }

        if (scope.has(PermissionNames.REPORT_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Dùng Tổng quan/Báo cáo để đối soát các chỉ số trong phạm vi báo cáo được cấp."
                : "Use Dashboard/Reports to reconcile metrics within your assigned reporting scope.");
        }

        if (scope.has(PermissionNames.NOTIFICATION_VIEW)) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra Thông báo và xử lý các cảnh báo thuộc đúng phạm vi nghiệp vụ của tài khoản."
                : "Review Notifications and act only on alerts inside this account's business scope.");
        }

        if (steps.isEmpty()) {
            steps.add(locale == HelpLocale.VI
                ? "Tài khoản hiện chưa có chức năng nghiệp vụ rõ ràng; hãy nhờ Chủ doanh nghiệp kiểm tra lại vai trò."
                : "This account has no clear operational function yet; ask Owner to review the role.");
        }

        return steps.stream().distinct().limit(6).toList();
    }

    public HelpAnswerResponse clarifyingQuestionAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            return response(
                "Mình cần thêm một chút ngữ cảnh để hướng dẫn đúng việc bạn đang làm.",
                List.of(
                    "Bạn đang ở màn hình nào hoặc muốn làm việc với phần nào trong hệ thống?",
                    "Bạn có thể hỏi theo kiểu: Tôi nên làm gì trước, kiểm kho thế nào, tạo đơn bán ra sao, hoặc vì sao không thấy một màn hình.",
                    "Nếu câu hỏi liên quan dữ liệu thật, hãy kèm mã đơn, mã hàng hoặc tên khách hàng khi bạn có quyền xem phần đó."
                ),
                scope.visibleModules(locale),
                List.of(
                    "Mình chỉ dùng các chức năng bạn được cấp quyền để trả lời.",
                    "Không gửi mật khẩu, mã truy cập, khóa API hoặc dữ liệu nhạy cảm vào câu hỏi."
                ),
                locale
            );
        }

        return response(
            "I need a little more context so I can guide the exact task you are working on.",
            List.of(
                "Tell me which screen you are on or which part of the system you want to use.",
                "You can ask things like: what should I do first, how to check stock, how to create a sales order, or why a screen is missing.",
                "For real data questions, include an order code, product code or customer name only when you have permission to view that area."
            ),
            scope.visibleModules(locale),
            List.of(
                "I only use modules assigned to your account when answering.",
                "Do not send passwords, tokens, API keys or sensitive data in the question."
            ),
            locale
        );
    }

    public HelpAnswerResponse missingScreenAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            return response(
                "Nếu một màn hình không xuất hiện ở thanh điều hướng, thường là tài khoản hiện tại chưa được cấp quyền cho chức năng đó.",
                List.of(
                    "Kiểm tra lại bạn đang đăng nhập đúng tài khoản cá nhân hay không.",
                    "Nhìn các mục đang hiển thị ở thanh điều hướng để biết phạm vi công việc hiện tại.",
                    "Nếu màn hình đó cần cho công việc, hãy nhờ Chủ doanh nghiệp vào Quản lý truy cập để kiểm tra vai trò và quyền.",
                    "Sau khi Chủ doanh nghiệp cập nhật quyền, đăng xuất rồi đăng nhập lại để tải lại thanh điều hướng và thông tin quyền mới."
                ),
                scope.visibleModules(locale),
                List.of(
                    "Không dùng tài khoản của người khác để mở màn hình bị ẩn.",
                    "Ẩn mục điều hướng chỉ là lớp trải nghiệm; máy chủ vẫn phải chặn API theo quyền."
                ),
                locale
            );
        }

        return response(
            "If a screen is missing from the sidebar, your current account usually does not have permission for that feature.",
            List.of(
                "Confirm you are signed in with your own staff account.",
                "Review the visible sidebar items to understand your current work scope.",
                "If the missing screen is required for your job, ask Owner to review your role and permissions in Team Access.",
                "After permissions change, sign out and sign in again so the menu and token are refreshed."
            ),
            scope.visibleModules(locale),
            List.of(
                "Do not use another employee's account to open hidden screens.",
                "Menu hiding is only the user experience layer; backend APIs must still enforce permissions."
            ),
            locale
        );
    }

    public HelpAnswerResponse outOfScopeAnswer(HelpPermissionScope scope, String requestedArea, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            return response(
                "Tôi không thể hỗ trợ phần " + requestedArea + " vì nội dung này nằm ngoài vai trò hoặc quyền được cấp của bạn.",
                List.of(
                    "Chỉ sử dụng các chức năng đang hiển thị với tài khoản của bạn.",
                    "Hãy yêu cầu Chủ doanh nghiệp xem lại vai trò nếu nhiệm vụ này thật sự thuộc công việc của bạn.",
                    "Không dùng tài khoản của nhân viên khác để truy cập quy trình bị giới hạn."
                ),
                scope.visibleModules(locale),
                List.of(
                    "Ranh giới này bảo vệ dữ liệu công ty và ngăn vượt quyền.",
                    "Thay đổi quyền phải được Chủ doanh nghiệp thực hiện qua Quản lý truy cập."
                ),
                VI_SCOPE_NOTICE,
                true
            );
        }

        return response(
            "I cannot help with " + requestedArea + " because it is outside your assigned role or permissions.",
            List.of(
                "Use the modules currently visible to your account.",
                "Ask Owner to review your role if this task is part of your job.",
                "Do not use another employee's account to access restricted workflows."
            ),
            scope.visibleModules(locale),
            List.of(
                "This boundary protects company data and prevents privilege bypass.",
                "Access changes must be made through Team Access by an authorized Owner."
            ),
            EN_SCOPE_NOTICE,
            true
        );
    }
}

package com.example.dms.help;

import com.example.dms.user.PermissionNames;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class HelpWorkflowKnowledge {

    private static final String EN_SCOPE_NOTICE =
        "I only answer workflow questions that match your assigned role and permissions.";
    private static final String VI_SCOPE_NOTICE =
        "Tôi chỉ trả lời các câu hỏi quy trình phù hợp với vai trò và quyền được phân công.";

    public HelpAnswerResponse teamAccessAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            return response(
                "Chủ doanh nghiệp có thể tạo tài khoản nhân viên và gán vai trò theo trách nhiệm công việc, để nhân viên chỉ thấy dữ liệu cần cho nhiệm vụ của mình.",
                List.of(
                    "Mở Quản lý truy cập.",
                    "Chọn Tạo nhân viên mới, sau đó nhập tên đăng nhập, họ tên và mật khẩu tạm thời.",
                    "Gán vai trò đúng với công việc như Nhân viên bán hàng, Nhân viên kho hoặc Kế toán.",
                    "Chỉ tạo vai trò tùy chỉnh khi vai trò hệ thống chưa khớp với mô hình vận hành của doanh nghiệp.",
                    "Khi nhân viên nghỉ việc, nên vô hiệu hóa tài khoản thay vì xóa dấu vết kiểm toán."
                ),
                scope.relatedModules(locale, "Team Access", "Roles & Permissions", "Audit Logs"),
                List.of(
                    "Không cấp quyền Chủ doanh nghiệp cho nhân viên vận hành thông thường.",
                    "Kiểm tra kỹ quyền Quản lý truy cập vì quyền này có thể quản trị tài khoản khác.",
                    "Mỗi nhân viên nên dùng một tài khoản riêng."
                ),
                locale
            );
        }

        return response(
            "Owner can create staff accounts and assign roles by job responsibility, so employees only access data required for their work.",
            List.of(
                "Open Team Access.",
                "Choose New Member, then enter username, full name and a temporary password.",
                "Assign the role that matches the employee's job, such as Sales, Warehouse or Accountant.",
                "Create a custom role only when the default system roles do not match the customer's operating model.",
                "Deactivate staff who leave the company instead of deleting their audit trail."
            ),
            scope.relatedModules(locale, "Team Access", "Roles & Permissions", "Audit Logs"),
            List.of(
                "Do not grant OWNER to operating staff.",
                "Review TEAM_MANAGE carefully because it can administer other accounts.",
                "Every staff member should use a separate account."
            ),
            locale
        );
    }

    public HelpAnswerResponse salesAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            if (scope.has(PermissionNames.CUSTOMER_VIEW)) {
                steps.add("Kiểm tra trạng thái khách hàng và điều khoản công nợ trước khi tạo đơn bán.");
            } else {
                steps.add("Kiểm tra các thông tin đơn hàng đang được phép xem; trạng thái khách hàng và hạn mức sẽ được máy chủ kiểm tra khi hoàn tất đơn.");
            }
            if (scope.has(PermissionNames.SALES_ORDER_CREATE)) {
                steps.add(scope.has(PermissionNames.SALES_ORDER_VIEW)
                    ? "Mở Đơn bán hàng và chọn Tạo đơn mới."
                    : "Dùng Tạo nhanh để mở Tạo đơn bán hàng mới.");
                steps.add("Chọn khách hàng, sản phẩm, số lượng và kho xuất, sau đó kiểm tra lại trước khi lưu.");
            } else {
                steps.add("Bạn có thể xem đơn bán được phép, nhưng tạo đơn cần quyền Tạo đơn bán hàng.");
            }
            if (scope.has(PermissionNames.SALES_ORDER_CONFIRM)) {
                steps.add("Chỉ xác nhận và hoàn tất đơn nháp khi khách hàng, tồn kho và giá đã đúng; thao tác này chuyển đơn sang trạng thái Hoàn tất.");
            }
            steps.add("Theo dõi vòng đời hiện tại: Nháp, Hoàn tất hoặc Đã hủy; hệ thống không lưu trạng thái Xác nhận riêng.");

            return response(
                "Quy trình bán hàng giúp đơn hàng chính xác, tồn kho khớp và công nợ rõ ràng.",
                steps,
                scope.relatedModules(locale, "Sales Orders", "Customers", "Inventory", "Payments"),
                List.of(
                    "Không xác nhận đơn khi thiếu hoặc sai dữ liệu khách hàng/sản phẩm.",
                    "Đơn sai nên hủy bằng thao tác được phép thay vì che giấu lỗi."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        if (scope.has(PermissionNames.CUSTOMER_VIEW)) {
            steps.add("Check customer status and credit terms before creating a sales order.");
        } else {
            steps.add("Review the order information available to you; customer status and credit limit are validated by the server during fulfillment.");
        }
        if (scope.has(PermissionNames.SALES_ORDER_CREATE)) {
            steps.add(scope.has(PermissionNames.SALES_ORDER_VIEW)
                ? "Open Sales Orders and choose New Order."
                : "Use Quick Create to open a new sales order.");
            steps.add("Select customer, products, quantities and warehouse, then review totals before saving.");
        } else {
            steps.add("You can review assigned sales orders, but creating orders requires SALES_ORDER_CREATE.");
        }
        if (scope.has(PermissionNames.SALES_ORDER_CONFIRM)) {
            steps.add("Confirm/fulfill a draft only after customer, stock and price are correct; this moves it to Completed.");
        }
        steps.add("Track the current lifecycle: Draft, Completed or Cancelled; Confirmed is not stored as a separate status.");

        return response(
            "Sales workflow keeps orders accurate, stock aligned and receivables clear.",
            steps,
            scope.relatedModules(locale, "Sales Orders", "Customers", "Inventory", "Payments"),
            List.of(
                "Do not confirm an order with missing or incorrect customer/product data.",
                "Cancel incorrect orders through the approved action instead of hiding mistakes."
            ),
            locale
        );
    }

    public HelpAnswerResponse invoiceAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            steps.add("Hóa đơn chỉ được tạo từ đơn bán hàng đã Hoàn tất; hóa đơn không tạo thêm một khoản công nợ mới.");
            if (scope.has(PermissionNames.INVOICE_CREATE)) {
                steps.add("Mở Đơn bán hàng, chọn một đơn Hoàn tất và dùng thao tác Tạo hóa đơn. Tạo lại cùng đơn sẽ mở hóa đơn hiện có thay vì nhân bản.");
            }
            if (scope.has(PermissionNames.INVOICE_ISSUE)) {
                steps.add("Kiểm tra khách hàng, số tiền và hạn thanh toán rồi phát hành hóa đơn nháp.");
            }
            if (scope.has(PermissionNames.PAYMENT_CREATE)) {
                steps.add("Tiền đã thu và còn phải thu trên hóa đơn luôn lấy từ công nợ của đơn bán hàng; ghi nhận tiền tại mục Thanh toán.");
            } else {
                steps.add("Tiền đã thu và còn phải thu lấy từ công nợ của đơn bán hàng; khoản thu do vai trò có quyền Thanh toán ghi nhận.");
            }

            return response(
                "Hóa đơn là chứng từ bán hàng gắn với đơn đã hoàn tất, còn thanh toán và công nợ vẫn dùng quy trình tài chính hiện tại.",
                steps,
                scope.relatedModules(locale, "Invoices", "Sales Orders", "Payments"),
                List.of(
                    "Không dùng hóa đơn để tạo hoặc điều chỉnh công nợ lần thứ hai.",
                    "Không hủy hóa đơn sau khi đơn hàng đã được ghi nhận thanh toán."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("Invoices can only be created from Completed sales orders and do not create a second receivable balance.");
        if (scope.has(PermissionNames.INVOICE_CREATE)) {
            steps.add("Open Sales Orders, choose a Completed order and use Create invoice. Repeating it for the same order returns the existing invoice instead of duplicating it.");
        }
        if (scope.has(PermissionNames.INVOICE_ISSUE)) {
            steps.add("Review customer, amount and due date, then issue the draft invoice.");
        }
        if (scope.has(PermissionNames.PAYMENT_CREATE)) {
            steps.add("Collected and remaining amounts come from the linked sales-order receivable; record money only in Payments.");
        } else {
            steps.add("Collected and remaining amounts come from the linked sales-order receivable; payment posting is handled by a role with payment permission.");
        }

        return response(
            "An invoice is a sales document linked to a completed order, while payments and receivables remain in the canonical finance workflow.",
            steps,
            scope.relatedModules(locale, "Invoices", "Sales Orders", "Payments"),
            List.of(
                "Do not use invoices to create or adjust receivables a second time.",
                "Do not cancel an invoice after payment has been recorded for its order."
            ),
            locale
        );
    }

    public HelpAnswerResponse inventoryAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            steps.add("Mở Kho hàng để xem tồn kho theo SKU và trạng thái sắp hết hàng.");
            if (scope.has(PermissionNames.INVENTORY_MANAGE)) {
                steps.add("Chỉ nhập hoặc điều chỉnh kho khi có phát sinh thật hoặc đã xác minh sai lệch.");
                steps.add("Ghi chú rõ lý do để lần sau có thể kiểm tra lại.");
            } else {
                steps.add("Nếu tồn kho sai, báo cho Nhân viên kho hoặc Chủ doanh nghiệp vì vai trò của bạn không được điều chỉnh kho.");
            }

            return response(
                "Hướng dẫn kho tập trung vào việc giữ số tồn chính xác và có thể truy vết.",
                steps,
                scope.relatedModules(locale, "Inventory", "Products", "Sales Orders"),
                List.of(
                    "Không điều chỉnh kho khi không có lý do nghiệp vụ.",
                    "Kiểm tra SKU và đơn vị trước khi nhập số lượng lớn."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("Open Inventory to review stock by SKU and low-stock status.");
        if (scope.has(PermissionNames.INVENTORY_MANAGE)) {
            steps.add("Use receive or adjust stock only when there is a real stock movement or verified correction.");
            steps.add("Add a clear note so the movement can be reviewed later.");
        } else {
            steps.add("Report incorrect stock to Warehouse or Owner because your role cannot adjust inventory.");
        }

        return response(
            "Inventory guidance focuses on keeping stock numbers accurate and traceable.",
            steps,
            scope.relatedModules(locale, "Inventory", "Products", "Sales Orders"),
            List.of(
                "Do not adjust stock without a business reason.",
                "Check SKU and unit before entering large quantities."
            ),
            locale
        );
    }

    public HelpAnswerResponse financeAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            steps.add("Kiểm tra công nợ khách hàng trước khi ghi nhận thanh toán.");
            if (scope.has(PermissionNames.PAYMENT_CREATE)) {
                steps.add("Mở Thanh toán và ghi đúng số tiền thực nhận cho đúng khách hàng.");
                steps.add("Kiểm tra lại báo cáo công nợ sau khi ghi nhận thanh toán.");
            } else {
                steps.add("Bạn có thể xem thông tin tài chính được cấp, nhưng ghi nhận thanh toán cần quyền Ghi nhận thanh toán.");
            }

            return response(
                "Quy trình tài chính giúp tiền thu và công nợ của doanh nghiệp luôn chính xác.",
                steps,
                scope.relatedModules(locale, "Payments", "Customers", "Reports"),
                List.of(
                    "Không ghi nhận thanh toán trước khi tiền thật sự được nhận.",
                    "Dữ liệu công nợ và doanh thu chỉ nên chia sẻ cho vai trò thật sự cần."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("Review customer debt before recording a payment.");
        if (scope.has(PermissionNames.PAYMENT_CREATE)) {
            steps.add("Open Payments and record the amount actually received for the correct customer.");
            steps.add("Recheck debt reports after posting the payment.");
        } else {
            steps.add("You may view permitted finance information, but recording payments requires PAYMENT_CREATE.");
        }

        return response(
            "Finance workflow keeps payments and receivables accurate for the business.",
            steps,
            scope.relatedModules(locale, "Payments", "Customers", "Reports"),
            List.of(
                "Do not record a payment before money is received.",
                "Debt and revenue data should only be shared with roles that need it."
            ),
            locale
        );
    }

    public HelpAnswerResponse productAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            steps.add("Dùng quy tắc đặt SKU nhất quán để bộ phận bán hàng và kho nhận diện sản phẩm chính xác.");
            if (scope.has(PermissionNames.PRODUCT_MANAGE)) {
                steps.add("Mở Sản phẩm để tạo hoặc cập nhật tên, SKU, giá vốn, giá bán và tồn kho tối thiểu.");
            } else {
                steps.add("Nếu tên, giá hoặc SKU sai, hãy yêu cầu người có quyền Quản lý sản phẩm cập nhật.");
            }

            return response(
                "Danh mục sản phẩm là dữ liệu gốc cho bộ phận bán hàng và kho, nên mọi thay đổi phải được kiểm soát.",
                steps,
                scope.relatedModules(locale, "Products", "Inventory", "Sales Orders"),
                List.of(
                    "Tránh dùng trùng SKU cho nhiều ý nghĩa khác nhau.",
                    "Giá vốn và giá bán có thể nhạy cảm, chỉ nên mở cho vai trò liên quan."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("Use consistent SKU naming so sales and warehouse teams identify products correctly.");
        if (scope.has(PermissionNames.PRODUCT_MANAGE)) {
            steps.add("Open Products to create or update name, SKU, cost, sale price and minimum stock.");
        } else {
            steps.add("If name, price or SKU is wrong, ask someone with PRODUCT_MANAGE to update it.");
        }

        return response(
            "Product catalog is master data for sales and inventory, so changes must be controlled.",
            steps,
            scope.relatedModules(locale, "Products", "Inventory", "Sales Orders"),
            List.of(
                "Avoid duplicate SKU meanings.",
                "Cost and sale price can be sensitive and should only be available to relevant roles."
            ),
            locale
        );
    }

    public HelpAnswerResponse customerAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            steps.add("Tìm khách hàng hiện có trước khi tạo mới để tránh trùng dữ liệu.");
            if (scope.has(PermissionNames.CUSTOMER_MANAGE)) {
                steps.add("Chỉ cập nhật điện thoại, địa chỉ, hạn mức nợ và điều khoản công nợ từ thông tin đã xác minh.");
            } else {
                steps.add("Nếu dữ liệu khách hàng sai, gửi yêu cầu chỉnh sửa cho người có quyền Quản lý khách hàng.");
            }
            if (scope.has(PermissionNames.CUSTOMER_DEACTIVATE)) {
                steps.add("Chỉ ngừng hoạt động khi khách hàng không còn công nợ và không có đơn nháp; có thể kích hoạt lại khi giao dịch trở lại.");
            }

            return response(
                "Dữ liệu khách hàng giúp bộ phận bán hàng và kế toán theo dõi đơn hàng, hạn mức và công nợ chính xác.",
                steps,
                scope.relatedModules(locale, "Customers", "Sales Orders", "Payments"),
                List.of(
                    "Không lưu dữ liệu cá nhân không cần thiết cho vận hành.",
                    "Kiểm tra điều khoản công nợ trước khi bán chịu."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("Search existing customers before creating a new one to avoid duplicates.");
        if (scope.has(PermissionNames.CUSTOMER_MANAGE)) {
            steps.add("Update phone, address, debt limit and credit terms from verified customer information.");
        } else {
            steps.add("If customer data is wrong, send a correction request to a role with CUSTOMER_MANAGE.");
        }
        if (scope.has(PermissionNames.CUSTOMER_DEACTIVATE)) {
            steps.add("Deactivate only when the customer has no outstanding debt and no draft sales orders; reactivate when trading resumes.");
        }

        return response(
            "Customer data helps sales and accounting track orders, limits and receivables correctly.",
            steps,
            scope.relatedModules(locale, "Customers", "Sales Orders", "Payments"),
            List.of(
                "Do not store personal data that is not needed for operations.",
                "Check credit terms before selling on debt."
            ),
            locale
        );
    }

    public HelpAnswerResponse reportAnswer(HelpPermissionScope scope, HelpLocale locale) {
        List<String> steps = new ArrayList<>();
        if (locale == HelpLocale.VI) {
            steps.add("Mở Tổng quan để xem nhanh tình hình kinh doanh.");
            steps.add("Dùng Báo cáo khi cần đối soát chi tiết.");
            steps.add(reportReconciliationStep(scope, locale));

            return response(
                "Tổng quan và Báo cáo dùng để theo dõi doanh thu, công nợ, tồn kho và hiệu quả vận hành.",
                steps,
                scope.relatedModules(locale, "Dashboard", "Reports", "Audit Logs"),
                List.of("Báo cáo chứa dữ liệu kinh doanh nhạy cảm và chỉ nên chia sẻ cho người có quyền."),
                locale
            );
        }

        steps.add("Open Dashboard for a fast business overview.");
        steps.add("Use Reports when detailed reconciliation is needed.");
        steps.add(reportReconciliationStep(scope, locale));

        return response(
            "Dashboard and Reports are for reviewing revenue, debt, stock and operational performance.",
            steps,
            scope.relatedModules(locale, "Dashboard", "Reports", "Audit Logs"),
            List.of("Reports may contain sensitive business data and should only be shared with authorized users."),
            locale
        );
    }

    private String reportReconciliationStep(HelpPermissionScope scope, HelpLocale locale) {
        List<String> sources = new ArrayList<>();
        if (scope.canViewSalesData()) {
            sources.add(HelpDisplayNames.module("Sales Orders", locale));
        }
        if (scope.canViewInventoryData()) {
            sources.add(HelpDisplayNames.module("Inventory", locale));
        }
        if (scope.has(PermissionNames.PAYMENT_CREATE)) {
            sources.add(HelpDisplayNames.module("Payments", locale));
        }

        if (sources.isEmpty()) {
            return locale == HelpLocale.VI
                ? "Nếu số liệu bất thường, chỉ đối chiếu trong phạm vi được cấp hoặc nhờ Chủ doanh nghiệp kiểm tra dữ liệu nguồn."
                : "If numbers look unusual, reconcile only within your assigned scope or ask Owner to check the source records.";
        }

        String joinedSources = String.join(", ", sources);
        return locale == HelpLocale.VI
            ? "Nếu số liệu bất thường, đối chiếu các dữ liệu nguồn bạn được phép xem: " + joinedSources + "."
            : "If numbers look unusual, compare the source data you are allowed to view: " + joinedSources + ".";
    }

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

    private HelpAnswerResponse response(
        String answer,
        List<String> steps,
        List<String> relatedModules,
        List<String> guardrails,
        HelpLocale locale
    ) {
        return response(answer, steps, relatedModules, guardrails, scopeNotice(locale), false);
    }

    private HelpAnswerResponse response(
        String answer,
        List<String> steps,
        List<String> relatedModules,
        List<String> guardrails,
        String scopeNotice,
        boolean blocked
    ) {
        return new HelpAnswerResponse(answer, steps, relatedModules, guardrails, scopeNotice, blocked);
    }

    private String scopeNotice(HelpLocale locale) {
        return locale == HelpLocale.VI ? VI_SCOPE_NOTICE : EN_SCOPE_NOTICE;
    }
}
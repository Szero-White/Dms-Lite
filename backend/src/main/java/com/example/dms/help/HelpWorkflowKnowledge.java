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

    public HelpAnswerResponse teamAccessAnswer(HelpLocale locale) {
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
                HelpDisplayNames.modules(locale, "Team Access", "Roles & Permissions", "Audit Logs"),
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
            HelpDisplayNames.modules(locale, "Team Access", "Roles & Permissions", "Audit Logs"),
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
            steps.add("Kiểm tra trạng thái khách hàng và điều khoản công nợ trước khi tạo đơn bán.");
            if (scope.has(PermissionNames.SALES_ORDER_CREATE)) {
                steps.add("Mở Đơn bán hàng và chọn Tạo đơn mới.");
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
                HelpDisplayNames.modules(locale, "Sales Orders", "Customers", "Inventory", "Payments"),
                List.of(
                    "Không xác nhận đơn khi thiếu hoặc sai dữ liệu khách hàng/sản phẩm.",
                    "Đơn sai nên hủy bằng thao tác được phép thay vì che giấu lỗi."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("Check customer status and credit terms before creating a sales order.");
        if (scope.has(PermissionNames.SALES_ORDER_CREATE)) {
            steps.add("Open Sales Orders and choose New Order.");
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
            HelpDisplayNames.modules(locale, "Sales Orders", "Customers", "Inventory", "Payments"),
            List.of(
                "Do not confirm an order with missing or incorrect customer/product data.",
                "Cancel incorrect orders through the approved action instead of hiding mistakes."
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
                HelpDisplayNames.modules(locale, "Inventory", "Products", "Sales Orders"),
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
            HelpDisplayNames.modules(locale, "Inventory", "Products", "Sales Orders"),
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
                HelpDisplayNames.modules(locale, "Payments", "Customers", "Reports"),
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
            HelpDisplayNames.modules(locale, "Payments", "Customers", "Reports"),
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
                HelpDisplayNames.modules(locale, "Products", "Inventory", "Sales Orders"),
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
            HelpDisplayNames.modules(locale, "Products", "Inventory", "Sales Orders"),
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

            return response(
                "Dữ liệu khách hàng giúp bộ phận bán hàng và kế toán theo dõi đơn hàng, hạn mức và công nợ chính xác.",
                steps,
                HelpDisplayNames.modules(locale, "Customers", "Sales Orders", "Payments"),
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

        return response(
            "Customer data helps sales and accounting track orders, limits and receivables correctly.",
            steps,
            HelpDisplayNames.modules(locale, "Customers", "Sales Orders", "Payments"),
            List.of(
                "Do not store personal data that is not needed for operations.",
                "Check credit terms before selling on debt."
            ),
            locale
        );
    }

    public HelpAnswerResponse reportAnswer(HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            return response(
                "Tổng quan và Báo cáo dùng để theo dõi doanh thu, công nợ, tồn kho và hiệu quả vận hành.",
                List.of(
                    "Mở Tổng quan để xem nhanh tình hình kinh doanh.",
                    "Dùng Báo cáo khi cần đối soát chi tiết.",
                    "Nếu số liệu bất thường, đối chiếu Đơn bán hàng, Kho hàng và Thanh toán."
                ),
                HelpDisplayNames.modules(locale, "Dashboard", "Reports", "Audit Logs"),
                List.of("Báo cáo chứa dữ liệu kinh doanh nhạy cảm và chỉ nên chia sẻ cho người có quyền."),
                locale
            );
        }

        return response(
            "Dashboard and Reports are for reviewing revenue, debt, stock and operational performance.",
            List.of(
                "Open Dashboard for a fast business overview.",
                "Use Reports when detailed reconciliation is needed.",
                "If numbers look unusual, compare Sales Orders, Inventory and Payments."
            ),
            HelpDisplayNames.modules(locale, "Dashboard", "Reports", "Audit Logs"),
            List.of("Reports may contain sensitive business data and should only be shared with authorized users."),
            locale
        );
    }

    public HelpAnswerResponse testingGuideAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            return response(
                "Để kiểm tra toàn bộ hệ thống, bạn nên đi theo luồng vận hành thật từ dữ liệu gốc đến bán hàng, kho, thanh toán, báo cáo và phân quyền.",
                List.of(
                    "Đăng nhập bằng tài khoản Chủ doanh nghiệp để kiểm tra Tổng quan, Quản lý truy cập, Sản phẩm, Khách hàng, Kho hàng, Đơn bán hàng, Thanh toán, Báo cáo, Thông báo và Nhật ký hoạt động.",
                    "Tạo hoặc kiểm tra dữ liệu gốc: sản phẩm, mã hàng, tồn kho tối thiểu, khách hàng, hạn mức và điều khoản công nợ.",
                    "Chạy luồng bán hàng: tạo đơn nháp, xác nhận đơn, kiểm tra trừ kho, hoàn tất đơn hoặc hủy đơn sai.",
                    "Chạy luồng tài chính: ghi nhận thanh toán, kiểm tra công nợ còn lại và đối chiếu báo cáo.",
                    "Đăng nhập từng vai trò như Nhân viên bán hàng, Nhân viên kho và Kế toán để chắc thanh điều hướng, thao tác tạo/sửa/xóa và dữ liệu nhạy cảm bị giới hạn đúng quyền.",
                    "Kiểm tra Trợ lý AI, thông báo và nhật ký hoạt động sau mỗi thao tác quan trọng để chắc hệ thống có thể giám sát được."
                ),
                scope.visibleModules(locale),
                List.of(
                    "Không kiểm tra nhật ký hoạt động bằng tài khoản dùng chung.",
                    "Không dùng dữ liệu khách hàng thật trong môi trường trình diễn hoặc máy cục bộ.",
                    "Nếu một màn hình bị ẩn, hãy kiểm tra vai trò trước khi xem đó là lỗi giao diện."
                ),
                locale
            );
        }

        return response(
            "To test the whole system, follow the real operating flow from master data to sales, inventory, payment, reporting and access control.",
            List.of(
                "Sign in as Owner and check Dashboard, Team Access, Products, Customers, Inventory, Sales Orders, Payments, Reports, Notifications and Audit Logs.",
                "Create or verify master data: products, product codes, minimum stock, customers, credit limits and payment terms.",
                "Run the sales flow: create a draft order, confirm it, verify stock deduction, then complete or cancel incorrect orders.",
                "Run the finance flow: record payment, check remaining receivables and reconcile reports.",
                "Sign in with Sales, Warehouse and Accountant roles to verify sidebar visibility, CRUD actions and sensitive data restrictions.",
                "Check AI, notifications and audit logs after important actions to confirm traceability."
            ),
            scope.visibleModules(locale),
            List.of(
                "Do not test audit-sensitive flows with shared accounts.",
                "Do not use real customer data in local or demo environments.",
                "If a screen is hidden, verify the role before treating it as a UI bug."
            ),
            locale
        );
    }

    public HelpAnswerResponse onboardingAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            return response(
                "Bạn nên bắt đầu bằng những màn hình mà tài khoản hiện tại được cấp quyền, rồi đi theo quy trình vận hành chính của doanh nghiệp.",
                List.of(
                    "Nhìn thanh điều hướng để biết tài khoản của bạn đang được phép dùng những chức năng nào.",
                    "Nếu là Chủ doanh nghiệp, hãy kiểm tra Tổng quan trước, sau đó cấu hình nhân viên, vai trò, sản phẩm, khách hàng và kho.",
                    "Nếu là Nhân viên bán hàng, hãy bắt đầu từ Khách hàng và Đơn bán hàng.",
                    "Nếu là Nhân viên kho, hãy bắt đầu từ Sản phẩm, Kho hàng và lịch sử nhập/xuất kho.",
                    "Nếu là Kế toán, hãy bắt đầu từ Thanh toán, công nợ khách hàng và báo cáo liên quan.",
                    "Nếu thiếu màn hình cần dùng, hãy nhờ Chủ doanh nghiệp kiểm tra lại quyền trong Quản lý truy cập."
                ),
                scope.visibleModules(locale),
                List.of(
                    "Trợ lý chỉ hướng dẫn trong phạm vi quyền hiện tại.",
                    "Không chia sẻ tài khoản giữa nhiều nhân viên vì nhật ký hoạt động sẽ mất ý nghĩa."
                ),
                locale
            );
        }

        return response(
            "Start with the screens available to your current account, then follow the main operating workflow for your role.",
            List.of(
                "Check the sidebar to see which modules your account can use.",
                "If you are Owner, review Dashboard first, then configure staff, roles, products, customers and inventory.",
                "If you are Sales, start with Customers and Sales Orders.",
                "If you are Warehouse, start with Products, Inventory and stock movement history.",
                "If you are Accountant, start with Payments, customer receivables and related reports.",
                "If a required screen is missing, ask Owner to review your permissions in Team Access."
            ),
            scope.visibleModules(locale),
            List.of(
                "The assistant only guides you inside your current permissions.",
                "Do not share accounts between employees because audit logs will become unreliable."
            ),
            locale
        );
    }

    public HelpAnswerResponse assignedWorkAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            return response(
                "Nhiệm vụ nên làm tiếp phụ thuộc vào vai trò và các chức năng đang được cấp quyền cho tài khoản của bạn.",
                assignedWorkSteps(scope, locale),
                scope.visibleModules(locale),
                List.of(
                    "Chỉ thao tác trên dữ liệu thuộc công việc được giao.",
                    "Nếu cần làm việc ngoài phạm vi đang thấy, hãy yêu cầu Chủ doanh nghiệp cấp quyền thay vì dùng tài khoản khác."
                ),
                locale
            );
        }

        return response(
            "What you should do next depends on your role and the modules currently assigned to your account.",
            assignedWorkSteps(scope, locale),
            scope.visibleModules(locale),
            List.of(
                "Only work with data related to your assigned responsibility.",
                "If you need work outside your visible scope, ask Owner for access instead of using another account."
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
                ? "Kiểm tra Tổng quan để nắm tình hình kinh doanh, sau đó xem cảnh báo hoặc báo cáo bất thường."
                : "Review Dashboard for the business overview, then check alerts or unusual reports.");
            steps.add(locale == HelpLocale.VI
                ? "Vào Quản lý truy cập để chắc nhân viên đang có đúng vai trò và quyền cần thiết."
                : "Open Team Access to confirm staff have the right roles and permissions.");
        }
        if (scope.canUseSales()) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra Đơn bán hàng: đơn nháp cần được xác nhận và hoàn tất; đơn đã hoàn tất cần theo dõi công nợ nếu còn phải thu."
                : "Check Sales Orders: confirm/fulfill drafts, then follow receivables for Completed orders when money is still due.");
        }
        if (scope.canUseInventory()) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra Kho hàng: mã sắp hết, tồn sai lệch và lịch sử nhập/xuất gần nhất."
                : "Check Inventory: low-stock items, stock mismatches and recent movements.");
        }
        if (scope.canUseFinance()) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra Thanh toán và công nợ để ghi nhận khoản đã thu và theo dõi khoản còn phải thu."
                : "Check Payments and receivables to record collected amounts and follow outstanding debt.");
        }
        if (scope.canUseProducts()) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra Sản phẩm để đảm bảo tên, mã hàng, giá và mức tồn tối thiểu đang đúng."
                : "Check Products to ensure names, product codes, prices and minimum stock are correct.");
        }
        if (scope.canUseCustomers()) {
            steps.add(locale == HelpLocale.VI
                ? "Kiểm tra Khách hàng để tránh trùng hồ sơ và cập nhật đúng hạn mức hoặc điều khoản công nợ."
                : "Check Customers to avoid duplicates and keep credit limits/payment terms correct.");
        }
        if (steps.isEmpty()) {
            steps.add(locale == HelpLocale.VI
                ? "Tài khoản hiện chưa có chức năng nghiệp vụ rõ ràng; hãy nhờ Chủ doanh nghiệp kiểm tra lại vai trò."
                : "This account has no clear operational module yet; ask Owner to review the role.");
        }
        return steps.stream().limit(6).toList();
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
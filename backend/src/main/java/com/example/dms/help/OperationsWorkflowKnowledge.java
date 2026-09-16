package com.example.dms.help;

import com.example.dms.user.PermissionNames;
import java.util.ArrayList;
import java.util.List;
import static com.example.dms.help.HelpWorkflowResponses.response;

final class OperationsWorkflowKnowledge {

    public HelpAnswerResponse inventoryAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            steps.add("Mở Kho hàng để xem tồn kho theo mã sản phẩm và trạng thái sắp hết hàng.");
            if (scope.has(PermissionNames.INVENTORY_MANAGE)) {
                steps.add("Chỉ dùng Nhập kho khi có hàng thực tế được nhận.");
                steps.add("Ghi chú rõ chứng từ hoặc lý do để lần sau có thể kiểm tra lại.");
            } else {
                steps.add("Nếu tồn kho có dấu hiệu sai, báo cho Kế toán hoặc Chủ doanh nghiệp để kiểm tra lịch sử giao dịch.");
            }

            return response(
                "Hướng dẫn kho tập trung vào việc giữ số tồn chính xác và có thể truy vết.",
                steps,
                scope.relatedModules(locale, "Inventory", "Products", "Sales Orders"),
                List.of(
                    "Không dùng Nhập kho để bù một sai lệch tồn chưa được xác minh.",
                    "Kiểm tra mã sản phẩm và đơn vị trước khi nhập số lượng lớn."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("Open Inventory to review stock by product code and low-stock status.");
        if (scope.has(PermissionNames.INVENTORY_MANAGE)) {
            steps.add("Use Receive Stock only when inventory is physically received.");
            steps.add("Add a clear document reference or note so the inbound movement can be reviewed later.");
        } else {
            steps.add("If stock appears incorrect, ask Accounting or Owner to review the movement history.");
        }

        return response(
            "Inventory guidance focuses on keeping stock numbers accurate and traceable.",
            steps,
            scope.relatedModules(locale, "Inventory", "Products", "Sales Orders"),
            List.of(
                "Do not use Receive Stock to mask an unverified stock discrepancy.",
                "Check the product code and unit before entering large quantities."
            ),
            locale
        );
    }

    public HelpAnswerResponse productAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            steps.add("Mã sản phẩm được hệ thống cấp tự động theo chuẩn PRD-000001 để bán hàng và quản lý tồn kho nhận diện nhất quán.");
            if (scope.has(PermissionNames.PRODUCT_MANAGE)) {
                steps.add("Mở Sản phẩm để tạo hoặc cập nhật tên, giá vốn, giá bán và tồn kho tối thiểu; mã sản phẩm do hệ thống tự cấp.");
                steps.add("Ngừng hoạt động sản phẩm không còn bán thay vì xóa lịch sử; kích hoạt lại khi doanh nghiệp bán trở lại.");
            } else {
                steps.add("Nếu tên hoặc giá sai, hãy yêu cầu người có quyền Quản lý sản phẩm cập nhật. Mã sản phẩm là mã hệ thống và không chỉnh thủ công.");
            }

            return response(
                "Danh mục sản phẩm là dữ liệu gốc cho bán hàng và quản lý tồn kho, nên mọi thay đổi phải được kiểm soát.",
                steps,
                scope.relatedModules(locale, "Products", "Inventory", "Sales Orders"),
                List.of(
                    "Không chỉnh sửa hoặc tái sử dụng mã sản phẩm hệ thống.",
                    "Giá vốn và giá bán có thể nhạy cảm, chỉ nên mở cho vai trò liên quan."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("Product codes are assigned automatically in PRD-000001 format so sales and inventory workflows use a consistent identifier.");
        if (scope.has(PermissionNames.PRODUCT_MANAGE)) {
            steps.add("Open Products to create or update name, cost, sale price and minimum stock; the product code is assigned automatically.");
            steps.add("Deactivate products that are no longer sold instead of deleting history; reactivate them when trading resumes.");
        } else {
            steps.add("If the name or price is wrong, ask someone with PRODUCT_MANAGE to update it. Product codes are system-managed and not manually editable.");
        }

        return response(
            "Product catalog is master data for sales and inventory, so changes must be controlled.",
            steps,
            scope.relatedModules(locale, "Products", "Inventory", "Sales Orders"),
            List.of(
                "Do not manually edit or reuse system product codes.",
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
}

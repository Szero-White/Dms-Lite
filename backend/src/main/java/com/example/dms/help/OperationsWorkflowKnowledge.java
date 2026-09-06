package com.example.dms.help;

import com.example.dms.user.PermissionNames;
import java.util.ArrayList;
import java.util.List;
import static com.example.dms.help.HelpWorkflowResponses.response;

final class OperationsWorkflowKnowledge {

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
}

package com.example.dms.help;

import com.example.dms.common.TenantContext;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.product.ProductRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CatalogHelpDataService {

    private final ProductRepository products;
    private final CustomerRepository customers;
    private final HelpDataResponseFactory responses;

    public HelpAnswerResponse productSummary(HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canViewProductData()) {
            return responses.blocked(scope, "Products", locale);
        }

        long count = products.countByTenantIdAndDeletedAtIsNull(TenantContext.tenantRequired());
        return responses.response(
            locale == HelpLocale.VI ? "Hiện có " + count + " mã hàng đang được quản lý." : "There are " + count + " active product codes being managed.",
            List.of(
                locale == HelpLocale.VI ? "Mở Sản phẩm để tìm theo mã hàng, tên hoặc mã vạch." : "Open Products to search by product code, name or barcode.",
                locale == HelpLocale.VI ? "Dữ liệu giá vốn/giá bán nên chỉ mở cho vai trò liên quan." : "Cost and selling price should stay limited to relevant roles.",
                scope.canViewInventoryData()
                    ? (locale == HelpLocale.VI ? "Dùng Kho hàng nếu bạn cần xem số tồn." : "Use Inventory if you need stock quantities.")
                    : (locale == HelpLocale.VI ? "Nếu cần số tồn, nhờ vai trò có quyền Kho hàng kiểm tra." : "If stock quantities are needed, ask a role with inventory access to check them.")
            ),
            scope.relatedModules(locale, "Products"),
            List.of(locale == HelpLocale.VI ? "Máy chủ tự tra số lượng sản phẩm, không gửi dữ liệu cơ sở dữ liệu sang dịch vụ AI bên ngoài." : "The backend counted products without sending DB data to Gemini."),
            locale
        );
    }

    public HelpAnswerResponse customerSummary(HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canViewCustomerData()) {
            return responses.blocked(scope, "Customers", locale);
        }

        long count = customers.countByTenantIdAndDeletedAtIsNull(TenantContext.tenantRequired());
        return responses.response(
            locale == HelpLocale.VI ? "Hiện có " + count + " khách hàng đang được quản lý." : "There are " + count + " active customers being managed.",
            List.of(
                locale == HelpLocale.VI ? "Mở Khách hàng để tìm theo tên, số điện thoại hoặc địa chỉ." : "Open Customers to search by name, phone or address.",
                locale == HelpLocale.VI ? "Kiểm tra hạn mức và điều khoản công nợ trước khi bán chịu." : "Check credit limits and terms before selling on debt.",
                locale == HelpLocale.VI ? "Không lưu dữ liệu cá nhân không cần thiết cho vận hành." : "Do not store personal data that is not needed for operations."
            ),
            scope.relatedModules(locale, "Customers"),
            List.of(locale == HelpLocale.VI ? "Máy chủ tự tra số lượng khách hàng theo quyền." : "The backend counted customers by permission."),
            locale
        );
    }
}

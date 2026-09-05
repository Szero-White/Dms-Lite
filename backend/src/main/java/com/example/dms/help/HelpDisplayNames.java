package com.example.dms.help;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

final class HelpDisplayNames {

    private static final Map<String, String> VI_MODULES = Map.ofEntries(
        Map.entry("Dashboard/Reports", "Tổng quan/Báo cáo"),
        Map.entry("Dashboard", "Tổng quan"),
        Map.entry("Reports", "Báo cáo"),
        Map.entry("Sales Orders", "Đơn bán hàng"),
        Map.entry("Sales order finance", "Tài chính đơn bán hàng"),
        Map.entry("Products", "Sản phẩm"),
        Map.entry("Customers", "Khách hàng"),
        Map.entry("Inventory", "Kho hàng"),
        Map.entry("Payments", "Thanh toán"),
        Map.entry("Payments/Debt", "Thanh toán/Công nợ"),
        Map.entry("Team Access", "Quản lý truy cập"),
        Map.entry("Roles & Permissions", "Vai trò & Quyền"),
        Map.entry("Audit Logs", "Nhật ký hoạt động"),
        Map.entry("Notifications", "Thông báo")
    );

    private HelpDisplayNames() {
    }

    static String module(String canonicalName, HelpLocale locale) {
        if (locale != HelpLocale.VI || canonicalName == null) {
            return canonicalName;
        }
        return VI_MODULES.getOrDefault(canonicalName, canonicalName);
    }

    static List<String> modules(HelpLocale locale, String... canonicalNames) {
        return modules(locale, Arrays.asList(canonicalNames));
    }

    static List<String> modules(HelpLocale locale, List<String> canonicalNames) {
        if (canonicalNames == null || canonicalNames.isEmpty()) {
            return List.of();
        }
        return canonicalNames.stream().map(name -> module(name, locale)).toList();
    }

    static String salesOrderStatus(String status, HelpLocale locale) {
        if (status == null) {
            return locale == HelpLocale.VI ? "Không xác định" : "Unknown";
        }
        if (locale == HelpLocale.VI) {
            return switch (status) {
                case "DRAFT" -> "Nháp";
                case "COMPLETED" -> "Hoàn tất";
                case "CANCELLED" -> "Đã hủy";
                default -> "Không xác định";
            };
        }
        return switch (status) {
            case "DRAFT" -> "Draft";
            case "COMPLETED" -> "Completed";
            case "CANCELLED" -> "Cancelled";
            default -> "Unknown";
        };
    }
}

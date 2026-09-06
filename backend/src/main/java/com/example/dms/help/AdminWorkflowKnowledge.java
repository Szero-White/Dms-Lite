package com.example.dms.help;

import java.util.List;
import static com.example.dms.help.HelpWorkflowResponses.response;

final class AdminWorkflowKnowledge {

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
}

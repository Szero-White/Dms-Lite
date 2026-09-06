package com.example.dms.invoice;

record InvoicePdfText(
    String title,
    String seller,
    String customer,
    String address,
    String invoice,
    String order,
    String issueDate,
    String dueDate,
    String product,
    String quantity,
    String unitPrice,
    String discount,
    String total,
    String subtotal,
    String paid,
    String remaining,
    String page,
    String paymentSnapshot
) {
    static InvoicePdfText forLanguage(InvoicePdfLanguage language) {
        if (language == InvoicePdfLanguage.VI) {
            return new InvoicePdfText(
                "HÓA ĐƠN BÁN HÀNG",
                "Đơn vị bán",
                "Khách hàng",
                "Địa chỉ",
                "Mã hóa đơn",
                "Đơn bán hàng",
                "Ngày phát hành",
                "Hạn thanh toán",
                "Sản phẩm",
                "SL",
                "Đơn giá",
                "Chiết khấu",
                "Thành tiền",
                "Tạm tính",
                "Đã thu",
                "Còn phải thu",
                "Trang",
                "Số tiền đã thu và còn phải thu phản ánh công nợ tại thời điểm tải PDF."
            );
        }

        return new InvoicePdfText(
            "SALES INVOICE",
            "Seller",
            "Customer",
            "Address",
            "Invoice no.",
            "Sales order",
            "Issue date",
            "Due date",
            "Product",
            "Qty",
            "Unit price",
            "Discount",
            "Amount",
            "Subtotal",
            "Paid",
            "Remaining",
            "Page",
            "Paid and remaining amounts reflect the receivable balance when this PDF was downloaded."
        );
    }
}

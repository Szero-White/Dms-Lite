package com.example.dms.payment;

public record PaymentReceiptText(
    String title,
    String paymentCode,
    String salesOrder,
    String orderTotal,
    String customer,
    String phone,
    String address,
    String receivedAt,
    String recordedBy,
    String debtBefore,
    String amountReceived,
    String debtAfter,
    String note,
    String partialNotice,
    String fullNotice,
    String legacyNotice
) {

    public static PaymentReceiptText forLanguage(PaymentReceiptLanguage language) {
        if (language == PaymentReceiptLanguage.VI) {
            return new PaymentReceiptText(
                "BIÊN NHẬN THANH TOÁN",
                "Mã thanh toán",
                "Đơn bán hàng",
                "Giá trị đơn",
                "Khách hàng",
                "Điện thoại",
                "Địa chỉ",
                "Thời gian ghi nhận",
                "Người ghi nhận",
                "Còn phải thu trước lần thanh toán",
                "Số tiền đã nhận",
                "Còn phải thu sau lần thanh toán",
                "Ghi chú",
                "Biên nhận này xác nhận số tiền đã nhận; đơn bán hàng vẫn còn phải thu.",
                "Biên nhận này xác nhận đơn bán hàng đã được tất toán.",
                "Khoản thanh toán cũ được tạo trước cơ chế gắn từng lần thu với một đơn bán hàng."
            );
        }

        return new PaymentReceiptText(
            "PAYMENT RECEIPT",
            "Payment code",
            "Sales order",
            "Order total",
            "Customer",
            "Phone",
            "Address",
            "Recorded at",
            "Recorded by",
            "Outstanding before this payment",
            "Amount received",
            "Outstanding after this payment",
            "Note",
            "This receipt confirms the amount received; the sales order still has an outstanding balance.",
            "This receipt confirms the sales order has been fully settled.",
            "This legacy payment predates order-specific payment tracking."
        );
    }
}

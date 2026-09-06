package com.example.dms.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class InvoiceAccessPolicyTest {

    @Test
    void invoiceViewAloneDoesNotExposeReceivableState() {
        assertThat(InvoiceAccessPolicy.canViewReceivableState(List.of("INVOICE_VIEW"))).isFalse();
    }

    @Test
    void existingFinancialPermissionsCanExposeReceivableState() {
        assertThat(InvoiceAccessPolicy.canViewReceivableState(List.of("DEBT_VIEW"))).isTrue();
        assertThat(InvoiceAccessPolicy.canViewReceivableState(List.of("PAYMENT_CREATE"))).isTrue();
        assertThat(InvoiceAccessPolicy.canViewReceivableState(List.of("REPORT_VIEW"))).isTrue();
        assertThat(InvoiceAccessPolicy.canViewReceivableState(List.of("SALES_ORDER_CREATE"))).isTrue();
    }
}

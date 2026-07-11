package com.example.dms.sales;

import com.example.dms.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    @PreAuthorize("hasAuthority('SALES_ORDER_CREATE')")
    public ApiResponse<Page<SalesOrderResponse>> list(
        @RequestParam(defaultValue = "0") int page
    ) {
        return ApiResponse.ok(salesOrderService.listOrders(page));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SALES_ORDER_CREATE')")
    public ApiResponse<SalesOrderDetailResponse> create(
        @Valid @RequestBody CreateSalesOrderRequest request
    ) {
        return ApiResponse.ok(salesOrderService.createOrder(request));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAuthority('SALES_ORDER_CONFIRM')")
    public ApiResponse<SalesOrderDetailResponse> confirm(@PathVariable Long id) {
        return ApiResponse.ok(salesOrderService.confirmOrder(id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('SALES_ORDER_CONFIRM')")
    public ApiResponse<SalesOrderDetailResponse> cancel(@PathVariable Long id) {
        return ApiResponse.ok(salesOrderService.cancelOrder(id));
    }
}

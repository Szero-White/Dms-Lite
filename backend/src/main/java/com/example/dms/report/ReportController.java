package com.example.dms.report;

import com.example.dms.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import java.time.Instant;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;


    @GetMapping("/sales")
    @PreAuthorize("hasAuthority('REPORT_VIEW') and hasAuthority('SALES_ORDER_VIEW')")
    public ApiResponse<SalesReport> sales(
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        Instant from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        Instant to
    ) {
        return ApiResponse.ok(reportService.sales(from, to));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ApiResponse<DashboardReport> dashboard() {
        return ApiResponse.ok(reportService.dashboard());
    }
}

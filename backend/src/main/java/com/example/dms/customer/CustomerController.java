package com.example.dms.customer;

import com.example.dms.common.ApiResponse;
import com.example.dms.debt.CustomerDebtTransaction;
import jakarta.validation.Valid;
import java.util.List;
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
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasAuthority('CUSTOMER_VIEW')")
    public ApiResponse<Page<CustomerResponse>> list(
        @RequestParam(defaultValue = "") String keyword,
        @RequestParam(defaultValue = "0") int page
    ) {
        return ApiResponse.ok(customerService.list(keyword, page));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public ApiResponse<Customer> create(@Valid @RequestBody CustomerRequest request) {
        return ApiResponse.ok(customerService.create(request));
    }

    @GetMapping("/{id}/debt-statement")
    @PreAuthorize("hasAuthority('DEBT_VIEW')")
    public ApiResponse<List<CustomerDebtTransaction>> statement(@PathVariable Long id) {
        return ApiResponse.ok(customerService.statement(id));
    }
}

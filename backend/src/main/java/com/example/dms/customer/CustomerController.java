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
import org.springframework.web.bind.annotation.PutMapping;
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

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CUSTOMER_VIEW')")
    public ApiResponse<CustomerResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(customerService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public ApiResponse<CustomerResponse> create(@Valid @RequestBody CustomerRequest request) {
        return ApiResponse.ok(customerService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')")
    public ApiResponse<CustomerResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody CustomerRequest request
    ) {
        return ApiResponse.ok(customerService.update(id, request));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('CUSTOMER_DEACTIVATE')")
    public ApiResponse<CustomerResponse> deactivate(@PathVariable Long id) {
        return ApiResponse.ok(customerService.deactivate(id));
    }

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasAuthority('CUSTOMER_DEACTIVATE')")
    public ApiResponse<CustomerResponse> reactivate(@PathVariable Long id) {
        return ApiResponse.ok(customerService.reactivate(id));
    }

    @GetMapping("/{id}/debt-statement")
    @PreAuthorize("hasAuthority('DEBT_VIEW')")
    public ApiResponse<List<CustomerDebtTransaction>> statement(@PathVariable Long id) {
        return ApiResponse.ok(customerService.statement(id));
    }
}

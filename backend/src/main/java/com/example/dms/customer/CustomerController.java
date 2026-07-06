package com.example.dms.customer;
import com.example.dms.common.*;import com.example.dms.debt.*;import jakarta.validation.constraints.*;import lombok.*;import org.springframework.data.domain.*;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.web.bind.annotation.*;import java.math.*;import java.time.*;
@RestController @RequestMapping("/api/customers") @RequiredArgsConstructor
public class CustomerController {
 private final CustomerRepository repo; private final CustomerDebtRepository debts; private final com.example.dms.audit.AuditService audit;
 public record CustomerRequest(@NotBlank String name,String phone,String address,BigDecimal creditLimit,Integer paymentTermDays){}
 public record CustomerResponse(Long id,String name,String phone,String address,BigDecimal creditLimit,Integer paymentTermDays,BigDecimal debtBalance,boolean active){}
 @GetMapping @PreAuthorize("hasAuthority('CUSTOMER_VIEW')") ApiResponse<?> list(@RequestParam(defaultValue="")String keyword,@RequestParam(defaultValue="0")int page){Long t=TenantContext.tenantRequired();return ApiResponse.ok(repo.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(t,keyword,PageRequest.of(page,20)).map(c->new CustomerResponse(c.getId(),c.getName(),c.getPhone(),c.getAddress(),c.getCreditLimit(),c.getPaymentTermDays(),debts.balance(t,c.getId()),c.isActive())));}
 @PostMapping @PreAuthorize("hasAuthority('CUSTOMER_MANAGE')") ApiResponse<?> create(@RequestBody CustomerRequest r){Customer c=repo.save(Customer.builder().tenantId(TenantContext.tenantRequired()).name(r.name()).phone(r.phone()).address(r.address()).creditLimit(r.creditLimit()==null?BigDecimal.ZERO:r.creditLimit()).paymentTermDays(r.paymentTermDays()==null?14:r.paymentTermDays()).active(true).build());audit.log("CUSTOMER_CREATED","Customer",c.getId(),c.getName());return ApiResponse.ok(c);}
 @GetMapping("/{id}/debt-statement") @PreAuthorize("hasAuthority('DEBT_VIEW')") ApiResponse<?> statement(@PathVariable Long id){return ApiResponse.ok(debts.findByTenantIdAndCustomerIdOrderByCreatedAtDesc(TenantContext.tenantRequired(),id));}
 Customer find(Long id){return repo.findByIdAndTenantIdAndDeletedAtIsNull(id,TenantContext.tenantRequired()).orElseThrow(()->new BusinessException("Customer not found"));}
}

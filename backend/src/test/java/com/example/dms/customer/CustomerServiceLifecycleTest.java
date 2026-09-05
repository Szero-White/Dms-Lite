package com.example.dms.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.sales.SalesOrderRepository;
import com.example.dms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerServiceLifecycleTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private CustomerDebtRepository customerDebtRepository;
    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private AuditService auditService;

    private CustomerService service;

    @BeforeEach
    void setUp() {
        service = new CustomerService(
            customerRepository,
            customerDebtRepository,
            salesOrderRepository,
            auditService
        );
        TenantContext.set(1L, 10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void blocksDeactivationWhenOutstandingDebtExists() {
        Customer customer = activeCustomer();
        when(customerRepository.lockByIdAndTenantIdAndDeletedAtIsNull(7L, 1L))
            .thenReturn(Optional.of(customer));
        when(customerDebtRepository.balance(1L, 7L)).thenReturn(new BigDecimal("1.00"));

        assertThatThrownBy(() -> service.deactivate(7L))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Cannot deactivate customer with outstanding debt");

        assertThat(customer.isActive()).isTrue();
        verify(salesOrderRepository, never())
            .existsByTenantIdAndCustomerIdAndStatus(1L, 7L, SalesOrderStatus.DRAFT);
    }

    @Test
    void blocksDeactivationWhenDraftSalesOrderExists() {
        Customer customer = activeCustomer();
        when(customerRepository.lockByIdAndTenantIdAndDeletedAtIsNull(7L, 1L))
            .thenReturn(Optional.of(customer));
        when(customerDebtRepository.balance(1L, 7L)).thenReturn(BigDecimal.ZERO);
        when(salesOrderRepository.existsByTenantIdAndCustomerIdAndStatus(
            1L, 7L, SalesOrderStatus.DRAFT
        )).thenReturn(true);

        assertThatThrownBy(() -> service.deactivate(7L))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Cannot deactivate customer with draft sales orders");

        assertThat(customer.isActive()).isTrue();
    }

    @Test
    void deactivatesAndReactivatesCustomerWithoutDeletingMasterData() {
        Customer customer = activeCustomer();
        when(customerRepository.lockByIdAndTenantIdAndDeletedAtIsNull(7L, 1L))
            .thenReturn(Optional.of(customer));
        when(customerDebtRepository.balance(1L, 7L)).thenReturn(BigDecimal.ZERO);
        when(salesOrderRepository.existsByTenantIdAndCustomerIdAndStatus(
            1L, 7L, SalesOrderStatus.DRAFT
        )).thenReturn(false);

        service.deactivate(7L);

        assertThat(customer.isActive()).isFalse();
        assertThat(customer.getDeletedAt()).isNull();
        verify(auditService).log("CUSTOMER_DEACTIVATED", "Customer", 7L, "Minh Phat");

        service.reactivate(7L);

        assertThat(customer.isActive()).isTrue();
        verify(auditService).log("CUSTOMER_REACTIVATED", "Customer", 7L, "Minh Phat");
    }

    private Customer activeCustomer() {
        return Customer.builder()
            .id(7L)
            .tenantId(1L)
            .name("Minh Phat")
            .creditLimit(new BigDecimal("10000000"))
            .paymentTermDays(14)
            .active(true)
            .build();
    }
}

package com.example.dms.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.audit.AuditService;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.sales.SalesOrderRepository;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class CustomerServiceSortTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerDebtRepository customerDebtRepository;
    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private AuditService auditService;

    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        customerService = new CustomerService(
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
    void listsNewestCustomersFirstByDefault() {
        when(customerRepository.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            eq(1L),
            eq(""),
            any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.<Customer>of()));

        customerService.list("", 0, 20);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(customerRepository).findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            eq(1L),
            eq(""),
            pageableCaptor.capture()
        );

        Sort.Order idOrder = pageableCaptor.getValue().getSort().getOrderFor("id");
        assertThat(idOrder).isNotNull();
        assertThat(idOrder.getDirection()).isEqualTo(Sort.Direction.DESC);
    }
}

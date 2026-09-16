package com.example.dms.common.code;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class BusinessCodeSequenceRepository {

    private final JdbcTemplate jdbcTemplate;

    public long nextValue(Long tenantId, BusinessCodeType type) {
        Long value = jdbcTemplate.queryForObject(
            """
            insert into business_code_sequences(tenant_id, code_type, last_value)
            values (?, ?, 1)
            on conflict (tenant_id, code_type)
            do update set last_value = business_code_sequences.last_value + 1
            returning last_value
            """,
            Long.class,
            tenantId,
            type.name()
        );

        if (value == null) {
            throw new IllegalStateException("Business code sequence did not return a value");
        }
        return value;
    }
}

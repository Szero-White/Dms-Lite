package com.example.dms.document;

import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class DocumentNumberSequenceRepository {

    private final JdbcTemplate jdbcTemplate;

    public int nextValue(Long tenantId, DocumentNumberType type, LocalDate businessDate) {
        Integer value = jdbcTemplate.queryForObject(
            """
            insert into document_number_sequences(tenant_id, document_type, business_date, last_value)
            values (?, ?, ?, 1)
            on conflict (tenant_id, document_type, business_date)
            do update set last_value = document_number_sequences.last_value + 1
            returning last_value
            """,
            Integer.class,
            tenantId,
            type.name(),
            businessDate
        );

        if (value == null) {
            throw new IllegalStateException("Document number sequence did not return a value");
        }
        return value;
    }
}

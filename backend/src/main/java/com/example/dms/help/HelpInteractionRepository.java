package com.example.dms.help;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HelpInteractionRepository extends JpaRepository<HelpInteraction, Long> {

    @Query("""
        select h from HelpInteraction h
        where h.tenantId = :tenantId
          and (:actorId is null or h.actorId = :actorId)
          and (:blocked is null or h.blocked = :blocked)
          and (
            :keyword = ''
            or lower(h.actorUsername) like lower(concat('%', :keyword, '%'))
            or lower(coalesce(h.actorFullName, '')) like lower(concat('%', :keyword, '%'))
            or lower(coalesce(h.actorRoles, '')) like lower(concat('%', :keyword, '%'))
            or lower(h.question) like lower(concat('%', :keyword, '%'))
            or lower(h.answer) like lower(concat('%', :keyword, '%'))
            or lower(coalesce(h.scopeNotice, '')) like lower(concat('%', :keyword, '%'))
          )
        order by h.createdAt desc
        """)
    Page<HelpInteraction> searchHistory(
        @Param("tenantId") Long tenantId,
        @Param("actorId") Long actorId,
        @Param("keyword") String keyword,
        @Param("blocked") Boolean blocked,
        Pageable pageable
    );

    Optional<HelpInteraction> findByIdAndTenantId(Long id, Long tenantId);
}

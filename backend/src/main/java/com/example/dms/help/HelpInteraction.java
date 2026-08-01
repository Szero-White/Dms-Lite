package com.example.dms.help;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "help_interactions")
public class HelpInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tenantId;

    private Long actorId;

    private String actorUsername;

    private String actorFullName;

    @Column(length = 500)
    private String actorRoles;

    @Column(columnDefinition = "text")
    private String question;

    @Column(columnDefinition = "text")
    private String answer;

    @Column(columnDefinition = "text")
    private String steps;

    @Column(columnDefinition = "text")
    private String relatedModules;

    @Column(columnDefinition = "text")
    private String guardrails;

    @Column(length = 500)
    private String scopeNotice;

    private boolean blocked;

    private Instant createdAt;

    @PrePersist
    void onPrePersist() {
        createdAt = Instant.now();
    }
}
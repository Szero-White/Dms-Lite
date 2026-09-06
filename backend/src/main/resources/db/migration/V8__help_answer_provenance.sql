-- Persist backend-owned answer provenance for supportability and transparent AI usage.
-- Historical interactions predate provenance tracking, so they are marked unknown instead
-- of guessing whether Gemini or the deterministic backend produced their wording.

alter table help_interactions add column answer_source varchar(40);
alter table help_interactions add column generation_provider varchar(40);

update help_interactions
set answer_source = 'LEGACY_UNKNOWN',
    generation_provider = 'LEGACY_UNKNOWN';

alter table help_interactions alter column answer_source set not null;
alter table help_interactions alter column generation_provider set not null;

alter table help_interactions
    add constraint chk_help_interactions_answer_source
    check (answer_source in ('LIVE_DATA', 'WORKFLOW_KNOWLEDGE', 'SYSTEM_FALLBACK', 'LEGACY_UNKNOWN'));

alter table help_interactions
    add constraint chk_help_interactions_generation_provider
    check (generation_provider in ('GEMINI', 'NONE', 'LEGACY_UNKNOWN'));

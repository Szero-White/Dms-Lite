import type {
  HelpAnswerSource,
  HelpGenerationProvider,
} from '../types/help.types';

const SOURCE_TRANSLATION_KEYS: Record<HelpAnswerSource, string> = {
  LIVE_DATA: 'helpProvenance.source.liveData',
  WORKFLOW_KNOWLEDGE: 'helpProvenance.source.workflowKnowledge',
  SYSTEM_FALLBACK: 'helpProvenance.source.systemFallback',
  LEGACY_UNKNOWN: 'helpProvenance.source.legacyUnknown',
};

const PROVIDER_TRANSLATION_KEYS: Record<HelpGenerationProvider, string> = {
  GEMINI: 'helpProvenance.provider.gemini',
  NONE: 'helpProvenance.provider.none',
  LEGACY_UNKNOWN: 'helpProvenance.provider.legacyUnknown',
};

export function answerSourceTranslationKey(source: HelpAnswerSource) {
  return SOURCE_TRANSLATION_KEYS[source];
}

export function generationProviderTranslationKey(provider: HelpGenerationProvider) {
  return PROVIDER_TRANSLATION_KEYS[provider];
}

export function aiStatusTranslationKey(
  source: HelpAnswerSource,
  provider: HelpGenerationProvider,
) {
  if (source === 'LEGACY_UNKNOWN' || provider === 'LEGACY_UNKNOWN') {
    return 'helpProvenance.aiStatus.unknown';
  }

  if (source === 'SYSTEM_FALLBACK') {
    return 'helpProvenance.aiStatus.fallback';
  }

  if (provider === 'GEMINI') {
    return 'helpProvenance.aiStatus.assisted';
  }

  return 'helpProvenance.aiStatus.notUsed';
}

export function assistantVisibleSource(source: HelpAnswerSource): HelpAnswerSource | null {
  if (source === 'LIVE_DATA') {
    return source;
  }

  if (source === 'LEGACY_UNKNOWN') {
    return null;
  }

  // Runtime fallback details are intentionally reserved for the Owner history view.
  return 'WORKFLOW_KNOWLEDGE';
}

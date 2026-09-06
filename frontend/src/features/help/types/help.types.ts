export type HelpAnswerSource =
  | 'LIVE_DATA'
  | 'WORKFLOW_KNOWLEDGE'
  | 'SYSTEM_FALLBACK'
  | 'LEGACY_UNKNOWN';

export type HelpGenerationProvider = 'GEMINI' | 'NONE' | 'LEGACY_UNKNOWN';

export interface HelpAnswer {
  answer: string;
  steps: string[];
  relatedModules: string[];
  guardrails: string[];
  scopeNotice: string;
  blocked: boolean;
  answerSource: HelpAnswerSource;
  generationProvider: HelpGenerationProvider;
}

export interface HelpConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface HelpAskPayload {
  question: string;
  locale?: string;
  context?: HelpConversationTurn[];
}

export interface HelpHistoryParams {
  mineOnly: boolean;
  keyword?: string;
  blocked?: boolean;
  page: number;
  size: number;
}

export interface HelpInteraction {
  id: number;
  actorId: number;
  actorUsername: string;
  actorFullName?: string;
  actorRoles: string[];
  question: string;
  locale?: string;
  answer: string;
  steps: string[];
  relatedModules: string[];
  guardrails: string[];
  scopeNotice: string;
  blocked: boolean;
  answerSource: HelpAnswerSource;
  generationProvider: HelpGenerationProvider;
  createdAt: string;
}

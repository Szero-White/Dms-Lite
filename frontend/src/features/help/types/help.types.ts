export interface HelpAnswer {
  answer: string;
  steps: string[];
  relatedModules: string[];
  guardrails: string[];
  scopeNotice: string;
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
  createdAt: string;
}

export interface HelpAnswer {
  answer: string;
  steps: string[];
  relatedModules: string[];
  guardrails: string[];
  scopeNotice: string;
}

export interface HelpAskPayload {
  question: string;
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
  answer: string;
  steps: string[];
  relatedModules: string[];
  guardrails: string[];
  scopeNotice: string;
  blocked: boolean;
  createdAt: string;
}

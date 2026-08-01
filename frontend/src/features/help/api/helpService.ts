import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type { PageResponse } from '../../../types';
import type {
  HelpAnswer,
  HelpAskPayload,
  HelpHistoryParams,
  HelpInteraction,
} from '../types/help.types';

export async function askHelpAssistant(payload: HelpAskPayload) {
  return unwrapResponse<HelpAnswer>(apiClient.post('/help/ask', payload));
}

export async function fetchHelpHistory(params: HelpHistoryParams) {
  return unwrapResponse<PageResponse<HelpInteraction>>(
    apiClient.get('/help/history', { params }),
  );
}

export async function deleteHelpHistoryItem(interactionId: number) {
  return unwrapResponse<void>(apiClient.delete(`/help/history/${interactionId}`));
}

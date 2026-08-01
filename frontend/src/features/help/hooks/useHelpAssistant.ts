import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';
import {
  askHelpAssistant,
  deleteHelpHistoryItem,
  fetchHelpHistory,
} from '../api/helpService';
import type { HelpAskPayload, HelpHistoryParams } from '../types/help.types';

export function useAskHelpAssistant() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: HelpAskPayload) => askHelpAssistant(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.helpHistory });
    },
    onError(error: unknown) {
      message.error(getErrorMessage(error));
    },
  });
}

export function useHelpHistory(params: HelpHistoryParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.helpHistoryList(params),
    queryFn: () => fetchHelpHistory(params),
    enabled,
    staleTime: 15_000,
  });
}

export function useDeleteHelpHistoryItem() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (interactionId: number) => deleteHelpHistoryItem(interactionId),
    onSuccess: async () => {
      message.success('AI history item deleted.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.helpHistory });
    },
    onError(error: unknown) {
      message.error(getErrorMessage(error));
    },
  });
}

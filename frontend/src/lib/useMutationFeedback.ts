import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from './format';

export function useMutationFeedback() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  return {
    queryClient,
    message,
    t,
    onError(error: unknown) {
      message.error(getErrorMessage(error));
    },
  };
}

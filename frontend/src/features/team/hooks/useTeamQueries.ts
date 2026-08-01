import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';
import {
  createTeamMember,
  createTeamRole,
  deactivateTeamMember,
  deleteTeamRole,
  fetchTeamMembers,
  fetchTeamPermissions,
  fetchTeamRoles,
  updateTeamMember,
  updateTeamRole,
} from '../api/teamService';
import type {
  RoleFormPayload,
  TeamMemberCreatePayload,
  TeamMemberUpdatePayload,
} from '../types/team.types';

function useTeamMutationFeedback() {
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

export function useTeamMembers() {
  return useQuery({
    queryKey: queryKeys.teamMembers,
    queryFn: fetchTeamMembers,
  });
}

export function useTeamRoles() {
  return useQuery({
    queryKey: queryKeys.teamRoles,
    queryFn: fetchTeamRoles,
  });
}

export function useTeamPermissions() {
  return useQuery({
    queryKey: queryKeys.teamPermissions,
    queryFn: fetchTeamPermissions,
  });
}

export function useCreateTeamRole() {
  const { queryClient, message, t, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: (payload: RoleFormPayload) => createTeamRole(payload),
    onSuccess: async () => {
      message.success(t('toast.team.roleCreated'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamRoles });
    },
    onError,
  });
}

export function useUpdateTeamRole() {
  const { queryClient, message, t, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: number; payload: RoleFormPayload }) =>
      updateTeamRole(roleId, payload),
    onSuccess: async () => {
      message.success(t('toast.team.roleUpdated'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.teamRoles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers }),
      ]);
    },
    onError,
  });
}

export function useDeleteTeamRole() {
  const { queryClient, message, t, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: (roleId: number) => deleteTeamRole(roleId),
    onSuccess: async () => {
      message.success(t('toast.team.roleDeleted'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamRoles });
    },
    onError,
  });
}

export function useCreateTeamMember() {
  const { queryClient, message, t, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: (payload: TeamMemberCreatePayload) => createTeamMember(payload),
    onSuccess: async () => {
      message.success(t('toast.team.memberCreated'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers });
    },
    onError,
  });
}

export function useUpdateTeamMember() {
  const { queryClient, message, t, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: TeamMemberUpdatePayload;
    }) => updateTeamMember(userId, payload),
    onSuccess: async () => {
      message.success(t('toast.team.memberUpdated'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers });
    },
    onError,
  });
}

export function useDeactivateTeamMember() {
  const { queryClient, message, t, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: (userId: number) => deactivateTeamMember(userId),
    onSuccess: async () => {
      message.success(t('toast.team.memberDeactivated'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers });
    },
    onError,
  });
}

import { App } from 'antd';
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

  return {
    queryClient,
    message,
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
  const { queryClient, message, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: (payload: RoleFormPayload) => createTeamRole(payload),
    onSuccess: async () => {
      message.success('Role created.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamRoles });
    },
    onError,
  });
}

export function useUpdateTeamRole() {
  const { queryClient, message, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: number; payload: RoleFormPayload }) =>
      updateTeamRole(roleId, payload),
    onSuccess: async () => {
      message.success('Role updated.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.teamRoles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers }),
      ]);
    },
    onError,
  });
}

export function useDeleteTeamRole() {
  const { queryClient, message, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: (roleId: number) => deleteTeamRole(roleId),
    onSuccess: async () => {
      message.success('Role deleted.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamRoles });
    },
    onError,
  });
}

export function useCreateTeamMember() {
  const { queryClient, message, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: (payload: TeamMemberCreatePayload) => createTeamMember(payload),
    onSuccess: async () => {
      message.success('Team member created.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers });
    },
    onError,
  });
}

export function useUpdateTeamMember() {
  const { queryClient, message, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: TeamMemberUpdatePayload;
    }) => updateTeamMember(userId, payload),
    onSuccess: async () => {
      message.success('Team member updated.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers });
    },
    onError,
  });
}

export function useDeactivateTeamMember() {
  const { queryClient, message, onError } = useTeamMutationFeedback();

  return useMutation({
    mutationFn: (userId: number) => deactivateTeamMember(userId),
    onSuccess: async () => {
      message.success('Team member deactivated.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers });
    },
    onError,
  });
}

import { Form, Tabs } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import {
  useCreateTeamMember,
  useCreateTeamRole,
  useDeactivateTeamMember,
  useDeleteTeamRole,
  useTeamMembers,
  useTeamPermissions,
  useTeamRoles,
  useUpdateTeamMember,
  useUpdateTeamRole,
} from '../../hooks/useTeamQueries';
import type {
  RoleFormValues,
  RoleOption,
  TeamMember,
  TeamMemberFormValues,
} from '../../types/team.types';
import { MembersTable } from './components/MembersTable';
import { RoleDrawer, type RoleDrawerMode } from './components/RoleDrawer';
import { RolesTable } from './components/RolesTable';
import { TeamMemberDrawer } from './components/TeamMemberDrawer';
import { TeamSummary } from './components/TeamSummary';
import styles from './TeamPage.module.css';
import {
  OWNER_ONLY_PERMISSIONS,
  groupPermissions,
  isOwner,
  roleLabel,
} from './teamPage.utils';

export function TeamPage() {
  const { t } = useTranslation();
  const [memberForm] = Form.useForm<TeamMemberFormValues>();
  const [roleForm] = Form.useForm<RoleFormValues>();
  const membersQuery = useTeamMembers();
  const rolesQuery = useTeamRoles();
  const permissionsQuery = useTeamPermissions();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deactivateMember = useDeactivateTeamMember();
  const createRole = useCreateTeamRole();
  const updateRole = useUpdateTeamRole();
  const deleteRole = useDeleteTeamRole();
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [roleDrawerMode, setRoleDrawerMode] = useState<RoleDrawerMode>('create');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);

  const members = membersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];
  const activeMembers = members.filter((member) => member.active).length;
  const customRoles = roles.filter((role) => role.editable).length;

  const roleOptions = useMemo(() => roles.map((role) => ({
    value: role.name,
    label: roleLabel(role.name),
  })), [roles]);

  const assignablePermissions = useMemo(
    () => permissions.filter((permission) => !OWNER_ONLY_PERMISSIONS.has(permission.name)),
    [permissions],
  );
  const permissionsByGroup = useMemo(() => groupPermissions(assignablePermissions), [assignablePermissions]);

  function closeMemberDrawer() {
    setMemberDrawerOpen(false);
    setSelectedMember(null);
  }

  function closeRoleDrawer() {
    setRoleDrawerOpen(false);
    setSelectedRole(null);
    setRoleDrawerMode('create');
  }

  function openCreateMemberDrawer() {
    setSelectedMember(null);
    setMemberDrawerOpen(true);
  }

  function openEditMemberDrawer(member: TeamMember) {
    if (isOwner(member)) {
      return;
    }

    setSelectedMember(member);
    setMemberDrawerOpen(true);
  }

  function openCreateRoleDrawer() {
    setSelectedRole(null);
    setRoleDrawerMode('create');
    setRoleDrawerOpen(true);
  }

  function openEditRoleDrawer(role: RoleOption) {
    if (!role.editable) {
      return;
    }

    setSelectedRole(role);
    setRoleDrawerMode('edit');
    setRoleDrawerOpen(true);
  }

  function openViewRoleDrawer(role: RoleOption) {
    setSelectedRole(role);
    setRoleDrawerMode('view');
    setRoleDrawerOpen(true);
  }

  async function handleMemberSubmit(values: TeamMemberFormValues) {
    const payload = {
      fullName: values.fullName.trim(),
      roles: values.roles,
      active: Boolean(values.active),
    };

    if (selectedMember) {
      await updateMember.mutateAsync({
        userId: selectedMember.id,
        payload,
      });
    } else {
      await createMember.mutateAsync({
        ...payload,
        username: values.username?.trim() ?? '',
        password: values.password ?? '',
      });
    }

    closeMemberDrawer();
  }

  async function handleRoleSubmit(values: RoleFormValues) {
    if (roleDrawerMode === 'view') {
      return;
    }

    const payload = {
      name: values.name.trim(),
      permissions: values.permissions,
    };

    if (selectedRole) {
      await updateRole.mutateAsync({ roleId: selectedRole.id, payload });
    } else {
      await createRole.mutateAsync(payload);
    }

    closeRoleDrawer();
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('team.title')}
        subtitle={t('team.subtitle')}
      />

      <TeamSummary activeMembers={activeMembers} customRoles={customRoles} />

      <Tabs
        className={styles.tabs}
        items={[
          {
            key: 'members',
            label: t('team.tabs.members'),
            children: (
              <MembersTable
                members={members}
                isLoading={membersQuery.isLoading || rolesQuery.isLoading}
                isError={membersQuery.isError || rolesQuery.isError}
                error={membersQuery.error ?? rolesQuery.error}
                isDeactivating={deactivateMember.isPending}
                deactivatingMemberId={deactivateMember.variables}
                onCreate={openCreateMemberDrawer}
                onEdit={openEditMemberDrawer}
                onDeactivate={(memberId) => deactivateMember.mutate(memberId)}
                onRetry={() => {
                  void membersQuery.refetch();
                  void rolesQuery.refetch();
                }}
              />
            ),
          },
          {
            key: 'roles',
            label: t('team.tabs.roles'),
            children: (
              <RolesTable
                roles={roles}
                isLoading={rolesQuery.isLoading || permissionsQuery.isLoading}
                isError={rolesQuery.isError || permissionsQuery.isError}
                error={rolesQuery.error ?? permissionsQuery.error}
                isDeleting={deleteRole.isPending}
                deletingRoleId={deleteRole.variables}
                onCreate={openCreateRoleDrawer}
                onView={openViewRoleDrawer}
                onEdit={openEditRoleDrawer}
                onDelete={(roleId) => deleteRole.mutate(roleId)}
                onRetry={() => {
                  void rolesQuery.refetch();
                  void permissionsQuery.refetch();
                }}
              />
            ),
          },
        ]}
      />

      <TeamMemberDrawer
        form={memberForm}
        open={memberDrawerOpen}
        selectedMember={selectedMember}
        roleOptions={roleOptions}
        submitting={createMember.isPending || updateMember.isPending}
        onClose={closeMemberDrawer}
        onSubmit={handleMemberSubmit}
      />

      <RoleDrawer
        form={roleForm}
        open={roleDrawerOpen}
        mode={roleDrawerMode}
        selectedRole={selectedRole}
        permissionsByGroup={permissionsByGroup}
        submitting={createRole.isPending || updateRole.isPending}
        onClose={closeRoleDrawer}
        onSubmit={handleRoleSubmit}
      />
    </div>
  );
}

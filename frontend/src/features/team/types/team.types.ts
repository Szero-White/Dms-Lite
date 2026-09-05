export interface TeamMember {
  id: number;
  username: string;
  fullName: string;
  active: boolean;
  roles: string[];
  permissions: string[];
}

export interface RoleOption {
  id: number;
  name: string;
  systemRole: boolean;
  editable: boolean;
  permissions: string[];
}

export interface PermissionOption {
  name: string;
  label: string;
  group: string;
  description: string;
  requires: string[];
}

export interface TeamMemberCreatePayload {
  username: string;
  fullName: string;
  password: string;
  roles: string[];
  active: boolean;
}

export interface TeamMemberUpdatePayload {
  fullName: string;
  roles: string[];
  active: boolean;
}

export interface RoleFormPayload {
  name: string;
  permissions: string[];
}

export interface TeamMemberFormValues {
  username?: string;
  fullName: string;
  password?: string;
  roles: string[];
  active: boolean;
}

export interface RoleFormValues {
  name: string;
  permissions: string[];
}

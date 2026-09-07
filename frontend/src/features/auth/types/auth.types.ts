export interface AuthSession {
  userId: number;
  tenantId: number;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface AuthUser extends AuthSession {
  accessToken: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

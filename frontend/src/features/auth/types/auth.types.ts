export interface AuthUser {
  accessToken: string;
  userId: number;
  tenantId: number;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export type Role = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'STOREKEEPER';

export interface User {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

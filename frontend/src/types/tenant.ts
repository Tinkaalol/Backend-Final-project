import type { User } from './user';
import type { Location } from './location';

export interface TenantCount {
  users: number;
  products: number;
  locations: number;
}

export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  _count?: TenantCount;
}

export interface TenantDetail extends Omit<Tenant, '_count'> {
  users: User[];
  locations: Location[];
  _count: { products: number };
}

export interface CreateTenantInput {
  name: string;
  adminEmail?: string;
  adminPassword?: string;
}

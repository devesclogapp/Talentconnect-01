import type { Database } from './types/database.types';

export type UserRole = 'CLIENT' | 'PROVIDER' | 'OPERATOR';

export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbService = Database['public']['Tables']['services']['Row'];
export type DbOrder = Database['public']['Tables']['orders']['Row'];
export type DbPayment = Database['public']['Tables']['payments']['Row'];
export type DbExecution = Database['public']['Tables']['executions']['Row'];
export type DbProviderProfile = Database['public']['Tables']['provider_profiles']['Row'];

export interface Service extends DbService {
  provider?: DbUser & { provider_profile?: DbProviderProfile };
}

export interface Order extends DbOrder {
  service?: DbService;
  client?: Pick<DbUser, 'id' | 'name' | 'avatar_url' | 'phone' | 'email'>;
  provider?: Pick<DbUser, 'id' | 'name' | 'avatar_url' | 'phone' | 'email'>;
  payment?: DbPayment | DbPayment[];
  execution?: DbExecution | DbExecution[];
}

export interface User extends DbUser {
  provider_profile?: DbProviderProfile;
}

// Keep legacy for backward compatibility during transition if needed
export type ServiceType = 'UNIT' | 'HOUR';
export type BookingStatus = DbOrder['status'];

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  actor_id: string;
  details?: string;
}

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

// --- DISPUTE SYSTEM ---

export type DisputeStatus = 'open' | 'waiting_other_party' | 'in_review' | 'resolved' | 'closed';
export type DisputeReason = 'provider_no_show' | 'client_no_show' | 'service_not_as_agreed' | 'service_not_completed' | 'timing_issue' | 'other';
export type ResolutionDecision = 'release_to_provider' | 'refund_to_client' | 'split_payment' | 'close_no_action';

export interface Dispute {
  id: string;
  order_id: string;
  opened_by_role: 'client' | 'provider';
  opened_by_user_id: string;
  reason_code: DisputeReason;
  description: string;
  status: DisputeStatus;
  created_at: string;
  resolved_at?: string;
  order?: Order;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_role: 'client' | 'provider' | 'operator';
  sender_user_id: string;
  message: string;
  created_at: string;
}

export interface DisputeResolution {
  id: string;
  dispute_id: string;
  operator_user_id: string;
  decision_code: ResolutionDecision;
  decision_notes: string;
  created_at: string;
}

// Keep legacy for backward compatibility during transition if needed
export type ServiceType = 'UNIT' | 'HOUR';
export type BookingStatus = DbOrder['status'] | 'disputed';

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  actor_id: string;
  details?: string;
}

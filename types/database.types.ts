export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    role: 'client' | 'provider' | 'operator'
                    name: string
                    phone: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    role: 'client' | 'provider' | 'operator'
                    name: string
                    phone?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'client' | 'provider' | 'operator'
                    name?: string
                    phone?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            provider_profiles: {
                Row: {
                    id: string
                    user_id: string
                    bio: string | null
                    professional_title: string | null
                    documents_status: 'pending' | 'approved' | 'rejected'
                    document_cpf: string | null
                    document_rg: string | null
                    active: boolean
                    rating_average: number
                    total_ratings: number
                    total_services_completed: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    bio?: string | null
                    professional_title?: string | null
                    documents_status?: 'pending' | 'approved' | 'rejected'
                    document_cpf?: string | null
                    document_rg?: string | null
                    active?: boolean
                    rating_average?: number
                    total_ratings?: number
                    total_services_completed?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    bio?: string | null
                    professional_title?: string | null
                    documents_status?: 'pending' | 'approved' | 'rejected'
                    document_cpf?: string | null
                    document_rg?: string | null
                    active?: boolean
                    rating_average?: number
                    total_ratings?: number
                    total_services_completed?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            services: {
                Row: {
                    id: string
                    provider_id: string
                    title: string
                    description: string | null
                    category: string | null
                    pricing_mode: 'hourly' | 'fixed'
                    base_price: number
                    duration_hours: number | null
                    image_url: string | null
                    active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    title: string
                    description?: string | null
                    category?: string | null
                    pricing_mode: 'hourly' | 'fixed'
                    base_price: number
                    duration_hours?: number | null
                    image_url?: string | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    title?: string
                    description?: string | null
                    category?: string | null
                    pricing_mode?: 'hourly' | 'fixed'
                    base_price?: number
                    duration_hours?: number | null
                    image_url?: string | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    client_id: string
                    provider_id: string
                    service_id: string
                    pricing_mode: 'hourly' | 'fixed'
                    scheduled_at: string | null
                    location_text: string | null
                    location_lat: number | null
                    location_lng: number | null
                    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'awaiting_details' | 'awaiting_payment' | 'paid_escrow_held' | 'awaiting_start_confirmation' | 'in_execution' | 'awaiting_finish_confirmation' | 'completed' | 'disputed' | 'cancelled'
                    total_amount: number | null
                    notes: string | null
                    service_title_snapshot: string | null
                    service_description_snapshot: string | null
                    service_category_snapshot: string | null
                    service_base_price_snapshot: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    provider_id: string
                    service_id: string
                    pricing_mode: 'hourly' | 'fixed'
                    scheduled_at?: string | null
                    location_text?: string | null
                    location_lat?: number | null
                    location_lng?: number | null
                    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'awaiting_details' | 'awaiting_payment' | 'paid_escrow_held' | 'awaiting_start_confirmation' | 'in_execution' | 'awaiting_finish_confirmation' | 'completed' | 'disputed' | 'cancelled'
                    total_amount?: number | null
                    notes?: string | null
                    service_title_snapshot?: string | null
                    service_description_snapshot?: string | null
                    service_category_snapshot?: string | null
                    service_base_price_snapshot?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    provider_id?: string
                    service_id?: string
                    pricing_mode?: 'hourly' | 'fixed'
                    scheduled_at?: string | null
                    location_text?: string | null
                    location_lat?: number | null
                    location_lng?: number | null
                    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'awaiting_details' | 'awaiting_payment' | 'paid_escrow_held' | 'awaiting_start_confirmation' | 'in_execution' | 'awaiting_finish_confirmation' | 'completed' | 'disputed' | 'cancelled'
                    total_amount?: number | null
                    notes?: string | null
                    service_title_snapshot?: string | null
                    service_description_snapshot?: string | null
                    service_category_snapshot?: string | null
                    service_base_price_snapshot?: number | null
                    created_at?: string
                    updated_at?: string
                }
            }
            payments: {
                Row: {
                    id: string
                    order_id: string
                    amount_total: number
                    operator_fee: number
                    provider_amount: number
                    escrow_status: 'pending' | 'held' | 'released' | 'failed' | 'refunded'
                    payment_method: string | null
                    transaction_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    amount_total: number
                    operator_fee: number
                    provider_amount: number
                    escrow_status?: 'pending' | 'held' | 'released' | 'failed' | 'refunded'
                    payment_method?: string | null
                    transaction_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    amount_total?: number
                    operator_fee?: number
                    provider_amount?: number
                    escrow_status?: 'pending' | 'held' | 'released' | 'failed' | 'refunded'
                    payment_method?: string | null
                    transaction_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            executions: {
                Row: {
                    id: string
                    order_id: string
                    started_at: string | null
                    ended_at: string | null
                    provider_marked_start: boolean
                    client_confirmed_start: boolean
                    provider_confirmed_finish: boolean
                    client_confirmed_finish: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    started_at?: string | null
                    ended_at?: string | null
                    provider_marked_start?: boolean
                    client_confirmed_start?: boolean
                    provider_confirmed_finish?: boolean
                    client_confirmed_finish?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    started_at?: string | null
                    ended_at?: string | null
                    provider_marked_start?: boolean
                    client_confirmed_start?: boolean
                    provider_confirmed_finish?: boolean
                    client_confirmed_finish?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            ratings: {
                Row: {
                    id: string
                    order_id: string
                    client_id: string
                    provider_id: string
                    score: number
                    comment: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    client_id: string
                    provider_id: string
                    score: number
                    comment?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    client_id?: string
                    provider_id?: string
                    score?: number
                    comment?: string | null
                    created_at?: string
                }
            }
            disputes: {
                Row: {
                    id: string
                    order_id: string
                    opened_by: 'client' | 'provider'
                    reason: string
                    status: 'open' | 'in_review' | 'resolved' | 'closed'
                    resolution_notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    opened_by: 'client' | 'provider'
                    reason: string
                    status?: 'open' | 'in_review' | 'resolved' | 'closed'
                    resolution_notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    opened_by?: 'client' | 'provider'
                    reason?: string
                    status?: 'open' | 'in_review' | 'resolved' | 'closed'
                    resolution_notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    actor_user_id: string | null
                    entity_type: string
                    entity_id: string
                    action: string
                    payload_json: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    actor_user_id?: string | null
                    entity_type: string
                    entity_id: string
                    action: string
                    payload_json?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    actor_user_id?: string | null
                    entity_type?: string
                    entity_id?: string
                    action?: string
                    payload_json?: Json | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            increment_provider_services: {
                Args: {
                    provider_user_id: string
                }
                Returns: void
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}

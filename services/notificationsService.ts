import { supabase } from './supabaseClient';
import type { Database } from '../types/database.types';

export type NotificationType = 'deal' | 'check' | 'message' | 'info' | 'dispute_resolved';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: NotificationType;
    read: boolean;
    created_at: string;
    metadata?: Record<string, any>;
}

/**
 * Criar uma nova notificação para um usuário
 */
export const createNotification = async (payload: {
    user_id: string;
    title: string;
    body: string;
    type: NotificationType;
    metadata?: Record<string, any>;
}) => {
    try {
        const { data, error } = await (supabase.from('notifications') as any).insert({
            ...payload,
            read: false
        }).select().single();

        if (error) {
            console.warn('Erro ao inserir na tabela notifications (pode não existir):', error.message);
            return null;
        }
        return data;
    } catch (err) {
        console.error('Falha ao criar notificação:', err);
        return null;
    }
};

/**
 * Buscar notificações do usuário logado
 */
export const getMyNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
        const { data, error } = await (supabase.from('notifications') as any)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Erro ao buscar notificações (tabela pode não existir):', error.message);
            return [];
        }
        return data as Notification[];
    } catch (err) {
        console.error('Falha ao buscar notificações:', err);
        return [];
    }
};

/**
 * Marcar todas como lidas
 */
export const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from('notifications') as any)
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
};

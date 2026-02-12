import { supabase } from './supabaseClient';
import {
    Dispute,
    DisputeMessage,
    DisputeReason,
    DisputeStatus,
    ResolutionDecision
} from '../types';

/**
 * Abre uma nova disputa vinculada a um pedido
 */
export const openDispute = async (data: {
    order_id: string;
    opened_by_role: 'client' | 'provider';
    opened_by_user_id: string;
    reason_code: DisputeReason;
    description: string;
}) => {
    // 1. Inserir a disputa
    const { data: dispute, error: disputeError } = await (supabase.from('disputes') as any)
        .insert({
            order_id: data.order_id,
            opened_by_role: data.opened_by_role,
            opened_by_user_id: data.opened_by_user_id,
            reason_code: data.reason_code,
            description: data.description,
            status: 'open',
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (disputeError) {
        const supabaseUrl = (supabase as any).supabaseUrl;
        console.error("❌ [SUPABASE DEBUG] URL:", supabaseUrl);
        console.error("❌ [SUPABASE DEBUG] Erro:", disputeError);
        alert(`Erro de Banco: ${disputeError.message}\n\nVerifique se o projeto ${supabaseUrl} contém a coluna 'description' na tabela 'disputes'.`);
        throw disputeError;
    }

    // 2. Atualizar o status do pedido para 'disputed'
    const { error: orderError } = await (supabase.from('orders') as any)
        .update({ status: 'disputed' })
        .eq('id', data.order_id);

    if (orderError) {
        console.error("Erro ao atualizar status do pedido:", orderError);
    }

    // 3. Registrar log de auditoria
    try {
        await (supabase.from('audit_logs') as any).insert({
            order_id: data.order_id,
            action: 'DISPUTE_OPENED',
            details: `Disputa aberta. Motivo: ${data.reason_code}`,
            old_status: '...',
            new_status: 'disputed',
            timestamp: new Date().toISOString()
        });
    } catch (logError) {
        console.warn("Falha ao registrar log de auditoria:", logError);
    }

    return dispute;
};

/**
 * Busca detalhes de uma disputa específica pelo ID do pedido
 */
export const getDisputeByOrderId = async (orderId: string) => {
    const { data, error } = await (supabase.from('disputes') as any)
        .select('*, order:orders(*)')
        .eq('order_id', orderId)
        .maybeSingle();

    if (error) throw error;
    return data as Dispute | null;
};

/**
 * Busca mensagens de uma disputa
 */
export const getDisputeMessages = async (disputeId: string) => {
    const { data, error } = await (supabase.from('dispute_messages') as any)
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data as DisputeMessage[];
};

/**
 * Envia uma mensagem em uma disputa
 */
export const sendDisputeMessage = async (data: {
    dispute_id: string;
    sender_role: 'client' | 'provider' | 'operator';
    sender_user_id: string;
    message: string;
}) => {
    const { data: msg, error } = await (supabase.from('dispute_messages') as any)
        .insert({
            ...data,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return msg as DisputeMessage;
};

/**
 * Busca todas as disputas (Uso exclusivo Operadora/ERP)
 */
export const getAllDisputes = async () => {
    const { data, error } = await (supabase.from('disputes') as any)
        .select(`
      *,
      order:orders(
        id,
        status,
        client:users!client_id(name),
        provider:users!provider_id(name)
      )
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Registra a decisão do Admin (Operadora)
 */
export const resolveDispute = async (data: {
    dispute_id: string;
    operator_user_id: string;
    decision_code: ResolutionDecision;
    decision_notes: string;
    order_id: string;
    final_order_status: 'completed' | 'cancelled';
}) => {
    // 1. Criar registro de resolução
    const { error: resError } = await (supabase.from('dispute_resolutions') as any)
        .insert({
            dispute_id: data.dispute_id,
            operator_user_id: data.operator_user_id,
            decision_code: data.decision_code,
            decision_notes: data.decision_notes,
            created_at: new Date().toISOString()
        });

    if (resError) throw resError;

    // 2. Atualizar status da disputa
    const { error: disputeUpdateError } = await (supabase.from('disputes') as any)
        .update({
            status: 'resolved',
            resolved_at: new Date().toISOString()
        })
        .eq('id', data.dispute_id);

    if (disputeUpdateError) throw disputeUpdateError;

    // 3. Atualizar status final do pedido
    const { error: orderError } = await (supabase.from('orders') as any)
        .update({ status: data.final_order_status })
        .eq('id', data.order_id);

    if (orderError) throw orderError;

    return { success: true };
};

/**
 * Busca logs de auditoria de um pedido para a mediação
 */
export const getOrderAuditLogs = async (orderId: string) => {
    const { data, error } = await (supabase.from('audit_logs') as any)
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true });

    if (error) throw error;
    return data;
};

/**
 * Escuta mudanças em tempo real em uma disputa específica
 */
export const subscribeToDisputeUpdates = (disputeId: string, callback: (dispute: any) => void) => {
    return (supabase.channel(`dispute-${disputeId}`) as any)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'disputes',
                filter: `id=eq.${disputeId}`,
            },
            (payload: any) => {
                callback(payload.new);
            }
        )
        .subscribe();
};

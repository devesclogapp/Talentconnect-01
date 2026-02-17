import { supabase } from './supabaseClient'
import type { Database } from '../types/database.types'

import { Order, Service } from '../types'

const logWorkflowAction = async (action: string, orderId: string, details: string, metadata: any = {}) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        await (supabase as any).from('audit_logs').insert({
            action,
            entity_type: 'orders',
            entity_id: orderId,
            actor_user_id: user?.id,
            payload_json: {
                details,
                ...metadata,
                ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
                origin: 'Talent Connect App'
            }
        });
    } catch (err) {
        console.error("Workflow Audit Failure:", err);
    }
};

type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderUpdate = Database['public']['Tables']['orders']['Update']


/**
 * Criar novo pedido (Client)
 */
export const createOrder = async (orderData: Omit<OrderInsert, 'client_id'> & {
    service_title_snapshot?: string,
    service_description_snapshot?: string,
    service_category_snapshot?: string,
    service_base_price_snapshot?: number
}) => {
    // Validação básica
    if (!orderData.service_id) throw new Error('Serviço não identificado.');
    if (!orderData.provider_id) throw new Error('Prestador não identificado.');
    if (!orderData.pricing_mode) throw new Error('Modalidade de preço não definida.');

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await (supabase
        .from('orders') as any)
        .insert({
            ...orderData,
            client_id: user.id,
            status: 'sent',
        })
        .select()
        .single()

    if (error) throw error

    // Log de Auditoria
    await logWorkflowAction('ORDER_CREATED', data.id, `Pedido criado pelo cliente para o serviço: ${orderData.service_title_snapshot || 'N/A'}`, { amount: orderData.total_amount });

    return data as Order
}

/**
 * Buscar pedidos do cliente
 */
export const getClientOrders = async () => {

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await (supabase
        .from('orders') as any)
        .select(`
      *,
      service:services(*),
      provider:users!provider_id(id, name, avatar_url, phone, email),
      payment:payments(*),
      execution:executions(*)
    `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as Order[]
}

/**
 * Buscar pedidos recebidos pelo prestador
 */
export const getProviderOrders = async () => {

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await (supabase
        .from('orders') as any)
        .select(`
      *,
      service:services(*),
      client:users!client_id(id, name, avatar_url, phone, email),
      payment:payments(*),
      execution:executions(*)
    `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as Order[]
}

/**
 * Buscar pedido por ID
 */
export const getOrderById = async (orderId: string) => {

    const { data, error } = await (supabase
        .from('orders') as any)
        .select(`
      *,
      service:services(*),
      client:users!client_id(id, name, avatar_url, phone, email),
      provider:users!provider_id(id, name, avatar_url, phone, email),
      payment:payments(*),
      execution:executions(*)
    `)
        .eq('id', orderId)
        .single()

    if (error) throw error
    return data as Order
}

/**
 * Aceitar pedido (Provider)
 */
export const acceptOrder = async (orderId: string) => {
    if (!orderId) throw new Error('ID do pedido não fornecido.');
    const { data, error } = await (supabase
        .from('orders') as any)
        .update({ status: 'accepted' })
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error

    // Log de Auditoria
    await logWorkflowAction('ORDER_ACCEPTED', orderId, 'O prestador aceitou o pedido.');

    return data as Order
}

/**
 * Recusar pedido (Provider)
 */
export const rejectOrder = async (orderId: string) => {
    if (!orderId) throw new Error('ID do pedido não fornecido.');
    const { data, error } = await (supabase
        .from('orders') as any)
        .update({ status: 'rejected' })
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error

    // Log de Auditoria
    await logWorkflowAction('ORDER_REJECTED', orderId, 'O prestador recusou o pedido.');

    return data as Order
}

/**
 * Enviar contraproposta (Provider)
 */
export const sendCounterOffer = async (orderId: string, newAmount: number) => {
    if (!orderId) throw new Error('ID do pedido não fornecido.');

    // Usamos 'awaiting_details' como estado de negociação no MVP 
    // para evitar alterações agressivas no esquema do banco
    const { data, error } = await (supabase
        .from('orders') as any)
        .update({
            total_amount: newAmount,
            status: 'awaiting_details'
        })
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error

    // Log de Auditoria
    await logWorkflowAction('ORDER_COUNTER_OFFER', orderId, `O prestador enviou uma contraproposta de R$ ${newAmount}.`, { newAmount });

    return data as Order
}

/**
 * Atualizar detalhes do pedido (Client)
 */
export const updateOrderDetails = async (
    orderId: string,
    details: {
        scheduled_at?: string
        location_text?: string
        location_lat?: number
        location_lng?: number
        notes?: string
    }
) => {
    const { data, error } = await (supabase
        .from('orders') as any)
        .update({
            ...details,
            status: 'awaiting_payment',
        })
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error

    // Log de Auditoria
    await logWorkflowAction('ORDER_DETAILS_UPDATED', orderId, 'O cliente atualizou agendamento e local.', { details });

    return data as Order
}

/**
 * Cancelar pedido
 */
export const cancelOrder = async (orderId: string) => {
    const { data, error } = await (supabase
        .from('orders') as any)
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error
    return data as Order
}

/**
 * Processar pagamento (Client)
 */
export const processPayment = async (
    orderId: string,
    paymentMethod: string,
    amount: number
) => {
    const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
            orderId,
            paymentMethod,
            amount,
        },
    })

    if (error) throw error
    return data
}

/**
 * Marcar início da execução (Provider)
 */
export const markExecutionStart = async (orderId: string) => {
    const { data, error } = await (supabase
        .from('executions') as any)
        .upsert({
            order_id: orderId,
            provider_marked_start: true,
            started_at: new Date().toISOString(),
        }, { onConflict: 'order_id' })
        .select()
        .single()

    if (error) throw error

    // Atualizar status do pedido
    await (supabase
        .from('orders') as any)
        .update({ status: 'awaiting_start_confirmation' })
        .eq('id', orderId)

    // Log de Auditoria
    await logWorkflowAction('EXECUTION_STARTED_MARK', orderId, 'O prestador sinalizou o início do serviço.');

    return data
}

/**
 * Confirmar início da execução (Client)
 */
export const confirmExecutionStart = async (orderId: string) => {
    const { data, error } = await (supabase
        .from('executions') as any)
        .update({ client_confirmed_start: true })
        .eq('order_id', orderId)
        .select()
        .single()

    if (error) throw error

    // Atualizar status do pedido
    await (supabase
        .from('orders') as any)
        .update({ status: 'in_execution' })
        .eq('id', orderId)

    // Log de Auditoria
    await logWorkflowAction('EXECUTION_STARTED_CONFIRM', orderId, 'O cliente confirmou a presença do prestador.');

    return data
}

/**
 * Marcar conclusão da execução (Provider)
 */
export const markExecutionFinish = async (orderId: string) => {
    const { data, error } = await (supabase
        .from('executions') as any)
        .update({
            provider_confirmed_finish: true,
            ended_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .select()
        .single()

    if (error) throw error

    // Atualizar status do pedido
    await (supabase
        .from('orders') as any)
        .update({ status: 'awaiting_finish_confirmation' })
        .eq('id', orderId)

    // Log de Auditoria
    await logWorkflowAction('EXECUTION_FINISHED_MARK', orderId, 'O prestador sinalizou a conclusão do serviço.');

    return data
}

/**
 * Confirmar conclusão da execução (Client)
 */
export const confirmExecutionFinish = async (orderId: string) => {
    const { data, error } = await (supabase
        .from('executions') as any)
        .update({ client_confirmed_finish: true })
        .eq('order_id', orderId)
        .select()
        .single()

    if (error) throw error

    // O sistema automaticamente libera o pagamento via Edge Function
    // quando detecta ambas confirmações.
    // Para garantir o fluxo no frontend, atualizamos o status manualmente aqui também:
    await (supabase
        .from('orders') as any)
        .update({ status: 'completed' })
        .eq('id', orderId);

    // Log de Auditoria
    await logWorkflowAction('EXECUTION_FINISHED_CONFIRM', orderId, 'O cliente confirmou a conclusão do serviço. Pedido finalizado.');

    return data
}

/**
 * Abrir disputa
 */
export const openDispute = async (
    orderId: string,
    reason: string,
    openedBy: 'client' | 'provider'
) => {
    const { data, error } = await (supabase
        .from('disputes') as any)
        .insert({
            order_id: orderId,
            opened_by: openedBy,
            reason,
            status: 'open',
        })
        .select()
        .single()

    if (error) throw error

    // Atualizar status do pedido
    await (supabase
        .from('orders') as any)
        .update({ status: 'disputed' })
        .eq('id', orderId)

    // Log de Auditoria
    await logWorkflowAction('DISPUTE_OPENED', orderId, `Disputa aberta pelo ${openedBy === 'client' ? 'cliente' : 'prestador'}. Motivo: ${reason}`, { reason, openedBy });

    return data
}

/**
 * Escutar mudanças em tempo real de um pedido
 */
export const subscribeToOrderUpdates = (
    orderId: string,
    callback: (order: Order) => void
) => {
    return (supabase
        .channel(`order-${orderId}`) as any)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`,
            },
            (payload: any) => {
                callback(payload.new as Order)
            }
        )
        .subscribe()
}

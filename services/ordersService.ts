import { supabase } from './supabaseClient'
import type { Database } from '../types/database.types'
import { Order } from '../types'

type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderUpdate = Database['public']['Tables']['orders']['Update']
type ExecutionInsert = Database['public']['Tables']['executions']['Insert']
type ExecutionUpdate = Database['public']['Tables']['executions']['Update']
type DisputeInsert = Database['public']['Tables']['disputes']['Insert']

const logWorkflowAction = async (action: string, orderId: string, details: string, metadata: Record<string, any> = {}) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        const logEntry: AuditLogInsert = {
            action,
            entity_type: 'orders',
            entity_id: orderId,
            actor_user_id: user?.id || null,
            payload_json: {
                details,
                ...metadata,
                ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
                origin: 'Talent Connect App'
            }
        };

        await (supabase.from('audit_logs') as any).insert(logEntry);
    } catch (err) {
        console.error("Workflow Audit Failure:", err);
    }
};

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
    if (!orderData.provider_id) throw new Error('Profissional não identificado.');
    if (!orderData.pricing_mode) throw new Error('Modalidade de preço não definida.');

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const insertPayload: OrderInsert = {
        ...orderData,
        client_id: user.id,
        status: 'sent',
    };

    const { data, error } = await (supabase
        .from('orders') as any)
        .insert(insertPayload)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Falha ao criar pedido.')

    // Log de Auditoria
    await logWorkflowAction('ORDER_CREATED', data.id, `Pedido criado pelo cliente para o serviço: ${orderData.service_title_snapshot || 'N/A'}`, { amount: orderData.total_amount });

    return data as unknown as Order
}

/**
 * Buscar pedidos do cliente
 */
export const getClientOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
        .from('orders')
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
    return data as unknown as Order[]
}

/**
 * Buscar pedidos recebidos pelo prestador
 */
export const getProviderOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
        .from('orders')
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
    return data as unknown as Order[]
}

/**
 * Buscar pedido por ID
 */
export const getOrderById = async (orderId: string) => {
    const { data, error } = await supabase
        .from('orders')
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
    return data as unknown as Order
}

/**
 * Aceitar pedido (Provider)
 */
export const acceptOrder = async (orderId: string) => {
    if (!orderId) throw new Error('ID do pedido não fornecido.');

    const updatePayload: OrderUpdate = { status: 'accepted' };

    const { data, error } = await (supabase
        .from('orders') as any)
        .update(updatePayload)
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Pedido não encontrado.')

    // Log de Auditoria
    await logWorkflowAction('ORDER_ACCEPTED', orderId, 'O profissional aceitou o pedido.');

    return data as unknown as Order
}

/**
 * Recusar pedido (Provider)
 */
export const rejectOrder = async (orderId: string) => {
    if (!orderId) throw new Error('ID do pedido não fornecido.');

    const updatePayload: OrderUpdate = { status: 'rejected' };

    const { data, error } = await (supabase
        .from('orders') as any)
        .update(updatePayload)
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Pedido não encontrado.')

    // Log de Auditoria
    await logWorkflowAction('ORDER_REJECTED', orderId, 'O profissional recusou o pedido.');

    return data as unknown as Order
}

/**
 * Enviar contraproposta (Provider)
 */
export const sendCounterOffer = async (orderId: string, newAmount: number) => {
    if (!orderId) throw new Error('ID do pedido não fornecido.');

    const updatePayload: OrderUpdate = {
        total_amount: newAmount,
        status: 'awaiting_details'
    };

    const { data, error } = await (supabase
        .from('orders') as any)
        .update(updatePayload)
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Pedido não encontrado.')

    // Log de Auditoria
    await logWorkflowAction('ORDER_COUNTER_OFFER', orderId, `O profissional enviou uma contraproposta de R$ ${newAmount}.`, { newAmount });

    return data as unknown as Order
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
    const updatePayload: OrderUpdate = {
        ...details,
        status: 'awaiting_payment',
    };

    const { data, error } = await (supabase
        .from('orders') as any)
        .update(updatePayload)
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Pedido não encontrado.')

    // Log de Auditoria
    await logWorkflowAction('ORDER_DETAILS_UPDATED', orderId, 'O cliente atualizou agendamento e local.', { details });

    return data as unknown as Order
}

/**
 * Cancelar pedido
 */
export const cancelOrder = async (orderId: string) => {
    const updatePayload: OrderUpdate = { status: 'cancelled' };

    const { data, error } = await (supabase
        .from('orders') as any)
        .update(updatePayload)
        .eq('id', orderId)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Pedido não encontrado.')
    return data as unknown as Order
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
    const executionPayload: ExecutionInsert = {
        order_id: orderId,
        provider_marked_start: true,
        started_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase
        .from('executions') as any)
        .upsert(executionPayload, { onConflict: 'order_id' })
        .select()
        .single()

    if (error) throw error

    // Atualizar status do pedido
    await (supabase
        .from('orders') as any)
        .update({ status: 'awaiting_start_confirmation' } as OrderUpdate)
        .eq('id', orderId)

    // Log de Auditoria
    await logWorkflowAction('EXECUTION_STARTED_MARK', orderId, 'O profissional sinalizou o início do serviço.');

    return data
}

/**
 * Confirmar início da execução (Client)
 */
export const confirmExecutionStart = async (orderId: string) => {
    const executionUpdate: ExecutionUpdate = { client_confirmed_start: true };

    const { data, error } = await (supabase
        .from('executions') as any)
        .update(executionUpdate)
        .eq('order_id', orderId)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Execução não encontrada.')

    // Atualizar status do pedido
    await (supabase
        .from('orders') as any)
        .update({ status: 'in_execution' } as OrderUpdate)
        .eq('id', orderId)

    // Log de Auditoria
    await logWorkflowAction('EXECUTION_STARTED_CONFIRM', orderId, 'O cliente confirmou a presença do profissional.');

    return data
}

/**
 * Marcar conclusão da execução (Provider)
 */
export const markExecutionFinish = async (orderId: string) => {
    const executionUpdate: ExecutionUpdate = {
        provider_confirmed_finish: true,
        ended_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase
        .from('executions') as any)
        .update(executionUpdate)
        .eq('order_id', orderId)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Execução não encontrada.')

    // Atualizar status do pedido
    await (supabase
        .from('orders') as any)
        .update({ status: 'awaiting_finish_confirmation' } as OrderUpdate)
        .eq('id', orderId)

    // Log de Auditoria
    await logWorkflowAction('EXECUTION_FINISHED_MARK', orderId, 'O profissional sinalizou a conclusão do serviço.');

    return data
}

/**
 * Confirmar conclusão da execução (Client)
 */
export const confirmExecutionFinish = async (orderId: string) => {
    const executionUpdate: ExecutionUpdate = { client_confirmed_finish: true };

    const { data, error } = await (supabase
        .from('executions') as any)
        .update(executionUpdate)
        .eq('order_id', orderId)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Execução não encontrada.')

    // Atualizar status do pedido
    await (supabase
        .from('orders') as any)
        .update({ status: 'completed' } as OrderUpdate)
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
    const disputePayload: DisputeInsert = {
        order_id: orderId,
        opened_by: openedBy,
        reason,
        status: 'open',
    };

    const { data, error } = await (supabase
        .from('disputes') as any)
        .insert(disputePayload)
        .select()
        .single()

    if (error) throw error
    if (!data) throw new Error('Falha ao abrir disputa.')

    // Atualizar status do pedido
    await (supabase
        .from('orders') as any)
        .update({ status: 'disputed' } as OrderUpdate)
        .eq('id', orderId)

    // Log de Auditoria
    await logWorkflowAction('DISPUTE_OPENED', orderId, `Disputa aberta pelo ${openedBy === 'client' ? 'cliente' : 'profissional'}. Motivo: ${reason}`, { reason, openedBy });

    return data
}

/**
 * Escutar mudanças em tempo real de um pedido
 */
export const subscribeToOrderUpdates = (
    orderId: string,
    callback: (order: Order) => void
) => {
    return supabase
        .channel(`order-${orderId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`,
            },
            (payload) => {
                callback(payload.new as Order)
            }
        )
        .subscribe()
}


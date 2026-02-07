import { supabase } from './supabaseClient'
import { Service } from '../types'
import type { Database } from '../types/database.types'
import { useAppStore } from '../store'

type ServiceInsert = Database['public']['Tables']['services']['Insert']
type ServiceUpdate = Database['public']['Tables']['services']['Update']


/**
 * Buscar todos os serviços ativos
 */
export const getActiveServices = async (category?: string) => {
    const query = (supabase
        .from('services') as any)
        .select(`
      *,
      provider:users!provider_id(
        id, 
        name, 
        avatar_url, 
        phone,
        provider_profile:provider_profiles(
          rating_average,
          total_ratings,
          total_services_completed,
          professional_title
        )
      )
    `)
        .eq('active', true)

    if (category) {
        query.eq('category', category)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error;
    return data as Service[]
}

/**
 * Buscar serviço por ID
 */
export const getServiceById = async (serviceId: string) => {

    const { data, error } = await (supabase
        .from('services') as any)
        .select('*')
        .eq('id', serviceId)
        .single()

    if (error) throw error
    return data as Service
}

/**
 * Buscar serviços de um prestador
 */
export const getProviderServices = async (providerId: string) => {

    const { data, error } = await (supabase
        .from('services') as any)
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as Service[]
}

/**
 * Criar novo serviço (Provider)
 */
export const createService = async (serviceData: Omit<ServiceInsert, 'provider_id'>) => {
    // Validação básica
    if (!serviceData.title?.trim()) throw new Error('O título do serviço é obrigatório.');
    if (!serviceData.category?.trim()) throw new Error('A categoria é obrigatória.');
    if (serviceData.base_price === undefined || serviceData.base_price < 0) {
        throw new Error('O preço base deve ser um valor válido.');
    }

    // Obtém o ID do usuário (Prestador)
    let userId: string | null = null;

    // 1. Tenta via sessão real do Supabase
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) userId = session.user.id;
    } catch (e) { }

    if (!userId) {
        throw new Error('Sessão não encontrada. Por favor, faça login.');
    }

    const { data, error } = await (supabase
        .from('services') as any)
        .insert({
            title: serviceData.title,
            description: serviceData.description,
            category: serviceData.category,
            base_price: serviceData.base_price,
            pricing_mode: serviceData.pricing_mode || 'fixed',
            duration_hours: serviceData.duration_hours || 0,
            image_url: serviceData.image_url,
            provider_id: userId,
            active: true,
        })
        .select()
        .single()

    if (error) {
        console.error("Erro Supabase (createService):", error);
        throw new Error(error.message);
    }
    return data as Service
}

/**
 * Atualizar serviço (Provider)
 */
export const updateService = async (serviceId: string, updates: ServiceUpdate) => {
    if (!serviceId) throw new Error('ID do serviço não fornecido.');

    // Obtém ID do usuário para verificar se é MOCK
    let userId: string | null = null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) userId = session.user.id;
    } catch (e) { }

    if (!userId) {
        throw new Error('Sessão não encontrada.');
    }

    const { data, error } = await (supabase
        .from('services') as any)
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single()

    if (error) {
        console.error("Erro Supabase (updateService):", error);
        throw new Error(error.message);
    }
    return data as Service
}

/**
 * Desativar serviço (Provider)
 */
export const deactivateService = async (serviceId: string) => {
    const { data, error } = await (supabase
        .from('services') as any)
        .update({ active: false })
        .eq('id', serviceId)
        .select()
        .single()

    if (error) throw error
    return data as Service
}

/**
 * Ativar serviço (Provider)
 */
export const activateService = async (serviceId: string) => {
    const { data, error } = await (supabase
        .from('services') as any)
        .update({ active: true })
        .eq('id', serviceId)
        .select()
        .single()

    if (error) throw error
    return data as Service
}

/**
 * Deletar serviço (Provider)
 */
export const deleteService = async (serviceId: string) => {
    const { error } = await (supabase
        .from('services') as any)
        .delete()
        .eq('id', serviceId)

    if (error) throw error
}

/**
 * Buscar categorias únicas
 */
export const getServiceCategories = async () => {
    const { data, error } = await (supabase
        .from('services') as any)
        .select('category')
        .eq('active', true)
        .not('category', 'is', null)

    if (error) throw error

    // Extrair categorias únicas
    const categories = [...new Set((data as any[]).map(item => item.category).filter(Boolean))]
    return categories as string[]
}

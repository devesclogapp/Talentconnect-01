import { supabase } from './supabaseClient'
import type { Database } from '../types/database.types'

type ProviderProfile = Database['public']['Tables']['provider_profiles']['Row']
type ProviderProfileInsert = Database['public']['Tables']['provider_profiles']['Insert']
type ProviderProfileUpdate = Database['public']['Tables']['provider_profiles']['Update']

/**
 * Criar perfil de profissional
 */
export const createProviderProfile = async (
    profileData: Omit<ProviderProfileInsert, 'user_id'>
) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await (supabase
        .from('provider_profiles') as any)
        .insert({
            ...profileData,
            user_id: user.id,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Buscar perfil de profissional por user_id
 */
export const getProviderProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('provider_profiles')
        .select(`
      *,
      user:users!user_id(id, name, email, phone, avatar_url)
    `)
        .eq('user_id', userId)
        .single()

    if (error) throw error
    return data
}

/**
 * Buscar meu perfil de profissional
 */
export const getMyProviderProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    return getProviderProfile(user.id)
}

/**
 * Atualizar perfil de profissional
 */
export const updateProviderProfile = async (updates: ProviderProfileUpdate) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verificar se perfil existe
    const { data: existing } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (existing) {
        // Atualizar
        const { data, error } = await (supabase
            .from('provider_profiles') as any)
            .update(updates)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) throw error
        return data
    } else {
        // Criar
        const { data, error } = await (supabase
            .from('provider_profiles') as any)
            .insert({
                ...updates,
                user_id: user.id,
            })
            .select()
            .single()

        if (error) throw error
        return data
    }
}

/**
 * Buscar profissionais ativos
 */
export const getActiveProviders = async (limit?: number) => {
    let query = supabase
        .from('provider_profiles')
        .select(`
      *,
      user:users!user_id(id, name, avatar_url),
      services:services(count)
    `)
        .eq('active', true)
        .order('rating_average', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data
}

/**
 * Buscar profissionais por categoria de serviço
 */
export const getProvidersByCategory = async (category: string) => {
    const { data, error } = await supabase
        .from('services')
        .select(`
      provider_id,
      provider:users!provider_id(id, name, avatar_url),
      provider_profile:provider_profiles!provider_id(*)
    `)
        .eq('category', category)
        .eq('active', true)

    if (error) throw error

    // Remover duplicatas (mesmo profissional pode ter vários serviços)
    const uniqueProviders = data.reduce((acc, item) => {
        if (!acc.find((p: any) => p.provider_id === item.provider_id)) {
            acc.push(item)
        }
        return acc
    }, [] as any[])

    return uniqueProviders
}

/**
 * Verificar se usuário tem perfil de profissional
 */
export const hasProviderProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) throw error
    return !!data
}

/**
 * Ativar/Desativar perfil de profissional
 */
export const toggleProviderStatus = async (active: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await (supabase
        .from('provider_profiles') as any)
        .update({ active })
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) throw error
    return data
}

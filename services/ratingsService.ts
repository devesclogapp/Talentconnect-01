import { supabase } from './supabaseClient'
import type { Database } from '../types/database.types'

type Rating = Database['public']['Tables']['ratings']['Row']
type RatingInsert = Database['public']['Tables']['ratings']['Insert']

/**
 * Criar avaliação (Client)
 */
export const createRating = async (
    orderId: string,
    providerId: string,
    score: number,
    comment?: string
) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
        .from('ratings')
        .insert({
            order_id: orderId,
            client_id: user.id,
            provider_id: providerId,
            score,
            comment,
        })
        .select()
        .single()

    if (error) throw error

    // O trigger update_rating_after_insert atualiza automaticamente
    // o rating_average e total_ratings do provider

    return data
}

/**
 * Buscar avaliações de um prestador
 */
export const getProviderRatings = async (providerId: string, limit?: number) => {
    let query = supabase
        .from('ratings')
        .select(`
      *,
      client:users!client_id(name, avatar_url),
      order:orders(service:services(title))
    `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data
}

/**
 * Buscar avaliação de um pedido específico
 */
export const getOrderRating = async (orderId: string) => {
    const { data, error } = await supabase
        .from('ratings')
        .select(`
      *,
      client:users!client_id(name, avatar_url),
      provider:users!provider_id(name, avatar_url)
    `)
        .eq('order_id', orderId)
        .maybeSingle()

    if (error) throw error
    return data
}

/**
 * Verificar se pedido já foi avaliado
 */
export const isOrderRated = async (orderId: string) => {
    const { data, error } = await supabase
        .from('ratings')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle()

    if (error) throw error
    return !!data
}

/**
 * Buscar estatísticas de avaliações de um prestador
 */
export const getProviderRatingStats = async (providerId: string) => {
    const { data: profile, error } = await supabase
        .from('provider_profiles')
        .select('rating_average, total_ratings')
        .eq('user_id', providerId)
        .single()

    if (error) throw error

    // Buscar distribuição de notas
    const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('score')
        .eq('provider_id', providerId)

    if (ratingsError) throw ratingsError

    // Calcular distribuição
    const distribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
    }

    ratings?.forEach((rating) => {
        distribution[rating.score as keyof typeof distribution]++
    })

    return {
        average: profile.rating_average,
        total: profile.total_ratings,
        distribution,
    }
}

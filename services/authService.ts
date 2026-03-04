import { supabase } from './supabaseClient'
import type { Database } from '../types/database.types'
import { User as CustomUser } from '../types'
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

export interface SignUpData {
    email: string
    password: string
    name: string
    role: 'client' | 'provider'
    phone?: string
    category?: 'mei' | 'pf'
    document?: string
}

export interface SignInData {
    email: string
    password: string
}

/**
 * Cadastro de novo usuário
 */
export const signUp = async (data: SignUpData) => {
    const { email, password, name, role, phone, category, document } = data

    const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                role,
                phone,
                category, // 'mei' | 'pf'
                document  // CPF or CNPJ
            },
        },
    })

    if (error) throw error

    // Inserir explicitamente na tabela public.users para garantir que os dados existam
    if (authData.user) {
        try {
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0E0E10&color=fff`;

            await (supabase
                .from('users') as any)
                .upsert({
                    id: authData.user.id,
                    email: authData.user.email || '',
                    name: name,
                    role: (role as 'client' | 'provider' | 'operator'),
                    phone: phone || null,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                } as Database['public']['Tables']['users']['Insert'], { onConflict: 'id' });

            console.log("✅ Usuário sincronizado no banco de dados.");
        } catch (dbError) {
            console.error("Erro ao sincronizar tabela users:", dbError);
        }
    }

    // Se for profissional, cria o perfil inicial
    if (role === 'provider' && authData.user) {
        try {
            const profileData: Database['public']['Tables']['provider_profiles']['Insert'] = {
                user_id: authData.user.id,
                documents_status: 'pending',
                active: false
            };

            if (document) {
                profileData.document_cpf = document;
            }

            await (supabase
                .from('provider_profiles') as any)
                .upsert(profileData, { onConflict: 'user_id' });

            console.log("✅ Perfil de profissional inicializado.");
        } catch (profileError) {
            console.error("Erro ao criar perfil de profissional:", profileError);
        }
    }

    return authData
}

/**
 * Login de usuário
 */
export const signIn = async (data: SignInData) => {
    const { email, password } = data

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) throw error

    // Sincronizar dados ao fazer login
    if (authData.user) {
        await syncUserSession(authData.user);
    }

    return authData
}

/**
 * Logout
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

/**
 * Obter usuário atual
 */
export const getCurrentUser = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (e) {
        return null;
    }
}

/**
 * Sincronizar dados da sessão com a tabela public.users
 */
export const syncUserSession = async (user: User | null) => {
    if (!user) return;

    const metadata = user.user_metadata;
    let nameToSave = metadata?.name || 'Usuário';

    if ((nameToSave === 'Usuário' || nameToSave === 'Cliente' || nameToSave === 'Profissional') && user.email) {
        const emailName = user.email.split('@')[0];
        nameToSave = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }

    try {
        await (supabase
            .from('users') as any)
            .upsert({
                id: user.id,
                email: user.email || '',
                name: nameToSave,
                role: (metadata?.role || 'client') as 'client' | 'provider' | 'operator',
                phone: metadata?.phone || null,
                avatar_url: metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToSave)}&background=0E0E10&color=fff`,
                updated_at: new Date().toISOString()
            } as Database['public']['Tables']['users']['Insert']);
    } catch (dbError) {
        console.error("Erro ao sincronizar tabela users:", dbError);
    }
}

/**
 * Obter perfil completo do usuário
 */
export const getUserProfile = async (userId: string) => {
    const { data, error } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('id', userId)
        .single()

    if (error) throw error
    return data as CustomUser
}

/**
 * Atualizar perfil do usuário
 */
export const updateUserProfile = async (userId: string, updates: {
    name?: string
    phone?: string
    avatar_url?: string
}) => {
    // Também atualizar metadata no Auth (importante para consistency)
    if (updates.name || updates.avatar_url || updates.phone) {
        await supabase.auth.updateUser({
            data: {
                ...updates
            }
        });
    }

    const { data, error } = await (supabase
        .from('users') as any)
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

    if (error) throw error
    return data as CustomUser
}

/**
 * Verificar se email já existe
 */
export const checkEmailExists = async (email: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle()

    if (error) throw error
    return !!data
}

/**
 * Resetar senha
 */
export const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
}

/**
 * Atualizar senha
 */
export const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) throw error
}

/**
 * Listener para mudanças de autenticação
 */
export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback)
}


import { supabase } from './supabaseClient'

export interface SignUpData {
    email: string
    password: string
    name: string
    role: 'client' | 'provider'
    phone?: string
}

export interface SignInData {
    email: string
    password: string
}

/**
 * Cadastro de novo usuário
 */
export const signUp = async (data: SignUpData) => {
    const { email, password, name, role, phone } = data

    const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                role,
                phone,
            },
        },
    })

    if (error) throw error

    // Inserir explicitamente na tabela public.users para garantir que os dados existam
    if (authData.user) {
        try {
            await (supabase as any)
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: authData.user.email,
                    name: name,
                    role: role,
                    phone: phone || null,
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0E0E10&color=fff`
                });
        } catch (dbError) {
            console.error("Erro ao sincronizar tabela users:", dbError);
        }
    }

    // Se for prestador, cria o perfil inicial
    if (role === 'provider' && authData.user) {
        try {
            await (supabase as any)
                .from('provider_profiles')
                .insert({
                    user_id: authData.user.id,
                    professional_title: 'Novo Prestador',
                    active: true,
                    rating_average: 5.0,
                    total_ratings: 0,
                    total_services_completed: 0
                });
        } catch (profileError) {
            console.error("Erro ao criar perfil de prestador:", profileError);
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
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
}

/**
 * Sincronizar dados da sessão com a tabela public.users
 */
export const syncUserSession = async (user: any) => {
    if (!user) return;

    const metadata = user.user_metadata;
    let nameToSave = metadata?.name || 'Usuário';

    // Se o nome for genérico e tivermos email, tenta gerar um nome melhor
    if ((nameToSave === 'Usuário' || nameToSave === 'Cliente' || nameToSave === 'Profissional') && user.email) {
        const emailName = user.email.split('@')[0];
        // Capitalizar a primeira letra
        nameToSave = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }

    try {
        await (supabase as any)
            .from('users')
            .upsert({
                id: user.id,
                email: user.email,
                name: nameToSave,
                role: metadata?.role || 'client',
                phone: metadata?.phone || null,
                avatar_url: metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameToSave)}&background=0E0E10&color=fff`,
                updated_at: new Date().toISOString()
            });
    } catch (dbError) {
        console.error("Erro ao sincronizar tabela users:", dbError);
    }
}

/**
 * Obter perfil completo do usuário (com dados da tabela users)
 */
export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) throw error
    return data
}

/**
 * Atualizar perfil do usuário
 */
export const updateUserProfile = async (userId: string, updates: {
    name?: string
    phone?: string
    avatar_url?: string
}) => {
    const query = (supabase as any)
        .from('users')
        .update(updates)
        .eq('id', userId);

    // Também atualizar metadata no Auth (importante para consistency)
    if (updates.name || updates.avatar_url || updates.phone) {
        await supabase.auth.updateUser({
            data: {
                ...updates
            }
        });
    }

    const { data, error } = await query.select().single()

    if (error) throw error
    return data
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
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
}

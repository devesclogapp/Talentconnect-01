import { supabase } from '../services/supabaseClient';

/**
 * Script utilitário para criar um usuário Operador/Admin no banco de dados local.
 * Como o Supabase Auth não permite criar usuários diretamente via SQL (por segurança), 
 * usamos o método de SignUp com metadados específicos.
 */

export const createAdminUser = async () => {
    const adminEmail = 'admin@talentconnect.com';
    const adminPass = 'admin123';

    try {
        // 1. Verificar se o usuário já existe na tabela public.users
        const { data: existingUser, error: checkError } = await (supabase as any)
            .from('users')
            .select('id, role')
            .eq('email', adminEmail)
            .maybeSingle();

        if (existingUser) {
            console.log('ℹ️ Admin de teste identificado.');

            // Garantir que a role está correta apenas se necessário (evitar 403 se não estiver logado)
            if (existingUser.role !== 'operator') {
                try {
                    await (supabase as any)
                        .from('users')
                        .update({ role: 'operator' })
                        .eq('id', existingUser.id);
                } catch (e) {
                    // Silencioso se for erro de permissão (403)
                }
            }

            return { success: true, email: adminEmail };
        }

        console.log('--- Criando Novo Usuário Admin de Teste ---');

        // 2. Tentar criar o usuário no Auth se não existir
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPass,
            options: {
                data: {
                    name: 'Administrador Talent',
                    role: 'operator',
                    phone: '11999999999'
                }
            }
        });

        if (authError) {
            // Caso ainda dê erro de "already registered" por race condition ou cache do Auth
            if (authError.message.includes('already registered')) {
                console.log('ℹ️ O usuário admin já existe no Auth (Sync).');
                return { success: true, email: adminEmail };
            }
            throw authError;
        }

        console.log('✅ Usuário Admin criado com sucesso.');
        return { success: true, email: adminEmail };

    } catch (err: any) {
        console.warn('⚠️ createAdmin: Falha ao gerenciar admin de teste:', err.message);
        return { success: false, error: err.message };
    }
};

import { supabase } from '../services/supabaseClient';

/**
 * Script utilitário para criar um usuário Operador/Admin no banco de dados local.
 * Como o Supabase Auth não permite criar usuários diretamente via SQL (por segurança), 
 * usamos o método de SignUp com metadados específicos.
 */

export const createAdminUser = async () => {
    const adminEmail = 'admin@talentconnect.com';
    const adminPass = 'admin123';

    console.log('--- Iniciando Criação de Usuário Admin ---');

    try {
        // 1. Tentar criar o usuário no Auth
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
            if (authError.message.includes('already registered')) {
                console.log('ℹ️ O usuário admin já existe no Auth.');

                // Se já existe, vamos garantir que ele tenha a role operator no banco public.users
                // Precisamos do ID dele. Tentar fazer um signIn para pegar os dados ou buscar no banco.
                const { data: usersData } = await (supabase as any)
                    .from('users')
                    .select('id')
                    .eq('email', adminEmail)
                    .single();

                if (usersData) {
                    await (supabase as any)
                        .from('users')
                        .update({ role: 'operator' })
                        .eq('id', (usersData as any).id);
                    console.log('✅ Role de operador confirmada na tabela public.users.');
                }
            } else {
                throw authError;
            }
        } else {
            console.log('✅ Usuário Admin criado com sucesso no Auth.');
        }

        console.log('\n--- Credenciais de Acesso ---');
        console.log(`Email: ${adminEmail}`);
        console.log(`Senha: ${adminPass}`);
        console.log('-----------------------------');

        return { success: true, email: adminEmail };

    } catch (err: any) {
        console.error('❌ Erro ao criar admin:', err.message);
        return { success: false, error: err.message };
    }
};

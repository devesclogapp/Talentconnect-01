
import { supabase } from './supabaseClient';

export interface ComplaintData {
    category: 'abuse' | 'harassment' | 'safety' | 'other';
    description: string;
    evidence_url?: string;
}

export const submitComplaint = async (data: ComplaintData) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Usuário não autenticado');

    // Tenta inserir na tabela 'complaints'. Se não existir, vai falhar (o que é esperado até a migração ser rodada).
    // Nota: A tabela 'complaints' deve ser criada no banco de dados com:
    /*
    CREATE TABLE complaints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('abuse', 'harassment', 'safety', 'other')),
        description TEXT NOT NULL,
        evidence_url TEXT,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    */

    const { error } = await (supabase as any)
        .from('complaints')
        .insert({
            user_id: user.id,
            category: data.category,
            description: data.description,
            evidence_url: data.evidence_url,
            status: 'open'
        });

    if (error) {
        console.error("Erro ao enviar denúncia:", error);
        throw error;
    }

    return true;
};

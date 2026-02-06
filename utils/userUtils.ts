export const resolveUserName = (userData: any): string => {
    if (!userData) return 'Cliente (Pendente)';

    // Handle Supabase returning array for single relations
    const data = Array.isArray(userData) ? userData[0] : userData;

    if (!data) return 'Cliente (Pendente)';

    const cleanName = (data.name || '').trim();
    const lowerName = cleanName.toLowerCase();
    const isGeneric = ['usuário', 'usuario', 'cliente', 'profissional', 'prestador', 'user'].includes(lowerName);

    // Priority: actual name (if not generic) > email > cleanName (even if generic) > 'Cliente'
    if (cleanName && !isGeneric) {
        return cleanName;
    }

    if (data.email) {
        return data.email.split('@')[0];
    }

    // Se chegou aqui, temos um nome genérico e SEM email.
    // Isso indica fortemente que o select não retornou o email (RLS) ou o registro está incompleto.
    if (isGeneric) {
        // Tenta mostrar ID curto como fallback desesperado para diferenciar usuários
        if (data.id) return `Cliente #${data.id.substr(0, 4)}`;
        return 'Cliente (Dados Ocultos)';
    }

    return cleanName || 'Cliente';
};

export const resolveUserAvatar = (userData: any): string => {
    const name = resolveUserName(userData);
    const data = Array.isArray(userData) ? userData[0] : userData;

    if (data?.avatar_url) return data.avatar_url;
    if (data?.user_metadata?.avatar_url) return data.user_metadata.avatar_url;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0E0E10&color=fff`;
};

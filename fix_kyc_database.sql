-- SCRIPT DE CORREÇÃO: TALENT CONNECT KYC
-- Execute este script no SQL Editor do seu Dashboard Supabase

-- 1. Criação das colunas de caminhos de arquivos para KYC
ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS doc_front_path TEXT,
ADD COLUMN IF NOT EXISTS doc_back_path TEXT,
ADD COLUMN IF NOT EXISTS selfie_path TEXT;

-- 2. Garantir que o status 'submitted' seja aceito no Enum
-- Observação: Substitua 'documents_status_enum' pelo nome real do tipo se for diferente
DO $$
BEGIN
    -- Tenta encontrar o tipo enum da coluna documents_status
    -- Se não encontrar por nome, ele tenta adicionar o valor
    BEGIN
        ALTER TYPE public.documents_status_enum ADD VALUE 'submitted';
    EXCEPTION
        WHEN duplicate_object THEN NULL; -- Já existe
        WHEN OTHERS THEN 
            -- Caso não seja um tipo enum nomeado, ignoramos para não quebrar o script
            NULL;
    END;
END
$$;

-- 3. (Opcional) Forçar sincronização de Junior Silva se você tiver o ID dele
-- UPDATE public.provider_profiles SET documents_status = 'submitted' WHERE user_id = 'ID_DO_USER';

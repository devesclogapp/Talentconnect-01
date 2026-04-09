-- SCRIPT DE ESTABILIZAÇÃO KYC - TALENT CONNECT
-- Este script prepara o banco de dados e o storage para o fluxo de verificação de identidade.

-- 1. Criação do Bucket de Documentos (Privado por padrão para segurança, mas o ERP usará URLs assinadas ou RLS)
-- Nota: O código atual do ERP usa getPublicUrl, então para compatibilidade imediata, criaremos como público.
-- Recomenda-se mudar para privado em produção.
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de RLS para o bucket 'documents'
-- Permitir que usuários autenticados façam upload para sua própria pasta
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários vejam seus próprios documentos
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que Admins (Operadores) vejam todos os documentos
-- Ajuste o filtro de role conforme sua implementação de roles na tabela users
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'operator'
  )
);

-- 3. Atualização da Tabela public.provider_profiles
-- Adiciona colunas para caminhos dos documentos
ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS doc_front_path TEXT,
ADD COLUMN IF NOT EXISTS doc_back_path TEXT,
ADD COLUMN IF NOT EXISTS selfie_path TEXT;

-- 4. Ajuste no status de documentos (Enum ou Check Constraint)
-- Se documents_status for um ENUM, precisamos adicionar o valor 'submitted'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'documents_status_enum') THEN
        ALTER TYPE public.documents_status_enum ADD VALUE 'submitted' BEFORE 'approved';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Se for uma check constraint na tabela, precisamos atualizá-la
-- (Omitido por segurança, pois o nome da constraint pode variar)

-- 5. Garantir que a coluna kyc_status na tabela users também suporte 'submitted'
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';

-- 1. Criar o bucket de avatars se não existir
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Políticas de RLS para o bucket 'avatars'

-- Permitir que qualquer pessoa veja as fotos (público)
create policy "Avatar images are publicly accessible"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );

-- Permitir que usuários autenticados façam upload apenas para sua própria pasta/arquivo
-- Usaremos o padrão: userId/filename
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários atualizem seu próprio avatar
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários excluam seu próprio avatar
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

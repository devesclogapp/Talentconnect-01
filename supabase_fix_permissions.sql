-- Execute este script no SQL Editor do Supabase para corrigir a visualização de nomes

-- 1. Habilitar que usuários autenticados vejam os dados básicos de outros usuários (necessário para o chat/dashboard)
create policy "Public profiles are visible to everyone"
on public.users
for select
to authenticated
using ( true );

-- 2. Garantir que usuários possam atualizar seus próprios dados
create policy "Users can update own profile"
on public.users
for update
to authenticated
using ( auth.uid() = id );

-- 3. Permitir inserção de perfil (caso não exista script automático)
create policy "Users can insert own profile"
on public.users
for insert
to authenticated
with check ( auth.uid() = id );

-- 4. (Opcional) Se as policies acima falharem porque já existem, tente remover as antigas antes:
-- drop policy if exists "Public profiles are visible to everyone" on public.users;
-- drop policy if exists "Users can update own profile" on public.users;
-- drop policy if exists "Users can insert own profile" on public.users;

-- MASTER FIX: EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- Este script garante que o Admin (usuários logados) possa ver TUDO no marketplace.

-- 1. Limpeza Radical de políticas existentes
DROP POLICY IF EXISTS "Public profiles are visible to everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view all services" ON public.services;
DROP POLICY IF EXISTS "Authenticated users can view all disputes" ON public.disputes;

-- 2. Permissão de Leitura TOTAL (Sem restrições para quem está logado)
CREATE POLICY "Public profiles are visible to everyone" ON public.users FOR SELECT TO authenticated USING ( true );
CREATE POLICY "Authenticated users can view all orders" ON public.orders FOR SELECT TO authenticated USING ( true );
CREATE POLICY "Authenticated users can view all services" ON public.services FOR SELECT TO authenticated USING ( true );
CREATE POLICY "Authenticated users can view all disputes" ON public.disputes FOR SELECT TO authenticated USING ( true );

-- 3. Permissão de Escrita Básica (Perfil Próprio)
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated USING ( auth.uid() = id );
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT TO authenticated WITH CHECK ( auth.uid() = id );

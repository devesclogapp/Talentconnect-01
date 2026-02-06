# 🗄️ DATABASE MIGRATIONS - TALENT CONNECT

Este documento contém todas as migrações SQL que serão aplicadas ao Supabase.

## ⏳ Status do Projeto
- **Project ID**: `ibnzikqsutqlymfikxpu`
- **Status Atual**: COMING_UP (aguardando restauração)
- **Região**: us-west-2

---

## 📋 ORDEM DE EXECUÇÃO

1. ✅ **create_core_tables** - Tabelas principais
2. ⏳ **create_triggers_and_functions** - Triggers e funções
3. ⏳ **enable_rls_policies** - Row Level Security
4. ⏳ **create_storage_buckets** - Storage para imagens
5. ⏳ **seed_initial_data** - Dados iniciais (opcional)

---

## 1️⃣ MIGRATION: create_core_tables

```sql
-- ============================================
-- TALENT CONNECT - CORE TABLES
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS (extends auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'provider', 'operator')),
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PROVIDER PROFILES
-- ============================================
CREATE TABLE public.provider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  professional_title TEXT,
  documents_status TEXT DEFAULT 'pending' CHECK (documents_status IN ('pending', 'approved', 'rejected')),
  document_cpf TEXT,
  document_rg TEXT,
  active BOOLEAN DEFAULT true,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  total_services_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- 3. SERVICES
-- ============================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('hourly', 'fixed')),
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  duration_hours INTEGER,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ORDERS
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('hourly', 'fixed')),
  scheduled_at TIMESTAMPTZ,
  location_text TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN (
    'draft', 'sent', 'accepted', 'rejected', 
    'awaiting_details', 'awaiting_payment', 'paid_escrow_held',
    'awaiting_start_confirmation', 'in_execution', 
    'awaiting_finish_confirmation', 'completed', 'disputed', 'cancelled'
  )),
  total_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. PAYMENTS
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_total DECIMAL(10,2) NOT NULL CHECK (amount_total >= 0),
  operator_fee DECIMAL(10,2) NOT NULL CHECK (operator_fee >= 0),
  provider_amount DECIMAL(10,2) NOT NULL CHECK (provider_amount >= 0),
  escrow_status TEXT NOT NULL DEFAULT 'pending' CHECK (escrow_status IN (
    'pending', 'held', 'released', 'failed', 'refunded'
  )),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)
);

-- ============================================
-- 6. EXECUTION
-- ============================================
CREATE TABLE public.executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  provider_marked_start BOOLEAN DEFAULT false,
  client_confirmed_start BOOLEAN DEFAULT false,
  provider_confirmed_finish BOOLEAN DEFAULT false,
  client_confirmed_finish BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)
);

-- ============================================
-- 7. RATINGS
-- ============================================
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)
);

-- ============================================
-- 8. DISPUTES
-- ============================================
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  opened_by TEXT NOT NULL CHECK (opened_by IN ('client', 'provider')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. AUDIT LOGS
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

CREATE INDEX idx_provider_profiles_user_id ON public.provider_profiles(user_id);
CREATE INDEX idx_provider_profiles_active ON public.provider_profiles(active);

CREATE INDEX idx_services_provider_id ON public.services(provider_id);
CREATE INDEX idx_services_active ON public.services(active);
CREATE INDEX idx_services_category ON public.services(category);

CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_provider_id ON public.orders(provider_id);
CREATE INDEX idx_orders_service_id ON public.orders(service_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_scheduled_at ON public.orders(scheduled_at);

CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_escrow_status ON public.payments(escrow_status);

CREATE INDEX idx_executions_order_id ON public.executions(order_id);

CREATE INDEX idx_ratings_provider_id ON public.ratings(provider_id);
CREATE INDEX idx_ratings_order_id ON public.ratings(order_id);

CREATE INDEX idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
```

---

## 2️⃣ MIGRATION: create_triggers_and_functions

```sql
-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executions_updated_at BEFORE UPDATE ON public.executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function: Create audit log
-- ============================================
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    payload_json
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
      ELSE row_to_json(NEW)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit triggers
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_executions AFTER INSERT OR UPDATE OR DELETE ON public.executions
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_disputes AFTER INSERT OR UPDATE OR DELETE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ============================================
-- Function: Update provider rating
-- ============================================
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.provider_profiles
  SET 
    rating_average = (
      SELECT AVG(score)::DECIMAL(3,2)
      FROM public.ratings
      WHERE provider_id = NEW.provider_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.ratings
      WHERE provider_id = NEW.provider_id
    )
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_insert AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- ============================================
-- Function: Auto-create user profile
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 3️⃣ MIGRATION: enable_rls_policies

```sql
-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public can view provider profiles"
  ON public.users FOR SELECT
  USING (role = 'provider');

-- ============================================
-- PROVIDER PROFILES POLICIES
-- ============================================
CREATE POLICY "Anyone can view active provider profiles"
  ON public.provider_profiles FOR SELECT
  USING (active = true);

CREATE POLICY "Providers can update own profile"
  ON public.provider_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert own profile"
  ON public.provider_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SERVICES POLICIES
-- ============================================
CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (active = true);

CREATE POLICY "Providers can manage own services"
  ON public.services FOR ALL
  USING (auth.uid() = provider_id);

-- ============================================
-- ORDERS POLICIES
-- ============================================
CREATE POLICY "Clients can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Providers can view received orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Clients can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Providers can update received orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = provider_id);

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

CREATE POLICY "System can manage payments"
  ON public.payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- EXECUTIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own executions"
  ON public.executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = executions.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own executions"
  ON public.executions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = executions.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

CREATE POLICY "System can insert executions"
  ON public.executions FOR INSERT
  WITH CHECK (true);

-- ============================================
-- RATINGS POLICIES
-- ============================================
CREATE POLICY "Anyone can view ratings"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Clients can create ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- ============================================
-- DISPUTES POLICIES
-- ============================================
CREATE POLICY "Users can view own disputes"
  ON public.disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = disputes.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

CREATE POLICY "Users can create disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = disputes.order_id
      AND (orders.client_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================
CREATE POLICY "Operators can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'operator'
    )
  );
```

---

## 4️⃣ STORAGE BUCKETS

```sql
-- Será criado via Supabase Storage API
-- Buckets:
-- - avatars (public)
-- - service-images (public)
-- - documents (private)
```

---

## 5️⃣ EDGE FUNCTIONS

### Function: process-payment
Processa pagamentos e atualiza status de escrow.

### Function: release-payment
Libera pagamento após confirmação de conclusão.

### Function: send-notification
Envia notificações push/email para usuários.

---

## 📊 PRÓXIMOS PASSOS

1. ⏳ Aguardar projeto Supabase ficar ACTIVE
2. ✅ Executar migrações na ordem
3. ✅ Criar storage buckets
4. ✅ Deploy de edge functions
5. ✅ Configurar Auth providers
6. ✅ Testar RLS policies
7. ✅ Popular dados de teste

---

**Última atualização**: 2026-02-04 15:15 BRT

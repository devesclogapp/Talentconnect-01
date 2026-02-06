# 🔑 CREDENCIAIS SUPABASE - TALENT CONNECT

## 📊 Informações do Projeto

**Project ID**: `ibnzikqsutqlymfikxpu`  
**Project Name**: App ESC Talent Connect  
**Região**: us-west-2  
**Status**: ✅ ACTIVE_HEALTHY

---

## 🌐 URLs

### API URL
```
https://ibnzikqsutqlymfikxpu.supabase.co
```

### Edge Functions Base URL
```
https://ibnzikqsutqlymfikxpu.supabase.co/functions/v1
```

### Dashboard
```
https://supabase.com/dashboard/project/ibnzikqsutqlymfikxpu
```

---

## 🔐 API Keys

### Anon Key (Public - Frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlibnppa3FzdXRxbHltZmlreHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODIzMjksImV4cCI6MjA4MzQ1ODMyOX0.H5pdsykJC9wg3TUZRwnKFcqbKtlaRwF3unnBM9I1B0E
```

### Publishable Key (Recomendado - Modern)
```
sb_publishable_p3NKwo4OFxhenhqDDNXn6A_wvulevAs
```

⚠️ **IMPORTANTE**: Use a **Publishable Key** para novos projetos (melhor segurança).

---

## 📝 Configuração do Frontend

### 1. Criar arquivo `.env.local`

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ibnzikqsutqlymfikxpu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlibnppa3FzdXRxbHltZmlreHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODIzMjksImV4cCI6MjA4MzQ1ODMyOX0.H5pdsykJC9wg3TUZRwnKFcqbKtlaRwF3unnBM9I1B0E
```

### 2. Atualizar `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
```

### 3. Instalar dependências

```bash
npm install @supabase/supabase-js
```

---

## 🚀 Edge Functions URLs

### Process Payment
```
POST https://ibnzikqsutqlymfikxpu.supabase.co/functions/v1/process-payment
```

**Headers**:
```json
{
  "Authorization": "Bearer <USER_JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "orderId": "uuid",
  "paymentMethod": "credit_card",
  "amount": 100.00
}
```

### Release Payment
```
POST https://ibnzikqsutqlymfikxpu.supabase.co/functions/v1/release-payment
```

**Headers**:
```json
{
  "Authorization": "Bearer <SERVICE_ROLE_KEY>",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "orderId": "uuid"
}
```

⚠️ **NOTA**: `release-payment` deve ser chamada apenas pelo backend (service role).

---

## 🔧 Exemplo de Uso

### Autenticação

```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      name: 'John Doe',
      role: 'client', // ou 'provider'
    },
  },
})

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

// Sign Out
await supabase.auth.signOut()
```

### Queries

```typescript
// Buscar serviços ativos
const { data: services } = await supabase
  .from('services')
  .select('*, provider:users(*)')
  .eq('active', true)

// Criar pedido
const { data: order } = await supabase
  .from('orders')
  .insert({
    service_id: serviceId,
    provider_id: providerId,
    client_id: user.id,
    pricing_mode: 'fixed',
    total_amount: 100.00,
    status: 'sent',
  })
  .select()
  .single()

// Buscar pedidos do cliente
const { data: orders } = await supabase
  .from('orders')
  .select('*, service:services(*), provider:users(*)')
  .eq('client_id', user.id)
  .order('created_at', { ascending: false })
```

### Processar Pagamento

```typescript
const { data, error } = await supabase.functions.invoke('process-payment', {
  body: {
    orderId: order.id,
    paymentMethod: 'credit_card',
    amount: order.total_amount,
  },
})

if (error) {
  console.error('Payment failed:', error)
} else {
  console.log('Payment successful:', data)
}
```

---

## 📊 Tabelas Disponíveis

1. **users** - Perfis de usuários
2. **provider_profiles** - Perfis de prestadores
3. **services** - Serviços
4. **orders** - Pedidos
5. **payments** - Pagamentos
6. **executions** - Execuções
7. **ratings** - Avaliações
8. **disputes** - Disputas
9. **audit_logs** - Logs de auditoria

---

## 🔒 Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Políticas de acesso por perfil
- ✅ JWT validation nas Edge Functions
- ✅ Audit logs automáticos
- ✅ Escrow system para pagamentos

---

## 📚 Documentação

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)

---

**Última atualização**: 2026-02-04 15:20 BRT

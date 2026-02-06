# 🚀 GUIA RÁPIDO DE INTEGRAÇÃO - SUPABASE

## ⚡ Setup em 3 Passos

### 1️⃣ Instalar Dependências

```bash
npm install @supabase/supabase-js
```

### 2️⃣ Criar `.env.local`

```env
VITE_SUPABASE_URL=https://ibnzikqsutqlymfikxpu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlibnppa3FzdXRxbHltZmlreHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODIzMjksImV4cCI6MjA4MzQ1ODMyOX0.H5pdsykJC9wg3TUZRwnKFcqbKtlaRwF3unnBM9I1B0E
```

### 3️⃣ Atualizar `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
```

---

## 📋 Exemplos Práticos

### Autenticação

```typescript
import { supabase } from './lib/supabase'

// Cadastro
const signUp = async (email: string, password: string, name: string, role: 'client' | 'provider') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
    },
  })
  return { data, error }
}

// Login
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Logout
const signOut = async () => {
  await supabase.auth.signOut()
}

// Obter usuário atual
const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

### Serviços (Provider)

```typescript
// Criar serviço
const createService = async (serviceData: {
  title: string
  description: string
  category: string
  pricing_mode: 'hourly' | 'fixed'
  base_price: number
  duration_hours?: number
  image_url?: string
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('services')
    .insert({
      ...serviceData,
      provider_id: user!.id,
      active: true,
    })
    .select()
    .single()
  
  return { data, error }
}

// Listar meus serviços
const getMyServices = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', user!.id)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Atualizar serviço
const updateService = async (serviceId: string, updates: Partial<Service>) => {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single()
  
  return { data, error }
}
```

### Serviços (Client)

```typescript
// Buscar serviços ativos
const getActiveServices = async (category?: string) => {
  let query = supabase
    .from('services')
    .select(`
      *,
      provider:users!provider_id(id, name, avatar_url),
      provider_profile:provider_profiles!provider_id(
        rating_average,
        total_ratings,
        total_services_completed
      )
    `)
    .eq('active', true)
  
  if (category) {
    query = query.eq('category', category)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  return { data, error }
}

// Buscar serviço por ID
const getServiceById = async (serviceId: string) => {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      provider:users!provider_id(id, name, avatar_url, phone),
      provider_profile:provider_profiles!provider_id(*)
    `)
    .eq('id', serviceId)
    .single()
  
  return { data, error }
}
```

### Pedidos (Orders)

```typescript
// Criar pedido (Client)
const createOrder = async (orderData: {
  service_id: string
  provider_id: string
  pricing_mode: 'hourly' | 'fixed'
  total_amount: number
  scheduled_at?: string
  location_text?: string
  notes?: string
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      client_id: user!.id,
      status: 'sent',
    })
    .select()
    .single()
  
  return { data, error }
}

// Aceitar pedido (Provider)
const acceptOrder = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'accepted' })
    .eq('id', orderId)
    .select()
    .single()
  
  return { data, error }
}

// Recusar pedido (Provider)
const rejectOrder = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'rejected' })
    .eq('id', orderId)
    .select()
    .single()
  
  return { data, error }
}

// Listar meus pedidos (Client)
const getMyOrders = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(*),
      provider:users!provider_id(id, name, avatar_url)
    `)
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Listar pedidos recebidos (Provider)
const getReceivedOrders = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(*),
      client:users!client_id(id, name, avatar_url)
    `)
    .eq('provider_id', user!.id)
    .order('created_at', { ascending: false })
  
  return { data, error }
}
```

### Pagamentos

```typescript
// Processar pagamento (Client)
const processPayment = async (orderId: string, paymentMethod: string, amount: number) => {
  const { data, error } = await supabase.functions.invoke('process-payment', {
    body: {
      orderId,
      paymentMethod,
      amount,
    },
  })
  
  return { data, error }
}

// Verificar status do pagamento
const getPaymentStatus = async (orderId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single()
  
  return { data, error }
}
```

### Execução

```typescript
// Marcar início (Provider)
const markStartExecution = async (orderId: string) => {
  const { data, error } = await supabase
    .from('executions')
    .update({ provider_marked_start: true, started_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .select()
    .single()
  
  return { data, error }
}

// Confirmar início (Client)
const confirmStartExecution = async (orderId: string) => {
  const { data, error } = await supabase
    .from('executions')
    .update({ client_confirmed_start: true })
    .eq('order_id', orderId)
    .select()
    .single()
  
  // Atualizar status do pedido
  await supabase
    .from('orders')
    .update({ status: 'in_execution' })
    .eq('id', orderId)
  
  return { data, error }
}

// Marcar conclusão (Provider)
const markFinishExecution = async (orderId: string) => {
  const { data, error } = await supabase
    .from('executions')
    .update({ 
      provider_confirmed_finish: true,
      ended_at: new Date().toISOString()
    })
    .eq('order_id', orderId)
    .select()
    .single()
  
  // Atualizar status do pedido
  await supabase
    .from('orders')
    .update({ status: 'awaiting_finish_confirmation' })
    .eq('id', orderId)
  
  return { data, error }
}

// Confirmar conclusão (Client)
const confirmFinishExecution = async (orderId: string) => {
  const { data, error } = await supabase
    .from('executions')
    .update({ client_confirmed_finish: true })
    .eq('order_id', orderId)
    .select()
    .single()
  
  // Liberar pagamento (automático via Edge Function)
  // O sistema detecta ambas confirmações e libera o pagamento
  
  return { data, error }
}
```

### Avaliações

```typescript
// Criar avaliação (Client)
const createRating = async (orderId: string, providerId: string, score: number, comment?: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      order_id: orderId,
      client_id: user!.id,
      provider_id: providerId,
      score,
      comment,
    })
    .select()
    .single()
  
  // O trigger update_rating_after_insert atualiza automaticamente
  // o rating_average e total_ratings do provider
  
  return { data, error }
}

// Buscar avaliações de um prestador
const getProviderRatings = async (providerId: string) => {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      client:users!client_id(name, avatar_url)
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}
```

### Perfil do Prestador

```typescript
// Criar/Atualizar perfil profissional
const updateProviderProfile = async (profileData: {
  bio?: string
  professional_title?: string
  document_cpf?: string
  document_rg?: string
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  // Tentar atualizar primeiro
  const { data: existing } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user!.id)
    .single()
  
  if (existing) {
    // Atualizar
    const { data, error } = await supabase
      .from('provider_profiles')
      .update(profileData)
      .eq('user_id', user!.id)
      .select()
      .single()
    
    return { data, error }
  } else {
    // Criar
    const { data, error } = await supabase
      .from('provider_profiles')
      .insert({
        ...profileData,
        user_id: user!.id,
      })
      .select()
      .single()
    
    return { data, error }
  }
}

// Buscar perfil profissional
const getProviderProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return { data, error }
}
```

---

## 🔔 Realtime Subscriptions

```typescript
// Escutar novos pedidos (Provider)
const subscribeToNewOrders = (providerId: string, callback: (order: any) => void) => {
  const subscription = supabase
    .channel('new-orders')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `provider_id=eq.${providerId}`,
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()
  
  return subscription
}

// Escutar mudanças de status do pedido (Client)
const subscribeToOrderStatus = (orderId: string, callback: (order: any) => void) => {
  const subscription = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()
  
  return subscription
}

// Cancelar subscription
subscription.unsubscribe()
```

---

## 🎯 Próximos Passos

1. ✅ Copiar exemplos acima para seus componentes
2. ✅ Testar autenticação
3. ✅ Implementar fluxo de serviços
4. ✅ Implementar fluxo de pedidos
5. ✅ Integrar pagamentos
6. ✅ Testar fluxo completo

---

## 📚 Documentação Completa

- [README_DATABASE.md](./README_DATABASE.md) - Resumo executivo
- [.agent/DATABASE_IMPLEMENTATION.md](./.agent/DATABASE_IMPLEMENTATION.md) - Estrutura detalhada
- [.agent/SUPABASE_CREDENTIALS.md](./.agent/SUPABASE_CREDENTIALS.md) - Credenciais
- [.agent/DATABASE_MIGRATIONS.md](./.agent/DATABASE_MIGRATIONS.md) - SQL das migrações

---

**Pronto para começar! 🚀**

# 🧪 Plano de Testes Práticos: Talent Connect (Sprint de Validação)

## 1. Overview
Este plano operacional visa testar o ecossistema Talent Connect em um cenário real (Handshake), passando pelo cadastro, contratação, execução e liberação de pagamento (Escrow), além da governança administrativa via ERP.

**Project Type**: WEB (Vite + React)  
**Dominante**: Marketplace & Operações Financeiras  

---

## 2. Success Criteria
- [ ] Conexão Supabase 100% (Splash Screen < 1s)
- [ ] Fluxo "Happy Path" concluído para um serviço de R$ 200
- [ ] Retenção de Escrow confirmada e Liberação via Edge Function
- [ ] Admin ERP visualiza a Timeline completa do pedido sem falhas de dados

---

## 3. Tech Stack
- **Frontend**: React 19 + Vite + Tailwind (Design Signature Refinement)
- **Backend**: Supabase (Auth, DB, Edge Functions)
- **State**: Zustand (App Store)
- **Payment Strategy**: Escrow retido no status `paid_escrow_held`

---

## 4. File Structure (Core de Teste)
```
Talent Connect/
├── services/             # Lógica de conexão
│   └── supabaseClient.ts
├── screens/              # Fluxo de UI
│   ├── Login.tsx
│   ├── ClientDashboard.tsx
│   ├── ProviderDashboard.tsx
│   └── AdminDashboard.tsx
└── supabase/             # Regras de Banco
    ├── functions/        # Edge Functions (Payment Release)
    └── migrations/       # RLS & Schemas
```

---

## 5. Task Breakdown

| Task ID | Name | Agent | Skills | Priority | Dependency | Verification |
|---------|------|-------|--------|----------|------------|--------------|
| **TS-001** | **Infra: Check Conn & .env** | `backend-specialist` | `vulnerability-scanner` | P0 | - | Vite dev log sem erros 500 ou Net Resolv. |
| **TS-002** | **DB: RLS & Permissions** | `database-architect` | `database-design` | P0 | TS-001 | Rodar `supabase_fix_permissions.sql`. |
| **TS-003** | **Auth: Provisioning** | `test-engineer` | `webapp-testing` | P1 | TS-002 | Criar 1 Conta Client e 1 Conta Provider. |
| **TS-004** | **Flow: Marketplace** | `test-engineer` | `brainstorming` | P1 | TS-003 | Provider cadastra serviço; Client agenda pedido. |
| **TS-005** | **Flow: Payment & Escrow** | `backend-specialist` | `api-patterns` | P1 | TS-004 | Pagar pedido; Ver `escrow_status: 'held'` no DB. |
| **TS-006** | **Flow: Handshake Execution** | `test-engineer` | `webapp-testing` | P2 | TS-005 | Iniciar -> Confirmar -> Finalizar -> Liberar $$. |
| **TS-007** | **ERP: Audit & Governance** | `orchestrator` | `ui-ux-pro-max` | P2 | TS-006 | Admin visualiza Timeline e Dossiê do pedido. |

---

## Phase X: Verification

### 1. Build & Lint
```bash
npm run build && npx tsc --noEmit
```

### 2. Functional Smoke Test
- [ ] Cadastro de Usuário (Client/Provider)
- [ ] Login bem sucedido
- [ ] Carregamento de Dashboard
- [ ] Fluxo de Pedido (Criação)

### 3. Security Check
- [ ] RLS impede que Client veja outros pedidos
- [ ] Escrow só libera dinheiro após confirmação dupla

---

## ✅ PHASE X COMPLETE
- Lint: [ ]
- Security: [ ]
- Build: [ ]
- Date: 2026-03-19

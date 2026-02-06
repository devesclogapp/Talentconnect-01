# Task: Refatoração, Estabilidade e Segurança de Tipos

Este documento detalha o plano para modernizar a arquitetura do Talent Connect, resolver problemas remanescentes de visibilidade e garantir segurança de tipos em toda a aplicação.

## 1. Objetivos
- [ ] **Visibilidade Final**: Corrigir cores fixas em telas secundárias (`ProviderDashboard`, `ServiceDetails`, `OrderHistory`, `Agenda`).
- [ ] **Arquitetura de Estado**: Migrar o estado global e navegação do `App.tsx` para um store **Zustand**.
- [ ] **Segurança de Tipos (TS)**: Definir interfaces rigorosas para `Order`, `Service`, `User` e `Provider` e remover o uso de `as any`.
- [ ] **Robustez de Dados**: Implementar validação simples nos serviços de dados.

## 2. Metodologia (4 Fases)

### Fase 1: Limpeza de UI (Visibilidade)
- Verificar e atualizar `screens/ProviderDashboard.tsx`.
- Verificar e atualizar `screens/ServiceDetails.tsx`.
- Verificar e atualizar `screens/OrderHistory.tsx`.
- Verificar e atualizar `screens/Agenda.tsx`.

### Fase 2: Definições de Tipos (`types.ts`)
- Criar interfaces completas para os modelos do Supabase.
- Tipar os retornos dos serviços (`ordersService`, `servicesService`, `authService`).
- Substituir `any` nas telas principais.

### Fase 3: Estado Global (Zustand)
- Instalar `zustand`.
- Criar `src/store/useAppStore.ts` (ou similar) para gerenciar:
    - `user` (auth state).
    - `view` (navegação).
    - `theme` (dark mode).
    - `activeOrder`/`selectedService` (transição entre telas).
- Refatorar `App.tsx` para usar o store e reduzir seu tamanho.

### Fase 4: Validação e Testes
- Verificar build do TypeScript (`npm run tsc`).
- Testar fluxos de navegação (Cliente e Prestador).
- Validar persistência do modo escuro.

## 3. Cronograma de Implementação

| Tarefa | Status | Descrição |
| :--- | :---: | :--- |
| Criar tipos base em `types.ts` | ⏳ | Definir contratos de dados. |
| Varredura de Visibilidade (Fase 1) | ⏳ | Corrigir cores fixas. |
| Preparar Zustand Store | ⏳ | Criar a lógica de estado global. |
| Refatorar `App.tsx` | ⏳ | Desmembrar o monolito. |
| Limpeza de `as any` nos serviços | ⏳ | Garantir segurança de ponta a ponta. |

---
**Próxima Ação**: Iniciar Fase 1 (Varredura de Visibilidade) e Fase 2 (Tipagem).

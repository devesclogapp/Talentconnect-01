# Plano de Implementação: Upgrade Operacional ERP (Admin Connect)

Este documento descreve a transição do ERP Talent Connect de um painel de visualização para um **Centro de Comando Operacional**.

## 1. ANÁLISE (Discovery & Research)

### Objetivos Técnicos
- **Base de Dados**: Expandir as tabelas `users`, `orders`, `disputes` e criar `transactions`, `kyc_documents` e `penalties`.
- **Governança**: Implementar gatilhos (triggers) de auditoria e score de risco.
- **Operação**: Criar páginas de detalhe e ações em massa.

### Premissas Adotadas
- **Score de Risco**: Lógica inicial: `(Disputas Abertas * 20) + (Cancelamentos Recentes * 10) - (Avaliações Positivas * 2)`.
- **KYC**: Focaremos no fluxo de status (Pendente/Aprovado/Rejeitado) e visualização de dados.
- **Financeiro**: "Gerar Repasse" criará um snapshot de transação e atualizará o saldo, com exportação para CSV.

---

## 2. PLANEJAMENTO (Task Breakdown)

### Fase 1: Infraestrutura de Dados e Auditoria (DB)
- [ ] Executar Migração SQL (Novas tabelas e colunas).
- [ ] Implementar Triggers de Auditoria Globais.
- [ ] Criar Edge Functions para processamento de Score de Risco.

### Fase 2: Dashboard e Fila Operacional
- [ ] Implementar Módulo de KPIs em Tempo Real.
- [ ] Criar Componente de "Fila de Urgências" (To-Do Admin).
- [ ] Adicionar Alertas Inteligentes (Fraude/Risco).

### Fase 3: Detalhes e Gestão Avançada (Entities)
- [ ] **Usuários**: Tela de Detalhe (Tabs: Resumo, Pedidos, Financeiro, Logs).
- [ ] **Pedidos**: Timeline de Eventos + Ações de Intervenção (Cancelamento Forçado).
- [ ] **Disputas**: Centro de Mediação + Registrador de Decisão Imutável.

### Fase 4: Centro Financeiro e Repasses
- [ ] Implementar Tela de Repasses (Bruto, Taxas, Líquido).
- [ ] Criar Módulo de Escrow (Bloqueio/Liberação de Fundos).
- [ ] Exportação de Relatórios Financeiros (CSV).

---

## 3. SOLUTIONING (Architecture & UI Design)

### Design System Operacional
- **Cores**: Neutralidade (Branco/Cinza/Preto) com acentos semânticos (Sucesso = Verde, Risco = Vermelho, Atenção = Amarelo).
- **Componentes**: Cards de KPI "Glanceable", Tabelas com Checkbox para Bulk Actions.

### Fluxos Críticos
- **Mediação**: Abertura de Disputa -> Análise Crítica (Audit Logs) -> Decisão (Liberar/Estornar/Parcial) -> Auditoria de Fechamento.
- **Risco**: Evento (Cancelamento) -> Atualização de Score -> Alerta no Dashboard Admin.

---

## 4. IMPLEMENTAÇÃO (Phase 1 Start)

**Próximo Passo Imediato**: Executar a migração de banco de dados para suportar as novas colunas de score, kyc e status operacionais.

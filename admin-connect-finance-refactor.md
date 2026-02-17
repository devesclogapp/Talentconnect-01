# Plano de Implementação: Centro Financeiro (Admin Connect)

Este documento detalha o plano para transformar a tela Financeira em um módulo contábil auditável com controle de escrow, ledger estruturado e conciliação global.

## 1. Visão Geral e Arquitetura

A refatoração transformará o `AdminFinance.tsx` de uma listagem passiva em um console de governança financeira. Utilizaremos o sistema de design premium estabelecido e expandiremos a lógica de dados para refletir um ledger contábil.

## 2. Mudanças na Estrutura de Dados e Helpers

### 2.1 Enriquecimento de Transações
- **Cálculo de Aging de Escrow**: Categorizar pagamentos retidos em colchetes (<7d, 7-14d, 14-30d, >30d).
- **Mapeamento de Transações (Ledger)**: Transformar registros de `payments` e `transactions` em entradas de ledger com De/Para (Dupla Entrada).

### 2.2 Auditoria Financeira
- Atualização do `logAdminAction` financeiro para incluir:
    - `before_state` e `after_state`
    - Metadados do executor (UA, IP sim., Platform)
    - Origem: 'ERP Financeiro Connect'

## 3. Componentes de Interface (UI)

### 3.1 Dashboard Contábil (KPIs)
- **GMV Strategic**: Cards com comparativo e colchetes temporais.
- **Escrow Aging**: Visualização de "dinheiro parado" por tempo.
- **Payout Health**: Gráfico de status de pagamentos aos profissionais.

### 3.2 Ledger Estratégico (Tabela)
- Colunas: [Protocolo/Data] | [Tipo/Participante] | [Financeiro (Bruto/Taxa/Líquido)] | [Status Escrow] | [Ação]
- Filtros Avançados: Por período, modalidade, status de conciliação e risco financeiro.

### 3.3 Dossier de Transação (Modal Expandido)
- **Aba Resumo**: Timeline financeira (do depósito ao saque).
- **Aba Ledger**: Visualização de partidas dobradas (Débito/Crédito).
- **Aba Gateway**: Inspecionamento de logs de integração (webhooks simulados).
- **Aba Auditoria**: Rastro completo de intervenções administrativas.

## 4. Fluxo de Execução

### Fase 1: Infraestrutura e Auditoria
- [ ] Implementar `logFinancialAction` com rastro digital completo.
- [ ] Criar helpers para cálculo de aging e taxas dinâmicas.

### Fase 2: Dashboard e Ledger
- [ ] Substituir `FinanceCard` pelo novo `AccountingCard` com tendências.
- [ ] Implementar a tabela de Ledger estruturada com badges dinâmicos.

### Fase 3: Dossier e Intervenções
- [ ] Construir o Dossier detalhado com abas.
- [ ] Implementar a lógica de ações administrativas (Bloqueio, Liberação, Estorno, Conciliação).

### Fase 4: Conciliação Global
- [ ] Criar a lógica de "Check-up" de divergências entre saldo interno e gateway.

## 5. Definições Técnicas para Ledger

| Campo | Lógica / Fonte |
|-------|----------------|
| **Gross** | `amount_total` (total pago pelo cliente) |
| **Fee** | `operator_fee` (comissão da operadora) |
| **Net** | `provider_amount` (líquido para o prestador) |
| **Aging** | `now() - created_at` (em dias) |
| **Escrow Bracket** | < 7d (Green) | 7-14d (Yellow) | 14-30d (Orange) | > 30d (Critical Red) |

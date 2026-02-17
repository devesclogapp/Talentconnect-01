# 🛠️ Plano de Implementação: Admin Connect - Fluxo de Pedidos

## 1. Visão Geral
Transformar a tela de Gestão de Pedidos em uma central de comando de alta precisão, focada em segurança financeira (Escrow), mitigação de risco e conformidade (Auditoria).

## 2. Mudanças de Arquitetura & Dados
- **Enriquecimento de Dados (Frontend-side):**
  - Implementar `calculateSLAStatus` (Verde, Amarelo, Vermelho, Crítico).
  - Implementar `calculateFinancialAging` para Escrow retido.
  - Implementar `calculateRiskScore` (algoritmo multicritério).
- **Auditoria Pro:**
  - Atualizar `logAdminAction` para capturar IP e UserAgent (via headers/cliente).
  - Estruturar payloads `before/after` para ações críticas.

## 3. Componentes de Interface
### 3.1 Dashboard de Eficiência (Top Section)
- Grid de 4-colunas com KPIs:
  - Avg Accept Time
  - % Disputas
  - Escrow Total Retido
  - SLA Health (% Dentro do prazo)

### 3.2 Tabela Operacional Estratégica
- Colunas:
  - Protocolo/Serviço
  - Financeiro (Bruto | Taxa | Líquido)
  - SLA (Tempo Restante + Badge de Status)
  - Risco (Score %)
  - Ação Expressa

### 3.3 Dossiê Detalhado (Side Drawee/Modal)
- **Aba Timeline:** Histórico imutável com ícones distintos por ator.
- **Aba Financeiro:** Breakdown completo da transação + Status do Gateway.
- **Aba Risco:** Indicadores de reincidência e scores.
- **Console de Comando:** Menu de ações administrativas (Cancelar, Estornar, Liberar).

## 4. Ordem de Execução
1. [ ] **Fase 1: Infra & Helpers** - Atualizar lógica de fetch e utilitários de cálculo.
2. [ ] **Fase 2: Estrutura da Tabela** - Adicionar novas colunas e estilização premium.
3. [ ] **Fase 3: Dashboard de Eficiência** - Implementar o painel superior.
4. [ ] **Fase 4: Dossiê & Console** - Refatorar o detalhamento do pedido e ações críticas.
5. [ ] **Fase 5: Auditoria & Validação** - Integrar logs estruturados e testes de fluxo.

## 5. Definições Técnicas (SLA & Risco)
- **SLA Amarelo:** < 20% do tempo restante até o agendamento.
- **SLA Vermelho:** Estourado (tempo real > agendado sem confirmação de início).
- **Risco:**
  - Pedido > R$ 1.000: +20 pts
  - Prestador < 3 serviços: +30 pts
  - Reincidência de disputa: +50 pts

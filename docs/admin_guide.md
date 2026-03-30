# Guia de Interface Administrativa - Talent Connect

Este guia detalha cada módulo do Painel do Operador (ERP), explicando as funcionalidades, a lógica de negócio e as ferramentas de governança disponíveis para a administração do marketplace.

---

## 🏗️ Arquitetura e Navegação

O painel administrativo é acessado via `/admin` e está estruturado sob o `AdminLayout.tsx`. A navegação lateral organiza o sistema em camadas de inteligência:

1.  **Dashboard**: Visão estratégica e auditoria.
2.  **Financeiro**: Fluxo de caixa e liquidez.
3.  **Gestão Operacional**: Ciclo de vida dos pedidos.
4.  **Mediação**: Resolução de conflitos (Escrow).
5.  **Usuários e Serviços**: Governança de catálogo e identidade.

---

## 📊 1. Dashboard (Visão Estratégica)

O Dashboard é o centro de comando em tempo real. Ele combina indicadores macro com micro-detalhes de eventos.

### Funcionalidades:
*   **KPI Strip**: Monitoramento de GMV, Pedidos, Usuários e Risco Médio.
*   **Live Audit Trail**: Fluxo contínuo de logs de auditoria. Cada evento pode ser clicado para abrir o **Dossiê de Negociação**.
*   **Detecção de Risco**: Sinalização imediata de negociações em estado crítico ou atenção.

---

## 💰 2. Central Financeira

A tela de finanças gerencia a saúde econômica da plataforma, focando em transparência e intervenção em Escrow.

### Funcionalidades:
*   **GCW (Gross Contract Value)**: Valor total em contratos ativos.
*   **Gestão de Escrow**: Visualização detalhada de valores retidos e liberados.
*   **Live Ledger**: Gráfico de performance financeira (GMV vs Receita).
*   **Dossiê Financeiro**: Detalhamento da simulação contábil para cada pedido, permitindo:
    *   **Liberar Pagamento**: Forçar o repasse ao profissional.
    *   **Estornar Cliente**: Devolver o valor retido ao cliente.

---

## 👥 3. Gestão de Usuários (Governança)

Foca no controle de identidade (KYC) e comportamento dos usuários (Risco).

### Funcionalidades:
*   **Verificação de KYC**: Visualização de documentos (Frente, Verso, Selfie) para aprovação ou rejeição manual.
*   **Score de Risco**: Algoritmo que calcula a confiabilidade do usuário baseado em:
    *   Status de KYC.
    *   Número de disputas em aberto.
    *   Taxa de cancelamento.
*   **Painel de Ações**: Bloqueio e reativação de contas com justificativa obrigatória registrada em auditoria.

---

## ⚖️ 4. Mediação de Conflitos

O módulo mais sensível do sistema, onde o administrador atua como juiz em disputas operacionais.

### Funcionalidades:
*   **Decision Intelligence**: Painel que compara o histórico de confiança do Cliente vs Profissional.
*   **Dossiê de Negociação**: Timeline completa de eventos, desde a criação do pedido até a abertura da disputa.
*   **Sistema de Evidências**: Permite ao admin marcar evidências (GPS, Logs, SLA) antes de emitir a **Sentença**.
*   **Execução de Sentença**: Ação direta sobre o contrato (Liberar Escrow ou Estornar Cliente).

---

## 📦 5. Gestão Operacional de Pedidos

Monitoramento do ciclo de vida das transações e garantia de SLA.

### Funcionalidades:
*   **SLA Monitor**: Cálculo de *aging* (horas passadas) para pedidos aguardando aceite ou início.
*   **Risk Bar**: Barra visual que indica o perigo de uma transação se tornar uma disputa.
*   **Intervenção Operacional**: Possibilidade de "Forçar Conclusão" ou "Forçar Cancelamento" para destravar fluxos parados.

---

## 🛠️ 6. Catálogo Global (Serviços)

Controle editorial e de qualidade sobre o que é oferecido na plataforma.

### Funcionalidades:
*   **Editorial Hold**: Possibilidade de pausar ou banir serviços que apresentem baixo desempenho ou denúncias.
*   **Métricas de Performance**: Avaliação média do serviço, taxa de cancelamento e receita gerada nos últimos 30 dias.
*   **Dossiê do Serviço**: Histórico de edições e incidentes relacionados a um serviço específico.

---

## 🛰️ Sistemas de Inteligência Interna

### Smart Tags Dinâmicas
Componentes clicáveis que representam entidades reais (👤 Cliente, 🧰 Profissional, 💰 Valor). Ao pairar o mouse, revelam dados detalhados sem trocar de tela.

### Audit Log Narrativo
Todos os eventos técnicos são convertidos em uma timeline narrativa e imutável, garantindo que cada intervenção administrativa tenha um rastro de responsabilidade.

---
*Documentação gerada pelo Sistema Antigravity / Talent Connect Docs.*

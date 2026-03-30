# Talent Connect — Guia da Interface do Profissional (Provider)

Este guia detalha a experiência mobile dedicada ao Prestador de Serviços (Profissional) no ecossistema Talent Connect, com foco em gestão de catálogo, execução de ordens e visibilidade financeira.

---

## 1. Dashboard Operacional (O Cockpit)
O Dashboard é o ponto de entrada central, projetado para fornecer consciência situacional imediata.

### 📊 Métricas de Performance
- **Saldo Disponível**: Valor líquido acumulado (após taxas da operadora).
- **Indicador de Crescimento**: Comparativo percentual em relação ao mês anterior.
- **Contadores de Status**: Acesso rápido a pedidos `Pendentes` e `Agendados`.

### 🛡️ Status de Verificação (KYC)
- **Banner de Alerta**: Exibido enquanto o perfil não for `approved`.
- **Estados**: `Verificação Necessária` (pendente envio) ou `Em Análise` (enviado, aguardando admin).

---

## 2. Gestão de Catálogo (Meus Serviços)
Interface para o profissional gerenciar sua vitrine de serviços.

### ⚙️ Funcionalidades principais:
- **Criação Flexível**: Registro de novos serviços com suporte a:
    - **Preço Fixo**: Valor único pelo escopo.
    - **Por Hora**: Cobrança baseada no tempo de execução (Timer).
- **Controle de Disponibilidade**: Botão de **Pausar/Reativar** para controle de agenda sem necessidade de excluir o serviço.
- **Imagens Automáticas**: O sistema vincula imagens premium baseadas na categoria selecionada para garantir estética consistente no marketplace.

---

## 3. Gestão de Pedidos e Negociação
Fluxo de recebimento e ajuste de propostas.

### 📦 Pedidos Recebidos
- Lista filtrável por status: `Pendentes`, `Agendados`, `Concluídos`.
- **Order Card**: Visualização rápida do cliente, valor e data solicitada.

### 🤝 Fluxo de Negociação
Interface dedicada para ajustes antes do aceite final:
- **Contraproposta**: O profissional pode sugerir um novo valor baseado na complexidade.
- **Linha do Tempo**: Stepper vertical que rastreia desde a `Proposta Recebida` até o `Serviço Agendado`.
- **Disputa Preventiva**: Opção de abrir chamado de suporte caso haja desacordo no valor antes da execução.

---

## 4. Execução e Controle de SLA
O centro de gravidade da operação durante a prestação do serviço.

### ⚡ Service Execution (Painel Real-time)
- **Regra de Início**: O botão de início só é liberado 10 minutos antes do agendamento (Safety Protocol).
- **Timer de Precisão**: Para serviços por hora, o sistema exibe um cronômetro persistente.
- **Dupla Confirmação**: 
    1. O profissional marca início (aguarda confirmação do cliente).
    2. O profissional marca fim (aguarda confirmação do cliente para liberação do pagamento).

---

## 5. Central de Ganhos (Financeiro)
Transparência total sobre a saúde financeira do profissional.

### 💰 Funcionalidades:
- **Gráfico de Performance**: Histórico de ganhos nos últimos 7 dias.
- **Detalhamento de Transação**: Expansão de cada serviço para ver:
    - **Valor Bruto** (Pago pelo cliente).
    - **Taxa Operadora** (Retenção da plataforma).
    - **Valor Líquido** (Repasse final).
- **Solicitação de Saque**: Interface para movimentar o saldo disponível para a conta bancária.

---

## 6. Governança e Perfil
- **Submissão de Documentos**: Interface de upload para CNH/RG e Selfie de segurança.
- **Agenda**: Visualização em calendário das obrigações futuras para evitar conflitos de horário.
- **Lista de Clientes**: Repositório de contatos que já contrataram o profissional, facilitando a fidelização.

---

## Regras de Negócio Críticas (Resumo)
1. **Escrow Requirement**: O profissional sabe que o pagamento está garantido quando o status muda para `paid_escrow_held`.
2. **SLA de Início**: O sistema monitora a pontualidade através dos logs de execução.
3. **Repasse Automático**: O crédito no `Saldo Disponível` ocorre imediatamente após a confirmação de conclusão pelo cliente.

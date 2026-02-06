---
trigger: always_on
---

# 📘 PRD — Tallent Conect (Atualizado com TELAS por Perfil)

## 1. Visão do Produto
- **Objetivo principal**: Intermediar contratação e execução de serviços presenciais com pagamento retido, validação de presença/início e confirmação de conclusão.
- **Problema que resolve**: Falta de confiança e previsibilidade no ciclo “contratar → executar → pagar”.
- **O que o sistema NÃO faz**:
  - Não permite contratação sem registro de pedido.
  - Não libera pagamento sem regras de confirmação definidas no fluxo.
  - Operadora (ERP) não executa pagamentos; apenas acompanha, audita e trata exceções.

## 2. Usuários e Permissões

### 2.1 Tipos de usuários
- Cliente (mobile)
- Prestador (mobile)
- Operadora (ERP web/desktop)

### 2.2 Permissões por tipo

#### Cliente
- Acessar telas do **Perfil Cliente** בלבד.
- Criar e acompanhar pedidos.
- Definir local/data/hora após aceite do prestador (quando aplicável ao fluxo).
- Realizar pagamento.
- Confirmar presença/início (quando solicitado).
- Confirmar conclusão do serviço.
- Abrir disputa/ajuda.
- Avaliar prestador (após conclusão).

#### Prestador
- Acessar telas do **Perfil Prestador** בלבד.
- Criar/editar serviços.
- Receber pedidos.
- Aceitar/recusar pedidos.
- Registrar status de execução (por hora ou por unidade).
- Consultar saldo e histórico de pagamentos.
- Abrir disputa/avisos.

#### Operadora (ERP)
- Acesso administrativo a dados e auditoria:
  - Usuários, serviços, pedidos, status, pagamentos (somente acompanhamento), logs, disputas, indicadores.
- Ações administrativas:
  - Gestão de casos (disputas/ajuda), bloqueios operacionais, revisão de logs.
- **Proibido**: executar pagamento manual, alterar repasse fora das regras do sistema.

## 3. Fluxo Principal (Happy Path)

### 3.1 Fluxo Cliente (contratação e conclusão)
1. Cliente faz login.
2. Cliente navega na Home e acessa listagem/busca.
3. Cliente escolhe serviço/prestador e cria um pedido.
4. Sistema envia pedido ao prestador.
5. Prestador aceita o pedido.
6. Cliente define local/data/hora (se ainda não definido no pedido) e confirma.
7. Cliente realiza pagamento (valor fica retido).
8. No dia/hora, prestador sinaliza início/chegada conforme modalidade.
9. Cliente confirma presença do prestador quando solicitado.
10. Prestador executa o serviço.
11. Prestador finaliza e cliente confirma conclusão.
12. Sistema libera repasse: prestador + taxa operadora.

### 3.2 Fluxo Prestador (recebimento e execução)
1. Prestador faz login.
2. Prestador mantém catálogo de serviços.
3. Prestador recebe pedido e visualiza detalhes.
4. Prestador aceita ou recusa.
5. Se aceito, prestador segue para execução conforme modalidade:
   - Por hora: iniciar → em execução → finalizar execução
   - Por unidade: finalizar serviço
6. Prestador acompanha saldo e histórico de pagamentos.

## 4. Funcionalidades do MVP (lista fechada)

### 4.1 Core marketplace
- Autenticação e seleção de perfil (Cliente / Prestador)
- Cadastro de prestador e perfil profissional
- Cadastro e gestão de serviços (criar/editar) pelo prestador
- Listagem e visualização de serviços/prestadores pelo cliente
- Criação de pedido pelo cliente
- Aceite/recusa do pedido pelo prestador
- Pagamento retido (escrow)
- Gestão de status do pedido (timeline/estado)
- Registro de início e execução (por hora) e finalização (por hora/unidade)
- Confirmação de conclusão por ambas as partes
- Avaliação do prestador (pós-conclusão)
- Histórico (pedidos do cliente; serviços/pagamentos do prestador)
- Disputas/Ajuda (cliente) e Disputas/Avisos (prestador)

### 4.2 ERP Operadora (web/desktop)
- Dashboard com indicadores
- Listagem e detalhe de usuários, serviços, pedidos
- Acompanhamento de pagamentos e repasses (somente leitura operacional + status)
- Logs de eventos e auditoria
- Gestão de disputas/casos

## 5. Estrutura de Telas (Obrigatória)

### 5.1 Telas — Perfil Cliente (Mobile)
Após login e seleção do perfil Cliente, o usuário terá acesso às seguintes telas:
1. Login
2. Cadastro
3. Recuperar Senha
4. Home do Cliente
5. Listagem de Serviços
6. Listagem de Prestadores
7. Perfil do Prestador
8. Criar Pedido
9. Confirmação de Pedido
10. Acompanhamento do Pedido (status do serviço)
11. Detalhe do Pedido
12. Pagamento
13. Confirmação de Conclusão do Serviço
14. Avaliação do Prestador
15. Histórico de Pedidos
16. Disputa / Ajuda

**Restrições de navegação (Cliente)**
- Cliente não acessa: Criar/Editar Serviço, Saldo do Prestador, Histórico de Pagamentos, Lista de Pedidos Recebidos.
- A tela **Pagamento** só é acessível quando o pedido estiver em estado que exige pagamento.
- A tela **Avaliação do Prestador** só é acessível após conclusão confirmada.

### 5.2 Telas — Perfil Prestador (Mobile)
Após login e seleção do perfil Prestador, o usuário terá acesso às seguintes telas:
1. Login
2. Cadastro de Prestador
3. Perfil Profissional
4. Home do Prestador
5. Criar Serviço
6. Editar Serviço
7. Lista de Pedidos Recebidos
8. Detalhe do Pedido
9. Aceitar / Recusar Pedido
10. Iniciar Execução (para serviços por hora)
11. Em Execução (status do serviço)
12. Finalizar Execução (serviço por hora)
13. Finalizar Serviço (serviço por unidade)
14. Saldo do Prestador
15. Histórico de Pagamentos
16. Histórico de Serviços Prestados
17. Disputas / Avisos

**Restrições de navegação (Prestador)**
- Prestador não acessa: Listagem de Prestadores (como cliente), Pagamento (como cliente), Histórico de Pedidos do cliente.
- Telas de execução por hora (Iniciar/Em Execução/Finalizar Execução) só existem para pedidos com modalidade “por hora”.
- Tela “Finalizar Serviço (por unidade)” só existe para modalidade “valor fixo/unidade”.

### 5.3 Telas — ERP Operadora (Web/Desktop)
- Login Operadora
- Dashboard (indicadores)
- Usuários (lista + detalhe)
- Prestadores (lista + detalhe + status operacional)
- Serviços (lista + detalhe)
- Pedidos (lista + detalhe + status + linha do tempo)
- Pagamentos (acompanhamento: retenção, repasse, taxas, status)
- Disputas (fila + detalhe + resolução operacional)
- Logs (eventos e auditoria)

## 6. Modelo de Dados (Simplificado)

- User
  - id
  - email
  - role (client | provider | operator)
  - name
  - created_at

- ProviderProfile
  - id
  - user_id
  - bio
  - documents_status
  - active (bool)

- Service
  - id
  - provider_id (User.id)
  - title
  - description
  - pricing_mode (hourly | fixed)
  - base_price
  - active (bool)

- Order
  - id
  - client_id (User.id)
  - provider_id (User.id)
  - service_id (Service.id)
  - pricing_mode (hourly | fixed)
  - scheduled_at
  - location_text
  - status (enum fechado; ver Regras)
  - created_at

- Payment
  - id
  - order_id
  - amount_total
  - operator_fee
  - provider_amount
  - escrow_status (pending | held | released | failed | refunded)
  - created_at

- Execution
  - id
  - order_id
  - started_at
  - ended_at
  - provider_marked_start (bool)
  - client_confirmed_start (bool)
  - provider_confirmed_finish (bool)
  - client_confirmed_finish (bool)

- Rating
  - id
  - order_id
  - client_id
  - provider_id
  - score (1-5)
  - comment (optional)

- Dispute
  - id
  - order_id
  - opened_by (client|provider)
  - reason
  - status (open | in_review | resolved | closed)
  - created_at

- AuditLog
  - id
  - actor_user_id
  - entity_type
  - entity_id
  - action
  - payload_json
  - created_at

## 7. Regras Técnicas e Restrições (Imutáveis)

### 7.1 Separação de perfis
- O app mobile opera em **modo Cliente** ou **modo Prestador** após seleção de perfil.
- É proibido misturar telas e permissões entre perfis.

### 7.2 Estados do Pedido (enum fechado)
- draft (criado pelo cliente, não enviado) — opcional se a UI exigir
- sent (pedido enviado ao prestador)
- accepted
- rejected
- awaiting_details (aguardando local/data/hora, se aplicável)
- awaiting_payment
- paid_escrow_held
- awaiting_start_confirmation
- in_execution
- awaiting_finish_confirmation
- completed
- disputed
- cancelled

### 7.3 Pagamento (escrow)
- Pagamento só ocorre quando o pedido estiver em estado que permite cobrança (ex.: accepted/awaiting_payment).
- Valor fica retido até condição de conclusão.
- Repasse ocorre automaticamente após conclusão confirmada conforme regra do fluxo.
- Operadora **não** altera repasses manualmente; somente acompanha status.

### 7.4 Execução por modalidade
- pricing_mode = hourly:
  - exige eventos: iniciar execução → em execução → finalizar execução
- pricing_mode = fixed:
  - exige evento: finalizar serviço

### 7.5 Confirmações obrigatórias
- Início: prestador sinaliza; cliente confirma (quando o fluxo exigir “confirmação de presença”).
- Fim: prestador confirma e cliente confirma.
- Sem dupla confirmação, o pedido não entra em “completed” e o repasse não é liberado.

### 7.6 Auditoria
- Toda mudança de status de Order, Payment, Execution e Dispute gera AuditLog.
- ERP exibe logs e histórico de estados por pedido.

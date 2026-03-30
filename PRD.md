# 📘 PRD — Talent Connect (Documento de Requisitos do Produto)

Versão: 1.0  
Status: Consolidado  

---

## 1. Visão Geral do Produto
O **Talent Connect** é um "Freelance Operating System" (Sistema Operacional para Freelancers) que atua como um marketplace inteligente de serviços locais. O sistema resolve a falta de confiança entre contratante e prestador através de um modelo de **pagamento retido (escrow)**, validação de execução e um ERP de inteligência operacional para mediação.

### Objetivos Estratégicos
- **Segurança**: Garantir que o prestador receba e o cliente tenha o serviço entregue.
- **Inteligência**: Prover dados para tomada de decisão no ERP.
- **Eficiência**: Automatizar o ciclo "contratar → executar → pagar".

---

## 2. Perfis de Usuário e Permissões

### 2.1 Cliente (Mobile)
- **Ações**: Buscar serviços/prestadores, criar pedidos, realizar pagamentos (escrow), confirmar início/fim de serviço, abrir disputas, avaliar prestadores.
- **Restrição**: Não visualiza dados financeiros internos ou painéis de outros prestadores.

### 2.2 Prestador (Mobile)
- **Ações**: Gerenciar catálogo de serviços, aceitar/recusar pedidos, registrar início e fim da execução, gerenciar agenda, visualizar saldo e histórico de ganhos.
- **Restrição**: Não realiza pagamentos para outros prestadores (dentro do perfil profissional).

### 2.3 Operadora / Admin (ERP Web)
- **Ações**: Auditoria de logs, gestão de usuários, mediação de disputas com veredito assistido, acompanhamento financeiro de taxas e repasses.
- **Restrição**: Proibida a execução manual de pagamentos fora das regras de segurança do sistema.

---

## 3. Fluxo Principal (Happy Path)

1.  **Descoberta**: Cliente navega por categorias ou busca prestadores.
2.  **Pedido**: Cliente cria um pedido (por hora ou valor fixo).
3.  **Aceite**: Prestador recebe notificação e aceita o pedido.
4.  **Escrow**: Cliente realiza o pagamento. O valor fica retido pelo sistema.
5.  **Execução**: 
    - No horário agendado, o prestador marca o **Início**.
    - O cliente confirma a presença (quando exigido).
6.  **Conclusão**: 
    - Prestador marca como **Finalizado**.
    - Cliente confirma a entrega.
7.  **Liquidação**: O sistema libera automaticamente o repasse ao prestador e a taxa da operadora.

---

## 4. Funcionalidades do app (MVP)

### 4.1 Marketplace (Cliente)
- **Home Inteligente**: Recomendações e categorias.
- **Busca Avançada**: Filtros por preço, rating e categoria.
- **Perfil do Prestador**: Portfólio, avaliações (AA+) e credenciais.
- **Rastreamento**: Timeline em tempo real do status do pedido.

### 4.2 Terminal do Prestador
- **Gestão de Serviços**: Criação de serviços com modo de preço (hora/fixo).
- **Dashboard de Ganhos**: Visão de valores pendentes, realizados e taxas.
- **Agenda**: Calendário integrado de compromissos.
- **KYC/Documentos**: Submissão de documentos para validação de perfil.

### 4.3 ERP de Inteligência (Admin)
- **Dossiê da Negociação**: Visão 360º de um pedido (Logs, Timeline, Risk Score).
- **Smart Tags**: Entidades dinâmicas (Cliente, Profissional, Valor) clicáveis para contexto rápido.
- **Centro de Disputas**: Mediação baseada em evidências de sistema (GPS, Timestamps).
- **Logs Narrativos**: Registro detalhado de cada ação administrativa.

---

## 5. Regras de Negócio Inegociáveis

- **Dupla Confirmação**: O pagamento só é liberado para o prestador após a confirmação de AMBAS as partes (ou intervenção admin).
- **Modos de Preço**:
    - *Por Hora*: Exige check-in e check-out cronometrado.
    - *Fixo*: Exige apenas confirmação de entrega.
- **Disputas**: Caso uma disputa seja aberta, o valor do escrow é bloqueado para qualquer repasse automático até a resolução manual.

---

## 6. Stack Técnica
- **Frontend**: Vite + React + TypeScript.
- **Estilização**: Tailwind CSS (Minimalista/Premium/Fintech).
- **Backend/DB**: Supabase (Auth, DB, Storage, Edge Functions).
- **IA**: Google Gemini (Sugestões de prospecção e resumo de disputas).
- **Tipografia**: Geh Geist / Inter.

---

## 7. Mapa de Telas

### Cliente
- Login / Cadastro / Onboarding
- Home / Listagem de Serviços / Perfil do Prestador
- Criar Pedido / Confirmação / Pagamento
- Meus Pedidos / Detalhe do Pedido / Tracking
- Avaliação / Disputa / Ajuda

### Prestador
- Dashboard do Prestador
- Meus Serviços / Cadastro de Serviço
- Pedidos Recebidos / Detalhe / Aceite e Recusa
- Fluxo de Execução (Iniciar/Pausar/Finalizar)
- Saldo / Ganhos / Agenda
- Documentos / Editar Perfil

### Admin
- Dashboard Admin
- Gestão de Usuários / Serviços
- Painel de Pedidos / Financeiro
- Central de Disputas / Auditoria de Logs

---

**Fim do Documento**

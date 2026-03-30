---
name: talent-connect-erp
description: >
  Build and iterate screens for the Talent Connect ERP Admin — a Freelance Operating System
  with escrow payments, dispute mediation, KYC validation, and operational intelligence.
  Use this skill whenever the user asks to: (1) build any screen of the Talent Connect admin
  (dashboard, pedidos, disputas, financeiro, usuários, auditoria), (2) add or update
  components specific to the marketplace domain (escrow, repasse, risk score, smart tags,
  logs narrativos), (3) create the light or dark version of any admin screen, (4) apply
  PRD rules to a new UI flow (dupla confirmação, bloqueio de escrow, veredito de disputa).
  Trigger when user mentions "talent connect", "ERP", "admin", "escrow", "disputa",
  "prestador", "repasse", "mediação", "KYC", "pedido", or any screen from the PRD map.
  Always read the folioblox-dashboard skill first for visual tokens and component CSS.
---

# Talent Connect ERP — Skill de Domínio

Este skill codifica o **domínio de negócio** do Talent Connect ERP Admin.
Para tokens visuais, componentes CSS e temas dark/light, consulte primeiro
o skill `folioblox-dashboard`.

---

## 1. Visão do Produto

**Talent Connect** é um Freelance Operating System — marketplace inteligente de serviços
locais com pagamento em escrow, validação de execução e ERP de inteligência operacional
para mediação.

**Três perfis:**
- **Cliente** (mobile) — contrata serviços, paga em escrow, confirma entrega
- **Prestador** (mobile) — gerencia serviços, executa, recebe repasse
- **Operadora / Admin** (ERP web) — este produto — audita, media disputas, libera repasses

---

## 2. Stack Técnica

```
Frontend:    Vite + React + TypeScript
Estilo:      Tailwind CSS (ou CSS puro com os tokens do folioblox-dashboard skill)
Backend/DB:  Supabase (Auth, DB, Storage, Edge Functions)
IA:          Google Gemini (sugestões de prospecção + resumo de disputas)
Tipografia:  DM Sans (via Google Fonts)
```

---

## 3. Regras de Negócio — Para Codificar na UI

### 3.1 Dupla Confirmação de Pagamento

O escrow só é liberado após confirmação de **ambas** as partes:

```
Prestador marca "Finalizado"
    → Cliente confirma entrega
        → Sistema libera repasse automaticamente
```

Se apenas uma parte confirmar, o escrow permanece retido.
Se nenhuma parte confirmar em X horas → fila para intervenção admin.

**UI implicada:** Botão "Liberar repasse" só deve estar ativo quando ambas confirmações existirem, ou quando o admin deliberadamente intervém.

### 3.2 Modos de Preço

| Modo | Validação exigida | UI |
|---|---|---|
| **Por hora** | Check-in + Check-out cronometrado com GPS | Exibir timer e timestamp de início |
| **Fixo** | Confirmação de entrega apenas | Exibir badge "Fixo" na tabela de pedidos |

### 3.3 Disputas — Fluxo de Bloqueio

```
Disputa aberta por qualquer parte
    → Escrow bloqueado imediatamente (automático)
    → Status muda para "Bloqueado" (vermelho)
    → Nenhum repasse automático até resolução
    → Admin abre "Centro de Mediação" com evidências:
        - GPS timestamps
        - Fotos enviadas
        - Logs do sistema
    → Admin emite veredito → escrow liberado para parte correta
```

**UI implicada:** Card de disputa com `border-left: 2px solid var(--red)`, Smart Tags clicáveis, botão "Iniciar mediação →".

### 3.4 KYC de Prestadores

Status possíveis: `validado` (verde) · `pendente` (amarelo) · `reprovado` (vermelho)

Prestadores sem KYC validado não devem receber repasses automáticos.

---

## 4. Mapa de Telas do ERP Admin

### 4.1 Dashboard Admin (tela atual)
**Seções:**
- Hero banner — volume total, escrow, repasses, disputas, taxa
- KPI row — Concluídos · Escrow · Disputas · Prestadores
- Main grid — Pedidos Recentes · Centro de Disputas · [Risk Score + Escrow Ativo]
- Second grid — Volume Financeiro · Top Prestadores · Agenda · [Logs + Saúde]

### 4.2 Gestão de Pedidos
**Colunas da tabela:** ID · Serviço · Cliente · Prestador · Valor · Tipo · Status · Escrow · Ações
**Filtros:** Status (todos/ativos/concluídos/disputas) · Tipo (hora/fixo) · Período
**Ações por linha:** Ver dossiê · Iniciar mediação · Liberar escrow · Bloquear

### 4.3 Centro de Disputas (tela dedicada)
**Componentes:**
- Lista de disputas com Smart Tags
- Painel lateral: Dossiê da Negociação (timeline + evidências + risk score)
- Área de veredito com campo de texto + botões Liberar/Estornar

**Dossiê da Negociação — campos:**
```
ID do Pedido · Serviço · Modalidade (hora/fixo)
Cliente: nome · rating · histórico
Prestador: nome · rating · KYC · histórico
Valor em escrow
Timeline de eventos (cada ação com timestamp + GPS se disponível)
Risk Score das partes
Evidências: fotos · logs · timestamps
```

### 4.4 Painel Financeiro
**Seções:**
- KPIs: Volume total · Repasses realizados · Taxa acumulada · Escrow ativo
- Gráfico: Volume mensal (área dupla: repasses + taxa)
- Tabela de repasses: prestador · serviço · valor bruto · taxa · valor líquido · data
- Filtros: período · prestador · status (liberado/pendente/bloqueado)

### 4.5 Gestão de Usuários
**Abas:** Clientes · Prestadores · Admins
**Colunas prestadores:** Avatar · Nome · Categoria · Rating · KYC · Ganhos · Status · Ações
**Ações:** Ver perfil · Validar KYC · Suspender · Ver pedidos

### 4.6 Auditoria de Logs
**Componentes:**
- Filtros: tipo de evento · usuário · período
- Timeline vertical com log-items tipados (ícone por categoria)
- Exportar CSV

---

## 5. Componentes Específicos do Domínio

### 5.1 Smart Tags (Centro de Disputas)

Entidades dinâmicas e clicáveis que aparecem em cards de disputa:

```html
<div class="disp-tags">
  <span class="smart-tag client">● {nome_cliente}</span>
  <span class="smart-tag provider">● {nome_prestador}</span>
  <span class="smart-tag value">R$ {valor_escrow}</span>
  <span class="smart-tag">Sem GPS</span>
  <span class="smart-tag">Sem timestamp</span>
  <span class="smart-tag">Fotos evidência</span>
</div>
```

**Tipos de tag semântica:**
- `.client` → azul (var(--blue))
- `.provider` → verde (var(--green))
- `.value` → amarelo (var(--yellow))
- sem classe → neutro (var(--text2))

**Evidências que podem virar tags:**
`Sem GPS` · `GPS confirmado` · `Sem timestamp` · `Check-out ausente` · `Fotos enviadas` · `Avaliação negativa` · `Histórico limpo`

### 5.2 Dossiê da Negociação

Card expandido para mediação de disputas:

```
┌─────────────────────────────────────────────────────────┐
│ Pedido #4821 · Reparo de Hidráulica · Por hora          │
├────────────────────────┬────────────────────────────────┤
│ CLIENTE                │ PRESTADOR                      │
│ Julia F. · 4.6★        │ Roberto A. · 3.8★              │
│ 12 pedidos · sem disp. │ 8 pedidos · 1 disputa anterior │
├────────────────────────┴────────────────────────────────┤
│ TIMELINE                                                │
│ 14:00  Check-in registrado ✓ (GPS: -23.55, -46.63)     │
│ 14:08  Disputa aberta pela cliente                      │
│ 14:09  Escrow bloqueado automaticamente                 │
│ —      Check-out: NÃO REGISTRADO                        │
├─────────────────────────────────────────────────────────┤
│ EVIDÊNCIAS: [Foto 1] [Foto 2] [Log completo]            │
├─────────────────────────────────────────────────────────┤
│ Risk Score: Roberto A. = 78/100 ⚠️ Alto                  │
├─────────────────────────────────────────────────────────┤
│ VEREDITO:  [Liberar para cliente]  [Liberar para prestador] │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Log Narrativo — Tipos de Evento

| Classe do ícone | Cor | Eventos |
|---|---|---|
| `.li-green` | var(--green) | Repasse liberado · Pedido concluído · KYC validado |
| `.li-red` | var(--red) | Disputa aberta · Escrow bloqueado · KYC reprovado |
| `.li-yellow` | var(--yellow) | KYC pendente · Confirmação pendente · Alerta de prazo |
| `.li-orange` | var(--accent) | Novo usuário · Novo pedido · Prestador onboarded |
| `.li-blue` | var(--blue) | Info geral · Pedido aceito · Check-in registrado |

### 5.4 Risk Score Ring

O score é calculado sobre 100. Referência de risco:

| Score | Cor | Classificação |
|---|---|---|
| 0–30 | var(--green) | Baixo |
| 31–60 | var(--yellow) | Moderado |
| 61–80 | var(--accent) | Alto |
| 81–100 | var(--red) | Crítico |

```js
// Atualizar ring dinamicamente
const score = 42; // valor 0-100
const pct = (score / 100 * 100).toFixed(0);
ring.style.background = `conic-gradient(${color} 0% ${pct}%, var(--surface2) ${pct}% 100%)`;
```

### 5.5 Status de Escrow — Estados Possíveis

| Estado | Cor | Descrição | Ação disponível |
|---|---|---|---|
| Ativo | var(--yellow) | Valor retido durante execução | Monitorar |
| Liberado | var(--green) | Repasse concluído | Ver comprovante |
| Bloqueado | var(--red) | Disputa em andamento | Mediar disputa |
| Pendente | var(--text3) | Aguardando confirmação | Aguardar ou intervir |

---

## 6. KPIs do Hero Banner — Mapeamento

```
#01 Em Escrow     → soma de todos os pedidos com escrow ativo (yellow)
#02 Repasses Hoje → total liberado no dia corrente (green)
#03 Disputas Abertas → contagem de disputas não resolvidas (red)
#04 Taxa da Plataforma → receita da operadora no período (accent)
```

Valor hero-h1 = **Volume Total do Mês** = soma de todos os pedidos concluídos + ativos.

---

## 7. Agenda de Execuções — Legendas do Calendário

```
.cld.exec  → verde  — execução agendada/em andamento neste dia
.cld.disp  → vermelho — disputa ativa neste dia
.cld.today → laranja (var(--accent)) — dia atual
.cld.dim   → text3 — dias fora do mês atual
```

---

## 8. Fluxo de Mediação — Passo a Passo para UI

```
1. Admin seleciona disputa na lista
2. Painel lateral expande: Dossiê completo
3. Admin lê timeline + evidências
4. Admin consulta Risk Score de cada parte
5. Admin escreve justificativa (campo de texto livre)
6. Admin clica: [Liberar para Cliente] ou [Liberar para Prestador]
7. Sistema:
   - Executa o repasse para a parte vencedora
   - Desconta taxa da plataforma
   - Registra log narrativo com justificativa do admin
   - Fecha a disputa
   - Notifica as duas partes (push mobile)
```

---

## 9. Próximas Telas a Desenvolver (Roadmap UI)

Em ordem de prioridade para o ERP:

1. **Tela de Pedido Individual** — Dossiê completo com timeline vertical
2. **Centro de Disputas dedicado** — tela full com mediação e veredito
3. **Painel Financeiro** — gráficos de volume, repasses e taxas
4. **Gestão de Usuários** — lista de prestadores com KYC inline
5. **Auditoria de Logs** — timeline filtrada por tipo e usuário

---

## 10. Mapeamento Folioblox → Domínio Talent Connect

| Elemento Folioblox | Talent Connect ERP |
|---|---|
| "Hey, I'm a Creative Director" | "Talent Connect · ERP Admin · Operadora" |
| Especialidades #01–#04 numeradas | Métricas #01 Escrow · #02 Repasses · #03 Disputas · #04 Taxa |
| Social Proof (logos de marcas) | KPI row (4 cards de métricas operacionais) |
| Portfolio Grid (imagens P&B) | Main grid (Pedidos + Disputas + Right col) |
| "Behind the Designs" | "Saúde da Plataforma" (progress bars) |
| Copy do About bold | Logs Narrativos tipados por evento |
| CTA "Get in touch →" | "Nova Auditoria" · "Iniciar mediação →" |

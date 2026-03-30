---
name: folioblox-dashboard
description: >
  Apply the Folioblox visual identity to dark or light ERP dashboards, admin panels,
  and data interfaces. Use this skill whenever the user wants to: (1) build or restyle
  an ERP admin dashboard with a dark/light premium aesthetic, (2) apply the orange-red
  gradient hero + DM Sans typography system to any interface, (3) create operational
  dashboards with escrow, dispute management, KPI cards, and narrative logs,
  (4) transform a generic dashboard into a branded editorial interface.
  Trigger even if the user says "aplique o conceito", "build the admin", "make it look
  premium", "gere a versão light/dark" — the skill covers both themes and the full
  component system. Always check if the user wants dark (default) or light mode.
---

# Folioblox Dashboard Skill

Sistema visual completo para dashboards ERP/Admin baseado na identidade Folioblox:
gradiente laranja-vermelho como hero, DM Sans como fonte única, acento `#FF5500`
como único hue cromático intencional, e dois temas (dark/light) com tokens
perfeitamente invertidos.

**Produto de referência:** Talent Connect ERP Admin — marketplace de serviços com
escrow, disputas, repasses e auditoria de logs.

---

## 1. Tokens de Cor

### Dark Mode (padrão)

```css
:root {
  --bg:         #0A0A0A;   /* palco escuro global */
  --surface:    #111111;   /* sidebar, topbar */
  --surface2:   #181818;   /* superfícies aninhadas */
  --card:       #141414;   /* todos os cards */
  --border:     rgba(255,255,255,0.07);
  --border-md:  rgba(255,255,255,0.13);

  --accent:     #FF5500;
  --accent2:    #FF8C00;
  --accent-dim: rgba(255,85,0,0.13);

  --text:       #FFFFFF;
  --text2:      rgba(255,255,255,0.52);
  --text3:      rgba(255,255,255,0.26);

  --green:      #1DB97A;
  --green-dim:  rgba(29,185,122,0.13);
  --yellow:     #F5C842;
  --yellow-dim: rgba(245,200,66,0.13);
  --red:        #E24B4A;
  --red-dim:    rgba(226,75,74,0.13);
  --blue:       #4A90E2;
  --blue-dim:   rgba(74,144,226,0.13);

  --radius:     16px;
  --radius-sm:  10px;
  --radius-xs:  7px;
}
```

### Light Mode

```css
:root {
  --bg:         #F4F4F2;   /* off-white quente */
  --surface:    #FFFFFF;
  --surface2:   #EBEBEA;
  --card:       #FFFFFF;
  --border:     rgba(0,0,0,0.08);
  --border-md:  rgba(0,0,0,0.16);

  --accent:     #E84800;   /* laranja escurecido — contraste WCAG */
  --accent2:    #FF7A00;
  --accent-dim: rgba(232,72,0,0.09);

  --text:       #111111;
  --text2:      rgba(17,17,17,0.52);
  --text3:      rgba(17,17,17,0.32);

  --green:      #0F9E60;   /* verde escuro para fundo claro */
  --green-dim:  rgba(15,158,96,0.09);
  --yellow:     #B28900;   /* âmbar escurecido */
  --yellow-dim: rgba(178,137,0,0.10);
  --red:        #C92B2B;
  --red-dim:    rgba(201,43,43,0.09);
  --blue:       #2565C7;
  --blue-dim:   rgba(37,101,199,0.09);

  --radius:     16px;
  --radius-sm:  10px;
  --radius-xs:  7px;
}
```

**Elevação no light mode** — cards precisam de sombra, já que a borda sozinha não cria profundidade suficiente:

```css
/* Adicionar no light mode */
.card       { box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04); }
.kpi-card   { box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
```

**Regra inegociável:** `--accent` é o único hue cromático intencional. No dark: `#FF5500`. No light: `#E84800`. Nenhuma segunda cor de acento.

---

## 2. Tipografia

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&display=swap');
```

**DM Sans é a única família.** Nenhum Syne, Inter, ou fonte genérica.

| Papel | Peso | Tamanho | Uso |
|---|---|---|---|
| Hero headline / KPI principal | 700 | 28–32px | `R$ 48.320,00`, totais |
| Stat secundário (right) | 700 | 24–26px | Total balance |
| Card title / topbar brand | 700 | 13–16px | `Pedidos Recentes`, `TalentConnect` |
| KPI value | 700 | 15px | Número dos 4 KPI cards |
| Pill valor no hero | 700 | 13px | `R$ 12.840`, `4 Casos` |
| Body / labels | 400–500 | 10–12px | Nomes, descrições |
| Muted / metadata | 300–400 | 9–11px | Timestamps, sub-labels |

---

## 3. Hero Banner — Componente de Identidade

O único elemento que **não muda entre dark e light**. Sempre o gradiente laranja-vermelho.

```css
.hero {
  background: linear-gradient(135deg, #FF6B00 0%, #CC2200 52%, #770000 100%);
  border-radius: 16px;
  padding: 20px 26px;
  display: flex; align-items: flex-start; justify-content: space-between;
  position: relative; overflow: hidden; gap: 20px;
}
.hero::before {           /* círculo decorativo superior-direito */
  content: ''; position: absolute; right: -40px; top: -40px;
  width: 220px; height: 220px; border-radius: 50%;
  background: rgba(255,255,255,0.04);
}
.hero::after {            /* círculo de sombra inferior */
  content: ''; position: absolute; left: 42%; bottom: -50px;
  width: 150px; height: 150px; border-radius: 50%;
  background: rgba(0,0,0,0.10);
}
```

### Pills #01–#04 (Folioblox Hero Footer → KPIs operacionais)

```html
<div class="hero-pills">
  <div class="hp">
    <div class="hp-num">#01 Em Escrow</div>
    <div class="hp-val">R$ 12.840</div>
  </div>
  <div class="hd"></div>   <!-- separador vertical -->
  <div class="hp">
    <div class="hp-num">#02 Repasses Hoje</div>
    <div class="hp-val">R$ 7.290</div>
  </div>
  <!-- #03 Disputas Abertas · #04 Taxa da Plataforma -->
</div>
```

```css
.hp     { display: flex; flex-direction: column; gap: 1px; padding-right: 16px; }
.hp-num { font-size: 9px; color: rgba(255,255,255,0.5); letter-spacing: 0.3px; }
.hp-val { font-size: 13px; font-weight: 700; color: #fff; }
.hd     { width: 0.5px; height: 26px; background: rgba(255,255,255,0.18); margin-right: 16px; }
```

---

## 4. Sistema de Cards

```css
.card {
  background: var(--card);
  border: 0.5px solid var(--border);
  border-radius: 16px;       /* --radius */
  padding: 16px 18px;
}

/* Superfície interna (token items, dispute items, escrow items) */
.inner-surface {
  background: var(--surface2);
  border: 0.5px solid var(--border);
  border-radius: 10px;       /* --radius-sm */
  padding: 9px 12px;
}
```

### Card Header

```html
<div class="card-hd">
  <div>
    <div class="card-title">Título do Card</div>
    <div class="card-sub">Subtítulo opcional</div>
  </div>
  <div class="card-acts">
    <!-- pills filtro + mini-icons -->
  </div>
</div>
```

```css
.card-hd    { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; gap: 8px; }
.card-title { font-weight: 700; font-size: 13px; letter-spacing: -0.1px; }
.card-sub   { font-size: 10px; color: var(--text3); margin-top: 2px; }
```

---

## 5. KPI Row (4 colunas)

Substitui o ticker row crypto. Cada card tem ícone semântico + label + valor + delta.

```css
.kpi-row  { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
.kpi-card { background: var(--card); border: 0.5px solid var(--border); border-radius: 10px; padding: 13px 15px; display: flex; align-items: center; gap: 10px; cursor: pointer; }
.kpi-icon { width: 33px; height: 33px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-icon svg { width: 15px; height: 15px; }

/* Variantes de cor do ícone — por semântica, não decoração */
.ki-green  { background: var(--green-dim);  color: var(--green); }   /* sucesso, concluído */
.ki-yellow { background: var(--yellow-dim); color: var(--yellow); }  /* escrow, pendente */
.ki-red    { background: var(--red-dim);    color: var(--red); }     /* disputa, alerta */
.ki-orange { background: var(--accent-dim); color: var(--accent); }  /* ativo, principal */
.ki-blue   { background: var(--blue-dim);   color: var(--blue); }    /* informação */

.kpi-label  { font-size: 10px; color: var(--text3); margin-bottom: 2px; }
.kpi-val    { font-weight: 700; font-size: 15px; letter-spacing: -0.4px; }
.kpi-delta  { font-size: 10px; margin-top: 2px; }
.delta-up   { color: var(--green); }
.delta-down { color: var(--red); }
.delta-warn { color: var(--yellow); }
```

**KPIs do Talent Connect:**
- `ki-green` → Pedidos Concluídos
- `ki-yellow` → Valor em Escrow
- `ki-red` → Disputas Abertas
- `ki-orange` → Prestadores Ativos

---

## 6. Tabela de Pedidos

Grid 6 colunas: status dot · serviço/partes · valor · tipo · badge · ação.

```css
.order-hrow, .order-row {
  display: grid;
  grid-template-columns: 28px 1fr 80px 72px 64px 56px;
  gap: 6px; align-items: center;
  padding: 9px 0; border-bottom: 0.5px solid var(--border);
  font-size: 11px;
}
.order-row:hover {
  background: rgba(255,255,255,0.02);  /* dark */
  /* light: rgba(0,0,0,0.02) */
  border-radius: 6px;
}
.order-row:last-child { border-bottom: none; }
```

Status dots:
```css
.status-dot { width: 6px; height: 6px; border-radius: 50%; margin: auto; }
.sd-green  { background: var(--green); }   /* Em execução */
.sd-yellow { background: var(--yellow); }  /* Aguardando início */
.sd-red    { background: var(--red); }     /* Disputa */
.sd-blue   { background: var(--blue); }    /* Escrow fixo */
```

Badges de status:
```css
.sbadge  { display: inline-flex; padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 600; }
.sb-exec { background: var(--green-dim);  color: var(--green); }
.sb-pend { background: var(--yellow-dim); color: var(--yellow); }
.sb-disp { background: var(--red-dim);    color: var(--red); }
.sb-done { background: rgba(255,255,255,0.07); color: var(--text2); }
/* light sb-done: background: rgba(0,0,0,0.06) */
```

---

## 7. Centro de Disputas

Cards com `border-left: 2px solid var(--red)` para disputas críticas + Smart Tags clicáveis.

```css
.dispute-item {
  background: var(--surface2); border: 0.5px solid var(--border);
  border-radius: 10px; padding: 11px 13px;
  display: flex; align-items: flex-start; gap: 10px;
  transition: border-color .15s;
}
.dispute-item.warn { border-left: 2px solid var(--red); }

/* Smart Tags — entidades clicáveis para contexto rápido */
.smart-tag         { background: var(--surface); border: 0.5px solid var(--border); border-radius: 4px; padding: 2px 7px; font-size: 9px; cursor: pointer; }
.smart-tag:hover   { border-color: var(--accent); color: var(--accent); }
.smart-tag.client  { color: var(--blue);   border-color: rgba(74,144,226,0.25); }
.smart-tag.provider{ color: var(--green);  border-color: rgba(29,185,122,0.25); }
.smart-tag.value   { color: var(--yellow); border-color: rgba(245,200,66,0.25); }
```

Uso das Smart Tags:
```html
<div class="disp-tags">
  <span class="smart-tag client">● Julia F.</span>
  <span class="smart-tag provider">● Roberto A.</span>
  <span class="smart-tag value">R$ 420</span>
  <span class="smart-tag">Sem GPS</span>
  <span class="smart-tag">Sem timestamp</span>
</div>
```

---

## 8. Painel de Escrow

Card com 3 estados possíveis para cada item:

```html
<!-- Estado: Em execução -->
<div class="escrow-item">
  <div><div class="name">Limpeza · Ana L.</div><div class="sub">Check-in: 14:03</div></div>
  <div><div class="amt">R$ 280</div><div class="sts">Em execução</div></div>
</div>

<!-- Estado: Bloqueado por disputa -->
<div class="escrow-item" style="border-color:rgba(201,43,43,.25);">
  <div><div class="name">Hidráulica · Julia F.</div><div class="sub">● Disputa aberta</div></div>
  <div><div class="amt" style="color:var(--red);">R$ 420</div><div class="sts" style="color:var(--red);">Bloqueado</div></div>
</div>
```

```css
.escrow-item {
  background: var(--surface2); border: 0.5px solid var(--border);
  border-radius: 7px; padding: 9px 12px;
  display: flex; align-items: center; justify-content: space-between;
}
.escrow-item .amt { font-size: 12px; font-weight: 700; color: var(--yellow); }
```

Botões de ação:
```css
.btn-rel { background: var(--accent-dim); color: var(--accent); border: 0.5px solid rgba(255,85,0,.3); border-radius: 7px; padding: 8px; font-size: 11px; font-weight: 500; }
.btn-blk { background: var(--red-dim);    color: var(--red);    border: 0.5px solid rgba(201,43,43,.3); border-radius: 7px; padding: 8px; font-size: 11px; font-weight: 500; }
```

---

## 9. Risk Score Ring

```css
.risk-ring {
  width: 80px; height: 80px; border-radius: 50%;
  background: conic-gradient(var(--yellow) 0% 42%, var(--surface2) 42% 100%);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.risk-ring::before {   /* buraco do donut */
  content: ''; position: absolute;
  width: 60px; height: 60px; border-radius: 50%;
  background: var(--card);   /* CRÍTICO: precisa ser var(--card), não hardcoded */
}
.risk-num { font-weight: 700; font-size: 18px; color: var(--yellow); z-index: 1; }
```

O percentual do `conic-gradient` é dinâmico: `0% {score}%` onde score = valor 0–100.

---

## 10. Logs Narrativos

```css
.log-item { display: flex; gap: 10px; padding: 9px 0; border-bottom: 0.5px solid var(--border); font-size: 11px; }
.log-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.log-icon svg { width: 11px; height: 11px; }

/* Ícones tipados por evento */
.li-green  { background: var(--green-dim);  color: var(--green); }   /* repasse liberado */
.li-red    { background: var(--red-dim);    color: var(--red); }     /* disputa aberta */
.li-yellow { background: var(--yellow-dim); color: var(--yellow); }  /* KYC pendente */
.li-orange { background: var(--accent-dim); color: var(--accent); }  /* novo usuário */
.li-blue   { background: var(--blue-dim);   color: var(--blue); }    /* informação */

.log-body .msg          { color: var(--text2); line-height: 1.5; }
.log-body .msg strong   { color: var(--text);  font-weight: 600; }
.log-body .ts           { font-size: 9px; color: var(--text3); margin-top: 2px; }
```

---

## 11. Chart.js

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>

<!-- Wrapper — height no div, NUNCA no canvas -->
<div style="position:relative; width:100%; height:88px;">
  <canvas id="volC"></canvas>
</div>
```

**Área (repasses ao longo do tempo):**
```js
new Chart(document.getElementById('volC'), {
  type: 'line',
  data: {
    labels: ['Jan','Fev','Mar','Abr'],
    datasets: [
      {
        label: 'Repasses',
        data: [18200, 24100, 29300, 34820],
        fill: true,
        backgroundColor: 'rgba(255,85,0,0.10)',
        borderColor: '#FF5500',
        borderWidth: 1.8, tension: 0.42, pointRadius: 0
      },
      {
        label: 'Taxa',
        data: [1092, 1446, 1758, 2416],
        fill: true,
        backgroundColor: 'rgba(245,200,66,0.08)',
        borderColor: '#F5C842',
        borderWidth: 1.5, tension: 0.42, pointRadius: 0
      }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: ctx => ' R$ ' + ctx.parsed.y.toLocaleString('pt-BR') },
        /* dark:  backgroundColor: '#1A1A1A', bodyColor: '#fff'         */
        /* light: backgroundColor: '#FFFFFF', bodyColor: '#111'         */
        backgroundColor: '#1A1A1A', bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.08)', borderWidth: 0.5,
        titleColor: 'rgba(255,255,255,0.5)', padding: 8
      }
    },
    scales: { x: { display: false }, y: { display: false } },
    interaction: { mode: 'index', intersect: false }
  }
});
```

---

## 12. Layout Architecture

```css
/* Root */
.root { display: grid; grid-template-columns: 54px 1fr; min-height: 100vh; }

/* Sidebar */
.sidebar {
  background: var(--surface);
  border-right: 0.5px solid var(--border);
  display: flex; flex-direction: column; align-items: center;
  padding: 18px 0 20px; position: sticky; top: 0; height: 100vh;
}

/* Content */
.content { flex: 1; overflow-y: auto; padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }

/* KPI row */
.kpi-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }

/* Main grid: Pedidos + Disputas + Right col */
.main-grid { display: grid; grid-template-columns: 1fr 1fr 272px; gap: 12px; align-items: start; }

/* Second grid: Financeiro + Prestadores + Agenda + Logs/Saúde */
.second-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 272px; gap: 12px; align-items: start; }
```

Mapeamento narrativo (Folioblox → Talent Connect):

| Folioblox | Talent Connect ERP |
|---|---|
| Hero card (gradiente) | Hero banner — volume total do mês |
| Hero Footer #01–#04 | Em Escrow · Repasses · Disputas · Taxa |
| Social Proof (logos) | KPI row — 4 métricas operacionais |
| About (split layout) | Logs Narrativos + Saúde da Plataforma |
| Portfolio Grid 3 col | Main grid — Pedidos · Disputas · Right col |

---

## 13. Sidebar — Ícones por Módulo do ERP

| Módulo | Ícone SVG sugerido |
|---|---|
| Dashboard | `<rect x4/> × 4` (grid 2×2) |
| Pedidos | Documento com linhas |
| Disputas | Triângulo de alerta + badge vermelho |
| Financeiro / Escrow | Cadeado com arco |
| Usuários | Silhueta de pessoa |
| Auditoria de Logs | Polilinha de gráfico |
| Configurações | Engrenagem / sol |

Badge de notificação no ícone de disputas:
```css
.ni .badge {
  position: absolute; top: 4px; right: 4px;
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--red); border: 1.5px solid var(--surface);
}
```

---

## 14. Progress Bars (Saúde da Plataforma)

```css
.prog-block { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; }
.prog-row   { display: flex; flex-direction: column; gap: 4px; }
.prog-lr    { display: flex; justify-content: space-between; font-size: 11px; color: var(--text2); }
.prog-pct   { color: var(--accent); font-weight: 600; }
.prog-bar   { height: 3px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
.prog-fill  { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--accent2), var(--accent)); }
```

Métricas de saúde:
- Taxa de conclusão: 94%
- KYC validados: 78%
- Satisfação (NPS): 82%
- Disputas resolvidas: 67%

---

## 15. Buttons

```css
/* CTA principal (topbar) */
.btn-action { background: var(--accent); color: #fff; border: none; border-radius: 999px; padding: 7px 16px; font-size: 11px; font-weight: 500; }

/* Pill filter tags */
.pill    { background: var(--surface2); border: 0.5px solid var(--border); border-radius: 999px; padding: 3px 9px; font-size: 10px; color: var(--text2); }
.pill.on { background: var(--accent-dim); border-color: rgba(255,85,0,.3); color: var(--accent); }

/* Ação de mediação (vermelho) */
.btn-mediate { background: var(--red-dim); border: 0.5px solid rgba(201,43,43,.3); border-radius: 999px; padding: 4px 10px; font-size: 9px; font-weight: 600; color: var(--red); }

/* Withdraw / ação de token */
.withdraw-btn { background: var(--accent-dim); border: 0.5px solid rgba(255,85,0,.25); border-radius: 999px; padding: 4px 11px; font-size: 10px; font-weight: 500; color: var(--accent); }
```

---

## 16. Calendário de Execuções

```css
.cal-g { display: grid; grid-template-columns: repeat(7,1fr); gap: 1px; }
.cld { text-align: center; font-size: 11px; color: var(--text2); padding: 5px 2px; border-radius: 6px; cursor: pointer; }
.cld:hover { background: var(--surface2); }
.cld.today { background: var(--accent); color: #fff; font-weight: 700; }
.cld.exec  { color: var(--green); font-weight: 600; }   /* execução agendada */
.cld.disp  { color: var(--red);   font-weight: 600; }   /* disputa ativa */
.cld.dim   { color: var(--text3); }                     /* dias fora do mês */
```

---

## 17. Checklist de Replicação

- [ ] Hero banner com `linear-gradient(135deg, #FF6B00 0%, #CC2200 52%, #770000 100%)`
- [ ] Pills #01–#04 com métricas de negócio (não decorativas)
- [ ] DM Sans 700 em todos os valores monetários e KPIs
- [ ] Acento único — `#FF5500` (dark) ou `#E84800` (light), nunca dois hues
- [ ] Cards: `background: var(--card)` · `border: 0.5px solid var(--border)` · `radius: 16px`
- [ ] Light mode: adicionar `box-shadow` nos cards (sem sombra no dark)
- [ ] `risk-ring::before` usa `var(--card)`, não cor hardcoded
- [ ] Tooltip do Chart.js: cores invertidas por tema
- [ ] Smart Tags nas disputas: `.client` / `.provider` / `.value`
- [ ] Badge vermelho no ícone de Disputas na sidebar
- [ ] `height` do canvas no wrapper `<div>`, nunca no `<canvas>`
- [ ] `.pill.on` usa `var(--accent-dim)` + `border-color: rgba(accent,.3)` + `color: var(--accent)`
- [ ] `.sb-done` no dark: `rgba(255,255,255,0.07)` / no light: `rgba(0,0,0,0.06)`
- [ ] `.order-row:hover` no dark: `rgba(255,255,255,0.02)` / no light: `rgba(0,0,0,0.02)`

---

## 18. O Que NUNCA Fazer

- ❌ Gradiente laranja fora do hero banner
- ❌ Segundo acento cromático (azul, roxo, verde como cor principal)
- ❌ `box-shadow` no modo dark
- ❌ `height` no elemento `<canvas>` do Chart.js
- ❌ Cores semânticas (verde/vermelho/amarelo) como decoração — só para significado
- ❌ Cards com `background` colorido — sempre `var(--card)`
- ❌ Fonte diferente de DM Sans
- ❌ `color: #FF5500` hardcoded fora dos tokens — sempre `var(--accent)`
- ❌ Smart Tags sem tipagem (`.client`, `.provider`, `.value`)
- ❌ Risk ring com `background` hardcoded em `::before`

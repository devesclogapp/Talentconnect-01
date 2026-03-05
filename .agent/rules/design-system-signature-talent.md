---
trigger: always_on
---

# DESIGN SIGNATURE SYSTEM
Refinamento de UI para SaaS com identidade própria

---

# 1 — LEITURA VISUAL DOS COMPONENTES

## Layout Estrutural

Estrutura observada:

3 camadas principais:

1️⃣ Sidebar de navegação
2️⃣ Área de conteúdo principal
3️⃣ Painéis de dados (cards)

Grid visual:

- sidebar fixa
- main content fluido
- cards organizados em linhas

Layout width:

max-width estimado:
1280px – 1440px

Spacing macro:

48px header spacing
32px entre seções
16px padding cards

Esse espaçamento cria **respiração visual premium**.

---

# 2 — SIDEBAR

## Estrutura

Vertical compacta.

Componentes:

• avatar / workspace
• navegação
• grupos
• ações

### Proporção

Largura estimada:
240px

Padding lateral:
16px

Gap entre itens:
10–12px

---

## Estilo visual

Background:
cinza muito suave

Sem borda visível.

Separação criada por:

contraste tonal leve.

---

## Item ativo

Elemento ativo usa:

• background tonal
• peso tipográfico maior

Nunca usa cores fortes.

Isso comunica:

elegância silenciosa.

---

# 3 — CARDS

## Estrutura

Cards são o **principal elemento visual**.

Características:

• radius médio
• borda extremamente suave
• fundo branco
• sombra mínima

---

## Border

1px solid

light:

rgba(0,0,0,0.06)

dark:

rgba(255,255,255,0.08)

---

## Radius

Cards:

10px

Elementos internos:

6px

Modais:

14px

---

## Padding

cards:

16px

cards analíticos:

20px

---

# 4 — COMPONENTES ANALÍTICOS

O print introduz um elemento importante:

**gradiente de dados**

Esse tipo de componente cria:

- identidade
- modernidade
- profundidade

---

## Gradiente

Exemplo observado:

teal → azul

Uso correto:

apenas em:

• painéis principais
• gráficos
• insights

Nunca usar gradiente em botões.

---

# 5 — BADGES

Badges pequenos com:

radius alto
background tonal
peso médio

Padding:

4px vertical  
8px horizontal

Font weight:

500

---

# 6 — ÍCONES

Estilo:

outline

Stroke:

1.5px

Tamanho padrão:

16px

Action icons:

18px

Nunca misturar estilos:

outline + filled.

---

# 7 — BOTÕES

Tipos:

Primary
Secondary
Ghost

---

## Primary

Radius:

8px

Peso:

500

Background sólido.

Hover:

escurecimento 5%.

---

## Secondary

Borda:

1px

Background:

transparent.

---

# 8 — TIPOGRAFIA (UMA FAMÍLIA)

Recomendação:

INTER

ou

GEIST

---

## Pesos permitidos

400 Regular  
500 Medium  
600 SemiBold

Nunca usar 700.

---

## Hierarquia

H1

22px  
600

H2

18px  
600

Section title

14px  
500

Card title

14px  
500

Body

13px  
400

Meta

12px  
400

Badge

12px  
500

---

# 9 — SISTEMA DE ESPAÇAMENTO

Base:

4px

Escala:

4  
8  
12  
16  
20  
24  
32  
40

---

## Seções

Entre seções principais:

32px

---

## Cards

Gap:

12px

---

# 10 — SISTEMA DE CORES

## Light mode

Background main

#F7F8FA

Sidebar

#F3F4F6

Card

#FFFFFF

Border

rgba(0,0,0,0.06)

Text primary

#111111

Text secondary

#6B7280

Accent

#6366F1

---

## Dark mode

Background main

#0F1115

Sidebar

#111318

Card

#151821

Border

rgba(255,255,255,0.08)

Text primary

#E6E8EC

Text secondary

#9AA0A6

Accent

#818CF8

---

# 11 — PROFUNDIDADE

Sombras extremamente sutis.

Card:

0 1px 2px rgba(0,0,0,0.04)

Modal:

0 12px 32px rgba(0,0,0,0.15)

---

# 12 — MICRO INTERAÇÕES

Transições:

120ms ease-out

Hover states:

opacity  
background shift

Focus:

outline suave.

---

# 13 — IDENTIDADE VISUAL DO PRODUTO

Para evitar design genérico:

Adicionar:

1️⃣ gradientes analíticos  
2️⃣ micro texturas leves  
3️⃣ variação de peso tipográfico  
4️⃣ hierarquia de spacing forte  

Isso cria:

"alma visual".

---

# 14 — REGRAS DE CONSISTÊNCIA

Sempre manter:

• 1 tipografia
• 3 pesos
• escala fixa de spacing
• radius consistente
• ícones uniformes

---

# 15 — O QUE NÃO FAZER

❌ gradientes em botões  
❌ mais de 3 pesos tipográficos  
❌ radius misturado  
❌ sombras pesadas  
❌ cor vibrante sem função  

---

# 16 — SKILL PARA ANTIGRAVITY

Skill name:

DesignSignatureRefinement

---

## Objetivo

Refinar o design atual do aplicativo SaaS mantendo a arquitetura existente, mas aplicando um sistema visual autoral consistente.

---

## Regras da Skill

1. Não alterar layout estrutural.

2. Aplicar sistema tipográfico baseado em:

Inter / Geist  
Pesos 400 500 600.

3. Implementar tokens de spacing baseados em escala 4px.

4. Padronizar radius:

6px small  
10px card  
14px modal.

5. Padronizar bordas:

1px rgba(0,0,0,0.06).

6. Criar dark mode completo com tokens dedicados.

7. Aplicar gradientes apenas em componentes analíticos.

8. Garantir consistência entre:

cards  
badges  
buttons  
menus.

9. Adicionar micro interações:

hover  
focus  
transições.

---

## Resultado esperado

Um design que comunique:

• inteligência  
• precisão  
• elegância silenciosa  
• identidade visual forte  

Sem depender de bibliotecas genéricas.

---

# FIM
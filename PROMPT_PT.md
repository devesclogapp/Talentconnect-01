# GEMINI_PT.md - Kit Antigravity (Versão Traduzida)

> Este documento contém as regras que definem o comportamento da IA neste workspace.

---

## CRÍTICO: PROTOCOLO DE AGENTE E SKILLS

**OBRIGATÓRIO:** A IA deve ler o arquivo do agente apropriado e suas skills ANTES de qualquer implementação.

### 1. Carregamento de Skills
Agente ativado → Verificar "skills:" → Ler ÍNDICE → Ler seções específicas.
- **Prioridade:** P0 (GEMINI.md) > P1 (.md do Agente) > P2 (SKILL.md).

---

## 📥 CLASSIFICADOR DE SOLICITAÇÃO

| Tipo | Gatilhos | Tier |
| --- | --- | --- |
| **Pergunta** | "o que é", "como" | T0 |
| **Código** | "corrija", "adicione", "construa" | T0 + T1 |
| **Design/UI** | "design", "estilo", "página" | T0 + T1 + Agente |

---

## 🤖 ROTEAMENTO DE AGENTE

**SEMPRE ATIVO:** A IA escolhe o especialista ideal (Frontend, Backend, etc.) e informa:
`🤖 Aplicando conhecimentos de @[nome-do-agente]...`

---

## 🌐 Tratamento de Idioma

1. **Tradução Interna:** Documentação e regras são convertidas para melhor entendimento.
2. **Resposta ao Usuário:** Sempre no idioma solicitado (Português).
3. **Código:** Comentários e variáveis permanecem em Inglês (padrão técnico).

---

## 🛑 PORTÃO SOCRÁTICO

**OBRIGATÓRIO:** Antes de agir em solicitações complexas, a IA deve:
1. Confirmar entendimento.
2. Perguntar sobre impactos e casos de borda.
3. Obter aprovação do plano antes de codar.

---

## 🏁 PROTOCOLO DE VERIFICAÇÃO FINAL

Sempre que concluir uma tarefa:
1. Verificar **Segurança**.
2. Verificar **Lint/Sintaxe**.
3. Verificar **UX/UI**.
4. Rodar testes de fumaça (Build).

---

# Design System - App Financeiro

### Cores (Tema Escuro)
- **Fundo Primário:** `#0A0E27`
- **Fundo Secundário:** `#151933`
- **Destaque:** `#C6FF00` (Verde Limão)
- **Texto:** `#FFFFFF` (Primário) / `#8E92BC` (Secundário)

### Tipografia
- **Família:** SF Pro Display / Inter.
- **Grade de Espaçamento:** Base de 8px.
- **Raio (Radius):** 12px (padrão) / 16px (cards).

### Componentes
- **Botões:** `.btn-primary` (Destaque limão), `.btn-icon` (Circular).
- **Cards:** `.card` (Borda sutil), `.card-stat` (Destaque de métricas).
- **Navegação:** `.bottom-nav` (Mobile-first).

# 🧪 Guia de Testes - Talent Connect

## 🎯 Developer Tools

Foi adicionado um **painel de ferramentas de desenvolvedor** para facilitar os testes do aplicativo!

### 📍 Como Acessar

1. **Botão Flutuante**: Procure o botão roxo/rosa girando no canto inferior direito da tela
2. **Clique** para abrir o painel de ferramentas
3. **Clique novamente** (ou no X) para fechar

> ⚠️ **Nota**: O DevTools só aparece em modo de desenvolvimento (não em produção)

---

## ⚡ Quick Actions (Ações Rápidas)

### 1. Login Rápido

**Sem precisar preencher formulários!**

- **Login como Cliente** (botão azul)
  - Faz login instantâneo como cliente
  - Vai direto para o Dashboard do Cliente
  
- **Login como Prestador** (botão laranja)
  - Faz login instantâneo como prestador
  - Vai direto para o Dashboard do Prestador

### 2. Ir para Dashboard

- Botão verde que leva você de volta ao dashboard principal
- Funciona para o perfil atual (Cliente ou Prestador)

### 3. Fazer Logout

- Botão vermelho para deslogar
- Volta para a tela de login
- Útil para trocar de perfil

---

## 🗺️ Navegação Direta

### Aba "Navegação"

Permite navegar diretamente para qualquer tela do app:

#### 📱 Autenticação
- Login
- Cadastro
- Onboarding
- Splash Screen

#### 👤 Telas do Cliente
- Dashboard Cliente
- Listagem de Serviços
- Listagem de Prestadores
- Histórico de Pedidos
- Acompanhamento
- Perfil
- Suporte

#### 🔧 Telas do Prestador
- Dashboard Prestador
- Pedidos Recebidos
- Cadastrar Serviço
- Meus Serviços
- Agenda
- Ganhos
- Perfil

> 💡 **Dica**: A tela atual fica destacada em cor diferente!

---

## 🧪 Cenários de Teste Recomendados

### Teste 1: Fluxo Completo do Cliente

```
1. Abrir DevTools
2. Clicar em "Login como Cliente"
3. Explorar Dashboard
4. Ir para "Listagem de Prestadores"
5. Ver perfil de um prestador
6. Criar um pedido (simulado)
7. Ver histórico de pedidos
8. Avaliar prestador
```

### Teste 2: Fluxo Completo do Prestador

```
1. Abrir DevTools
2. Clicar em "Login como Prestador"
3. Explorar Dashboard
4. Ir para "Pedidos Recebidos"
5. Aceitar um pedido
6. Iniciar execução do serviço
7. Finalizar serviço
8. Ver ganhos
```

### Teste 3: Trocar Entre Perfis

```
1. Login como Cliente
2. Explorar algumas telas
3. Fazer Logout (DevTools)
4. Login como Prestador
5. Explorar telas do prestador
6. Comparar experiências
```

### Teste 4: Navegação Direta

```
1. Abrir DevTools
2. Ir para aba "Navegação"
3. Clicar em diferentes telas
4. Testar se todas carregam corretamente
5. Verificar se o estado persiste
```

---

## 🎨 Visual do DevTools

### Indicadores Visuais

- **Tela Atual**: Mostrada no header do painel
- **Usuário Atual**: Mostra o perfil logado (CLIENT/PROVIDER)
- **Cores por Categoria**:
  - 🟣 Roxo/Rosa: DevTools
  - 🔵 Azul: Cliente
  - 🟠 Laranja: Prestador
  - 🟢 Verde: Dashboard
  - 🔴 Vermelho: Logout

---

## 💡 Dicas de Uso

### Para Desenvolvimento

1. **Teste Rápido de Telas**
   - Use a navegação direta para pular entre telas
   - Economize tempo sem precisar clicar em vários botões

2. **Teste de Perfis**
   - Alterne rapidamente entre Cliente e Prestador
   - Verifique se as telas corretas aparecem para cada perfil

3. **Debug de Estado**
   - O painel mostra a tela atual
   - Útil para saber onde você está no fluxo

### Para Demonstrações

1. **Preparação Rápida**
   - Faça login rápido no perfil desejado
   - Navegue direto para a tela que quer mostrar

2. **Troca de Contexto**
   - Mostre a visão do cliente
   - Depois mostre a visão do prestador
   - Tudo sem precisar fazer login manual

---

## 🔧 Troubleshooting

### DevTools não aparece?

✅ **Verifique**:
- Você está em modo de desenvolvimento? (`npm run dev`)
- O botão está no canto inferior direito (pode estar atrás de algo)
- Tente recarregar a página

### Botão de login não funciona?

✅ **Verifique**:
- O MockBackend está funcionando
- Console do navegador para erros
- Tente fazer logout e login novamente

### Navegação não funciona?

✅ **Verifique**:
- A tela existe no App.tsx
- Não há erros no console
- O estado do app está correto

---

## 🚀 Atalhos de Teclado (Futuro)

> 📝 **Planejado**: Adicionar atalhos de teclado para abrir/fechar o DevTools

Sugestões:
- `Ctrl + D` ou `Cmd + D`: Toggle DevTools
- `Ctrl + 1`: Login Cliente
- `Ctrl + 2`: Login Prestador
- `Ctrl + L`: Logout

---

## 📊 Informações Técnicas

### Componente

- **Localização**: `components/DevTools.tsx`
- **Integração**: `App.tsx`
- **Modo**: Apenas desenvolvimento (`process.env.NODE_ENV !== 'production'`)

### Props

```typescript
interface DevToolsProps {
  currentView: string;        // Tela atual
  currentUser: any;           // Usuário logado
  onNavigate: (view: string) => void;  // Função de navegação
  onQuickLogin: (role: UserRole) => void;  // Login rápido
  onLogout: () => void;       // Logout
}
```

### Funcionalidades

- ✅ Login rápido (Cliente/Prestador)
- ✅ Navegação direta para qualquer tela
- ✅ Logout rápido
- ✅ Indicador de tela atual
- ✅ Indicador de usuário atual
- ✅ Tabs (Quick Actions / Navegação)
- ✅ Design responsivo
- ✅ Dark mode suportado
- ✅ Animações suaves

---

## 🎉 Benefícios

### Para Desenvolvedores

- ⚡ **Velocidade**: Teste fluxos completos em segundos
- 🎯 **Precisão**: Navegue exatamente para onde precisa
- 🔄 **Flexibilidade**: Troque de perfil instantaneamente
- 🐛 **Debug**: Veja estado atual facilmente

### Para QA/Testes

- ✅ **Cobertura**: Teste todas as telas rapidamente
- 📋 **Cenários**: Execute cenários de teste facilmente
- 🔍 **Verificação**: Confirme comportamento de cada perfil
- 📊 **Relatórios**: Identifique problemas mais rápido

### Para Demonstrações

- 🎭 **Apresentação**: Mostre diferentes perfis facilmente
- 🚀 **Agilidade**: Pule para telas específicas
- 💼 **Profissional**: Demonstre fluxos completos
- ✨ **Impacto**: Mostre todas as funcionalidades

---

## 📝 Exemplo de Sessão de Teste

```
[Abrir App]
↓
[Clicar no botão DevTools (roxo/rosa)]
↓
[Quick Actions] → "Login como Cliente"
↓
[Explorar Dashboard do Cliente]
↓
[DevTools] → Navegação → "Listagem de Prestadores"
↓
[Ver perfis de prestadores]
↓
[DevTools] → Quick Actions → "Fazer Logout"
↓
[DevTools] → Quick Actions → "Login como Prestador"
↓
[Explorar Dashboard do Prestador]
↓
[DevTools] → Navegação → "Pedidos Recebidos"
↓
[Ver e aceitar pedidos]
↓
[DevTools] → Navegação → "Execução de Serviço"
↓
[Testar cronômetro e finalização]
↓
[Sucesso! ✅]
```

---

**Aproveite o DevTools e teste o app com facilidade! 🚀**

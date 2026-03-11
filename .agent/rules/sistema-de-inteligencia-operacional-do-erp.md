---
trigger: always_on
---

# CONTEXTO

Este ERP administra um marketplace de serviços entre clientes e profissionais.

O painel administrativo é responsável por:

- governança de usuários
- verificação de identidade (KYC)
- análise de risco
- gestão de serviços
- gestão financeira com escrow
- mediação de disputas
- auditoria de eventos

O objetivo é transformar o painel admin em um **Centro de Inteligência Operacional**, permitindo que administradores tomem decisões baseadas em dados completos da negociação.

---

# CONCEITO PRINCIPAL

Criar o conceito de:

DOSSIÊ OPERACIONAL DA NEGOCIAÇÃO

Toda negociação deve possuir um dossiê consolidado contendo:

- usuário cliente
- usuário profissional
- serviço contratado
- pedido
- valores financeiros
- logs do sistema
- eventos
- evidências
- histórico de disputas
- status de execução
- dados de risco
- timeline da negociação

Esse dossiê será acessível em qualquer tela através de Smart Tags ou pelo painel lateral.

---

# SISTEMA DE SMART TAGS INTELIGENTES

Implementar Smart Tags clicáveis ou hoveráveis que revelam dados relacionados.

Exemplo de Smart Tags:

#CLIENTE  
#PROFISSIONAL  
#SERVIÇO  
#PEDIDO  
#NEGOCIAÇÃO  
#VALOR  
#DATA  
#RISCO  

Quando o admin passar o mouse ou clicar, abrir um mini painel contextual contendo:

Exemplo:

Profissional

Nome  
ID  
Score de risco  
Pedidos realizados  
Disputas anteriores  
Taxa de cancelamento  
Avaliação média  
Data de cadastro

Isso permite visualizar contexto sem sair da tela.

---

# TIMELINE DA NEGOCIAÇÃO

Criar uma timeline cronológica automática contendo eventos como:

Pedido criado  
Profissional aceitou  
Execução iniciada  
Execução finalizada  
Disputa aberta  
Pagamento retido  
Intervenção admin  

Formato:

linha vertical com eventos ordenados por timestamp.

Cada evento deve conter:

- data
- tipo
- ator (cliente / profissional / sistema / admin)
- descrição

---

# SCORE DE DECISÃO AUTOMÁTICA

Criar um sistema de pontuação para auxiliar decisões de disputa.

Gerar dois indicadores:

Probabilidade Cliente
Probabilidade Profissional

Baseado em:

- confirmação de presença
- logs do sistema
- histórico do profissional
- histórico do cliente
- tempo de resposta
- cancelamentos
- disputas anteriores
- localização GPS (se existir)
- confirmação de execução

Exemplo de saída:

Probabilidade de razão:

Cliente 35%  
Profissional 65%

Este score serve apenas como recomendação, não decisão automática.

---

# MODO INVESTIGAÇÃO

Ao abrir uma disputa, ativar um painel investigativo com os blocos:

IDENTIDADE  
KYC do cliente e profissional

HISTÓRICO  
transações anteriores entre as partes

EVENTOS  
timeline da negociação

FINANCEIRO  
escrow, valor do serviço, taxas

LOGS  
eventos técnicos registrados

CONTRATO  
dados da contratação

RISCO  
score de risco de cada parte

EVIDÊNCIAS  
dados que comprovam execução ou ausência

---

# SISTEMA DE EVIDÊNCIAS

Antes do admin emitir um veredito, ele pode marcar evidências utilizadas.

Exemplo:

[ ] Latência de início  
[ ] Localização GPS  
[ ] Histórico de logs  
[ ] Não comparecimento  
[ ] Confirmação do cliente  
[ ] Confirmação do profissional

Essas evidências ficam registradas no log de auditoria.

---

# RESUMO AUTOMÁTICO DA DISPUTA

Gerar automaticamente um resumo da disputa baseado nos dados disponíveis.

Exemplo:

Resumo da disputa:

Cliente afirma que o profissional não compareceu ao serviço.

O profissional marcou início da execução às 10:32.

Não há confirmação do cliente no sistema.

Pagamento encontra-se retido em escrow.

Esse resumo ajuda o admin a entender rapidamente o caso.

---

# VEREDITO ASSISTIDO

Antes de confirmar decisão, o sistema mostra:

Resumo do caso  
Evidências selecionadas  
Score de probabilidade  
Histórico das partes

Então o admin pode escolher:

Liberar pagamento ao profissional  
Estornar valor ao cliente

Registrar automaticamente no log de auditoria:

- admin responsável
- evidências consideradas
- justificativa escrita
- timestamp

---

# DETECÇÃO DE PADRÕES DE FRAUDE

Criar sistema de análise comportamental.

Exemplos de alertas:

Cliente abriu muitas disputas em curto período  
Profissional possui alta taxa de cancelamento  
Serviço frequentemente gera disputas  
Transações acima da média da categoria  

Mostrar alertas no painel de risco.

---

# ALERTAS OPERACIONAIS

Criar alertas automáticos para o admin.

Exemplos:

Escrow retido há mais de X dias  
Volume anormal de disputas  
Serviços com risco elevado  
Usuário com comportamento suspeito

Esses alertas devem aparecer no Centro de Comando.

---

# ÍNDICE DE CONFIABILIDADE DO USUÁRIO

Criar um Trust Score de 0 a 100 para cada usuário.

Baseado em:

tempo de conta  
avaliações  
disputas  
cancelamentos  
volume de serviços  
inadimplência  

Mostrar esse score no perfil do usuário.

---

# LOG NARRATIVO DE AUDITORIA

Além dos logs técnicos, registrar logs narrativos.

Exemplo:

Admin João decidiu liberar pagamento ao profissional.

Motivo:
Logs confirmam início do serviço e ausência de cancelamento pelo cliente.

Evidências utilizadas:
Latência de início, histórico de logs.

---

# OBJETIVO FINAL

Transformar o ERP em um sistema de:

Governança  
Auditoria  
Mediação inteligente  
Análise de risco  
Tomada de decisão assistida

onde cada decisão administrativa seja baseada em evidências e contexto completo da negociação.
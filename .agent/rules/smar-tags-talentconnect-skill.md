---
trigger: always_on
---

# IMPLEMENTAÇÃO DE SMART TAGS DINÂMICAS COM ENTIDADES REAIS

## CONTEXTO

O ERP do sistema Talent Connect utiliza **Smart Tags** dentro de painéis administrativos (principalmente em disputas, pedidos e auditoria) para representar entidades da negociação.

Atualmente as tags aparecem com placeholders como:

CLI: Cliente (Pendente)
PROF: Cliente (Pendente)
SERVIÇO
R$ 0,00

Isso gera confusão operacional.

O objetivo é transformar essas tags em **entidades reais do sistema**, exibindo **nome real, valor real e contexto da negociação**, além de permitir **hover ou clique para abrir um painel de informações rápidas**.

---

# OBJETIVO

Substituir Smart Tags genéricas por **Smart Tags Dinâmicas ligadas ao banco de dados**.

Cada tag deve representar uma entidade real da negociação.

Entidades principais:

CLIENTE
PROFISSIONAL
SERVIÇO
PEDIDO
VALOR
NEGOCIAÇÃO

---

# EXEMPLO DE RESULTADO ESPERADO

ANTES

CLI: Cliente (Pendente)
PROF: Cliente (Pendente)
SERVIÇO
R$ 0,00

DEPOIS

👤 Maria Oliveira
🧰 João Silva
🧹 Limpeza Residencial
💰 R$ 200

Cada item deve funcionar como **Smart Tag clicável ou hoverável**.

---

# ESTRUTURA DAS SMART TAGS

Cada Smart Tag deve possuir a seguinte estrutura lógica:

type
entity_id
entity_name
metadata

Exemplo:

type: client
entity_id: usr_4832
entity_name: Maria Oliveira

---

# REGRAS DE RENDERIZAÇÃO

Quando o sistema renderizar a interface de disputas, pedidos ou logs:

1. Identificar entidades relacionadas à negociação.
2. Buscar os dados reais no banco.
3. Renderizar as Smart Tags com o nome da entidade.

Mapeamento de dados:

Cliente → tabela users
Profissional → tabela professionals
Serviço → tabela services
Pedido → tabela orders
Pagamento → tabela payments

---

# PADRÃO VISUAL DAS TAGS

Cliente

👤 Maria Oliveira

Profissional

🧰 João Silva

Serviço

🧹 Limpeza Residencial

Valor

💰 R$ 200

Pedido

📦 Pedido #1184

---

# CORES SEMÂNTICAS DAS TAGS

Cliente
Cor azul

Profissional
Cor laranja

Serviço
Cor roxo

Valor
Cor neutra / cinza

Pedido
Cor verde

Isso permite identificação visual rápida.

---

# HOVER PANEL (PAINEL DE CONTEXTO)

Ao passar o mouse sobre uma tag, abrir um mini painel informativo.

## Cliente

Nome
ID
Trust Score
Pedidos realizados
Disputas abertas
Data de cadastro

Exemplo:

Maria Oliveira
ID: usr_4832
Trust Score: 82
Pedidos: 12
Disputas: 1
Cadastro: 03/04/2024

---

## Profissional

Nome
ID
Serviços executados
Avaliação média
Disputas anteriores
Trust Score

Exemplo:

João Silva
ID: pro_9931
Serviços executados: 54
Avaliação média: 4.9
Disputas: 0
Trust Score: 94

---

## Serviço

Nome do serviço
Categoria
Preço médio da categoria
Taxa de disputa da categoria

Exemplo:

Limpeza Residencial
Categoria: Limpeza
Preço médio: R$ 180
Disputas na categoria: 3%

---

# USO DAS TAGS EM JUSTIFICATIVAS

Dentro do campo de justificativa da decisão administrativa, permitir inserir tags automaticamente.

Exemplo de texto:

Cliente #cliente afirma que o profissional #profissional não compareceu ao serviço #serviço.

Ao renderizar o texto:

Cliente Maria Oliveira afirma que o profissional João Silva não compareceu ao serviço Limpeza Residencial.

As entidades devem aparecer como **tags clicáveis**.

---

# FALLBACK

Se algum dado estiver ausente:

Cliente → "Cliente não identificado"
Profissional → "Profissional não identificado"
Serviço → "Serviço não definido"

Evitar placeholders genéricos.

---

# RESULTADO ESPERADO

O admin deve conseguir identificar rapidamente:

Quem é o cliente
Quem é o profissional
Qual serviço foi contratado
Qual valor está em disputa

Tudo diretamente nas Smart Tags sem precisar abrir novas telas.

---

# OBJETIVO FINAL

Transformar Smart Tags em **atalhos inteligentes de investigação**, permitindo que o admin visualize rapidamente o contexto completo da negociação dentro do ERP.

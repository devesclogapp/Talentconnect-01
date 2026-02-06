# 🌱 Seed Data - Talent Connect Marketplace

## Como Popular o Banco de Dados

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Copie e cole o conteúdo de `scripts/seed-marketplace.sql`
5. **IMPORTANTE**: Antes de executar, verifique os IDs dos seus usuários:
   ```sql
   SELECT id, email, name, role FROM users;
   ```
6. Execute o script completo
7. Verifique os dados criados com as queries de verificação no final do script

### Opção 2: Ajustar IDs Manualmente

Se você souber os IDs exatos dos seus 2 usuários, edite o script e substitua:

```sql
-- Ao invés de:
(SELECT id FROM users WHERE role = 'provider' LIMIT 1)

-- Use:
'seu-user-id-aqui'
```

### O Que Será Criado

#### 📊 Dados de Demonstração

- **2 Provider Profiles** (um para cada usuário provider)
  - Bio profissional
  - Status de documentos aprovado
  - Ratings médios (4.9 e 4.8)
  
- **7 Serviços Variados**
  - 3 serviços do Provider 1 (Maintenance/Elite)
  - 4 serviços do Provider 2 (Creative/Digital)
  - Preços entre $150 - $800
  - Imagens do Unsplash
  
- **3 Pedidos de Exemplo**
  - 1 completado (com avaliação)
  - 1 em execução
  - 1 pendente
  
- **2 Pagamentos**
  - 1 liberado (released)
  - 1 retido (held)
  
- **1 Avaliação**
  - 5 estrelas com comentário

### Categorias de Serviços

Os serviços são distribuídos nas categorias do marketplace:

- **Maintenance** - Manutenção e reparos
- **Creative** - Design e branding
- **Digital** - Marketing e desenvolvimento
- **Elite** - Serviços premium especializados

### Verificação Pós-Seed

Após executar o script, você verá:

1. **Contagem de registros** criados em cada tabela
2. **Lista de serviços** com nome do provider
3. **Lista de pedidos** com status e valores

### Troubleshooting

**Erro: "violates foreign key constraint"**
- Certifique-se de que seus 2 usuários têm roles corretos ('client' e 'provider')
- Verifique se as tabelas estão vazias antes de executar

**Erro: "duplicate key value"**
- Execute as queries de DELETE no início do script para limpar dados antigos
- Ou ajuste os dados para não conflitar

**Nenhum dado aparece no app**
- Verifique as RLS policies no Supabase
- Confirme que o usuário logado tem permissão para ver os dados
- Teste as queries manualmente no SQL Editor

### Próximos Passos

Depois de popular o banco:

1. ✅ Faça login no app
2. ✅ Navegue pelo Client Dashboard para ver os serviços
3. ✅ Acesse o Provider Dashboard para ver métricas
4. ✅ Teste a busca e filtros
5. ✅ Visualize perfis de prestadores
6. ✅ Crie novos pedidos

### Adicionar Mais Dados

Para adicionar mais serviços, copie e adapte os blocos INSERT:

```sql
INSERT INTO services (provider_id, title, description, category, pricing_mode, base_price, active, image_url)
VALUES
  (
    'seu-provider-id',
    'Nome do Serviço',
    'Descrição detalhada',
    'Categoria', -- Maintenance, Creative, Digital, Elite
    'hourly', -- ou 'fixed'
    250.00,
    true,
    'https://images.unsplash.com/photo-...'
  );
```

### Imagens do Unsplash

As URLs de imagem usam fotos profissionais do Unsplash. Para adicionar novas:

1. Acesse [unsplash.com](https://unsplash.com)
2. Busque por temas relevantes
3. Copie a URL no formato: `https://images.unsplash.com/photo-XXXXX?w=800&q=80`

---

**Dica**: Mantenha este arquivo atualizado conforme adiciona mais dados de seed!

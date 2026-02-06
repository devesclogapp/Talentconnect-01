-- =====================================================
-- SEED DATA PARA TALENT CONNECT MARKETPLACE
-- =====================================================
-- Este script popula o banco com dados de demonstração
-- Execute no SQL Editor do Supabase
-- =====================================================

-- Limpar dados existentes (CUIDADO: isso apaga tudo!)
-- DELETE FROM ratings;
-- DELETE FROM executions;
-- DELETE FROM payments;
-- DELETE FROM orders;
-- DELETE FROM services;
-- DELETE FROM provider_profiles;

-- =====================================================
-- 1. CRIAR PERFIS DE PRESTADORES (Provider Profiles)
-- =====================================================
-- Assumindo que você já tem 2 usuários na tabela users
-- Vamos criar perfis de prestador para eles

-- Obter os IDs dos usuários existentes (ajuste conforme necessário)
-- Substitua 'user-id-1' e 'user-id-2' pelos IDs reais dos seus usuários

INSERT INTO provider_profiles (user_id, bio, documents_status, active, rating_average, rating_count)
VALUES 
  -- Provider 1
  (
    (SELECT id FROM users WHERE role = 'provider' LIMIT 1),
    'Professional with over 10 years of specialized experience in high-performance infrastructure and complex logistical solutions. Delivery of excellence guaranteed.',
    'approved',
    true,
    4.9,
    127
  ),
  -- Provider 2 (se houver um segundo provider)
  (
    (SELECT id FROM users WHERE role = 'provider' OFFSET 1 LIMIT 1),
    'Expert in creative solutions and digital transformation. Certified specialist with proven track record in delivering premium services.',
    'approved',
    true,
    4.8,
    89
  )
ON CONFLICT (user_id) DO UPDATE SET
  bio = EXCLUDED.bio,
  documents_status = EXCLUDED.documents_status,
  active = EXCLUDED.active,
  rating_average = EXCLUDED.rating_average,
  rating_count = EXCLUDED.rating_count;

-- =====================================================
-- 2. CRIAR SERVIÇOS (Services)
-- =====================================================

INSERT INTO services (provider_id, title, description, category, pricing_mode, base_price, active, image_url)
VALUES
  -- Serviços do Provider 1
  (
    (SELECT id FROM users WHERE role = 'provider' LIMIT 1),
    'Premium Structural Maintenance',
    'Full audit and high-performance repair of building systems with guaranteed quality and fast turnaround.',
    'Maintenance',
    'hourly',
    185.00,
    true,
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80'
  ),
  (
    (SELECT id FROM users WHERE role = 'provider' LIMIT 1),
    'Critical Emergency Response',
    'Rapid identification and real-time correction of infrastructure failures. Available 24/7 for urgent situations.',
    'Maintenance',
    'fixed',
    350.00,
    true,
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80'
  ),
  (
    (SELECT id FROM users WHERE role = 'provider' LIMIT 1),
    'Advanced System Installation',
    'Professional installation of complex systems with technical precision and industry certifications.',
    'Elite',
    'hourly',
    220.00,
    true,
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80'
  ),
  
  -- Serviços do Provider 2
  (
    (SELECT id FROM users WHERE role = 'provider' OFFSET 1 LIMIT 1),
    'Creative Brand Design',
    'Complete brand identity development with modern design principles and market research.',
    'Creative',
    'fixed',
    450.00,
    true,
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80'
  ),
  (
    (SELECT id FROM users WHERE role = 'provider' OFFSET 1 LIMIT 1),
    'Digital Marketing Strategy',
    'Comprehensive digital marketing plan with SEO, social media, and content strategy.',
    'Digital',
    'hourly',
    150.00,
    true,
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
  ),
  (
    (SELECT id FROM users WHERE role = 'provider' OFFSET 1 LIMIT 1),
    'UI/UX Design Excellence',
    'User-centered design for web and mobile applications with modern frameworks.',
    'Creative',
    'hourly',
    175.00,
    true,
    'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&q=80'
  ),
  (
    (SELECT id FROM users WHERE role = 'provider' OFFSET 1 LIMIT 1),
    'Website Development Pro',
    'Full-stack web development with React, Node.js, and modern cloud infrastructure.',
    'Digital',
    'fixed',
    800.00,
    true,
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80'
  );

-- =====================================================
-- 3. CRIAR PEDIDOS DE EXEMPLO (Orders)
-- =====================================================

INSERT INTO orders (
  client_id, 
  provider_id, 
  service_id, 
  pricing_mode, 
  scheduled_at, 
  location_text, 
  status, 
  total_amount
)
VALUES
  -- Pedido completado
  (
    (SELECT id FROM users WHERE role = 'client' LIMIT 1),
    (SELECT id FROM users WHERE role = 'provider' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Premium Structural Maintenance' LIMIT 1),
    'hourly',
    NOW() - INTERVAL '5 days',
    'Av. Paulista, 1000 - São Paulo, SP',
    'completed',
    420.00
  ),
  -- Pedido em execução
  (
    (SELECT id FROM users WHERE role = 'client' LIMIT 1),
    (SELECT id FROM users WHERE role = 'provider' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Critical Emergency Response' LIMIT 1),
    'fixed',
    NOW() + INTERVAL '2 hours',
    'Rua Augusta, 500 - São Paulo, SP',
    'in_execution',
    350.00
  ),
  -- Pedido pendente
  (
    (SELECT id FROM users WHERE role = 'client' LIMIT 1),
    (SELECT id FROM users WHERE role = 'provider' OFFSET 1 LIMIT 1),
    (SELECT id FROM services WHERE title = 'Creative Brand Design' LIMIT 1),
    'fixed',
    NOW() + INTERVAL '1 day',
    'Av. Faria Lima, 2000 - São Paulo, SP',
    'sent',
    450.00
  );

-- =====================================================
-- 4. CRIAR AVALIAÇÕES (Ratings)
-- =====================================================

INSERT INTO ratings (order_id, client_id, provider_id, score, comment)
VALUES
  (
    (SELECT id FROM orders WHERE status = 'completed' LIMIT 1),
    (SELECT id FROM users WHERE role = 'client' LIMIT 1),
    (SELECT id FROM users WHERE role = 'provider' LIMIT 1),
    5,
    'Excellent execution. The system was restored to peak performance within the predicted window. Highly professional and technically precise.'
  );

-- =====================================================
-- 5. CRIAR PAGAMENTOS (Payments)
-- =====================================================

INSERT INTO payments (
  order_id, 
  amount_total, 
  operator_fee, 
  provider_amount, 
  escrow_status
)
VALUES
  (
    (SELECT id FROM orders WHERE status = 'completed' LIMIT 1),
    420.00,
    42.00,
    378.00,
    'released'
  ),
  (
    (SELECT id FROM orders WHERE status = 'in_execution' LIMIT 1),
    350.00,
    35.00,
    315.00,
    'held'
  );

-- =====================================================
-- 6. VERIFICAR DADOS INSERIDOS
-- =====================================================

-- Contar registros criados
SELECT 
  'Provider Profiles' as table_name, 
  COUNT(*) as count 
FROM provider_profiles
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Ratings', COUNT(*) FROM ratings
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments;

-- Ver serviços criados
SELECT 
  s.id,
  s.title,
  s.category,
  s.pricing_mode,
  s.base_price,
  u.name as provider_name
FROM services s
JOIN users u ON s.provider_id = u.id
ORDER BY s.created_at DESC;

-- Ver pedidos criados
SELECT 
  o.id,
  o.status,
  o.total_amount,
  o.scheduled_at,
  s.title as service_title,
  provider.name as provider_name,
  client.name as client_name
FROM orders o
JOIN services s ON o.service_id = s.id
JOIN users provider ON o.provider_id = provider.id
JOIN users client ON o.client_id = client.id
ORDER BY o.created_at DESC;

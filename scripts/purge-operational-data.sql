-- =====================================================
-- PURGE OPERATIONAL DATA - TALENT CONNECT MARKETPLACE
-- =====================================================
-- Este script remove todos os dados transacionais para 
-- iniciar um novo ciclo de testes limpos.
-- ⚠️ CUIDADO: Esta ação é irreversível.
-- =====================================================

-- Limpar tabelas transacionais (Ordem de dependência)
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.disputes CASCADE;
TRUNCATE TABLE public.ratings CASCADE;
TRUNCATE TABLE public.executions CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.services CASCADE;
TRUNCATE TABLE public.provider_profiles CASCADE;

-- VERIFICAÇÃO PÓS-PURGE
SELECT 'Audit Logs' as table, COUNT(*) FROM audit_logs
UNION ALL SELECT 'Disputes', COUNT(*) FROM disputes
UNION ALL SELECT 'Ratings', COUNT(*) FROM ratings
UNION ALL SELECT 'Executions', COUNT(*) FROM executions
UNION ALL SELECT 'Payments', COUNT(*) FROM payments
UNION ALL SELECT 'Orders', COUNT(*) FROM orders;

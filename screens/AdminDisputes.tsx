import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Eye,
    MessageSquare,
    Scale,
    ShieldAlert,
    User,
    ArrowUpCircle,
    History,
    MapPin,
    Zap,
    RefreshCw
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from '../components/ui/alert-dialog';
import {
    Sheet,
    SheetContent
} from '../components/ui/sheet';
import NegotiationDossier from '../components/erp/NegotiationDossier';
import DecisionIntelligence from '../components/erp/DecisionIntelligence';
import SmartTag from '../components/erp/SmartTag';
import TrustScore from '../components/erp/TrustScore';

interface Dispute {
    id: string;
    order_id: string;
    opened_by: 'client' | 'provider';
    reason: string;
    status: 'open' | 'in_review' | 'resolved' | 'closed';
    created_at: string;
    order: {
        id: string;
        client_id: string;
        provider_id: string;
        service_id: string;
        total_amount: number;
        status: string;
        client: {
            id: string;
            name: string;
            email: string;
            avatar_url?: string;
            trustScore?: number;
        };
        provider: {
            id: string;
            name: string;
            email: string;
            avatar_url?: string;
            trustScore?: number;
        };
        service: {
            id: string;
            title: string;
            category?: string;
        };
        scheduled_at: string;
    };
}

const AdminDisputes: React.FC = () => {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<'analyze' | 'resolve_release' | 'resolve_refund' | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [selectedProofs, setSelectedProofs] = useState<string[]>([]);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setIsLoading(true);
        try {
            // 1. Busca as disputas básicas
            const { data: disputesData, error: disputesError } = await supabase
                .from('disputes')
                .select('*')
                .order('created_at', { ascending: false });

            if (disputesError) throw disputesError;

            // 2. Coleta IDs de ordens para hidratação manual
            const orderIds = [...new Set((disputesData || []).map(d => d.order_id))];

            // 3. Busca as ordens relacionadas (ISOLADAS para evitar que erro 403 no Join quebre a lista)
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('id, client_id, provider_id, service_id, status, total_amount, scheduled_at, service_base_price_snapshot')
                .in('id', orderIds);

            if (ordersError) console.error('📊 [LOG_V3] Erro ao buscar ordens:', ordersError);
            console.log('📊 [LOG_V3] Ordens Encontradas:', ordersData?.length || 0);

            // 4. Busca usuários e serviços separadamente (Mais lento, mas 100% resiliente a permissões)
            const clientIds = [...new Set((ordersData || []).map(o => o.client_id))];
            const providerIds = [...new Set((ordersData || []).map(o => o.provider_id))];
            const allUserIds = [...new Set([...clientIds, ...providerIds])];

            const { data: usersData } = await supabase
                .from('users')
                .select('id, name, email, avatar_url')
                .in('id', allUserIds);

            const serviceIds = [...new Set((ordersData || []).map(o => o.service_id))];
            const { data: servicesData } = await supabase
                .from('services')
                .select('id, title, category')
                .in('id', serviceIds);

            // 5. Mapeia tudo para o estado final com Hidratação Profunda
            const formattedData = (disputesData || []).map(dispute => {
                const orderRaw = (ordersData || []).find(o => o.id === dispute.order_id);
                if (!orderRaw) {
                    console.warn(`📊 [LOG_V3] Disputa ${dispute.id} órfã da ordem ${dispute.order_id}`);
                    return { ...dispute, order: null };
                }

                const clientObj = (usersData || []).find(u => u.id === orderRaw.client_id);
                const providerObj = (usersData || []).find(u => u.id === orderRaw.provider_id);
                const serviceObj = (servicesData || []).find(s => s.id === orderRaw.service_id);

                let order = {
                    ...orderRaw,
                    client: clientObj || { id: orderRaw.client_id },
                    provider: providerObj || { id: orderRaw.provider_id },
                    service: serviceObj || { id: orderRaw.service_id }
                } as any;

                // Aplica resolução de nomes
                if (order.client) order.client.displayName = resolveUserName(order.client);
                if (order.provider) order.provider.displayName = resolveUserName(order.provider);

                return { ...dispute, order };
            });

            console.log('📊 [LOG_V3] Dados Hidratados Final:', formattedData);
            setDisputes(formattedData as any);
        } catch (error) {
            console.error('Erro ao buscar disputas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAuditLogs = async (orderId: string) => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('entity_id', orderId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAuditLogs(data || []);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        }
    };

    const handleSelectDispute = async (dispute: Dispute) => {
        let currentDispute = { ...dispute };

        console.log('🚀 [VIRTUAL_ADMIN] Iniciando Seleção v3:', {
            id: currentDispute.id,
            hasOrder: !!currentDispute.order,
            orderId: currentDispute.order_id
        });

        // HIDRATAÇÃO DE EMERGÊNCIA V4: Totalmente isolada (Zero-Join)
        if (!currentDispute.order) {
            console.log('🚀 [HIDRATAÇÃO] Buscando Ordem Isolada:', currentDispute.order_id);
            try {
                // Busca a Ordem pura
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', currentDispute.order_id)
                    .single();

                if (orderData) {
                    console.log('🚀 [HIDRATAÇÃO] Ordem encontrada, buscando detalhes...');
                    // Busca os detalhes sem cruzar tabelas
                    const [clientRes, providerRes, serviceRes] = await Promise.all([
                        supabase.from('users').select('*').eq('id', (orderData as any).client_id).single(),
                        supabase.from('users').select('*').eq('id', (orderData as any).provider_id).single(),
                        supabase.from('services').select('*').eq('id', (orderData as any).service_id).single()
                    ]);

                    currentDispute.order = {
                        ...(orderData as any),
                        client: clientRes.data || { id: (orderData as any).client_id },
                        provider: providerRes.data || { id: (orderData as any).provider_id },
                        service: serviceRes.data || { id: (orderData as any).service_id }
                    } as any;
                }
            } catch (err) {
                console.error('🚀 [HIDRATAÇÃO] Falha na recuperação isolada:', err);
            }
        }

        setSelectedDispute(currentDispute);
        fetchAuditLogs(currentDispute.order_id);

        const clientId = currentDispute.order?.client_id || (currentDispute.order?.client as any)?.id;
        const providerId = currentDispute.order?.provider_id || (currentDispute.order?.provider as any)?.id;

        if (!clientId || !providerId) {
            console.warn('[Diagnostic] Falha Crítica Final:IDs não encontrados.', {
                clientId,
                providerId,
                orderData: currentDispute.order
            });
            return;
        }

        // Busca estatísticas reais para o Cliente e Profissional (para as Smart Tags)
        try {
            console.log(`🚀 [VIRTUAL_ADMIN] Buscando Stats Reais para:`, { clientId, providerId });
            const [clientStats, providerStats] = await Promise.all([
                fetchUserStats(clientId),
                fetchUserStats(providerId)
            ]);

            console.log(`🚀 [VIRTUAL_ADMIN] Resultado Stats:`, {
                clientName: clientStats.profile?.name || clientStats.profile?.email,
                providerName: providerStats.profile?.name || providerStats.profile?.email
            });

            const clientTrust = calculateTrust(clientStats.totalOrders, clientStats.disputes);
            const providerTrust = calculateTrust(providerStats.totalOrders, providerStats.disputes);

            setSelectedDispute(prev => {
                if (!prev || !prev.order) return prev;

                // Criação do objeto hidratado
                const updatedClient = {
                    ...(prev.order.client || {}),
                    ...(clientStats.profile || {}),
                    ...clientStats,
                    id: clientId,
                    trustScore: clientTrust,
                };
                (updatedClient as any).displayName = resolveUserName(updatedClient);

                const updatedProvider = {
                    ...(prev.order.provider || {}),
                    ...(providerStats.profile || {}),
                    ...providerStats,
                    id: providerId,
                    trustScore: providerTrust,
                };
                (updatedProvider as any).displayName = resolveUserName(updatedProvider);

                return {
                    ...prev,
                    order: {
                        ...prev.order,
                        client: updatedClient as any,
                        provider: updatedProvider as any
                    }
                };
            });
        } catch (err) {
            console.warn('Erro ao buscar estatísticas de usuário:', err);
        }
    };

    const calculateTrust = (orders: number, disputes: number) => {
        if (orders === 0) return 80;
        const rate = (orders - disputes) / orders;
        return Math.floor(rate * 100);
    };

    const fetchUserStats = async (userId: string) => {
        if (!userId) return { totalOrders: 0, disputes: 0, profile: null };

        console.log(`[Diagnostic] Buscando stats para o usuário: ${userId}`);
        const [ordersRes, disputesRes, profileRes] = await Promise.all([
            supabase.from('orders').select('*', { count: 'exact', head: true }).or(`client_id.eq.${userId},provider_id.eq.${userId}`),
            supabase.from('disputes').select('*, order:orders!inner(*)', { count: 'exact', head: true }).or(`order.client_id.eq.${userId},order.provider_id.eq.${userId}`),
            supabase.from('users').select('id, name, email, avatar_url').eq('id', userId).single()
        ]);

        const pRes: any = profileRes;
        if (pRes.error) {
            console.warn(`[Diagnostic] Erro ao buscar perfil ${userId}:`, pRes.error);
        } else if (pRes.data) {
            console.log(`[Diagnostic] Perfil encontrado para ${userId}:`, pRes.data.name || pRes.data.email);
        } else {
            console.warn(`[Diagnostic] Nenhum dado retornado para o usuário ${userId}`);
        }

        return {
            totalOrders: ordersRes.count || 0,
            disputes: disputesRes.count || 0,
            profile: profileRes.data
        };
    };

    const performAction = async () => {
        if (!selectedDispute || !pendingAction) return;

        setIsProcessing(selectedDispute.id);
        try {
            let newStatus = selectedDispute.status;
            let orderStatus = selectedDispute.order.status;
            let paymentStatus = 'held';

            if (pendingAction === 'analyze') {
                newStatus = 'in_review';
            } else if (pendingAction === 'resolve_release') {
                newStatus = 'resolved';
                orderStatus = 'completed';
                paymentStatus = 'released';
            } else if (pendingAction === 'resolve_refund') {
                newStatus = 'resolved';
                orderStatus = 'cancelled';
                paymentStatus = 'refunded';
            }

            // Atualiza Disputa
            const { error: disputeError } = await (supabase.from('disputes') as any)
                .update({ status: newStatus })
                .eq('id', selectedDispute.id);

            if (disputeError) throw disputeError;

            // Atualiza Pedido e Pagamento se necessário
            if (pendingAction !== 'analyze') {
                const { error: orderError } = await (supabase.from('orders') as any)
                    .update({ status: orderStatus })
                    .eq('id', selectedDispute.order_id);

                if (orderError) throw orderError;

                // ATUALIZAÇÃO DA TABELA DE PAGAMENTOS (Ponto Corrigido)
                const { error: paymentError } = await (supabase.from('payments') as any)
                    .update({ escrow_status: paymentStatus })
                    .eq('order_id', selectedDispute.order_id);

                if (paymentError) {
                    console.warn('Alerta: Pedido atualizado mas falha ao atualizar status de pagamento:', paymentError);
                }

                // Grava Log Narrativo
                await (supabase.from('audit_logs') as any).insert({
                    entity_type: 'order',
                    entity_id: selectedDispute.order_id,
                    action: 'admin_resolution',
                    payload_json: {
                        decision: pendingAction,
                        reason: actionReason,
                        reason_formatted: processSmartTags(actionReason),
                        evidence: selectedProofs,
                        resolved_by: 'admin_portal'
                    }
                });
            }

            alert('Decisão processada com sucesso!');
            await fetchDisputes();
            setSelectedDispute(null);
            setPendingAction(null);
            setActionReason('');
            setSelectedProofs([]);
        } catch (error: any) {
            console.error('Erro ao processar ação:', error);
            alert(`Falha ao atualizar: ${error.message || 'Erro desconhecido de banco de dados'}`);
        } finally {
            setIsProcessing(null);
        }
    };

    const getTagValue = (tag: string) => {
        if (!selectedDispute) return tag;
        switch (tag) {
            case '#CLIENTE': return resolveUserName(selectedDispute.order?.client);
            case '#PROFISSIONAL': return resolveUserName(selectedDispute.order?.provider);
            case '#SERVICO': return selectedDispute.order?.service?.title || 'Serviço';
            case '#VALOR': return formatCurrency(selectedDispute.order?.total_amount || 0);
            case '#PEDIDO': return `#${selectedDispute.order_id.slice(0, 8)}`;
            default: return tag;
        }
    };

    const processSmartTags = (text: string) => {
        return text
            .replace(/#CLIENTE/g, getTagValue('#CLIENTE'))
            .replace(/#PROFISSIONAL/g, getTagValue('#PROFISSIONAL'))
            .replace(/#SERVICO/g, getTagValue('#SERVICO'))
            .replace(/#VALOR/g, getTagValue('#VALOR'))
            .replace(/#PEDIDO/g, getTagValue('#PEDIDO'));
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            in_review: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
            closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        };
        const labels = {
            open: 'Aberto',
            in_review: 'Em Análise',
            resolved: 'Resolvido',
            closed: 'Fechado'
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[status as keyof typeof colors]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    const filteredDisputes = disputes;

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    const formatCurrency = (v: number) => `R$ ${(v || 0).toFixed(2)}`;

    return (
        <div className="space-y-5 pb-12">

            {/* ── AlertDialog — Confirmação de Sentença ── */}
            <AlertDialog open={!!pendingAction} onOpenChange={(open) => { if (!open) { setPendingAction(null); setActionReason(''); setSelectedProofs([]); } }}>
                <AlertDialogContent className="sm:!max-w-[800px] rounded-[40px] p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction === 'analyze' ? 'Elevar para Análise Crítica' :
                                pendingAction === 'resolve_release' ? 'Liberar Pagamento ao Profissional' :
                                    'Estornar Valor ao Cliente'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction === 'analyze'
                                ? 'A disputa será marcada como "Em Análise" e o protocolo de mediação será ativado.'
                                : 'Esta decisão é irreversível e será registrada no log de auditoria.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {pendingAction !== 'analyze' && (
                        <div className="space-y-4 py-2">
                            <DecisionIntelligence negotiationData={{ order: selectedDispute?.order, dispute: selectedDispute }} />

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                    Evidências Consideradas para o Veredito
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'LATENCIA', label: 'Latência de Início', icon: <Clock size={12} /> },
                                        { id: 'LOCALIZACAO', label: 'Localização GPS', icon: <MapPin size={12} /> },
                                        { id: 'LOGS_SISTEMA', label: 'Análise de Logs', icon: <History size={12} /> },
                                        { id: 'NAO_COMPARECIMENTO', label: 'Não Comparecimento', icon: <AlertTriangle size={12} className="text-orange-500" />, color: 'orange' }
                                    ].map(proof => (
                                        <button
                                            key={proof.id}
                                            onClick={() => {
                                                setSelectedProofs(prev =>
                                                    prev.includes(proof.label) ? prev.filter(p => p !== proof.label) : [...prev, proof.label]
                                                );
                                            }}
                                            className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-[11px] font-semibold transition-all ${selectedProofs.includes(proof.label)
                                                ? proof.color === 'orange' ? 'bg-orange-500/10 border-orange-500 text-orange-600' : 'bg-primary/10 border-primary text-primary'
                                                : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                                                }`}
                                        >
                                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedProofs.includes(proof.label)
                                                ? proof.color === 'orange' ? 'border-orange-500' : 'border-primary'
                                                : 'border-border'
                                                }`}>
                                                {selectedProofs.includes(proof.label) && (
                                                    <div className={`w-1.5 h-1.5 rounded-full ${proof.color === 'orange' ? 'bg-orange-500' : 'bg-primary'}`} />
                                                )}
                                            </div>
                                            <span className="flex items-center gap-1.5 flex-1 min-w-0">
                                                {proof.icon}
                                                <span className="truncate">{proof.label}</span>
                                                {proof.color === 'orange' && <AlertTriangle size={12} className="text-orange-500 ml-auto" />}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                                        Histórico de Risco das Partes
                                    </label>
                                    <div className="flex gap-2">
                                        <TrustScore score={selectedDispute?.order?.client?.trustScore || 85} size="sm" />
                                        <TrustScore score={selectedDispute?.order?.provider?.trustScore || 70} size="sm" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                                        Justificativa (Tags Inteligentes)
                                    </label>
                                    <div className="flex flex-wrap items-center gap-2 py-1">
                                        {(() => {
                                            const clientVal = selectedDispute?.order?.client;
                                            const providerVal = selectedDispute?.order?.provider;

                                            // DIAGNÓSTICO EM TEMPO REAL V3
                                            console.log('⚙️ [MODAL_VALORES] Values:', {
                                                disputeId: selectedDispute?.id,
                                                orderId: selectedDispute?.order_id,
                                                hasOrder: !!selectedDispute?.order,
                                                client: clientVal,
                                                provider: providerVal
                                            });

                                            return [
                                                {
                                                    id: '#CLIENTE',
                                                    label: `Cli: ${resolveUserName(clientVal)}`,
                                                    type: 'CLIENTE' as const,
                                                    data: clientVal
                                                },
                                                {
                                                    id: '#PROFISSIONAL',
                                                    label: `Prof: ${resolveUserName(providerVal)}`,
                                                    type: 'PROFISSIONAL' as const,
                                                    data: providerVal
                                                },
                                                {
                                                    id: '#SERVICO',
                                                    label: selectedDispute?.order?.service?.title || 'Serviço',
                                                    type: 'SERVICO' as const,
                                                    data: {
                                                        ...selectedDispute?.order?.service,
                                                        avgPrice: selectedDispute?.order?.service_base_price_snapshot || 0,
                                                        disputeRate: 0 // Mantido como 0 até ter métrica real
                                                    }
                                                },
                                                {
                                                    id: '#VALOR',
                                                    label: formatCurrency(selectedDispute?.order?.total_amount || 0),
                                                    type: 'VALOR' as const,
                                                    data: { totalAmount: selectedDispute?.order?.total_amount || 0 }
                                                },
                                                {
                                                    id: '#PEDIDO',
                                                    label: `#${selectedDispute?.order_id?.slice(0, 6)}`,
                                                    type: 'PEDIDO' as const,
                                                    data: selectedDispute?.order
                                                },
                                            ].map(tag => (
                                                <SmartTag
                                                    key={tag.id}
                                                    type={tag.type}
                                                    label={tag.label}
                                                    data={tag.data}
                                                />
                                            ));
                                        })()}
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea
                                        value={actionReason}
                                        onChange={e => setActionReason(e.target.value)}
                                        className="w-full h-36 rounded-2xl p-6 text-sm outline-none bg-muted/20 border-2 border-border text-foreground focus:border-orange-500/30 transition-all resize-none placeholder:text-muted-foreground/40 leading-relaxed"
                                        placeholder="Descreva o motivo da decisão para auditoria operacional..."
                                    />
                                    <button
                                        disabled={!actionReason || (isProcessing === selectedDispute?.id)}
                                        onClick={performAction}
                                        type="button"
                                        className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 active:scale-95 transition-all shadow-md disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <ArrowUpCircle size={24} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <p className="w-full text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 px-1">Atalhos de Veredito</p>
                                    {[
                                        { label: 'Não Comparecimento', text: 'O profissional #PROFISSIONAL não compareceu ao serviço #SERVICO após tempo de espera excedido, conforme verificado nos logs.' },
                                        { label: 'Atraso Crítico', text: 'Identificado atraso crítico na execução de #SERVICO por #PROFISSIONAL, comprometendo a operação.' },
                                        { label: 'Serviço Validado', text: 'A análise confirma que o serviço #SERVICO foi prestado por #PROFISSIONAL conforme acordado com #CLIENTE.' }
                                    ].map(snippet => (
                                        <button
                                            key={snippet.label}
                                            type="button"
                                            onClick={() => setActionReason(processSmartTags(snippet.text))}
                                            className="px-3 py-1.5 rounded-full bg-muted border border-border text-[9px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {snippet.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter className="sm:justify-center gap-3 pt-4">
                        <AlertDialogCancel
                            onClick={() => { setPendingAction(null); setActionReason(''); setSelectedProofs([]); }}
                            className="rounded-full px-8 py-5 border-2 border-orange-500 text-foreground font-bold hover:bg-orange-50 transition-colors"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={(pendingAction !== 'analyze' && !actionReason) || (isProcessing === selectedDispute?.id)}
                            onClick={performAction}
                            className="rounded-full px-8 py-5 bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95"
                        >
                            {isProcessing ? 'Processando...' : 'Confirmar Sentença'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Sheet — Painel de Mediação ── */}
            <Sheet open={!!selectedDispute} onOpenChange={(open) => { if (!open) setSelectedDispute(null); }}>
                <SheetContent side="right" className="w-full max-w-2xl p-0 flex flex-col gap-0 overflow-hidden">
                    {selectedDispute && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 overflow-hidden">
                                <NegotiationDossier
                                    data={selectedDispute}
                                    auditLogs={auditLogs}
                                    onBack={() => setSelectedDispute(null)}
                                />
                            </div>

                            {/* Ações Rápidas de Admin no Rodapé do Dossier (Investigação Assistida) */}
                            <div className="px-6 py-4 border-t border-border bg-card/80 flex gap-3">
                                <button
                                    onClick={() => setPendingAction('resolve_release')}
                                    disabled={selectedDispute.status === 'resolved'}
                                    className="flex-1 h-12 bg-green-500/10 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all disabled:opacity-30"
                                >
                                    Liberar Pagamento
                                </button>
                                <button
                                    onClick={() => setPendingAction('resolve_refund')}
                                    disabled={selectedDispute.status === 'resolved'}
                                    className="flex-1 h-12 bg-red-500/10 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
                                >
                                    Estornar Cliente
                                </button>
                                {selectedDispute.status === 'open' && (
                                    <button
                                        onClick={() => setPendingAction('analyze')}
                                        className="px-6 h-12 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                                    >
                                        <Zap size={14} className="text-primary" /> Analisar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Gestão de Disputas</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Análise de litígios e mediação de pagamentos em escrow</p>
                </div>
                <button onClick={fetchDisputes} className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:rotate-180 transition-all duration-500">
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden mt-6">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Caso / Data</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Motivo / Reclamante</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Valor</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="px-5 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDisputes.map(dispute => (
                            <tr key={dispute.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-all cursor-pointer" onClick={() => handleSelectDispute(dispute)}>
                                <td className="px-5 py-4">
                                    <p className="text-xs font-semibold text-foreground">#{dispute.id.slice(0, 8)}</p>
                                    <p className="text-[10px] text-muted-foreground">{formatDate(dispute.created_at)}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">{dispute.reason || 'N/A'}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${dispute.opened_by === 'client' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                            {dispute.opened_by === 'client' ? 'Cliente' : 'Prestador'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {dispute.opened_by === 'client' ? resolveUserName(dispute.order?.client) : resolveUserName(dispute.order?.provider)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-xs font-semibold text-foreground">{formatCurrency(dispute.order?.total_amount)}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <StatusBadge status={dispute.status} />
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <button className="p-1.5 rounded-lg border border-border hover:bg-muted">
                                        <Eye size={13} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDisputes;

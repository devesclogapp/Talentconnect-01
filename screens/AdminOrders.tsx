import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    MapPin,
    Calendar,
    DollarSign,
    User,
    Package,
    Shield,
    X,
    History,
    FileText,
    ArrowRightCircle,
    Activity,
    AlertTriangle,
    CheckCircle,
    Truck,
    CreditCard,
    Gavel,
    RefreshCcw,
    Zap,
    Scale,
    ShieldCheck,
    MoreVertical,
    BarChart3,
    Briefcase,
    ZapOff,
    Percent,
    TrendingUp,
    ShieldAlert,
    ArrowUpRight,
    Lock,
    Unlock,
    RotateCcw
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import { useAppStore } from '../store';

// --- Helpers de Governança Avançada ---
const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string, before?: any, after?: any) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const meta = {
            ua: navigator.userAgent,
            platform: navigator.platform,
            reason,
            details,
            before_state: before,
            after_state: after,
            origin: 'ERP Admin Connect'
        };

        await (supabase as any).from('audit_logs').insert({
            action,
            entity_type: entityType,
            entity_id: entityId,
            actor_user_id: user?.id,
            payload_json: meta
        });
    } catch (err) {
        console.error("Audit Log Failure:", err);
    }
};

const calculateSLA = (scheduledAt: string, status: string) => {
    if (!scheduledAt || status === 'completed' || status === 'cancelled') return { label: 'Finalizado', status: 'normal', remaining: 0 };

    const target = new Date(scheduledAt);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) return { label: 'Estourado', status: 'critical', remaining: diffHours };
    if (diffHours < 2) return { label: 'Crítico', status: 'warning', remaining: diffHours };
    if (diffHours < 6) return { label: 'Em Risco', status: 'alert', remaining: diffHours };

    return { label: 'Normal', status: 'normal', remaining: diffHours };
};

const calculateRiskScore = (order: any) => {
    let score = 0;
    const amount = order.payment?.amount_total || 0;

    if (amount > 1000) score += 30;
    if (order.status === 'disputed') score += 50;
    if (order.aging_hours > 48 && order.status === 'sent') score += 20;

    // Simulação de reincidência (em produção viria de uma query agregada)
    if (order.provider?.user_metadata?.total_disputes > 0) score += 40;

    return Math.min(score, 100);
};

const AdminOrders: React.FC = () => {
    const { viewFilters, setViewFilters } = useAppStore();

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState(viewFilters?.status || 'all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [isUpdating, setIsUpdating] = useState(false);
    const [orderAuditLogs, setOrderAuditLogs] = useState<any[]>([]);

    // Métricas para o Dashboard de Eficiência
    const [stats, setStats] = useState({
        avgAcceptTime: '0h',
        disputeRate: '0%',
        totalEscrow: 0,
        slaHealth: 0
    });

    // Estados de Ação
    const [actionModal, setActionModal] = useState<{ open: boolean, type: string, order: any } | null>(null);
    const [actionReason, setActionReason] = useState('');

    useEffect(() => {
        fetchOrders();
        return () => setViewFilters(null);
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    client:users!client_id (id, email, user_metadata),
                    provider:users!provider_id (id, email, user_metadata),
                    service:services (id, title, pricing_mode, base_price, category),
                    payment:payments (*)
                `);

            if (error) throw error;

            // Enriquecimento com Lógica de SLA e Score de Risco
            const enriched = (data as any[] || []).map((o: any) => {
                const now = new Date();
                const created = new Date(o.created_at);
                const agingHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

                const sla = calculateSLA(o.scheduled_at, o.status);
                const risk = calculateRiskScore({ ...o, aging_hours: agingHours });

                return {
                    ...o,
                    aging_hours: agingHours,
                    sla,
                    risk_score: risk,
                    is_high_risk: risk > 60
                };
            }).sort((a, b) => b.risk_score - a.risk_score);

            // Calcular Estatísticas do Dashboard
            const disputes = enriched.filter(o => o.status === 'disputed').length;
            const heldPayments = enriched.reduce((acc, o) => acc + (o.payment?.escrow_status === 'held' ? o.payment.amount_total : 0), 0);
            const healthyOrders = enriched.filter(o => o.sla.status === 'normal').length;

            setStats({
                avgAcceptTime: '4.2h', // Mock de média
                disputeRate: `${((disputes / (enriched.length || 1)) * 100).toFixed(1)}%`,
                totalEscrow: heldPayments,
                slaHealth: Math.round((healthyOrders / (enriched.length || 1)) * 100)
            });

            setOrders(enriched);
        } catch (error) {
            console.error('Error fetching admin orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDossierLogs = async (orderId: string) => {
        const { data } = await supabase.from('audit_logs').select('*').eq('entity_id', orderId).order('timestamp', { ascending: false });
        setOrderAuditLogs(data || []);
    };

    const handleSelectOrder = (order: any) => {
        setSelectedOrder(order);
        setActiveTab('summary');
        fetchOrderDossierLogs(order.id);
    };

    const performOperationalIntervention = async () => {
        if (!actionModal || !actionReason) return;
        setIsUpdating(true);
        try {
            const { type, order } = actionModal;
            const updates: any = {};
            const paymentUpdates: any = {};

            if (type === 'FORCE_COMPLETE') updates.status = 'completed';
            if (type === 'FORCE_CANCEL') updates.status = 'cancelled';
            if (type === 'RELEASE_PAYMENT') paymentUpdates.escrow_status = 'released';
            if (type === 'HOLD_ESCROW') paymentUpdates.escrow_status = 'held';
            if (type === 'REFUND_TOTAL') {
                updates.status = 'cancelled';
                paymentUpdates.escrow_status = 'refunded';
            }

            // Transação Atômica Fake (Update sequencial com log)
            if (Object.keys(updates).length > 0) {
                await (supabase as any).from('orders').update(updates).eq('id', order.id);
            }
            if (Object.keys(paymentUpdates).length > 0) {
                await (supabase as any).from('payments').update(paymentUpdates).eq('order_id', order.id);
            }

            await logAdminAction(
                `ORDER_INTERVENTION_${type}`,
                'ORDER',
                order.id,
                `Intervenção Master: ${type}`,
                actionReason,
                order, // Before
                { ...order, ...updates } // After (simplificado)
            );

            alert('Intervenção operacional registrada com rastro de auditoria.');
            fetchOrders(); // Recarregar tudo para garantir specs
            setActionModal(null);
            setActionReason('');
        } catch (err: any) {
            alert('Erro: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(search) ||
            (order.client?.email || '').toLowerCase().includes(search) ||
            (order.service?.title || '').toLowerCase().includes(search);

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'delayed' ? order.is_delayed : order.status === filterStatus);

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex gap-8 animate-fade-in relative pb-12 h-screen overflow-hidden">

            {/* Sidebar Filtros Operacionais */}
            <div className="w-80 bg-bg-primary border-r border-border-subtle h-full p-8 space-y-10 overflow-y-auto shrink-0">
                <div className="flex items-center gap-2 mb-2">
                    <Zap size={18} className="text-accent-primary" />
                    <h3 className="text-[10px] font-black text-text-primary uppercase tracking-widest">Monitor SLA</h3>
                </div>

                <div className="space-y-6">
                    <FilterGroup label="Situação de Fluxo">
                        <FilterButton active={filterStatus === 'all'} label="Geral" onClick={() => setFilterStatus('all')} />
                        <FilterButton active={filterStatus === 'delayed'} label="Atrasados (Aging)" color="text-error" onClick={() => setFilterStatus('delayed')} />
                        <FilterButton active={filterStatus === 'disputed'} label="Em Disputa" color="text-warning" onClick={() => setFilterStatus('disputed')} />
                    </FilterGroup>

                    <FilterGroup label="Status do Escrow">
                        <FilterButton label="Held (Garantia)" />
                        <FilterButton label="Released (Pago)" />
                    </FilterGroup>
                </div>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto p-8 pr-12">

                {/* Modal Console de Comando */}
                {actionModal?.open && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                        <div className="bg-bg-primary w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95">
                            <div className="p-10 border-b border-border-subtle bg-bg-secondary/30">
                                <h1 className="text-2xl font-black text-text-primary mb-2 flex items-center gap-2">
                                    <Gavel className="text-accent-primary" /> Comando de Fluxo
                                </h1>
                                <p className="text-xs text-text-tertiary">Protocolo de intervenção manual para o Pedido <strong>{actionModal.order.id.slice(0, 8)}</strong>.</p>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Justificativa Operacional do Comando</label>
                                    <textarea
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        className="w-full h-32 bg-bg-secondary border border-border-subtle rounded-3xl p-5 text-xs font-medium outline-none focus:border-accent-primary"
                                        placeholder="Descreva a evidência ou motivo da intervenção manual..."
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setActionModal(null)} className="flex-1 py-4 bg-bg-secondary rounded-2xl text-[10px] font-black uppercase text-text-primary">Abortar</button>
                                    <button
                                        disabled={!actionReason || isUpdating}
                                        onClick={performOperationalIntervention}
                                        className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:scale-105 disabled:opacity-30"
                                    >
                                        Executar Comando
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dossiê do Pedido - Command Center */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                        <div className="bg-bg-primary h-full w-full max-w-5xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">

                            {/* Header do Dossiê */}
                            <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-secondary/30">
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 rounded-2xl ${selectedOrder.risk_score > 60 ? 'bg-error text-white' : 'bg-accent-primary text-white'} shadow-lg`}>
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">{selectedOrder.service?.title || 'Pedido Genérico'}</h2>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedOrder.is_high_risk ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                                {selectedOrder.is_high_risk ? 'High Risk Asset' : 'Verified Order'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest flex items-center gap-2">
                                            Protocolo: <span className="font-mono text-text-primary">{selectedOrder.id}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedOrder(null)} className="p-3 bg-bg-secondary hover:bg-bg-tertiary rounded-xl border border-border-subtle transition-all"><X size={24} /></button>
                                </div>
                            </div>

                            {/* Navegação Interna */}
                            <div className="flex px-10 bg-bg-secondary/10 border-b border-border-subtle overflow-x-auto">
                                {[
                                    { id: 'summary', label: 'Timeline Imutável', icon: <History size={14} /> },
                                    { id: 'logistics', label: 'Logística & Prova', icon: <Truck size={14} /> },
                                    { id: 'financial', label: 'Escrow & Repasse', icon: <DollarSign size={14} /> },
                                    { id: 'compliance', label: 'Conformidade', icon: <ShieldCheck size={14} /> },
                                    { id: 'risk', label: 'Análise de Risco', icon: <Shield size={14} /> },
                                    { id: 'audit', label: 'Auditoria Digital', icon: <FileText size={14} /> }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0 flex items-center gap-2 ${activeTab === tab.id ? 'border-accent-primary text-accent-primary bg-accent-primary/5' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Conteúdo Dinâmico */}
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                {activeTab === 'summary' && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <DetailBox label="Aging Total" value={`${selectedOrder.aging_hours}h`} color="text-accent-primary" />
                                            <DetailBox label="SLA Status" value={selectedOrder.sla.label} color={selectedOrder.sla.status === 'critical' ? 'text-error' : 'text-success'} />
                                            <DetailBox label="Risk Level" value={`${selectedOrder.risk_score}%`} color={selectedOrder.risk_score > 60 ? 'text-error' : 'text-success'} />
                                            <DetailBox label="Garantia" value={`R$ ${selectedOrder.payment?.amount_total || '0'}`} color="text-text-primary" />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className="space-y-8">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest flex items-center gap-2">
                                                    <Zap className="text-accent-primary" size={14} /> Console de Intervenção
                                                </h4>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <ActionShortcut
                                                        icon={<CheckCircle2 />}
                                                        title="Forçar Conclusão"
                                                        desc="Libera escrow imediatamente (Requer Prova)"
                                                        onClick={() => setActionModal({ open: true, type: 'FORCE_COMPLETE', order: selectedOrder })}
                                                    />
                                                    <ActionShortcut
                                                        icon={<RotateCcw />}
                                                        title="Estorno Total (Full Refund)"
                                                        desc="Cancela e devolve 100% ao cliente"
                                                        color="text-error"
                                                        onClick={() => setActionModal({ open: true, type: 'REFUND_TOTAL', order: selectedOrder })}
                                                    />
                                                    <ActionShortcut
                                                        icon={<Lock />}
                                                        title="Congelar Escrow (Hold)"
                                                        desc="Bloqueia repasse para investigação extra"
                                                        color="text-warning"
                                                        onClick={() => setActionModal({ open: true, type: 'HOLD_ESCROW', order: selectedOrder })}
                                                    />
                                                    <ActionShortcut
                                                        icon={<Gavel />}
                                                        title="Abrir Disputa Manual"
                                                        desc="Intervém e trava o fluxo do pedido"
                                                        onClick={() => setActionModal({ open: true, type: 'MANUAL_DISPUTE', order: selectedOrder })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest flex items-center gap-2">
                                                    <History className="text-text-tertiary" size={14} /> Timeline Operacional
                                                </h4>
                                                <div className="bg-bg-secondary/30 p-8 rounded-[40px] border border-border-subtle relative">
                                                    <div className="absolute left-12 top-10 bottom-10 w-px bg-border-subtle" />
                                                    <div className="space-y-8 relative">
                                                        {orderAuditLogs.length > 0 ? orderAuditLogs.map((log, i) => (
                                                            <div key={i} className="flex gap-6 items-start">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${log.origin.includes('Admin') ? 'bg-black text-white' : 'bg-bg-tertiary text-text-tertiary border border-border-subtle'}`}>
                                                                    {log.origin.includes('Admin') ? <ShieldCheck size={14} /> : <Activity size={12} />}
                                                                </div>
                                                                <div className="flex-1 pt-1">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <p className="text-[10px] font-black uppercase text-text-primary tracking-tight">{log.action}</p>
                                                                        <span className="text-[8px] font-bold text-text-tertiary uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                                                                    </div>
                                                                    <p className="text-[10px] text-text-tertiary font-medium mb-2 italic">"{log.reason}"</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[8px] bg-bg-secondary px-2 py-0.5 rounded text-text-tertiary font-bold uppercase font-mono">{log.origin}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="py-20 text-center">
                                                                <Activity size={32} className="mx-auto text-text-tertiary opacity-20 mb-4" />
                                                                <p className="text-[10px] text-text-tertiary uppercase font-black tracking-widest">Aguardando Eventos</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'logistics' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="bg-bg-secondary/20 p-8 rounded-[40px] border border-border-subtle space-y-8 text-left">
                                            <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Rastreio de Execução</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <LogItem label="Janela Contratada" value={selectedOrder.scheduled_at ? new Date(selectedOrder.scheduled_at).toLocaleString() : 'N/A'} icon={<Calendar size={14} />} />
                                                <LogItem label="Check-in Presença" value={selectedOrder.client_confirmed_start ? 'Confirmado via App' : 'Pendente'} icon={<MapPin size={14} />} color={selectedOrder.client_confirmed_start ? 'text-success' : 'text-warning'} />
                                                <LogItem label="Início Registrado" value={selectedOrder.started_at ? new Date(selectedOrder.started_at).toLocaleString() : 'Pendente'} icon={<Clock size={14} />} />
                                                <LogItem label="Fim Registrado" value={selectedOrder.ended_at ? new Date(selectedOrder.ended_at).toLocaleString() : 'Pendente'} icon={<CheckCircle2 size={14} />} />
                                            </div>
                                        </div>
                                        <div className="bg-bg-secondary/20 p-8 rounded-[40px] border border-border-subtle space-y-4 text-left">
                                            <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Evidência de Local</h4>
                                            <div className="p-6 bg-bg-primary rounded-3xl border border-border-subtle">
                                                <p className="text-xs font-medium text-text-primary leading-relaxed">{selectedOrder.location_text || 'Localização não declarada no contrato digital.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'financial' && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                            <FinancialCard label="Total Custódia" value={`R$ ${selectedOrder.payment?.amount_total || '0'}`} sub="Valor retido no Escrow" color="text-text-primary" />
                                            <FinancialCard label="Taxa Operadora" value={`R$ ${selectedOrder.payment?.operator_fee || '0'}`} sub="Comissão Admin Connect" color="text-accent-primary" />
                                            <FinancialCard label="Líquido Profissional" value={`R$ ${selectedOrder.payment?.provider_amount || '0'}`} sub="Previsão de Repasse" color="text-success" />
                                        </div>

                                        <div className="bg-bg-secondary/20 p-10 rounded-[40px] border border-border-subtle space-y-8 text-left">
                                            <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Gestão de Garantia (Escrow)</h4>
                                            <div className="flex items-center justify-between p-8 bg-bg-primary rounded-[32px] border border-border-subtle shadow-sm">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedOrder.payment?.escrow_status === 'released' ? 'bg-success/10 text-success' :
                                                        selectedOrder.payment?.escrow_status === 'held' ? 'bg-warning/10 text-warning' : 'bg-bg-secondary text-text-tertiary'
                                                        }`}>
                                                        <CreditCard size={32} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black uppercase text-text-primary tracking-tight">{selectedOrder.payment?.escrow_status || 'Transação Inexistente'}</p>
                                                        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">ID Gateway: {selectedOrder.payment?.id || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setActionModal({ open: true, type: 'RELEASE_PAYMENT', order: selectedOrder })}
                                                        className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                                                    >
                                                        Liberar Manualmente
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'compliance' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            {/* Chat Monitor */}
                                            <div className="bg-bg-secondary/20 p-8 rounded-[40px] border border-border-subtle flex flex-col h-[500px]">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-6">Monitoramento de Chat (Read-only)</h4>
                                                <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                                                    <div className="bg-bg-primary p-4 rounded-2xl border border-border-subtle max-w-[80%]">
                                                        <p className="text-[8px] font-black uppercase text-accent-primary mb-1">{resolveUserName(selectedOrder.client)} (Cliente)</p>
                                                        <p className="text-xs text-text-primary">Olá, já cheguei no local. Quando podemos começar?</p>
                                                    </div>
                                                    <div className="bg-black p-4 rounded-2xl ml-auto max-w-[80%]">
                                                        <p className="text-[8px] font-black uppercase text-white/60 mb-1">{resolveUserName(selectedOrder.provider)} (Profissional)</p>
                                                        <p className="text-xs text-white">Oi! Já estou finalizando o atendimento anterior e chego em 5 minutos.</p>
                                                    </div>
                                                    <div className="bg-bg-primary p-4 rounded-2xl border border-border-subtle max-w-[80%]">
                                                        <p className="text-[8px] font-black uppercase text-accent-primary mb-1">{resolveUserName(selectedOrder.client)} (Cliente)</p>
                                                        <p className="text-xs text-text-primary">Perfeito, estou te aguardando na recepção.</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 p-4 bg-bg-tertiary/30 rounded-2xl border border-dashed border-border-subtle text-center">
                                                    <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Visualização restrita ao operador</p>
                                                </div>
                                            </div>

                                            {/* Evidências & Anexos */}
                                            <div className="space-y-8">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Galeria de Evidências</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="aspect-square bg-bg-secondary border-2 border-dashed border-border-subtle rounded-3xl flex flex-col items-center justify-center text-text-tertiary group hover:border-accent-primary transition-all cursor-pointer">
                                                        <FileText size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[9px] font-black uppercase">Contrato.pdf</span>
                                                    </div>
                                                    <div className="aspect-square bg-bg-secondary border-2 border-dashed border-border-subtle rounded-3xl flex flex-col items-center justify-center text-text-tertiary group hover:border-accent-primary transition-all cursor-pointer">
                                                        <Package size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[9px] font-black uppercase">Entrega.jpg</span>
                                                    </div>
                                                </div>
                                                <div className="bg-warning/5 border border-warning/20 p-6 rounded-3xl">
                                                    <p className="text-[10px] font-bold text-warning uppercase mb-2">Nota de Governança</p>
                                                    <p className="text-[10px] text-text-tertiary leading-relaxed">Em caso de disputa, utilize estas evidências e o log de chat como base para a decisão final de estorno ou repasse.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'risk' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                                            <div className="bg-bg-secondary/20 p-10 rounded-[40px] border border-border-subtle space-y-6">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Indicadores de Risco</h4>
                                                <div className="space-y-6">
                                                    <RiskMetric label="Volume Transacional" value={selectedOrder.payment?.amount_total > 500 ? 'Alto Impacto' : 'Normal'} status={selectedOrder.payment?.amount_total > 500 ? 'warning' : 'success'} />
                                                    <RiskMetric label="Histórico de Conflitos" value="1 Disputa Anterior" status="alert" />
                                                    <RiskMetric label="Integridade de Perfil" value="KYC Verificado" status="success" />
                                                    <RiskMetric label="SLA Histórico" value="98.2% de Pontualidade" status="success" />
                                                </div>
                                            </div>
                                            <div className="bg-bg-secondary/20 p-10 rounded-[40px] border border-border-subtle flex flex-col items-center justify-center text-center space-y-4">
                                                <div className="relative w-40 h-40 flex items-center justify-center">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-bg-tertiary" />
                                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * selectedOrder.risk_score) / 100} className={`${selectedOrder.risk_score > 60 ? 'text-error' : 'text-success'}`} />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-4xl font-black text-text-primary">{selectedOrder.risk_score}%</span>
                                                        <span className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Risk Score</span>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest px-8">Este score é calculado com base em métricas de tempo, valor e comportamento histórico.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'audit' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-left">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Journal Operacional Completo</h4>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-subtle rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-bg-tertiary transition-all">
                                                <FileText size={14} /> Exportar Logs
                                            </button>
                                        </div>
                                        <div className="bg-bg-secondary/20 rounded-[40px] border border-border-subtle overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-bg-secondary/40 border-b border-border-subtle">
                                                    <tr>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase text-text-tertiary tracking-widest">Evento / Ação</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase text-text-tertiary tracking-widest">Agente & Contexto</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase text-text-tertiary tracking-widest">Data / Hora</th>
                                                        <th className="px-8 py-5 text-[9px] font-black uppercase text-text-tertiary tracking-widest">Justificativa</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-subtle">
                                                    {orderAuditLogs.map((log, i) => (
                                                        <tr key={i} className="hover:bg-bg-primary/50 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-lg ${log.action.includes('INTERVENTION') ? 'bg-error/10 text-error' : 'bg-bg-tertiary text-text-tertiary'}`}>
                                                                        <Activity size={14} />
                                                                    </div>
                                                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{log.action}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <p className="text-[10px] font-bold text-text-primary uppercase">{log.origin}</p>
                                                                    {log.metadata && (
                                                                        <p className="text-[8px] text-text-tertiary font-medium truncate max-w-[200px]" title={JSON.parse(log.metadata).ua}>
                                                                            Device: {JSON.parse(log.metadata).platform}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-[10px] font-bold text-text-tertiary">{new Date(log.timestamp).toLocaleString()}</td>
                                                            <td className="px-8 py-5">
                                                                <p className="text-[10px] text-text-tertiary italic font-medium leading-relaxed">"{log.reason}"</p>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Header & Quick Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-text-primary tracking-tighter">Fluxo de Pedidos</h1>
                        <p className="text-sm text-text-tertiary font-medium">Monitoramento de SLA, contingência e governança de transações em tempo real</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchOrders} className="p-3 bg-bg-secondary border border-border-subtle rounded-2xl hover:rotate-180 transition-all duration-300"><RefreshCcw size={20} /></button>
                        <button className="h-12 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><ArrowRightCircle size={16} /> Relatórios Export</button>
                    </div>
                </div>

                {/* Dashboard de Eficiência */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <EfficiencyCard
                        label="SLA Health Score"
                        value={`${stats.slaHealth}%`}
                        icon={<Zap size={18} />}
                        desc="Pedidos dentro do prazo"
                        color="text-accent-primary"
                        trend="+2.4%"
                    />
                    <EfficiencyCard
                        label="Taxa de Disputa"
                        value={stats.disputeRate}
                        icon={<Scale size={18} />}
                        desc="Média global de conflitos"
                        color="text-error"
                        trend="-0.5%"
                    />
                    <EfficiencyCard
                        label="Escrow Retido"
                        value={`R$ ${stats.totalEscrow.toLocaleString()}`}
                        icon={<ShieldCheck size={18} />}
                        desc="Garantias em hold"
                        color="text-success"
                    />
                    <EfficiencyCard
                        label="Média de Aceite"
                        value={stats.avgAcceptTime}
                        icon={<Clock size={18} />}
                        desc="Lead time inicial"
                        color="text-text-tertiary"
                    />
                </div>

                {/* Toolbar Administrativa */}
                <div className="bg-bg-primary border border-border-subtle p-6 rounded-[32px] flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded-2xl pl-14 pr-6 h-16 text-sm font-medium outline-none focus:border-accent-primary transition-all" placeholder="Filtrar por Protocolo, Cliente, Profissional ou Serviço..." />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:w-48">
                            <select className="w-full h-16 px-6 bg-bg-secondary border border-border-subtle rounded-2xl text-[10px] font-black uppercase outline-none focus:border-accent-primary appearance-none cursor-pointer">
                                <option>Risk: All Levels</option>
                                <option>High Risk ({">"}70)</option>
                                <option>Medium Risk</option>
                            </select>
                        </div>
                        <button className="h-16 w-16 bg-bg-secondary border border-border-subtle rounded-2xl flex items-center justify-center hover:bg-bg-tertiary transition-all">
                            <Filter size={20} className="text-text-primary" />
                        </button>
                    </div>
                </div>

                {/* Tabela Estratégica de Pedidos */}
                <div className="bg-bg-primary border border-border-subtle rounded-[40px] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-bg-secondary/40 border-b border-border-subtle">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Protocolo / Serviço</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Financeiro (Bruto/Líq)</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Monitor SLA</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Risco</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Dossiê</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-24 text-center"><RefreshCcw className="animate-spin mx-auto mb-4 text-accent-primary" size={32} /></td></tr>
                                ) : filteredOrders.map(order => (
                                    <tr key={order.id} onClick={() => handleSelectOrder(order)} className="hover:bg-bg-secondary/20 transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-accent-primary">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] text-text-tertiary font-mono bg-bg-secondary px-2 py-0.5 rounded">#{order.id.slice(0, 8)}</span>
                                                    <span className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-success' : order.status === 'disputed' ? 'bg-error' : 'bg-warning'}`} />
                                                </div>
                                                <p className="text-xs font-black text-text-primary uppercase group-hover:text-accent-primary transition-colors">{order.service?.title || 'Serviço Personalizado'}</p>
                                                <p className="text-[10px] text-text-tertiary font-medium">Cli: {resolveUserName(order.client)}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <p className="text-xs font-black text-text-primary">R$ {order.payment?.amount_total || '0'}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] font-bold text-text-tertiary uppercase">Líq: R$ {order.payment?.provider_amount || '0'}</span>
                                                    <span className="text-[8px] font-black text-accent-primary bg-accent-primary/5 px-1.5 py-0.5 rounded">Taxa: R$ {order.payment?.operator_fee || '0'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${order.sla.status === 'critical' ? 'bg-error/10 border-error/20 text-error' :
                                                    order.sla.status === 'warning' ? 'bg-warning/10 border-warning/20 text-warning' :
                                                        order.sla.status === 'alert' ? 'bg-info/10 border-info/20 text-info' :
                                                            'bg-bg-secondary border-border-subtle text-text-tertiary'
                                                    }`}>
                                                    <Zap size={10} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{order.sla.label}</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-text-tertiary">{order.scheduled_at ? new Date(order.scheduled_at).toLocaleString() : 'Não agendado'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 w-16 bg-bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${order.risk_score > 70 ? 'bg-error' : order.risk_score > 40 ? 'bg-warning' : 'bg-success'}`}
                                                        style={{ width: `${order.risk_score}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-black ${order.risk_score > 60 ? 'text-error' : 'text-text-tertiary'}`}>
                                                    {order.risk_score}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleSelectOrder(order)} className="p-3 bg-bg-secondary rounded-xl border border-border-subtle hover:bg-black hover:text-white transition-all shadow-sm">
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponentes de UI Operacional ---

const EfficiencyCard = ({ label, value, icon, desc, color, trend }: any) => (
    <div className="bg-bg-primary border border-border-subtle p-8 rounded-[40px] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-text-tertiary opacity-10 group-hover:scale-125 transition-transform">
            {React.cloneElement(icon as React.ReactElement, { size: 48 })}
        </div>
        <div className="relative space-y-4">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl bg-bg-secondary ${color}`}>{icon}</div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black ${trend.startsWith('+') ? 'text-success' : 'text-error'}`}>
                        <TrendingUp size={12} className={trend.startsWith('-') ? 'rotate-180' : ''} />
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{label}</p>
                <h3 className={`text-3xl font-black tracking-tighter mt-1 ${color}`}>{value}</h3>
            </div>
            <p className="text-[10px] font-medium text-text-tertiary">{desc}</p>
        </div>
    </div>
);

// --- Subcomponentes de UI Operacional ---

const FilterGroup = ({ label, children }: any) => (
    <div className="space-y-4">
        <h4 className="text-[9px] font-black uppercase text-text-tertiary tracking-widest border-b border-border-subtle pb-2">{label}</h4>
        <div className="flex flex-col gap-2">{children}</div>
    </div>
);

const FilterButton = ({ active, label, color, onClick }: any) => (
    <button onClick={onClick} className={`text-left px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-black text-white shadow-lg scale-[1.02]' : 'bg-bg-secondary/30 text-text-tertiary hover:bg-bg-secondary border border-transparent hover:border-border-subtle'}`}>
        <span className={color}>{label}</span>
    </button>
);

const DetailBox = ({ label, value, color }: any) => (
    <div className="bg-bg-primary border border-border-subtle p-6 rounded-[32px] shadow-sm">
        <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
);

const ActionShortcut = ({ icon, title, desc, color, onClick }: any) => (
    <button onClick={onClick} className="flex items-center gap-6 p-6 bg-bg-primary border border-border-subtle rounded-[32px] hover:shadow-xl hover:bg-bg-secondary transition-all group group-hover:scale-[1.02]">
        <div className={`w-14 h-14 rounded-2xl bg-bg-secondary flex items-center justify-center border border-border-subtle group-hover:scale-110 transition-transform ${color || 'text-accent-primary'}`}>
            {React.cloneElement(icon as React.ReactElement, { size: 24 })}
        </div>
        <div className="text-left">
            <h5 className="text-xs font-black text-text-primary uppercase tracking-tight">{title}</h5>
            <p className="text-[10px] text-text-tertiary font-medium">{desc}</p>
        </div>
        <ChevronRight size={18} className="ml-auto text-text-tertiary opacity-0 group-hover:opacity-100 transition-all" />
    </button>
);

const LogItem = ({ label, value, icon, color }: any) => (
    <div className="flex items-center justify-between p-6 bg-bg-primary rounded-2xl border border-border-subtle">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-bg-secondary rounded-lg text-text-tertiary">{icon}</div>
            <span className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">{label}</span>
        </div>
        <span className={`text-[10px] font-black uppercase ${color || 'text-text-primary'}`}>{value}</span>
    </div>
);

const FinancialCard = ({ label, value, sub, color }: any) => (
    <div className="bg-bg-primary border border-border-subtle p-8 rounded-[40px] shadow-sm">
        <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
        <p className="text-[8px] font-bold text-text-tertiary uppercase mt-2 tracking-tighter opacity-70">{sub}</p>
    </div>
);

const RiskMetric = ({ label, value, status }: any) => (
    <div className="flex items-center justify-between p-4 bg-bg-primary rounded-2xl border border-border-subtle">
        <div className="flex flex-col">
            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-0.5">{label}</span>
            <span className="text-[10px] font-bold text-text-primary uppercase">{value}</span>
        </div>
        <div className={`w-3 h-3 rounded-full ${status === 'success' ? 'bg-success shadow-[0_0_10px_rgba(76,175,80,0.4)]' :
            status === 'warning' ? 'bg-error shadow-[0_0_10px_rgba(244,67,54,0.4)]' :
                'bg-warning shadow-[0_0_10px_rgba(255,152,0,0.4)]'
            }`} />
    </div>
);

export default AdminOrders;

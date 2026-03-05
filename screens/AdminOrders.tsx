import React, { useState, useEffect } from 'react';
import {
    Search,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    DollarSign,
    Activity,
    ShieldAlert,
    FileText,
    Zap,
    ChevronRight,
    Package,
    User,
    Briefcase,
    X,
    ArrowUp,
    ArrowDown,
    Eye
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import { useAppStore } from '../store';

const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from('audit_logs').insert({
            action,
            entity_type: entityType,
            entity_id: entityId,
            actor_user_id: user?.id,
            payload_json: { details, reason, origin: 'ERP AdminOrders' }
        });
    } catch (err) { console.error("Audit log failed:", err); }
};

const AdminOrders: React.FC = () => {
    const { viewFilters, setViewFilters } = useAppStore();

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState(viewFilters?.status || 'all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [dossierTab, setDossierTab] = useState('summary');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [sortField, setSortField] = useState<'risk' | 'sla' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchOrders();
        return () => setViewFilters(null);
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    client:users!client_id (id, email, name),
                    provider:users!provider_id (id, email, name),
                    service:services (id, title, pricing_mode)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const { data: payments } = await supabase.from('payments').select('order_id, amount_total, operator_fee, escrow_status');
            const { data: disputes } = await supabase.from('disputes').select('order_id, status');

            const allPayments = (payments || []) as any[];
            const allDisputes = (disputes || []) as any[];

            const enriched = ((data || []) as any[]).map(o => {
                const now = new Date();
                const created = new Date(o.created_at);
                const agingHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

                const orderPayment = allPayments.find(p => p.order_id === o.id);
                const orderDispute = allDisputes.find(d => d.order_id === o.id);

                let slaStatus: 'normal' | 'warning' | 'critical' = 'normal';
                if (o.status === 'sent') {
                    if (agingHours > 24) slaStatus = 'critical';
                    else if (agingHours > 12) slaStatus = 'warning';
                }

                let riskScore = 5;
                if (orderDispute) riskScore += 40;
                if (slaStatus === 'critical') riskScore += 30;
                if (slaStatus === 'warning') riskScore += 15;

                return {
                    ...o,
                    agingHours,
                    slaStatus,
                    riskScore: Math.min(riskScore, 100),
                    payment: orderPayment,
                    dispute: orderDispute
                };
            });

            setOrders(enriched);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const performIntervention = async (type: string) => {
        if (!selectedOrder) return;
        const reason = prompt('Justificativa para intervenção (Registro de Auditoria):');
        if (!reason) return;

        setIsProcessing(selectedOrder.id);
        try {
            const updates: any = {};
            if (type === 'FORCE_COMPLETE') updates.status = 'completed';
            if (type === 'FORCE_CANCEL') updates.status = 'cancelled';

            const { error } = await (supabase as any).from('orders').update(updates).eq('id', selectedOrder.id);
            if (error) throw error;

            await logAdminAction(type, 'ORDER', selectedOrder.id, `Intervenção operacional: ${type}`, reason);

            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updates } : o));
            setSelectedOrder({ ...selectedOrder, ...updates });
            alert('Intervenção aplicada com sucesso.');
        } catch (err: any) {
            alert('Erro: ' + err.message);
        } finally {
            setIsProcessing(null);
        }
    };

    const toggleSort = (field: 'risk' | 'sla') => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const filteredOrders = orders
        .filter(o => {
            const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                (o.id || '').toLowerCase().includes(search) ||
                (o.service?.title || '').toLowerCase().includes(search) ||
                resolveUserName(o.client).toLowerCase().includes(search) ||
                resolveUserName(o.provider).toLowerCase().includes(search);
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => {
            if (!sortField) return 0;
            if (sortField === 'risk') return sortDir === 'desc' ? b.riskScore - a.riskScore : a.riskScore - b.riskScore;
            if (sortField === 'sla') return sortDir === 'desc' ? b.agingHours - a.agingHours : a.agingHours - b.agingHours;
            return 0;
        });

    const getStatusStyle = (status: string) => {
        const map: Record<string, string> = {
            completed: 'bg-success/10 text-success',
            cancelled: 'bg-error/10 text-error',
            in_execution: 'bg-accent-primary/10 text-accent-primary',
            disputed: 'bg-warning/10 text-warning',
            sent: 'bg-info/10 text-info',
            paid_escrow_held: 'bg-info/10 text-info'
        };
        return map[status] || 'bg-bg-secondary text-text-tertiary border border-border-subtle';
    };

    const getSlaStyle = (sla: string) => {
        if (sla === 'critical') return 'text-error';
        if (sla === 'warning') return 'text-warning';
        return 'text-success';
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

    const statusCounts = {
        critical: orders.filter(o => o.slaStatus === 'critical').length,
        disputes: orders.filter(o => o.dispute).length,
        inExecution: orders.filter(o => o.status === 'in_execution').length,
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">

            {/* Order Dossier */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div
                        className="h-full w-full max-w-4xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col"
                        style={{ background: 'var(--bg-primary)' }}
                    >
                        <div className="p-6 border-b border-border-subtle flex items-center justify-between" style={{ background: 'var(--bg-secondary)' }}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-[8px] bg-accent-primary text-white"><Package size={20} /></div>
                                <div>
                                    <h2 className="text-base font-semibold text-text-primary">Dossiê do Pedido</h2>
                                    <p className="text-[10px] text-text-tertiary font-mono">#{selectedOrder.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-[8px] hover:bg-bg-tertiary transition-colors border border-border-subtle"><X size={20} /></button>
                        </div>

                        <div className="flex px-6 border-b border-border-subtle overflow-x-auto" style={{ background: 'var(--bg-secondary)' }}>
                            {['summary', 'financial', 'intervention'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setDossierTab(tab)}
                                    className={`px-5 py-4 text-[10px] font-semibold uppercase tracking-widest border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                                >
                                    {tab === 'summary' ? 'Resumo' : tab === 'financial' ? 'Financeiro' : 'Intervenção'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {dossierTab === 'summary' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="grid grid-cols-3 gap-4">
                                        <MiniStat label="Status" value={selectedOrder.status} />
                                        <MiniStat label="Modalidade" value={selectedOrder.pricing_mode === 'hourly' ? 'Por Hora' : 'Fixo'} />
                                        <MiniStat label="Aging" value={`${selectedOrder.agingHours}h`} color={getSlaStyle(selectedOrder.slaStatus)} />
                                    </div>
                                    <div
                                        className="p-6 space-y-1"
                                        style={{ background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}
                                    >
                                        <InfoRow label="Serviço" value={selectedOrder.service?.title} />
                                        <InfoRow label="Cliente" value={resolveUserName(selectedOrder.client)} />
                                        <InfoRow label="Profissional" value={resolveUserName(selectedOrder.provider)} />
                                        <InfoRow label="Agendamento" value={formatDate(selectedOrder.scheduled_at)} />
                                        <InfoRow label="Local" value={selectedOrder.location_text} />
                                        <InfoRow label="Risk Score" value={`${selectedOrder.riskScore}%`} />
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'financial' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="grid grid-cols-3 gap-4">
                                        <MiniStat label="Total" value={`R$ ${(selectedOrder.payment?.amount_total || 0).toFixed(2)}`} color="text-accent-primary" />
                                        <MiniStat label="Taxa (10%)" value={`R$ ${(selectedOrder.payment?.operator_fee || 0).toFixed(2)}`} color="text-warning" />
                                        <MiniStat label="Status Escrow" value={selectedOrder.payment?.escrow_status || 'N/A'} color={(selectedOrder.payment?.escrow_status === 'released') ? 'text-success' : 'text-text-secondary'} />
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'intervention' && (
                                <div className="space-y-4 animate-in fade-in">
                                    <h4 className="text-[10px] font-semibold uppercase text-text-tertiary tracking-widest">Painel de Intervenção Operacional</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InterventionCard
                                            icon={<CheckCircle2 size={20} />}
                                            label="Forçar Conclusão"
                                            desc="Marca como concluído e inicia fluxo de repasse."
                                            color="text-success"
                                            onClick={() => performIntervention('FORCE_COMPLETE')}
                                            disabled={isProcessing === selectedOrder.id}
                                        />
                                        <InterventionCard
                                            icon={<XCircle size={20} />}
                                            label="Forçar Cancelamento"
                                            desc="Cancela o pedido e aciona política de reembolso."
                                            color="text-error"
                                            onClick={() => performIntervention('FORCE_CANCEL')}
                                            disabled={isProcessing === selectedOrder.id}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-semibold text-text-primary">Pedidos & SLA</h1>
                    <p className="text-[13px] text-text-secondary mt-0.5">Controle operacional de ciclo de vida das contratações</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="p-2.5 rounded-[8px] border border-border-subtle hover:rotate-180 transition-all duration-500"
                    style={{ background: 'var(--bg-secondary)' }}
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Total de Pedidos" value={orders.length} icon={<Briefcase size={14} />} />
                <KpiCard label="SLA Violado" value={statusCounts.critical} icon={<AlertTriangle size={14} />} color="text-error" />
                <KpiCard label="Com Disputa" value={statusCounts.disputes} icon={<ShieldAlert size={14} />} color="text-warning" />
                <KpiCard label="Em Execução" value={statusCounts.inExecution} icon={<Zap size={14} />} color="text-accent-primary" />
            </div>

            {/* Toolbar */}
            <div
                className="flex flex-col md:flex-row gap-3 p-4"
                style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '10px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por ID, serviço, cliente ou profissional..."
                        className="w-full h-10 rounded-[8px] pl-10 pr-4 text-sm outline-none transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)', color: 'var(--text-primary)' }}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { val: 'all', label: 'Todos' },
                        { val: 'sent', label: 'Enviados' },
                        { val: 'in_execution', label: 'Em Execução' },
                        { val: 'disputed', label: 'Disputados' },
                        { val: 'completed', label: 'Concluídos' },
                    ].map(opt => (
                        <button
                            key={opt.val}
                            onClick={() => setFilterStatus(opt.val)}
                            className="h-10 px-4 rounded-[8px] text-[10px] font-semibold uppercase tracking-widest transition-all duration-[120ms]"
                            style={filterStatus === opt.val
                                ? { background: 'var(--text-primary)', color: '#FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                                : { background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: '1px solid rgba(0,0,0,0.06)' }
                            }
                        >{opt.label}</button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div
                style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '10px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    overflow: 'hidden'
                }}
            >
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border-subtle" style={{ background: 'var(--bg-secondary)' }}>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Pedido / Serviço</th>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Partes</th>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Status</th>
                            <th
                                className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary cursor-pointer hover:text-text-primary transition-colors"
                                onClick={() => toggleSort('sla')}
                            >
                                <span className="flex items-center gap-1.5">SLA {sortField === 'sla' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}</span>
                            </th>
                            <th
                                className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary cursor-pointer hover:text-text-primary transition-colors"
                                onClick={() => toggleSort('risk')}
                            >
                                <span className="flex items-center gap-1.5">Risco {sortField === 'risk' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}</span>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Valor</th>
                            <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Dossiê</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {loading ? (
                            <tr><td colSpan={7} className="py-20 text-center">
                                <RefreshCw className="animate-spin mx-auto mb-3 text-accent-primary" size={24} />
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Sincronizando Pedidos...</p>
                            </td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={7} className="py-20 text-center opacity-30">
                                <Package size={40} className="mx-auto mb-3" />
                                <p className="text-[10px] font-semibold uppercase tracking-widest">Nenhum pedido encontrado</p>
                            </td></tr>
                        ) : filteredOrders.map(order => (
                            <tr
                                key={order.id}
                                className="transition-all cursor-pointer"
                                onClick={() => setSelectedOrder(order)}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                            >
                                <td className="px-6 py-4">
                                    <p className="text-[10px] font-mono text-text-tertiary mb-0.5">#{order.id.slice(0, 8)}</p>
                                    <p className="text-xs font-semibold text-text-primary">{order.service?.title || 'Serviço'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-[10px] text-text-secondary">{resolveUserName(order.client)}</p>
                                    <p className="text-[10px] text-text-tertiary">→ {resolveUserName(order.provider)}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-semibold uppercase ${getStatusStyle(order.status)}`}>{order.status?.replace(/_/g, ' ')}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 text-[10px] font-semibold ${getSlaStyle(order.slaStatus)}`}>
                                        <Clock size={11} /> {order.agingHours}h
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-16 rounded-full bg-bg-tertiary overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${order.riskScore > 60 ? 'bg-error' : order.riskScore > 30 ? 'bg-warning' : 'bg-success'}`}
                                                style={{ width: `${order.riskScore}%` }}
                                            />
                                        </div>
                                        <span className={`text-[10px] font-semibold ${order.riskScore > 60 ? 'text-error' : order.riskScore > 30 ? 'text-warning' : 'text-success'}`}>{order.riskScore}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-semibold text-text-primary font-mono">
                                        {order.payment ? `R$ ${order.payment.amount_total?.toFixed(2)}` : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        className="p-2 rounded-[6px] border border-border-subtle hover:bg-text-primary hover:text-white hover:border-transparent transition-all duration-[120ms]"
                                        style={{ background: 'var(--bg-secondary)' }}
                                    >
                                        <Eye size={14} />
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

// --- Sub-components ---
const KpiCard = ({ label, value, icon, color }: any) => (
    <div
        className="p-5"
        style={{
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
    >
        <div className={`p-2 rounded-[6px] bg-bg-secondary border border-border-subtle w-fit mb-4 ${color || 'text-text-secondary'}`}>{icon}</div>
        <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-xl font-semibold leading-none ${color || 'text-text-primary'}`}>{value}</h3>
    </div>
);

const MiniStat = ({ label, value, color }: any) => (
    <div
        className="p-5"
        style={{
            background: 'var(--bg-secondary)',
            borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.06)'
        }}
    >
        <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-sm font-semibold ${color || 'text-text-primary'}`}>{value}</p>
    </div>
);

const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border-subtle last:border-0">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest">{label}</span>
        <span className="text-xs font-medium text-text-primary">{value || '—'}</span>
    </div>
);

const InterventionCard = ({ icon, label, desc, color, onClick, disabled }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`p-5 text-left rounded-[10px] border border-border-subtle hover:shadow-md transition-all duration-[120ms] group disabled:opacity-30 ${color}`}
        style={{ background: 'var(--bg-secondary)' }}
    >
        <div className="transition-transform group-hover:scale-110 mb-4 w-fit">{icon}</div>
        <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
        <p className="text-[10px] text-text-tertiary leading-relaxed">{desc}</p>
    </button>
);

const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
        completed: 'bg-success/10 text-success',
        cancelled: 'bg-error/10 text-error',
        in_execution: 'bg-accent-primary/10 text-accent-primary',
        disputed: 'bg-warning/10 text-warning',
        sent: 'bg-info/10 text-info',
        paid_escrow_held: 'bg-info/10 text-info'
    };
    return map[status] || 'bg-bg-secondary text-text-tertiary border border-border-subtle';
};

const getSlaStyle = (sla: string) => {
    if (sla === 'critical') return 'text-error';
    if (sla === 'warning') return 'text-warning';
    return 'text-success';
};

export default AdminOrders;

import React, { useState, useEffect } from 'react';
import {
    Search, RefreshCw, Clock, AlertTriangle, CheckCircle2, XCircle,
    DollarSign, Activity, ShieldAlert, FileText, Zap, ChevronRight,
    Package, User, Briefcase, X, ArrowUp, ArrowDown, Eye
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import { useAppStore } from '../store';
import KpiCard from '../components/erp/KpiCard';
import StatusBadge from '../components/erp/StatusBadge';
import RiskBar from '../components/erp/RiskBar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from('audit_logs').insert({
            action, entity_type: entityType, entity_id: entityId,
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

    useEffect(() => { fetchOrders(); return () => setViewFilters(null); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('orders').select(`*, client:users!client_id (id, email, name), provider:users!provider_id (id, email, name), service:services (id, title, pricing_mode)`).order('created_at', { ascending: false });
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
                return { ...o, agingHours, slaStatus, riskScore: Math.min(riskScore, 100), payment: orderPayment, dispute: orderDispute };
            });
            setOrders(enriched);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
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
        } catch (err: any) { alert('Erro: ' + err.message); }
        finally { setIsProcessing(null); }
    };

    const toggleSort = (field: 'risk' | 'sla') => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const filteredOrders = orders.filter(o => {
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        const search = searchTerm.toLowerCase();
        const matchesSearch = (o.id || '').toLowerCase().includes(search) ||
            (o.service?.title || '').toLowerCase().includes(search) ||
            resolveUserName(o.client).toLowerCase().includes(search) ||
            resolveUserName(o.provider).toLowerCase().includes(search);
        return matchesStatus && matchesSearch;
    }).sort((a, b) => {
        if (!sortField) return 0;
        if (sortField === 'risk') return sortDir === 'desc' ? b.riskScore - a.riskScore : a.riskScore - b.riskScore;
        if (sortField === 'sla') return sortDir === 'desc' ? b.agingHours - a.agingHours : a.agingHours - b.agingHours;
        return 0;
    });

    const getSlaColor = (sla: string) => {
        if (sla === 'critical') return 'text-red-600 dark:text-red-400';
        if (sla === 'warning') return 'text-yellow-600 dark:text-yellow-400';
        return 'text-green-600 dark:text-green-400';
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

    const statusCounts = {
        critical: orders.filter(o => o.slaStatus === 'critical').length,
        disputes: orders.filter(o => o.dispute).length,
        inExecution: orders.filter(o => o.status === 'in_execution').length,
    };

    return (
        <div className="space-y-5 animate-fade-in pb-12">

            {/* ── Order Dossier ── */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="h-full w-full max-w-2xl bg-background shadow-2xl flex flex-col border-l border-border">
                        <div className="p-5 border-b border-border bg-card flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary text-primary-foreground"><Package size={18} /></div>
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Dossiê do Pedido</h2>
                                    <p className="text-[10px] text-muted-foreground font-mono">#{selectedOrder.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex px-5 border-b border-border bg-card">
                            {['summary', 'financial', 'intervention'].map(tab => (
                                <button key={tab} onClick={() => setDossierTab(tab)}
                                    className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-widest border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                                    {tab === 'summary' ? 'Resumo' : tab === 'financial' ? 'Financeiro' : 'Intervenção'}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {dossierTab === 'summary' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Status', value: <StatusBadge status={selectedOrder.status} size="md" /> },
                                            { label: 'Modalidade', value: selectedOrder.pricing_mode === 'hourly' ? 'Por Hora' : 'Fixo' },
                                            { label: 'Aging', value: <span className={getSlaColor(selectedOrder.slaStatus)}>{selectedOrder.agingHours}h</span> },
                                        ].map(s => (
                                            <div key={s.label} className="bg-card border border-border rounded-xl p-3">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">{s.label}</p>
                                                <div className="text-xs font-semibold text-foreground">{s.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                                        {[
                                            { label: 'Serviço', value: selectedOrder.service?.title },
                                            { label: 'Cliente', value: resolveUserName(selectedOrder.client) },
                                            { label: 'Profissional', value: resolveUserName(selectedOrder.provider) },
                                            { label: 'Agendamento', value: formatDate(selectedOrder.scheduled_at) },
                                            { label: 'Local', value: selectedOrder.location_text },
                                            { label: 'Risk Score', value: `${selectedOrder.riskScore}%` },
                                        ].map(row => (
                                            <div key={row.label} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0">
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{row.label}</span>
                                                <span className="text-xs font-medium text-foreground">{row.value || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'financial' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-card border border-border rounded-xl p-4">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total</p>
                                            <p className="text-base font-semibold text-primary">R$ {(selectedOrder.payment?.amount_total || 0).toFixed(2)}</p>
                                        </div>
                                        <div className="bg-card border border-border rounded-xl p-4">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Taxa (10%)</p>
                                            <p className="text-base font-semibold text-yellow-500">R$ {(selectedOrder.payment?.operator_fee || 0).toFixed(2)}</p>
                                        </div>
                                        <div className="bg-card border border-border rounded-xl p-4">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Escrow</p>
                                            <StatusBadge status={selectedOrder.payment?.escrow_status || 'pending'} size="md" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'intervention' && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Painel de Intervenção Operacional</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => performIntervention('FORCE_COMPLETE')} disabled={isProcessing === selectedOrder.id}
                                            className="p-4 text-left bg-card border border-border rounded-xl hover:bg-green-500/10 hover:border-green-500/30 text-green-600 dark:text-green-400 transition-all group disabled:opacity-30">
                                            <CheckCircle2 size={20} className="mb-3 group-hover:scale-110 transition-transform" />
                                            <p className="text-xs font-semibold text-foreground mb-1">Forçar Conclusão</p>
                                            <p className="text-[10px] text-muted-foreground">Inicia fluxo de repasse.</p>
                                        </button>
                                        <button onClick={() => performIntervention('FORCE_CANCEL')} disabled={isProcessing === selectedOrder.id}
                                            className="p-4 text-left bg-card border border-border rounded-xl hover:bg-red-500/10 hover:border-red-500/30 text-red-600 dark:text-red-400 transition-all group disabled:opacity-30">
                                            <XCircle size={20} className="mb-3 group-hover:scale-110 transition-transform" />
                                            <p className="text-xs font-semibold text-foreground mb-1">Forçar Cancelamento</p>
                                            <p className="text-[10px] text-muted-foreground">Aciona política de reembolso.</p>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Pedidos & SLA</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Controle operacional de ciclo de vida das contratações</p>
                </div>
                <button onClick={fetchOrders} className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:rotate-180 transition-all duration-500">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Total de Pedidos" value={orders.length} icon={<Briefcase size={16} />} />
                <KpiCard label="SLA Violado" value={statusCounts.critical} icon={<AlertTriangle size={16} />} color="text-red-600 dark:text-red-400" bg="bg-red-500/10" />
                <KpiCard label="Com Disputa" value={statusCounts.disputes} icon={<ShieldAlert size={16} />} color="text-yellow-600 dark:text-yellow-400" bg="bg-yellow-500/10" />
                <KpiCard label="Em Execução" value={statusCounts.inExecution} icon={<Zap size={16} />} color="text-primary" bg="bg-primary/10" />
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por ID, serviço, cliente ou profissional..."
                        className="w-full h-9 rounded-lg pl-9 pr-4 text-sm outline-none bg-background border border-border text-foreground focus:border-primary transition-all"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { val: 'all', label: 'Todos' }, { val: 'sent', label: 'Enviados' },
                        { val: 'in_execution', label: 'Em Execução' }, { val: 'disputed', label: 'Disputados' },
                        { val: 'completed', label: 'Concluídos' },
                    ].map(opt => (
                        <button key={opt.val} onClick={() => setFilterStatus(opt.val)}
                            className={`h-9 px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all ${filterStatus === opt.val ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground border border-border'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Orders Table ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pedido / Serviço</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Partes</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('sla')}>
                                <span className="flex items-center gap-1.5">SLA {sortField === 'sla' ? (sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />) : null}</span>
                            </th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('risk')}>
                                <span className="flex items-center gap-1.5">Risco {sortField === 'risk' ? (sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />) : null}</span>
                            </th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Valor</th>
                            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Dossiê</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="py-16 text-center">
                                <RefreshCw className="animate-spin mx-auto mb-3 text-primary" size={22} />
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    <span className="relative inline-block">
                                        Sincronizando
                                        <span className="absolute left-full ml-1 top-0">...</span>
                                    </span>
                                </p>
                            </td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={7} className="py-16 text-center opacity-30">
                                <Package size={36} className="mx-auto mb-3" />
                                <p className="text-[10px] font-semibold uppercase tracking-widest">Nenhum pedido</p>
                            </td></tr>
                        ) : filteredOrders.map(order => (
                            <tr key={order.id}
                                className="border-b border-border last:border-0 hover:bg-muted/30 transition-all cursor-pointer"
                                onClick={() => setSelectedOrder(order)}>
                                <td className="px-5 py-4">
                                    <p className="text-[10px] font-mono text-muted-foreground mb-0.5">#{order.id.slice(0, 8)}</p>
                                    <p className="text-xs font-semibold text-foreground">{order.service?.title || 'Serviço'}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-[11px] text-foreground">{resolveUserName(order.client)}</p>
                                    <p className="text-[10px] text-muted-foreground">→ {resolveUserName(order.provider)}</p>
                                </td>
                                <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                                <td className="px-5 py-4">
                                    <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${getSlaColor(order.slaStatus)}`}>
                                        <Clock size={11} /> {order.agingHours}h
                                    </span>
                                </td>
                                <td className="px-5 py-4"><RiskBar score={order.riskScore} /></td>
                                <td className="px-5 py-4">
                                    <span className="text-xs font-semibold text-foreground font-mono tabular-nums">
                                        {order.payment ? `R$ ${order.payment.amount_total?.toFixed(2)}` : '—'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <button className="p-1.5 rounded-lg border border-border hover:bg-foreground hover:text-background hover:border-transparent transition-all">
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

export default AdminOrders;

import React, { useState, useEffect } from 'react';
import {
    Search, RefreshCw, Clock, AlertTriangle, CheckCircle2, XCircle,
    DollarSign, Activity, ShieldAlert, FileText, Zap, ChevronRight,
    Package, User, Briefcase, X, ArrowUp, ArrowDown, Eye, ArrowRight,
    Unlock, ShieldCheck
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
            const { data: payments } = await supabase.from('payments').select('order_id, amount_total, operator_fee, escrow_status') as { data: any[] | null };
            const { data: disputes } = await supabase.from('disputes').select('order_id, status') as { data: any[] | null };
            const enriched = ((data || []) as any[]).map(o => {
                const now = new Date();
                const created = new Date(o.created_at);
                const agingHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
                const orderPayment = (payments || []).find(p => p.order_id === o.id);
                const orderDispute = (disputes || []).find(d => d.order_id === o.id);
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
            fetchOrders();
            toast.success('Intervenção aplicada com sucesso.');
        } catch (err: any) { toast.error('Erro: ' + err.message); }
        finally { setIsProcessing(null); }
    };

    const toggleSort = (field: 'risk' | 'sla') => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const filteredOrders = orders.filter(o => {
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        const search = searchTerm.toLowerCase();
        return matchesStatus && (
            (o.id || '').toLowerCase().includes(search) ||
            (o.service?.title || '').toLowerCase().includes(search) ||
            resolveUserName(o.client).toLowerCase().includes(search) ||
            resolveUserName(o.provider).toLowerCase().includes(search)
        );
    }).sort((a, b) => {
        if (!sortField) return 0;
        if (sortField === 'risk') return sortDir === 'desc' ? b.riskScore - a.riskScore : a.riskScore - b.riskScore;
        if (sortField === 'sla') return sortDir === 'desc' ? b.agingHours - a.agingHours : a.agingHours - b.agingHours;
        return 0;
    });

    const getSlaInfo = (sla: string) => {
        if (sla === 'critical') return { color: 'text-[#E24B4A]', bg: 'bg-[#E24B4A]/10' };
        if (sla === 'warning') return { color: 'text-[#F5C842]', bg: 'bg-[#F5C842]/10' };
        return { color: 'text-[#1DB97A]', bg: 'bg-[#1DB97A]/10' };
    };

    const formatCurrency = (v: number) => `R$ ${(v || 0).toFixed(2)}`;
    const formatDate = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

    return (
        <div className="space-y-8 pb-16 animate-fade-in">

            {/* ── Order Dossier (Overlay) ── */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-folio-bg/80 backdrop-blur-md z-[100] flex justify-end animate-in fade-in duration-300">
                    <div className="h-full w-full max-w-2xl bg-folio-bg shadow-2xl flex flex-col border-l border-folio-border animate-in slide-in-from-right duration-500">
                        <div className="px-10 py-8 border-b border-folio-border bg-folio-surface flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-folio-bg border border-folio-border text-folio-accent flex items-center justify-center shadow-inner">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-folio-text uppercase tracking-tight">Dossiê do Pedido</h2>
                                    <p className="text-[11px] text-folio-text-dim/60 font-mono font-bold tracking-[2px] mt-1">ID: {selectedOrder.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 rounded-2xl bg-folio-bg border border-folio-border flex items-center justify-center text-folio-text-dim hover:text-folio-text transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex px-10 border-b border-folio-border bg-folio-surface gap-2">
                            {['summary', 'financial', 'intervention'].map(tab => (
                                <button key={tab} onClick={() => setDossierTab(tab)}
                                    className={`px-4 py-5 text-[10px] font-black uppercase tracking-[2px] border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-folio-accent text-folio-accent' : 'border-transparent text-folio-text-dim hover:text-folio-text'}`}>
                                    {tab === 'summary' ? 'Operacional' : tab === 'financial' ? 'Financeiro' : 'Governança'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-8">
                            {dossierTab === 'summary' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Estado Atual', value: <StatusBadge status={selectedOrder.status} /> },
                                            { label: 'Aging SLA', value: <span className={`font-black tracking-widest ${getSlaInfo(selectedOrder.slaStatus).color}`}>{selectedOrder.agingHours}H</span> },
                                            { label: 'Risco', value: <RiskBar score={selectedOrder.riskScore} /> },
                                        ].map(s => (
                                            <div key={s.label} className="bg-folio-surface border border-folio-border rounded-[24px] p-6 shadow-sm">
                                                <p className="text-[9px] text-folio-text-dim/50 font-black uppercase tracking-[2px] mb-3">{s.label}</p>
                                                <div className="flex items-center">{s.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 space-y-6 shadow-folio">
                                        {[
                                            { label: 'Serviço Contratado', value: selectedOrder.service?.title },
                                            { label: 'Cliente (Emissor)', value: resolveUserName(selectedOrder.client) },
                                            { label: 'Profissional (Executor)', value: resolveUserName(selectedOrder.provider) },
                                            { label: 'Data do Agendamento', value: formatDate(selectedOrder.scheduled_at) },
                                            { label: 'Local de Prestação', value: selectedOrder.location_text || 'Remoto/Não Definido' },
                                        ].map(row => (
                                            <div key={row.label} className="flex flex-col gap-1.5 border-b border-folio-border last:border-0 pb-5 last:pb-0">
                                                <span className="text-[9px] font-black text-folio-text-dim/50 uppercase tracking-[2px]">{row.label}</span>
                                                <span className="text-sm font-bold text-folio-text uppercase tracking-tight">{row.value || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {dossierTab === 'financial' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 shadow-folio">
                                            <p className="text-[9px] text-folio-text-dim/50 font-black uppercase tracking-[2px] mb-2">Total Transacionado</p>
                                            <p className="text-3xl font-black text-folio-text tabular-nums tracking-tighter">{formatCurrency(selectedOrder.payment?.amount_total || 0)}</p>
                                        </div>
                                        <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 shadow-folio">
                                            <p className="text-[9px] text-folio-text-dim/50 font-black uppercase tracking-[2px] mb-2">Estado de Liquidez</p>
                                            <div className="mt-2"><StatusBadge status={selectedOrder.payment?.escrow_status || 'pending'} /></div>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-folio-bg border border-folio-border rounded-[32px]">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black text-folio-text-dim uppercase tracking-[2px]">Fee Plataforma (10%)</span>
                                            <span className="text-sm font-black text-[#F5C842] font-mono">{formatCurrency(selectedOrder.payment?.operator_fee || 0)}</span>
                                        </div>
                                        <div className="h-px bg-folio-border my-6" />
                                        <div className="flex justify-between items-center text-folio-text">
                                            <span className="text-[10px] font-black uppercase tracking-[2.5px]">Repasse ao Profissional</span>
                                            <span className="text-xl font-black font-mono tracking-tighter">{formatCurrency((selectedOrder.payment?.amount_total || 0) * 0.9)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {dossierTab === 'intervention' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <ShieldCheck className="text-[#1DB97A]" size={20} />
                                        <h4 className="text-sm font-black text-folio-text uppercase tracking-[2px]">Intervenção de Governança</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => performIntervention('FORCE_COMPLETE')} disabled={isProcessing === selectedOrder.id}
                                            className="p-8 text-left bg-folio-surface border border-folio-border rounded-[32px] hover:bg-[#1DB97A]/10 hover:border-[#1DB97A]/30 text-[#1DB97A] transition-all group disabled:opacity-30 shadow-sm hover:shadow-glow-dim">
                                            <CheckCircle2 size={24} className="mb-4 transition-transform group-hover:scale-110" />
                                            <p className="text-sm font-black text-folio-text mb-2 uppercase tracking-tight">Forçar Conclusão</p>
                                            <p className="text-[11px] font-medium text-folio-text-dim leading-relaxed opacity-70">Libera o repasse e finaliza o ciclo operacional.</p>
                                        </button>
                                        <button onClick={() => performIntervention('FORCE_CANCEL')} disabled={isProcessing === selectedOrder.id}
                                            className="p-8 text-left bg-folio-surface border border-folio-border rounded-[32px] hover:bg-[#E24B4A]/10 hover:border-[#E24B4A]/30 text-[#E24B4A] transition-all group disabled:opacity-30 shadow-sm hover:shadow-glow-dim">
                                            <XCircle size={24} className="mb-4 transition-transform group-hover:scale-110" />
                                            <p className="text-sm font-black text-folio-text mb-2 uppercase tracking-tight">Forçar Cancelamento</p>
                                            <p className="text-[11px] font-medium text-folio-text-dim leading-relaxed opacity-70">Cancela o pedido e estorna os valores ao cliente.</p>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-folio-text uppercase tracking-tight leading-none">Gestão Operacional de Pedidos</h1>
                    <p className="text-[11px] font-bold text-folio-text-dim/50 uppercase tracking-[2px] mt-2">Controle de Ciclo de Vida e Monitoramento de SLA</p>
                </div>
                <button onClick={fetchOrders} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-folio-border bg-folio-surface text-folio-text-dim hover:text-folio-accent hover:rotate-180 transition-all duration-700 shadow-sm"><RefreshCw size={18} /></button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Volume Total" value={orders.length} icon={<Package size={18} />} trend="Global" tooltip="Total acumulado de pedidos gerados pelo sistema." />
                <KpiCard label="Violação SLA" value={orders.filter(o => o.slaStatus === 'critical').length} icon={<AlertTriangle size={18} />} trend="Crítico" color="text-[#E24B4A]" bg="bg-[#E24B4A]/10" tooltip="Pedidos pendentes há mais de 24h sem resposta do profissional." />
                <KpiCard label="Em Disputa" value={orders.filter(o => o.dispute).length} icon={<ShieldAlert size={18} />} trend="Pendente" color="text-[#F5C842]" bg="bg-[#F5C842]/10" tooltip="Serviços com conflito aberto aguardando mediação operacional." />
                <KpiCard label="Execução Ativa" value={orders.filter(o => o.status === 'in_execution').length} icon={<Zap size={18} />} trend="Operando" color="text-folio-accent" bg="bg-folio-accent/10" tooltip="Serviços que estão sendo realizados ou concluídos neste momento." />
            </div>

            <div className="bg-folio-surface border border-folio-border rounded-[24px] p-4 flex flex-col md:flex-row gap-4 shadow-folio">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-folio-text-dim" size={16} />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="ID, Serviço, Cliente ou Profissional..."
                        className="w-full h-11 rounded-xl pl-11 pr-4 text-sm outline-none bg-folio-bg border border-folio-border text-folio-text focus:border-folio-accent transition-all placeholder:text-folio-text-dim/30"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[{ val: 'all', label: 'Todos' }, { val: 'sent', label: 'Enviados' }, { val: 'in_execution', label: 'Em Execução' }, { val: 'completed', label: 'Concluídos' }].map(opt => (
                        <button key={opt.val} onClick={() => setFilterStatus(opt.val)}
                            className={`h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-[1.5px] transition-all border ${filterStatus === opt.val ? 'bg-folio-accent border-folio-accent text-white shadow-glow' : 'bg-folio-bg border-folio-border text-folio-text-dim hover:text-folio-text hover:border-folio-text-dim/30'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-folio-surface border border-folio-border rounded-[32px] p-6 shadow-folio">
                <div className="hidden md:grid grid-cols-12 px-8 py-4 opacity-40">
                    <div className="col-span-3 text-[10px] font-black text-folio-text uppercase tracking-[2px]">Pedido / Serviço</div>
                    <div className="col-span-3 text-[10px] font-black text-folio-text uppercase tracking-[2px]">Partes</div>
                    <div className="col-span-2 text-[10px] font-black text-folio-text uppercase tracking-[2px]">Estado</div>
                    <div className="col-span-2 text-[10px] font-black text-folio-text uppercase tracking-[2px]">Aging / Risco</div>
                    <div className="col-span-2 text-right"></div>
                </div>

                <div className="space-y-4 mt-2">
                    {loading ? (
                        [1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="grid grid-cols-12 items-center px-8 py-6 bg-folio-bg border border-folio-border rounded-[28px] opacity-60">
                                <div className="col-span-3 space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                                <div className="col-span-3">
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <div className="col-span-2">
                                    <Skeleton className="h-6 w-16 rounded-lg" />
                                </div>
                                <div className="col-span-2">
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    <Skeleton className="h-10 w-10 rounded-2xl" />
                                </div>
                            </div>
                        ))
                    ) : filteredOrders.length === 0 ? (
                        <div className="py-24 text-center border-2 border-dashed border-folio-border bg-folio-bg/30 rounded-[28px]">
                            <Package className="mx-auto mb-4 text-folio-accent opacity-20" size={56} />
                            <p className="text-[12px] font-black text-folio-text-dim uppercase tracking-[3px] opacity-40">Nenhum pedido encontrado</p>
                        </div>
                    ) : (
                        filteredOrders.map(o => (
                            <div key={o.id} onClick={() => setSelectedOrder(o)}
                                className="grid grid-cols-12 items-center px-8 py-6 bg-folio-bg border border-folio-border rounded-[28px] hover:border-folio-accent/40 shadow-sm hover:shadow-glow-dim transition-all group cursor-pointer">
                                <div className="col-span-3">
                                    <p className="text-[10px] font-black text-folio-text-dim/40 font-mono mb-1 uppercase tracking-tighter">#{o.id.slice(0, 8)}</p>
                                    <div className="flex items-center gap-2 mb-1.5 h-1">
                                        {['sent', 'accepted', 'paid_escrow_held', 'in_execution', 'completed'].map((s, idx) => {
                                            const steps = ['sent', 'accepted', 'paid_escrow_held', 'in_execution', 'completed'];
                                            const currentIdx = steps.indexOf(o.status);
                                            const stepIdx = steps.indexOf(s);
                                            const isError = o.status === 'cancelled' || o.status === 'disputed' || !!o.dispute;
                                            return (
                                                <div key={s} className={`h-1 rounded-full transition-all duration-500 ${stepIdx <= currentIdx
                                                    ? (isError ? 'bg-error w-4' : 'bg-folio-accent w-4')
                                                    : (isError && stepIdx === 0 ? 'bg-error/30 w-4' : 'bg-folio-border w-1.5')
                                                    }`} />
                                            );
                                        })}
                                    </div>
                                    <p className="text-sm font-black text-folio-text uppercase tracking-tight truncate leading-none">{o.service?.title || 'Serviço'}</p>
                                </div>
                                <div className="col-span-3">
                                    <p className="text-[11px] font-bold text-folio-text leading-none">{resolveUserName(o.client)}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <ArrowRight size={10} className="text-folio-text-dim/30" />
                                        <p className="text-[11px] font-bold text-folio-text-dim/60 truncate">{resolveUserName(o.provider)}</p>
                                    </div>
                                </div>
                                <div className="col-span-2"><StatusBadge status={o.status} /></div>
                                <div className="col-span-2">
                                    <div className="flex flex-col gap-2">
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest border w-fit ${getSlaInfo(o.slaStatus).bg} ${getSlaInfo(o.slaStatus).color} border-current/10`}>
                                            <Clock size={10} className="mr-1" /> {o.agingHours}H
                                        </span>
                                        <RiskBar score={o.riskScore} />
                                    </div>
                                </div>
                                <div className="col-span-2 text-right">
                                    <button className="w-10 h-10 flex items-center justify-center rounded-2xl border border-folio-border bg-folio-surface text-folio-text-dim group-hover:bg-folio-accent group-hover:text-white group-hover:border-folio-accent transition-all shadow-sm"><Eye size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;

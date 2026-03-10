import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, TrendingUp, Users, Briefcase, ShieldAlert,
    Clock, Activity, Zap, Plus, Scale, ShieldCheck,
    CreditCard, MessageSquare, X, History, RefreshCw,
    Smartphone, Info, Target, AlertTriangle, ArrowRight
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

import StatCard from '../components/admin/StatCard';
import InboxItem from '../components/admin/InboxItem';
import RiskActionModal from '../components/admin/RiskActionModal';
import CommunicationModal from '../components/admin/CommunicationModal';
import SimpleShortcut from '../components/admin/SimpleShortcut';
import KpiCard from '../components/erp/KpiCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Badge } from '../components/ui/Badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';

// --- Helpers de Auditoria ---
const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from('audit_logs').insert({
            action, entity_type: entityType, entity_id: entityId,
            actor_user_id: user?.id,
            payload_json: { details, reason, origin: 'ERP Admin', ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server' }
        });
    } catch (err) { console.error("Audit log failed:", err); }
};

const ADMIN_ROUTE_MAP: Record<string, string> = {
    'ADMIN_DASHBOARD': '/admin', 'ADMIN_USERS': '/admin/users', 'ADMIN_SERVICES': '/admin/services',
    'ADMIN_ORDERS': '/admin/orders', 'ADMIN_FINANCE': '/admin/finance',
    'ADMIN_DISPUTES': '/admin/disputes', 'ADMIN_AUDIT': '/admin/audit',
    'USER_MANAGEMENT': '/admin/users', 'AUDIT_LOGS': '/admin/audit',
};

const EVENT_TYPE_COLOR: Record<string, string> = {
    order: 'bg-green-500', payment: 'bg-primary', dispute: 'bg-red-500', kyc: 'bg-blue-500'
};

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0, totalOrders: 0, activeServices: 0, pendingVerifications: 0,
        openDisputes: 0, totalVolume: 0, operatorEarnings: 0, inEscrow: 0,
        pendingPayouts: 0, ordersAwaitingAccept: 0, ordersInExecution: 0,
        ordersDelayed: 0, highRiskUsers: 0,
        agingEscrow: '0' as any, agingPayouts: '0' as any, agingDisputes: '0' as any,
        revenueVariaction: '0%'
    });
    const [liveEvents, setLiveEvents] = useState<any[]>([]);
    const [riskSignals, setRiskSignals] = useState<any[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any>(null);
    const [activeModal, setActiveModal] = useState<'communication' | 'risk' | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionReason, setActionReason] = useState('');
    const [isEscrowSheetOpen, setIsEscrowSheetOpen] = useState(false);
    const [escrowList, setEscrowList] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async (refresh = false) => {
        try {
            if (refresh) setIsRefreshing(true);
            const [
                { data: userData },
                { data: profileData },
                { data: orderData },
                { data: paymentData },
                { data: disputeData },
                { data: serviceData },
                { data: auditData }
            ] = await Promise.all([
                supabase.from('users').select('id, name, kyc_status'),
                supabase.from('provider_profiles').select('documents_status'),
                supabase.from('orders').select('id, status, created_at'),
                supabase.from('payments').select('id, order_id, amount_total, operator_fee, escrow_status, provider_amount, created_at'),
                supabase.from('disputes').select('id, status, reason, order:orders(client:users!client_id(name), provider:users!provider_id(name))'),
                supabase.from('services').select('id', { count: 'exact' }).eq('active', true),
                supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
            ]);

            const uData = (userData || []) as any[];
            const oData = (orderData || []) as any[];
            const pData = (paymentData || []) as any[];
            const dData = (disputeData || []) as any[];
            const profData = (profileData || []) as any[];
            const aData = (auditData || []) as any[];

            const openDisputesCount = dData.filter(d => d.status === 'open' || d.status === 'in_review').length;
            const pendingKYCCount = profData.filter(p => p.documents_status === 'submitted').length;
            const inEscrowVolume = pData.filter(p => p.escrow_status === 'held').reduce((acc, p) => acc + (p.amount_total || 0), 0);
            const earningsTotal = pData.filter(p => p.escrow_status === 'released').reduce((acc, p) => acc + (p.operator_fee || 0), 0);
            const potentialRevenue = pData.filter(p => p.escrow_status === 'held').reduce((acc, p) => acc + (p.operator_fee || 0), 0);
            const payoutsPending = pData.filter(p => p.escrow_status === 'pending').reduce((acc, p) => acc + (p.provider_amount || 0), 0);

            // Aging Escrow: Volume retido há mais de 7 dias
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const agingEscrowVolume = pData
                .filter(p => p.escrow_status === 'held' && new Date(p.created_at) < sevenDaysAgo)
                .reduce((acc, p) => acc + (p.amount_total || 0), 0);

            const now = new Date();
            const delayed = oData.filter(o => {
                if (o.status !== 'sent') return false;
                const hours = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60));
                return hours > 24;
            }).length;

            setStats({
                totalUsers: uData.length,
                totalOrders: oData.length,
                activeServices: serviceData?.length || 0,
                pendingVerifications: pendingKYCCount,
                openDisputes: openDisputesCount,
                totalVolume: pData.reduce((acc, p) => acc + (p.amount_total || 0), 0),
                operatorEarnings: earningsTotal,
                inEscrow: inEscrowVolume,
                pendingPayouts: payoutsPending,
                ordersAwaitingAccept: oData.filter(o => o.status === 'sent').length,
                ordersInExecution: oData.filter(o => o.status === 'in_execution').length,
                ordersDelayed: delayed,
                highRiskUsers: uData.filter(u => u.kyc_status === 'rejected').length,
                agingEscrow: agingEscrowVolume > 0 ? `R$ ${(agingEscrowVolume / 1000).toFixed(1)}k > 7d` : 'Volume Seguro',
                agingPayouts: payoutsPending > 0 ? `${pData.filter(p => p.escrow_status === 'pending').length} pendentes` : 'Em dia',
                agingDisputes: openDisputesCount > 0 ? `${openDisputesCount} pnd / 0 crit` : 'Nenhuma disputa',
                revenueVariaction: potentialRevenue > 0 ? `R$ ${potentialRevenue.toFixed(2)} prev.` : '+0%'
            });

            // Map Audit Logs to Live Events
            const mappedEvents = aData.map((log, idx) => {
                const typeMap: any = {
                    'ORDER_CREATED': 'order',
                    'PAYMENT_RELEASED': 'payment',
                    'DISPUTE_OPENED': 'dispute',
                    'KYC_APPROVED': 'kyc'
                };
                const timeDiff = Math.floor((new Date().getTime() - new Date(log.created_at).getTime()) / (1000 * 60));
                const timeStr = timeDiff < 60 ? `${timeDiff}m` : `${Math.floor(timeDiff / 60)}h`;

                return {
                    id: log.id,
                    type: typeMap[log.action] || 'order',
                    action: log.action.replace(/_/g, ' '),
                    name: log.details || 'Ação de sistema',
                    time: timeStr,
                    user: log.actor_user_id ? `Agente ${log.actor_user_id.slice(0, 4)}` : 'Sistema'
                };
            });
            setLiveEvents(mappedEvents.length > 0 ? mappedEvents : [
                { id: 1, type: 'order', action: 'Sistema Ativo', name: 'Monitoramento em tempo real', time: 'now', user: 'Admin' }
            ]);

            // Guardar lista detalhada de Escrow
            const heldPayments = pData
                .filter(p => p.escrow_status === 'held')
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setEscrowList(heldPayments);

            // Risk Signals - Inteligência de Detecção
            const signals: any[] = [];

            // 1. Compliance: KYC Rejeitado
            uData.filter(u => u.kyc_status === 'rejected').forEach(u => {
                signals.push({
                    id: `KYC-${u.id}`, user: u.name || `User ${u.id.slice(0, 6)}`,
                    reason: 'Documentação Rejeitada ou Inconsistente', score: 90, type: 'Compliance'
                });
            });

            // 2. Conflito: Disputas Abertas (Prioridade Alta)
            dData.filter(d => d.status === 'open' || d.status === 'in_review').forEach(d => {
                const clientName = (d.order as any)?.client?.name || 'Cliente';
                const providerName = (d.order as any)?.provider?.name || 'Prestador';
                signals.push({
                    id: `DISP-${d.id}`, user: `${clientName} vs ${providerName}`,
                    reason: d.reason || 'Disputa aberta por impasse operacional', score: 85, type: 'Conflito'
                });
            });

            // 3. Financeiro: Escrow Parado (Aging > 10d)
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
            pData.filter(p => p.escrow_status === 'held' && new Date(p.created_at) < tenDaysAgo).slice(0, 2).forEach(p => {
                signals.push({
                    id: `FIN-${p.id}`, user: `Pagamento #${p.id.slice(0, 8)}`,
                    reason: 'Volume retido há mais de 10 dias sem movimentação', score: 75, type: 'Retenção'
                });
            });

            setRiskSignals(signals.slice(0, 4));

        } catch (err) { console.error(err); }
        finally { setLoading(false); setIsRefreshing(false); }
    };

    const handleUniversalSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        setIsSearchOpen(true);
        const query = searchQuery.toLowerCase();
        setSearchResults({
            users: stats.totalUsers > 0 ? [{ id: 'USR-1', name: 'Fulano Search', email: query + '@ex.com' }] : [],
            orders: [{ id: 'ORD-999', title: 'Serviço Encontrado', value: 1200 }],
            disputes: []
        });
    };

    const performRiskAction = async (action: string) => {
        if (!actionReason) { alert("Motivo obrigatório para auditoria."); return; }
        await logAdminAction(action, 'USER', selectedUser?.id || 'GLOBAL', `Ação de risco: ${action}`, actionReason);
        alert(`Ação de ${action} registrada com sucesso.`);
        setActiveModal(null);
        setActionReason('');
    };

    const handleDrillDown = (targetView: string, _filters?: any) => {
        const route = ADMIN_ROUTE_MAP[targetView] || '/admin';
        navigate(route);
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in relative">

            {/* ── Universal Search Modal ── */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] p-10 flex flex-col items-center">
                    <button
                        onClick={() => setIsSearchOpen(false)}
                        className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-full max-w-3xl space-y-6 mt-16">
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={24} />
                            <input
                                autoFocus value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-20 bg-white/5 border border-white/10 rounded-2xl pl-16 pr-10 text-2xl font-semibold text-white outline-none focus:border-primary transition-all placeholder:text-white/20"
                                placeholder="ID, Email, Documento ou Protocolo..."
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { title: 'Usuários', icon: <Users />, results: searchResults?.users },
                                { title: 'Pedidos', icon: <Briefcase />, results: searchResults?.orders },
                                { title: 'Transações', icon: <CreditCard />, results: [] },
                            ].map(({ title, icon, results }) => (
                                <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-64 flex flex-col">
                                    <h4 className="text-white text-[11px] font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        {React.cloneElement(icon as React.ReactElement, { size: 14 })} {title}
                                    </h4>
                                    <div className="flex-1 space-y-2 overflow-y-auto">
                                        {results?.length > 0 ? results.map((res: any, i: number) => (
                                            <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
                                                <p className="text-sm font-semibold text-white">{res.name || res.title || res.id}</p>
                                                <p className="text-[10px] text-white/40 uppercase">{res.email || `R$ ${res.value}`}</p>
                                            </div>
                                        )) : (
                                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                                <Search size={32} className="text-white mb-2" />
                                                <p className="text-[10px] text-white font-semibold uppercase">Sem resultados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            {activeModal === 'communication' && (
                <CommunicationModal onClose={() => setActiveModal(null)} onSend={(data: any) => {
                    logAdminAction('SEND_COMMUNICATION', 'SYSTEM', 'GLOBAL', `Comunicado: ${data.title}`, 'Informativo via Admin');
                    setActiveModal(null);
                }} />
            )}
            {activeModal === 'risk' && (
                <RiskActionModal user={selectedUser} reason={actionReason}
                    onReasonChange={setActionReason} onClose={() => setActiveModal(null)}
                    onAction={performRiskAction} />
            )}

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">Centro de Comando</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Orquestração e inteligência operacional em tempo real</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchDashboardStats(true)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={15} />
                    </button>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <Search size={15} />
                    </button>
                    <button
                        onClick={() => setActiveModal('communication')}
                        className="flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all"
                    >
                        <MessageSquare size={14} /> Comunicado
                    </button>
                </div>
            </div>

            {isRefreshing && (
                <div className="h-0.5 w-full rounded-full overflow-hidden bg-muted">
                    <div className="h-full bg-primary animate-pulse w-full" />
                </div>
            )}

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                    label="Volume em Garantia" value={`R$ ${stats.inEscrow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<ShieldCheck size={16} />} color="text-primary" bg="bg-primary/10"
                    trend="+4.2%" trendDir="up"
                    onClick={() => setIsEscrowSheetOpen(true)}
                />
                <KpiCard
                    label="Receita Operadora" value={`R$ ${stats.operatorEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<TrendingUp size={16} />} color="text-green-600 dark:text-green-400" bg="bg-green-500/10"
                    trend={stats.revenueVariaction} trendDir="up"
                    onClick={() => handleDrillDown('ADMIN_FINANCE')}
                />
                <KpiCard
                    label="Repasses Pendentes" value={`R$ ${stats.pendingPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<CreditCard size={16} />} color="text-yellow-600 dark:text-yellow-400" bg="bg-yellow-500/10"
                    trend="Ação Necessária"
                    onClick={() => handleDrillDown('ADMIN_FINANCE')}
                />
                <KpiCard
                    label="Disputas Abertas" value={stats.openDisputes}
                    icon={<Scale size={16} />}
                    color={stats.openDisputes > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}
                    bg={stats.openDisputes > 0 ? 'bg-red-500/10' : 'bg-muted'}
                    trend={stats.openDisputes > 0 ? 'Urgente' : 'Limpo'}
                    trendDir={stats.openDisputes > 0 ? 'down' : 'up'}
                    onClick={() => handleDrillDown('ADMIN_DISPUTES')}
                />
            </div>

            {/* ── Secondary KPIs ── */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Total de Usuários', value: stats.totalUsers, icon: <Users size={14} /> },
                    { label: 'Total de Pedidos', value: stats.totalOrders, icon: <Briefcase size={14} /> },
                    { label: 'Em Execução', value: stats.ordersInExecution, icon: <Zap size={14} /> },
                    { label: 'KYC Pendente', value: stats.pendingVerifications, icon: <Clock size={14} /> },
                ].map((item) => (
                    <div key={item.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">{item.icon}</div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                            <p className="text-lg font-semibold text-foreground">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Content Grid ── */}
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">

                {/* Left: Decision Queue + Risk */}
                <div className="col-span-12 lg:col-span-8 space-y-4 flex flex-col">

                    {/* Decision Queue */}
                    <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Target className="text-primary" size={14} /> Fila de Decisão
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Triagem operacional por prioridade e SLA</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-[10px] font-semibold uppercase">{stats.openDisputes} Críticos</span>
                                <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-[10px] font-semibold uppercase">{stats.pendingVerifications} Triagem</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {stats.openDisputes > 0 && (
                                <InboxItem title="Disputas em Aberto" desc="Litígios aguardando sentença operacional"
                                    count={stats.openDisputes} priority="Alta" sla="há 2h" action="Mediação"
                                    onClick={() => handleDrillDown('ADMIN_DISPUTES')} />
                            )}
                            {stats.pendingVerifications > 0 && (
                                <InboxItem title="Revisão de KYC" desc="Validação de documentos de novos profissionais"
                                    count={stats.pendingVerifications} priority="Média" sla="há 1 dia" action="Validar"
                                    onClick={() => navigate(ADMIN_ROUTE_MAP['USER_MANAGEMENT']!)} />
                            )}
                            {stats.ordersDelayed > 0 && (
                                <InboxItem title="SLA: Pedidos Atrasados" desc="Sem aceite há mais de 24h"
                                    count={stats.ordersDelayed} priority="Alta" sla="VIOLADO" action="Intervir"
                                    onClick={() => handleDrillDown('ADMIN_ORDERS')} />
                            )}
                            {stats.openDisputes === 0 && stats.pendingVerifications === 0 && stats.ordersDelayed === 0 && (
                                <div className="py-8 text-center">
                                    <ShieldCheck className="mx-auto mb-2 text-green-500" size={32} />
                                    <p className="text-sm font-semibold text-muted-foreground">Fila limpa — nenhuma ação necessária</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Risk & Fraud */}
                    <div className="bg-card border border-border rounded-xl p-5 flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <ShieldAlert className="text-red-500" size={14} /> Risco & Fraude
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Detecção de padrões e comportamento anômalo</p>
                            </div>
                            <button
                                onClick={() => navigate(ADMIN_ROUTE_MAP['USER_MANAGEMENT']!)}
                                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                                Ver Todos <ArrowRight size={12} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {riskSignals.length > 0 ? riskSignals.map((signal, i) => (
                                <div key={i} className="p-4 bg-muted/40 border border-border rounded-xl hover:bg-muted/70 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-[9px] font-semibold text-red-600 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded uppercase tracking-widest">{signal.type}</span>
                                            <h4 className="text-sm font-semibold text-foreground mt-1.5">{signal.user}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-semibold text-muted-foreground uppercase">Risk</p>
                                            <p className="text-xl font-semibold text-red-600 dark:text-red-400">{signal.score}</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">"{signal.reason}"</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setSelectedUser(signal); setActiveModal('risk'); }}
                                            className="flex-1 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg text-[11px] font-semibold hover:bg-red-500/20 transition-all"
                                        >Bloquear</button>
                                        <button className="w-8 h-8 flex items-center justify-center bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all">
                                            <Info size={12} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 py-8 text-center bg-muted/20 border border-dashed border-border rounded-xl">
                                    <ShieldCheck className="mx-auto mb-2 text-primary opacity-20" size={32} />
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Nenhuma ameaça detectada</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Live Events + Shortcuts */}
                <div className="col-span-12 lg:col-span-4 space-y-4 flex flex-col">

                    {/* Live Events Feed */}
                    <div className="bg-card border border-border rounded-xl p-5 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Zap size={14} className="text-primary" /> Eventos Ao Vivo
                            </h4>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        </div>
                        <ScrollArea className="flex-1 -mx-2 px-2 max-h-[420px]">
                            <div className="space-y-1">
                                {liveEvents.map((evt) => (
                                    <div key={evt.id} className="flex gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group border-b border-border last:border-0">
                                        <div className="mt-0.5 shrink-0">
                                            <div className={`w-2 h-2 rounded-full ${EVENT_TYPE_COLOR[evt.type] || 'bg-muted-foreground'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[12px] font-semibold text-foreground uppercase leading-tight">{evt.action}</p>
                                                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{evt.time}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{evt.name}</p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{evt.user}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <button
                            onClick={() => navigate(ADMIN_ROUTE_MAP['AUDIT_LOGS']!)}
                            className="w-full mt-3 py-2.5 border border-dashed border-border rounded-lg text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hover:bg-muted transition-all"
                        >
                            Ver Logs Completos
                        </button>
                    </div>

                    {/* Quick Shortcuts */}
                    <div className="bg-card border border-border rounded-xl p-4">
                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Ações Rápidas</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <SimpleShortcut icon={<Plus size={16} />} label="Admin" />
                            <SimpleShortcut icon={<RefreshCw size={16} />} label="Sync" onClick={() => fetchDashboardStats(true)} />
                            <SimpleShortcut icon={<Smartphone size={16} />} label="Mobile" />
                            <SimpleShortcut icon={<History size={16} />} label="Logs" onClick={() => navigate(ADMIN_ROUTE_MAP['AUDIT_LOGS']!)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Escrow Detail Sheet ── */}
            <Sheet open={isEscrowSheetOpen} onOpenChange={setIsEscrowSheetOpen}>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0">
                    <div className="p-6 pb-4 border-b border-border bg-card/50">
                        <SheetHeader className="text-left">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <ShieldCheck size={18} />
                                </div>
                                <SheetTitle className="text-lg">Volume em Garantia</SheetTitle>
                            </div>
                            <SheetDescription className="text-xs text-muted-foreground">
                                Detalhamento das transações atualmente retidas em escrow.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Total Consolidado</p>
                            <p className="text-2xl font-bold text-foreground">
                                R$ {stats.inEscrow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                                    {escrowList.length} transações ativas
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-6">
                        <div className="py-6 space-y-6">
                            {escrowList.length > 0 ? (
                                <div className="space-y-4">
                                    {escrowList.map((payment, idx) => (
                                        <div key={payment.id || idx} className="group transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                                                        #{payment.id?.slice(0, 8) || 'ID INDISP.'}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">
                                                        {new Date(payment.created_at).toLocaleDateString('pt-BR')} às {new Date(payment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-foreground">
                                                        R$ {payment.amount_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">+ R$ {payment.operator_fee?.toFixed(2)} FEE</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px] h-5 border-border bg-muted/30 font-mono text-muted-foreground">
                                                    ORDER: {payment.order_id?.slice(0, 6)}
                                                </Badge>
                                                {new Date(payment.created_at) < (new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) && (
                                                    <Badge variant="destructive" className="text-[9px] h-5 px-1.5 py-0 bg-red-500/10 text-red-600 dark:text-red-400 border-none">
                                                        Aging {'>'} 7d
                                                    </Badge>
                                                )}
                                            </div>
                                            {idx < escrowList.length - 1 && <Separator className="mt-4" />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                    <Activity size={32} className="mb-2" />
                                    <p className="text-xs font-semibold uppercase tracking-widest leading-relaxed">
                                        Nenhuma transação<br />em garantia
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-6 border-t border-border bg-card/30">
                        <button
                            onClick={() => {
                                setIsEscrowSheetOpen(false);
                                navigate('/admin/finance');
                            }}
                            className="w-full h-10 flex items-center justify-center gap-2 bg-foreground text-background rounded-lg text-xs font-semibold hover:opacity-90 transition-all"
                        >
                            Ver Financeiro Completo <ArrowRight size={14} />
                        </button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AdminDashboard;

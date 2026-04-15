import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, TrendingUp, Users, Briefcase, ShieldAlert,
    Clock, Activity, Zap, Plus, Scale, ShieldCheck,
    CreditCard, MessageSquare, X, History, RefreshCw,
    Smartphone, Info, Target, AlertTriangle, ArrowRight, Eye
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from "../components/ui/tooltip";

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
                                    <h4 className="text-white text-sm font-normal capitalize mb-4 flex items-center gap-2">
                                        {React.cloneElement(icon as React.ReactElement, { size: 14 })} {title}
                                    </h4>
                                    <div className="flex-1 space-y-2 overflow-y-auto">
                                        {results?.length > 0 ? results.map((res: any, i: number) => (
                                            <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
                                                <p className="text-sm font-semibold text-white">{res.name || res.title || res.id}</p>
                                                <p className="text-xs text-white/40 tracking-tight">{res.email || `R$ ${res.value}`}</p>
                                            </div>
                                        )) : (
                                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                                <Search size={32} className="text-white mb-2" />
                                                <p className="text-sm text-white font-normal capitalize">Sem resultados</p>
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

            {/* ── Folioblox Hero Banner ── */}
            <div className="hero">
                <div className="flex items-start justify-between relative z-10">
                    <div>

                        <h1 className="text-3xl font-bold font-display leading-tight">
                            R$ {stats.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h1>
                        <p className="text-sm text-white/70 font-medium flex items-center gap-2 mt-1">
                            Volume Total Transacionado <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">+4.2%</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchDashboardStats(true)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={() => setActiveModal('communication')}
                            className="bg-white text-folio-accent px-5 h-10 rounded-full text-xs font-bold hover:shadow-xl hover:scale-105 transition-all"
                        >
                            Nova Auditoria
                        </button>
                    </div>
                </div>

                <div className="hero-pills relative z-10">
                    <div className="hp interactive" onClick={() => setIsEscrowSheetOpen(true)}>
                        <div className="hp-num">#01 garantia protegida</div>
                        <div className="hp-val text-sm font-normal capitalize">garantia protegida</div>
                        <div className="hp-val">R$ {stats.inEscrow.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                    </div>
                    <div className="hd" />
                    <div className="hp interactive" onClick={() => handleDrillDown('ADMIN_FINANCE')}>
                        <div className="hp-num">#02 liquidação pendente</div>
                        <div className="hp-val text-sm font-normal capitalize">liquidação pendente</div>
                        <div className="hp-val">R$ {(stats.operatorEarnings / 1.5).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                    </div>
                    <div className="hd" />
                    <div className="hp interactive" onClick={() => handleDrillDown('ADMIN_DISPUTES')}>
                        <div className="hp-num">#03 disputas abertas</div>
                        <div className="hp-val text-sm font-normal capitalize">disputas abertas</div>
                        <div className="hp-val">{stats.openDisputes} Casos</div>
                    </div>
                    <div className="hd" />
                    <div className="hp interactive" onClick={() => handleDrillDown('ADMIN_FINANCE')}>
                        <div className="hp-num">#04 taxa plataforma</div>
                        <div className="hp-val text-sm font-normal capitalize">taxa plataforma</div>
                        <div className="hp-val">R$ {stats.operatorEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                    </div>
                </div>
            </div>

            {isRefreshing && (
                <div className="h-0.5 w-full rounded-full overflow-hidden bg-muted absolute top-0 left-0 z-[100]">
                    <div className="h-full bg-folio-accent animate-pulse w-full" />
                </div>
            )}

            {/* ── KPI Grid (Folioblox Skin) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Pedidos Concluídos" value={stats.totalOrders}
                    icon={<Zap size={16} />} color="text-success" bg="bg-success/10"
                    trend="+12%" trendDir="up"
                    onClick={() => handleDrillDown('ADMIN_ORDERS')}
                    tooltip="Total de serviços finalizados com sucesso, com pagamento processado e repasse concluído."
                />
                <KpiCard
                    label="Garantia Protegida" value={`R$ ${(stats.inEscrow / 1000).toFixed(1)}k`}
                    icon={<ShieldCheck size={16} />} color="text-warning" bg="bg-warning/10"
                    trend="Em Escrow"
                    onClick={() => setIsEscrowSheetOpen(true)}
                    tooltip="Saldo retido em Escrow (garantia) aguardando a finalização dos serviços para liberação."
                />
                <KpiCard
                    label="Disputas Ativas" value={stats.openDisputes}
                    icon={<Scale size={16} />} color="text-error" bg="bg-error/10"
                    trend={stats.openDisputes > 0 ? "Crítico" : "Limpo"}
                    onClick={() => handleDrillDown('ADMIN_DISPUTES')}
                    tooltip="Casos em mediação onde houve contestação. Exige intervenção administrativa manual."
                />
                <KpiCard
                    label="Usuários Ativos" value={stats.totalUsers - stats.highRiskUsers}
                    icon={<Users size={16} />} color="text-folio-accent" bg="bg-folio-accent/10"
                    trend="Verificados"
                    onClick={() => handleDrillDown('ADMIN_USERS')}
                    tooltip="Número de usuários com cadastro aprovado (KYC) e habilitados para operar na plataforma."
                />
            </div>

            {/* ── Secondary KPIs ── */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total de Usuários', value: stats.totalUsers, icon: <Users size={16} />, color: 'text-blue-500', tooltip: 'Volume total de contas registradas (Clientes e Profissionais).' },
                    { label: 'Total de Pedidos', value: stats.totalOrders, icon: <Briefcase size={16} />, color: 'text-folio-accent', tooltip: 'Histórico acumulado de todas as intenções de contratação geradas.' },
                    { label: 'Em Execução', value: stats.ordersInExecution, icon: <Zap size={16} />, color: 'text-[#F5C842]', tooltip: 'Serviços ocorrendo agora ou aguardando confirmação de término.' },
                    { label: 'KYC Pendente', value: stats.pendingVerifications, icon: <Clock size={16} />, color: 'text-folio-text-dim', tooltip: 'Profissionais aguardando validação de documentos para operar.' },
                ].map((item) => (
                    <div key={item.label} className="bg-folio-surface border border-folio-border rounded-3xl p-5 flex items-center gap-4 shadow-sm group hover:shadow-glow-dim transition-all relative">
                        {/* Info Icon Tooltip */}
                        <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                            <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                        <button className="p-1 rounded-full hover:bg-slate-500/5 transition-colors text-slate-400/20 hover:text-slate-400/60 outline-none">
                                            <Info size={12} strokeWidth={2} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipPortal>
                                        <TooltipContent side="top" className="max-w-[200px] text-center bg-slate-900 border-slate-800 z-[9999]">
                                            {item.tooltip}
                                        </TooltipContent>
                                    </TooltipPortal>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className={`p-3 rounded-2xl bg-folio-bg border border-folio-border ${item.color} shadow-inner group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <div>
                            <p className="text-sm font-normal text-folio-text-dim opacity-60">{item.label}</p>
                            <p className="text-xl font-black text-folio-text tabular-nums tracking-tighter">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Content Grid ── */}
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left: Decision Queue + Risk */}
                <div className="col-span-12 lg:col-span-8 space-y-6 flex flex-col">

                    {/* Decision Queue */}
                    <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 flex flex-col shadow-folio">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-normal text-folio-text flex items-center gap-3 tracking-tight">
                                    <Target className="text-folio-accent" size={20} /> Fila de Decisão
                                </h3>
                                <p className="text-sm font-normal text-folio-text-dim/50 mt-1">Triagem operacional por prioridade e SLA</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-error/10 text-error border border-error/20 rounded-full text-sm font-normal capitalize">{stats.openDisputes} críticos</span>
                                <span className="px-3 py-1 bg-folio-bg border border-folio-border text-folio-text-dim rounded-full text-sm font-normal capitalize">{stats.pendingVerifications} triagem</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {stats.openDisputes > 0 && (
                                <InboxItem title="Disputas em Aberto" desc="Litígios aguardando sentença operacional imediata"
                                    count={stats.openDisputes} priority="Alta" sla="há 2h" action="Mediação"
                                    onClick={() => handleDrillDown('ADMIN_DISPUTES')} />
                            )}
                            {stats.pendingVerifications > 0 && (
                                <InboxItem title="Revisão de KYC" desc="Validação de documentos e identidade de profissionais"
                                    count={stats.pendingVerifications} priority="Média" sla="há 1 dia" action="Validar"
                                    onClick={() => navigate(ADMIN_ROUTE_MAP['USER_MANAGEMENT']!)} />
                            )}
                            {stats.ordersDelayed > 0 && (
                                <InboxItem title="SLA: Pedidos Atrasados" desc="Negociações sem aceite ativo há mais de 24h"
                                    count={stats.ordersDelayed} priority="Alta" sla="VIOLADO" action="Intervir"
                                    onClick={() => handleDrillDown('ADMIN_ORDERS')} />
                            )}
                            {stats.openDisputes === 0 && stats.pendingVerifications === 0 && stats.ordersDelayed === 0 && (
                                <div className="py-12 text-center rounded-[24px] border-2 border-dashed border-folio-border bg-folio-bg/50">
                                    <ShieldCheck className="mx-auto mb-3 text-[#1DB97A] opacity-50" size={48} />
                                    <p className="text-sm font-normal text-folio-text-dim capitalize">fila limpa — nenhuma ação pendente</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Risk & Fraud */}
                    <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 flex-1 shadow-folio">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-normal text-folio-text flex items-center gap-3 tracking-tight">
                                    <ShieldAlert className="text-error" size={20} /> Risco & Fraude
                                </h3>
                                <p className="text-sm font-normal text-folio-text-dim/50 mt-1">Detecção de padrões e comportamento anômalo em transações</p>
                            </div>
                            <button
                                onClick={() => navigate(ADMIN_ROUTE_MAP['USER_MANAGEMENT']!)}
                                className="px-4 py-2 bg-folio-bg border border-folio-border rounded-xl text-sm font-normal text-folio-text-dim capitalize hover:text-folio-accent hover:border-folio-accent/30 transition-all flex items-center gap-2"
                            >
                                ver tudo <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {riskSignals.length > 0 ? riskSignals.map((signal, i) => (
                                <div key={i} className="p-6 bg-folio-bg border border-folio-border rounded-[28px] hover:border-folio-accent/30 transition-all group shadow-sm hover:shadow-glow-dim">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex gap-2 items-center">
                                                <span className="w-2 h-2 rounded-full bg-error shadow-[0_0_10px_var(--red)] animate-pulse" />
                                                <span className="text-sm font-normal text-error capitalize">{signal.type}</span>
                                            </div>
                                            <h4 className="text-md font-normal text-folio-text tracking-tight capitalize leading-none">{signal.user}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-normal text-folio-text-dim/30 mb-1">Audit Score</p>
                                            <div className="px-2 py-0.5 bg-warning/10 border border-warning/20 rounded-lg">
                                                <p className="text-xl font-black text-warning font-display leading-none">{signal.score}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-5">
                                        <span className="px-2.5 py-1 rounded-lg bg-folio-surface border border-folio-border text-xs font-mono text-folio-text-dim">#{signal.id.slice(0, 10)}</span>
                                        <span className={`px-2.5 py-1 rounded-lg bg-folio-surface border text-sm font-normal ${signal.type === 'Conflito' ? 'text-error border-error/20 shadow-[inset_0_0_8px_var(--red-dim)]' : 'text-folio-text-dim border-folio-border'
                                            }`}>
                                            {signal.type === 'Conflito' ? 'Crítico' : 'Em revisão'}
                                        </span>
                                    </div>

                                    <p className="text-sm font-medium text-folio-text-dim/80 mb-6 leading-relaxed line-clamp-2 italic">"{signal.reason}"</p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setSelectedUser(signal); setActiveModal('risk'); }}
                                            className="flex-1 h-12 bg-error text-white rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-glow active:scale-95"
                                        >Agir agora</button>
                                        <button className="w-12 h-12 flex items-center justify-center bg-folio-surface border border-folio-border rounded-2xl text-folio-text-dim hover:text-folio-text transition-all hover:bg-folio-surface2 shadow-sm">
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 py-16 text-center border-2 border-dashed border-folio-border bg-folio-bg/30 rounded-[28px]">
                                    <ShieldCheck className="mx-auto mb-4 text-folio-accent opacity-20" size={56} />
                                    <p className="text-[12px] font-black text-folio-text-dim opacity-40">Zona segura — nenhuma anomalia detectada</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Live Events + Shortcuts */}
                <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col">

                    {/* Live Events Feed */}
                    <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 flex flex-col flex-1 shadow-folio">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-md font-normal text-folio-text flex items-center gap-3 tracking-tight">
                                <Zap size={18} className="text-folio-accent animate-pulse" /> Eventos em Tempo Real
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-normal text-folio-accent capitalize">live</span>
                                <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                            </div>
                        </div>
                        <ScrollArea className="flex-1 -mx-2 px-2 max-h-[480px]">
                            <div className="flex flex-col gap-1">
                                {liveEvents.map((evt) => (
                                    <div key={evt.id} className="flex gap-4 py-4 px-2 border-b border-folio-border/50 last:border-0 group cursor-pointer hover:bg-folio-bg/50 rounded-2xl transition-all">
                                        <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border shadow-sm ${evt.type === 'payment' ? 'bg-success/10 text-success border-success/20' :
                                            evt.type === 'dispute' ? 'bg-error/10 text-error border-error/20' :
                                                evt.type === 'kyc' ? 'bg-info/10 text-info border-info/20' :
                                                    'bg-folio-accent/10 text-folio-accent border-folio-accent/20'
                                            }`}>
                                            <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <p className="text-sm font-normal text-folio-accent">{evt.action}</p>
                                                <span className="text-xs font-bold text-folio-text-dim/40 tabular-nums">{evt.time}</span>
                                            </div>
                                            <p className="text-[12px] text-folio-text-dim leading-relaxed">
                                                <span className="text-folio-text font-normal text-sm tracking-tight">{evt.user}</span> • {evt.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <button
                            onClick={() => navigate(ADMIN_ROUTE_MAP['AUDIT_LOGS']!)}
                            className="w-full mt-6 py-4 border-2 border-dashed border-folio-border rounded-2xl text-sm font-normal text-folio-text-dim hover:bg-folio-bg hover:text-folio-accent hover:border-folio-accent/30 transition-all"
                        >
                            Acessar logs de auditoria
                        </button>
                    </div>

                    {/* Quick Shortcuts */}
                    <div className="bg-folio-surface border border-folio-border rounded-[32px] p-6 shadow-folio">
                        <h4 className="text-sm font-normal text-folio-text-dim capitalize mb-4 opacity-40 text-center">Protocolos Rápidos</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <SimpleShortcut icon={<Plus size={18} />} label="Admin" />
                            <SimpleShortcut icon={<RefreshCw size={18} />} label="Sync" onClick={() => fetchDashboardStats(true)} />
                            <SimpleShortcut icon={<Smartphone size={18} />} label="App" />
                            <SimpleShortcut icon={<History size={18} />} label="Audit" onClick={() => navigate(ADMIN_ROUTE_MAP['AUDIT_LOGS']!)} />
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
                            <p className="text-sm font-normal text-muted-foreground capitalize mb-1">Total Consolidado</p>
                            <p className="text-2xl font-bold text-foreground">
                                R$ {stats.inEscrow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">
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
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        {new Date(payment.created_at).toLocaleDateString('pt-BR')} às {new Date(payment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-foreground">
                                                        R$ {payment.amount_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+ R$ {payment.operator_fee?.toFixed(2)} FEE</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs h-5 border-border bg-muted/30 font-mono text-muted-foreground">
                                                    ORDER: {payment.order_id?.slice(0, 6)}
                                                </Badge>
                                                {new Date(payment.created_at) < (new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) && (
                                                    <Badge variant="destructive" className="text-xs h-5 px-1.5 py-0 bg-red-500/10 text-red-600 dark:text-red-400 border-none">
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
                                    <p className="text-xs font-semibold lowercase leading-relaxed">
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

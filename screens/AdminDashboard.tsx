import React, { useState, useEffect } from 'react';
import {
    Search,
    TrendingUp,
    Users,
    Briefcase,
    ShieldAlert,
    Clock,
    Activity,
    ArrowRight,
    Zap,
    Plus,
    Scale,
    ShieldCheck,
    AlertTriangle,
    CreditCard,
    MessageSquare,
    X,
    MoreVertical,
    History,
    RefreshCw,
    Smartphone,
    Info,
    Lock,
    Target
} from 'lucide-react';
import { useAppStore } from '../store';
import { supabase } from '../services/supabaseClient';

// --- Helpers de Auditoria ---
const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from('audit_logs').insert({
            action,
            entity_type: entityType,
            entity_id: entityId,
            actor_user_id: user?.id,
            payload_json: {
                details,
                reason,
                origin: 'ERP Admin',
                ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
            }
        });
    } catch (err) {
        console.error("Audit log failed:", err);
    }
};

const AdminDashboard: React.FC = () => {
    const setView = useAppStore(state => state.setView);
    const setViewFilters = useAppStore(state => state.setViewFilters);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        activeServices: 0,
        pendingVerifications: 0,
        openDisputes: 0,
        totalVolume: 0,
        operatorEarnings: 0,
        inEscrow: 0,
        pendingPayouts: 0,
        ordersAwaitingAccept: 0,
        ordersInExecution: 0,
        ordersDelayed: 0,
        highRiskUsers: 0,
        agingEscrow: '0' as any,
        agingPayouts: '0' as any,
        agingDisputes: '0' as any,
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

    useEffect(() => {
        fetchDashboardStats();
        fetchLiveEvents();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);

            // 1. Fetch Global Metrics
            const { data: userData } = await supabase.from('users').select('id');
            const { data: orderData } = await supabase.from('orders').select('id, status, created_at');
            const { data: paymentData } = await supabase.from('payments').select('amount_total, operator_fee, escrow_status, provider_amount');
            const { data: disputeData } = await supabase.from('disputes').select('id, status');

            // 2. Calculate Aggregates
            const uData = (userData || []) as any[];
            const oData = (orderData || []) as any[];
            const pData = (paymentData || []) as any[];
            const dData = (disputeData || []) as any[];

            const totalUsersCount = uData.length;
            const openOrdersCount = oData.filter(o => o.status === 'sent' || o.status === 'accepted' || o.status === 'in_execution').length;
            const openDisputesCount = dData.filter(d => d.status === 'open' || d.status === 'in_review').length;

            const inEscrowVolume = pData.filter(p => p.escrow_status === 'held').reduce((acc, p) => acc + (p.amount_total || 0), 0);
            const earningsTotal = pData.filter(p => p.escrow_status === 'released').reduce((acc, p) => acc + (p.operator_fee || 0), 0);
            const payoutsPending = pData.filter(p => p.escrow_status === 'pending').reduce((acc, p) => acc + (p.provider_amount || 0), 0);

            // 3. Detect SLA Alerts
            const now = new Date();
            const delayed = oData.filter(o => {
                if (o.status !== 'sent') return false;
                const hours = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60));
                return hours > 24;
            }).length;

            setStats({
                totalUsers: totalUsersCount,
                totalOrders: oData.length,
                activeServices: 0,
                pendingVerifications: totalUsersCount > 0 ? 2 : 0,
                openDisputes: openDisputesCount,
                totalVolume: pData.reduce((acc, p) => acc + (p.amount_total || 0), 0),
                operatorEarnings: earningsTotal,
                inEscrow: inEscrowVolume,
                pendingPayouts: payoutsPending,
                ordersAwaitingAccept: oData.filter(o => o.status === 'sent').length,
                ordersInExecution: oData.filter(o => o.status === 'in_execution').length,
                ordersDelayed: delayed,
                highRiskUsers: 2,
                agingEscrow: 'R$ 1.2k > 7d' as any,
                agingPayouts: '3 atrasados' as any,
                agingDisputes: '1 violado' as any,
                revenueVariaction: '+12.5%'
            });

            // Mock Risk Signals
            setRiskSignals([
                { id: 'USR-MOCK-1', user: 'Marcos Silva', reason: 'Múltiplas contas via IP 189.22.x.x', score: 88, type: 'Fraude' },
                { id: 'USR-MOCK-2', user: 'Clínica Pro', reason: 'Reincidência em disputas (3 nos últimos 30 dias)', score: 92, type: 'Compliance' }
            ]);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveEvents = async () => {
        // Mock Live Events (Simulating real-time feed)
        setLiveEvents([
            { id: 1, type: 'order', action: 'Pedido Criado', name: 'Manutenção Elétrica', time: '2m', user: 'Ana Paula' },
            { id: 2, type: 'payment', action: 'Garantia Retida', name: 'R$ 450.00', time: '12m', user: 'Sistema' },
            { id: 3, type: 'dispute', action: 'Nova Disputa', name: 'Serviço não concluído', time: '45m', user: 'Pedro J.' },
            { id: 4, type: 'kyc', action: 'KYC Aprovado', name: 'Dr. Roberto Santos', time: '1h', user: 'Admin' }
        ]);
    };

    const handleUniversalSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        setIsSearchOpen(true);
        // Universal Search Logic (Partial Mock)
        const query = searchQuery.toLowerCase();
        setSearchResults({
            users: stats.totalUsers > 0 ? [{ id: 'USR-1', name: 'Fulano Search', email: query + '@ex.com' }] : [],
            orders: [{ id: 'ORD-999', title: 'Serviço Encontrado', value: 1200 }],
            disputes: []
        });
    };

    const performRiskAction = async (action: string) => {
        if (!actionReason) {
            alert("Motivo obrigatório para auditoria.");
            return;
        }
        await logAdminAction(action, 'USER', selectedUser?.id || 'GLOBAL', `Ação de risco: ${action}`, actionReason);
        alert(`Ação de ${action} registrada com sucesso.`);
        setActiveModal(null);
        setActionReason('');
    };

    const handleDrillDown = (targetView: string, filters: any) => {
        setViewFilters(filters);
        setView(targetView);
    };

    return (
        <div className="space-y-8 animate-fade-in relative">

            {/* --- Universal Search Overlay --- */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] p-10 flex flex-col items-center">
                    <button onClick={() => setIsSearchOpen(false)} className="absolute top-10 right-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
                        <X size={32} />
                    </button>
                    <div className="w-full max-w-4xl space-y-8 mt-20">
                        <div className="relative">
                            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-accent-primary" size={32} />
                            <input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-[40px] pl-24 pr-10 text-3xl font-black text-white outline-none focus:border-accent-primary transition-all placeholder:text-white/20"
                                placeholder="ID, Email, Documento ou Protocolo..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SearchResultBox title="Usuários" icon={<Users />} results={searchResults?.users} />
                            <SearchResultBox title="Pedidos" icon={<Briefcase />} results={searchResults?.orders} />
                            <SearchResultBox title="Transações" icon={<CreditCard />} results={[]} />
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modals (Communications / Risk) --- */}
            {activeModal === 'communication' && (
                <CommunicationModal onClose={() => setActiveModal(null)} onSend={(data: any) => {
                    logAdminAction('SEND_COMMUNICATION', 'SYSTEM', 'GLOBAL', `Comunicado: ${data.title}`, 'Informativo via Admin');
                    setActiveModal(null);
                }} />
            )}

            {activeModal === 'risk' && (
                <RiskActionModal
                    user={selectedUser}
                    reason={actionReason}
                    onReasonChange={setActionReason}
                    onClose={() => setActiveModal(null)}
                    onAction={performRiskAction}
                />
            )}

            {/* --- Header Section --- */}
            <div className="flex justify-between items-end">
                <div className="animate-slide-up">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        <span className="text-[10px] font-black text-success uppercase tracking-widest">Servidor Operacional</span>
                    </div>
                    <h1 className="text-5xl font-black text-text-primary tracking-tight leading-none mb-2">Centro de Comando</h1>
                    <p className="text-sm text-text-tertiary font-medium">Orquestração e inteligência operacional Talent Connect</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="w-14 h-14 bg-bg-secondary border border-border-subtle rounded-2xl flex items-center justify-center hover:bg-bg-tertiary transition-all">
                        <Search size={24} />
                    </button>
                    <button
                        onClick={() => setActiveModal('communication')}
                        className="px-8 bg-accent-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow-blue hover:scale-105 transition-all flex items-center gap-3">
                        <MessageSquare size={18} /> Novo Comunicado
                    </button>
                </div>
            </div>

            {/* --- Top KPIs (Actionable) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Volume em Garantia"
                    value={`R$ ${stats.inEscrow.toLocaleString()}`}
                    icon={<ShieldCheck />}
                    aging={`> 7 dias: ${stats.agingEscrow}`}
                    color="text-accent-primary"
                    bg="bg-accent-primary/10"
                    trend="+4.2%"
                    onClick={() => handleDrillDown('ADMIN_FINANCE', { escrow_status: 'held', sort: 'aging' })}
                />
                <StatCard
                    label="Receita Operadora"
                    value={`R$ ${stats.operatorEarnings.toLocaleString()}`}
                    icon={<TrendingUp />}
                    aging={`Hoje: R$ 450`}
                    color="text-success"
                    bg="bg-success/10"
                    trend={stats.revenueVariaction}
                    onClick={() => handleDrillDown('ADMIN_FINANCE', { tab: 'revenue' })}
                />
                <StatCard
                    label="Repasses Pendentes"
                    value={`R$ ${stats.pendingPayouts.toLocaleString()}`}
                    icon={<CreditCard />}
                    aging={`Atrasados: ${stats.agingPayouts}`}
                    color="text-warning"
                    bg="bg-warning/10"
                    trend="Ação Necessária"
                    onClick={() => handleDrillDown('ADMIN_FINANCE', { tab: 'payouts', status: 'pending' })}
                />
                <StatCard
                    label="Disputas Críticas"
                    value={stats.openDisputes}
                    icon={<Scale />}
                    aging={`SLA Violado: ${stats.agingDisputes}`}
                    color={stats.openDisputes > 0 ? "text-error" : "text-text-tertiary"}
                    bg={stats.openDisputes > 0 ? "bg-error/10" : "bg-bg-tertiary"}
                    trend={stats.openDisputes > 0 ? "Urgente" : "Limpo"}
                    onClick={() => handleDrillDown('ADMIN_DISPUTES', { status: 'open', priority: 'high' })}
                />
            </div>

            {/* --- Main Operational Layer --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column (Inbox & Discovery) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Operational Queue (Inbox Style) */}
                    <div className="bg-bg-primary border border-border-subtle rounded-[48px] p-10 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight flex items-center gap-3">
                                    <Target className="text-accent-primary" /> Fila de Decisão
                                </h3>
                                <p className="text-xs text-text-tertiary font-medium">Triagem operacional por prioridade e SLA</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-4 py-2 bg-error text-white text-[10px] font-black rounded-full uppercase tracking-widest">{stats.openDisputes} Críticos</span>
                                <span className="px-4 py-2 bg-bg-secondary border border-border-subtle text-text-tertiary text-[10px] font-black rounded-full uppercase tracking-widest">{stats.pendingVerifications} Triagem</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Inbox Items */}
                            {stats.openDisputes > 0 && (
                                <InboxItem
                                    title="Disputas em Aberto"
                                    desc="Litígios aguardando sentença operacional"
                                    count={stats.openDisputes}
                                    priority="Alta"
                                    sla="há 2h"
                                    action="Mediação"
                                    onClick={() => handleDrillDown('ADMIN_DISPUTES', { status: 'open' })}
                                />
                            )}
                            {stats.pendingVerifications > 0 && (
                                <InboxItem
                                    title="Revisão de KYC"
                                    desc="Validação de documentos de novos profissionais"
                                    count={stats.pendingVerifications}
                                    priority="Média"
                                    sla="há 1 dia"
                                    action="Validar"
                                    onClick={() => setView('USER_MANAGEMENT')}
                                />
                            )}
                            {stats.ordersDelayed > 0 && (
                                <InboxItem
                                    title="SLA: Pedidos Atrasados"
                                    desc="Contratações sem aceite há mais de 24h"
                                    count={stats.ordersDelayed}
                                    priority="Alta"
                                    sla="VIOLADO"
                                    action="Intervir"
                                    onClick={() => handleDrillDown('ADMIN_ORDERS', { status: 'sent', delayed: true })}
                                />
                            )}
                        </div>
                    </div>

                    {/* Risk & Fraud (Explainability) */}
                    <div className="bg-bg-primary border border-border-subtle rounded-[48px] p-10 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-text-primary uppercase tracking-tight flex items-center gap-3">
                                    <ShieldAlert className="text-error" /> Risco & Fraude
                                </h3>
                                <p className="text-xs text-text-tertiary font-medium">Detecção de padrões e comportamento anômalo</p>
                            </div>
                            <button onClick={() => setView('USER_MANAGEMENT')} className="text-[10px] font-black uppercase text-accent-primary hover:underline">Ver Tabela Completa</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {riskSignals.map((signal, i) => (
                                <div key={i} className="p-6 bg-bg-secondary/40 border border-border-subtle rounded-[32px] group hover:bg-bg-secondary transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[9px] font-black text-error border border-error/30 px-2 py-0.5 rounded uppercase tracking-widest">{signal.type}</span>
                                            <h4 className="text-sm font-black text-text-primary mt-2">{signal.user}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-text-tertiary uppercase">Risk Score</p>
                                            <p className="text-xl font-black text-error leading-tight">{signal.score}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-tertiary leading-relaxed mb-6 italic">"{signal.reason}"</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setSelectedUser(signal); setActiveModal('risk'); }}
                                            className="flex-1 py-3 bg-error text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Bloquear</button>
                                        <button className="px-4 bg-bg-primary border border-border-subtle rounded-xl text-text-tertiary hover:text-text-primary transition-all">
                                            <Info size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (Live Feed & Audit) */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Live Event Feed */}
                    <div className="bg-bg-primary border border-border-subtle rounded-[40px] p-8 min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                                <Zap size={16} className="text-accent-primary fill-accent-primary" /> Eventos Ao Vivo
                            </h4>
                            <span className="w-2 h-2 rounded-full bg-success animate-ping"></span>
                        </div>

                        <div className="flex-1 space-y-6">
                            {liveEvents.map((evt) => (
                                <div key={evt.id} className="flex gap-4 relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-px before:bg-border-subtle group hover:bg-bg-secondary/30 p-2 rounded-2xl transition-all cursor-pointer">
                                    <div className={`absolute left-1 top-2 w-4 h-4 rounded-full border-4 border-bg-primary bg-bg-secondary flex items-center justify-center`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${evt.type === 'order' ? 'bg-success' : evt.type === 'payment' ? 'bg-accent-primary' : 'bg-error'}`}></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className="text-[11px] font-black text-text-primary uppercase">{evt.action}</p>
                                            <span className="text-[9px] font-medium text-text-tertiary">{evt.time}</span>
                                        </div>
                                        <p className="text-[10px] text-text-tertiary font-bold mb-1 truncate">{evt.name}</p>
                                        <div className="flex items-center gap-2 text-[9px] text-text-tertiary uppercase font-black opacity-60">
                                            <Users size={10} /> {evt.user}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setView('AUDIT_LOGS')} className="w-full mt-8 py-4 border border-dashed border-border-subtle rounded-2xl text-[10px] font-black text-text-tertiary uppercase tracking-widest hover:bg-bg-secondary transition-all">
                            Ver Logs de Auditoria
                        </button>
                    </div>

                    {/* Quick System Shortcuts */}
                    <div className="grid grid-cols-2 gap-4">
                        <SimpleShortcut icon={<Plus />} label="Admin" />
                        <SimpleShortcut icon={<RefreshCw />} label="Sync Cache" onClick={fetchDashboardStats} />
                        <SimpleShortcut icon={<Smartphone />} label="Mobile V" />
                        <SimpleShortcut icon={<History />} label="Logs" onClick={() => setView('AUDIT_LOGS')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponentes Locais ---

const StatCard = ({ label, value, icon, aging, color, bg, trend, onClick }: any) => (
    <div
        onClick={onClick}
        className="bg-bg-primary border border-border-subtle p-7 rounded-[40px] shadow-sm hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden active:scale-95"
    >
        <div className="flex items-start justify-between mb-6">
            <div className={`p-4 rounded-2xl ${bg} ${color}`}>
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${trend.includes('Ação') || trend.includes('Urgente') ? 'bg-error text-white' : 'bg-bg-secondary text-text-tertiary'}`}>
                    {trend}
                </span>
                <span className="text-[8px] font-bold text-text-tertiary uppercase opacity-60">{aging}</span>
            </div>
        </div>
        <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.15em] mb-1">{label}</p>
        <h3 className="text-3xl font-black text-text-primary leading-tight tracking-tighter">{value}</h3>

        {/* Progress Hint */}
        <div className="mt-4 h-1 w-full bg-bg-secondary rounded-full overflow-hidden opacity-30">
            <div className={`h-full ${bg.replace('/10', '')} w-[65%]`}></div>
        </div>
    </div>
);

const InboxItem = ({ title, desc, count, priority, sla, action, onClick }: any) => (
    <div
        onClick={onClick}
        className="flex items-center gap-6 p-6 bg-bg-secondary/30 border border-border-subtle/40 rounded-[32px] hover:bg-bg-secondary hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]"
    >
        <div className="w-16 h-16 rounded-[24px] bg-bg-primary border border-border-subtle flex items-center justify-center relative shadow-sm group-hover:scale-110 transition-transform">
            <Activity className="text-accent-primary" size={28} />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-error text-white text-xs font-black flex items-center justify-center rounded-full border-4 border-bg-secondary shadow-lg">
                {count}
            </div>
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <h5 className="text-base font-black text-text-primary uppercase tracking-tight">{title}</h5>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${priority === 'Alta' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                    {priority}
                </span>
            </div>
            <p className="text-xs text-text-tertiary font-medium mb-1">{desc}</p>
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-accent-primary uppercase tracking-widest flex items-center gap-1">
                    <Clock size={12} /> SLA: {sla}
                </span>
            </div>
        </div>
        <button className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-primary hover:text-white transition-all shadow-sm">
            {action}
        </button>
    </div>
);

const SearchResultBox = ({ title, icon, results }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-[400px] flex flex-col">
        <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            {React.cloneElement(icon, { size: 16 })} {title}
        </h4>
        <div className="flex-1 space-y-3 overflow-y-auto">
            {results?.length > 0 ? results.map((res: any, i: number) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                    <p className="text-sm font-bold text-white mb-1 group-hover:text-accent-primary transition-colors">{res.name || res.title || res.id}</p>
                    <p className="text-[10px] text-white/40 uppercase font-black">{res.email || `R$ ${res.value}`}</p>
                </div>
            )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <Search size={40} className="text-white mb-2" />
                    <p className="text-[10px] text-white font-black uppercase">Nenhum resultado</p>
                </div>
            )}
        </div>
    </div>
);

const SimpleShortcut = ({ icon, label, onClick }: any) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-3 p-6 bg-bg-primary border border-border-subtle rounded-[32px] hover:bg-bg-secondary hover:shadow-md transition-all group active:scale-95"
    >
        <div className="text-text-tertiary group-hover:text-accent-primary transition-all">
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{label}</span>
    </button>
);

const RiskActionModal = ({ user, reason, onReasonChange, onClose, onAction }: any) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
        <div className="bg-bg-primary w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-error/20 animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-border-subtle bg-error/5">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-error text-white rounded-2xl shadow-glow-red">
                        <Lock size={32} />
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-secondary rounded-xl transition-all"><X size={24} /></button>
                </div>
                <h2 className="text-2xl font-black text-text-primary mb-2">Protocolo de Bloqueio</h2>
                <p className="text-xs text-text-tertiary">Você está prestes a restringir permanentemente o acesso de <strong>{user?.user}</strong>.</p>
            </div>
            <div className="p-10 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Justificativa da Auditoria (Obrigatório)</label>
                    <textarea
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        className="w-full h-32 bg-bg-secondary border border-border-subtle rounded-2xl p-4 text-xs font-medium outline-none focus:border-error transition-all"
                        placeholder="Ex: Padrão de fraude detectado no IP..."
                    />
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-bg-secondary rounded-2xl text-xs font-black uppercase tracking-widest">Cancelar</button>
                    <button onClick={() => onAction('BLOCK_USER')} className="flex-1 py-4 bg-error text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow-red">Confirmar Bloqueio</button>
                </div>
            </div>
        </div>
    </div>
);

const CommunicationModal = ({ onClose, onSend }: any) => {
    const [title, setTitle] = useState('');
    const [segment, setSegment] = useState('all');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <div className="bg-bg-primary w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden border border-accent-primary/20 animate-in zoom-in-95 duration-200">
                <div className="p-10 border-b border-border-subtle bg-accent-primary/5">
                    <h2 className="text-2xl font-black text-text-primary mb-2">Canal de Transmissão</h2>
                    <p className="text-xs text-text-tertiary font-medium">Envie comunicados segmentados para a base de usuários.</p>
                </div>
                <div className="p-10 space-y-8">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Público Alvo</label>
                                <select
                                    value={segment}
                                    onChange={(e) => setSegment(e.target.value)}
                                    className="w-full h-12 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-xs font-bold"
                                >
                                    <option value="all">Toda a Base</option>
                                    <option value="providers">Prestadores</option>
                                    <option value="clients">Clientes</option>
                                    <option value="kyc_pending">KYC Pendente</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Tipo de Alerta</label>
                                <select className="w-full h-12 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-xs font-bold">
                                    <option>Informativo</option>
                                    <option>Manutenção</option>
                                    <option>Urgente</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Mensagem</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-14 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-sm font-bold outline-none focus:border-accent-primary"
                                placeholder="Título do Comunicado..."
                            />
                            <textarea className="w-full h-32 bg-bg-secondary border border-border-subtle rounded-2xl p-4 text-xs font-medium outline-none" placeholder="Conteúdo da mensagem..." />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 bg-bg-secondary rounded-2xl text-xs font-black uppercase tracking-widest">Descartar</button>
                        <button onClick={() => onSend({ title, segment })} className="flex-1 py-4 bg-accent-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow-blue">Transmitir Agora</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

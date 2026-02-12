import React, { useState, useEffect } from 'react';
import {
    Users,
    Briefcase,
    CreditCard,
    AlertTriangle,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    ShieldAlert,
    Clock,
    Gavel
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
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
        highRiskUsers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                // 1. Contagens Básicas
                const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
                const { count: serviceCount } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('status', 'active');
                const { count: disputeCount } = await supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open');

                // 2. KYC e Risco (Novas Colunas)
                const { count: pendingKYC } = await (supabase.from('users') as any).select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending');
                const { count: highRiskCount } = await (supabase.from('users') as any).select('*', { count: 'exact', head: true }).eq('risk_level', 'high');

                // 3. Pedidos por Status
                const { count: awaitingAccept } = await (supabase.from('orders') as any).select('*', { count: 'exact', head: true }).eq('status', 'sent');
                const { count: inExecution } = await (supabase.from('orders') as any).select('*', { count: 'exact', head: true }).eq('status', 'in_execution');

                // Pedidos atrasados (ex: status 'sent' e criados há mais de 24h)
                const yesterday = new Date();
                yesterday.setHours(yesterday.getHours() - 24);
                const { count: delayedCount } = await (supabase.from('orders') as any)
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'sent')
                    .lt('created_at', yesterday.toISOString());

                // 4. Financeiro (Payments & Transactions)
                const { data: payments } = await supabase.from('payments').select('amount_total, operator_fee, escrow_status');
                const pData = (payments || []) as any[];

                const volume = pData.reduce((acc, p) => acc + (p.amount_total || 0), 0);
                const earnings = pData.reduce((acc, p) => acc + (p.operator_fee || 0), 0);
                const escrow = pData.filter(p => p.escrow_status === 'held').reduce((acc, p) => acc + (p.amount_total || 0), 0);

                const { data: pendingTrans } = await (supabase.from('transactions') as any).select('amount').eq('type', 'payout').eq('status', 'pending');
                const payoutsTotal = (pendingTrans || []).reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

                setStats({
                    totalUsers: userCount || 0,
                    activeServices: serviceCount || 0,
                    pendingVerifications: pendingKYC || 0,
                    openDisputes: disputeCount || 0,
                    totalVolume: volume,
                    operatorEarnings: earnings,
                    inEscrow: escrow,
                    pendingPayouts: payoutsTotal,
                    ordersAwaitingAccept: awaitingAccept || 0,
                    ordersInExecution: inExecution || 0,
                    ordersDelayed: delayedCount || 0,
                    highRiskUsers: highRiskCount || 0
                });
            } catch (error) {
                console.error("Admin dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { label: 'Volume em Escrow', value: `R$ ${stats.inEscrow.toLocaleString()}`, icon: <ShieldAlert />, trend: 'Protegido', color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
        { label: 'Receita Operadora', value: `R$ ${stats.operatorEarnings.toLocaleString()}`, icon: <TrendingUp />, trend: '+8.4%', color: 'text-success', bg: 'bg-success/10' },
        { label: 'Repasses Pendentes', value: `R$ ${stats.pendingPayouts.toLocaleString()}`, icon: <CreditCard />, trend: 'Aguardando', color: 'text-warning', bg: 'bg-warning/10' },
        { label: 'Disputas Críticas', value: stats.openDisputes, icon: <AlertTriangle />, trend: stats.openDisputes > 0 ? 'Ação Imediata' : 'Limpo', color: stats.openDisputes > 0 ? 'text-error' : 'text-text-tertiary', bg: stats.openDisputes > 0 ? 'bg-error/10' : 'bg-bg-tertiary' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Page Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="heading-xl text-text-primary">Centro de Comando</h1>
                    <p className="text-sm text-text-tertiary">Monitoramento operacional em tempo real</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-bg-secondary border border-border-subtle rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-bg-tertiary transition-all">Exportar CSV</button>
                    <button className="px-4 py-2 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow-blue hover:scale-105 transition-all">Novo Comunicado</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-bg-primary border border-border-subtle p-6 rounded-[32px] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                                {React.cloneElement(card.icon as React.ReactElement, { size: 24 })}
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${card.trend.includes('Ação') ? 'bg-error/10 text-error' : 'bg-bg-secondary text-text-tertiary'}`}>
                                {card.trend}
                            </span>
                        </div>
                        <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest mb-1">{card.label}</p>
                        <h3 className="text-2xl font-black text-text-primary leading-tight">{card.value}</h3>
                    </div>
                ))}
            </div>

            {/* Operational Layer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Urgency Queue (Fila Operacional) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-bg-primary border border-border-subtle rounded-[40px] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                                    <Activity size={20} className="text-accent-primary" />
                                    Fila Operacional
                                </h3>
                                <p className="text-[10px] text-text-tertiary font-medium">Itens que requerem sua intervenção imediata</p>
                            </div>
                            <span className="px-3 py-1 bg-accent-primary/10 text-accent-primary text-[10px] font-black rounded-full uppercase">
                                {stats.openDisputes + stats.pendingVerifications + stats.ordersAwaitingAccept} Tarefas
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {stats.openDisputes > 0 && (
                                <QueueItem
                                    type="dispute"
                                    title="Mediação Urgente"
                                    desc="Verificar reclamações e bloqueios de escrow"
                                    status={`${stats.openDisputes} disputas sem análise`}
                                    priority="high"
                                />
                            )}
                            {stats.pendingVerifications > 0 && (
                                <QueueItem
                                    type="kyc"
                                    title="Revisão de KYC"
                                    desc="Novos profissionais aguardando aprovação"
                                    status={`${stats.pendingVerifications} contas pendentes`}
                                    priority="medium"
                                />
                            )}
                            {stats.ordersAwaitingAccept > 0 && (
                                <QueueItem
                                    type="order"
                                    title="Pedidos sem Resposta"
                                    desc="Prestadores que ainda não aceitaram pedidos"
                                    status={`${stats.ordersAwaitingAccept} pedidos em espera`}
                                    priority="low"
                                />
                            )}
                            {stats.openDisputes === 0 && stats.pendingVerifications === 0 && stats.ordersAwaitingAccept === 0 && (
                                <div className="py-20 text-center border-2 border-dashed border-border-subtle rounded-[32px] opacity-40">
                                    <Activity size={48} className="mx-auto mb-4 text-text-tertiary" strokeWidth={1} />
                                    <p className="text-sm font-bold">Fila limpa. Bom trabalho!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Risk Alerts & Shortcuts */}
                <div className="space-y-8">
                    {/* Alertas Inteligentes */}
                    <div className="bg-error/5 border border-error/20 rounded-[40px] p-8">
                        <h4 className="text-xs font-black text-error uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ShieldAlert size={16} />
                            Risco & Fraude
                        </h4>
                        <div className="space-y-4">
                            {stats.highRiskUsers > 0 ? (
                                <div className="p-4 bg-white dark:bg-black/20 rounded-2xl border border-error/10">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-error uppercase">Alerta Vermelho</span>
                                        <span className="text-[9px] font-mono text-text-tertiary">AGORA</span>
                                    </div>
                                    <p className="text-xs font-bold text-text-primary mb-1">{stats.highRiskUsers} Usuários de Alto Risco</p>
                                    <p className="text-[10px] text-text-tertiary leading-relaxed">Padrões de cancelamento reincidente detectados em contas novas.</p>
                                </div>
                            ) : (
                                <div className="p-6 text-center opacity-40">
                                    <p className="text-[10px] font-bold text-text-tertiary uppercase">Nenhum risco detectado</p>
                                </div>
                            )}

                            <button className="w-full py-4 bg-error text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow-red hover:scale-[1.02] transition-all">
                                Bloquear Contas Suspeitas
                            </button>
                        </div>
                    </div>

                    {/* Atalhos Operacionais */}
                    <div className="bg-bg-primary border border-border-subtle rounded-[40px] p-8">
                        <h4 className="text-xs font-black text-text-primary uppercase tracking-widest mb-6">Atalhos Rápidos</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ShortcutButton icon={<Users size={18} />} label="Cadastrar Admin" />
                            <ShortcutButton icon={<CreditCard size={18} />} label="Faturar Mês" />
                            <ShortcutButton icon={<AlertTriangle size={18} />} label="Ver Logs" />
                            <ShortcutButton icon={<Briefcase size={18} />} label="Categorias" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QueueItem = ({ type, title, desc, status, priority }: any) => {
    const getPriorityStyle = (p: string) => {
        switch (p) {
            case 'high': return 'bg-error/10 text-error';
            case 'medium': return 'bg-warning/10 text-warning';
            default: return 'bg-accent-primary/10 text-accent-primary';
        }
    };

    return (
        <div className="flex items-center gap-6 p-6 bg-bg-secondary/40 border border-border-subtle/50 rounded-[28px] hover:bg-bg-secondary hover:shadow-lg transition-all cursor-pointer group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-border-subtle group-hover:scale-110 transition-transform ${getPriorityStyle(priority)}`}>
                {type === 'dispute' && <Gavel size={24} />}
                {type === 'kyc' && <ShieldAlert size={24} />}
                {type === 'order' && <Clock size={24} />}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-black text-text-primary uppercase tracking-tight">{title}</h5>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${getPriorityStyle(priority)}`}>
                        {priority}
                    </span>
                </div>
                <p className="text-xs text-text-tertiary font-medium mb-1">{desc}</p>
                <p className="text-[10px] font-black text-accent-primary uppercase tracking-widest">{status}</p>
            </div>
            <ArrowUpRight className="text-text-tertiary group-hover:text-accent-primary transition-colors" size={20} />
        </div>
    );
};

const ShortcutButton = ({ icon, label }: any) => (
    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-bg-secondary hover:bg-bg-tertiary border border-border-subtle rounded-2xl transition-all group">
        <div className="text-text-tertiary group-hover:text-accent-primary transition-colors">
            {icon}
        </div>
        <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-tighter">{label}</span>
    </button>
);


const PendingItem = ({ icon, title, desc, time }: any) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-bg-secondary transition-colors cursor-pointer group">
        <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center border border-border-subtle group-hover:bg-bg-primary transition-colors">
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <div className="flex-1 min-w-0">
            <h5 className="text-sm font-bold text-text-primary truncate">{title}</h5>
            <p className="text-xs text-text-tertiary truncate">{desc}</p>
        </div>
        <span className="text-[10px] text-text-tertiary font-medium">{time}</span>
    </div>
);

const ProfitRow = ({ label, value, color }: any) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-medium text-text-tertiary">
            <span>{label}</span>
            <span>{value}</span>
        </div>
        <div className="h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: value }}></div>
        </div>
    </div>
);

export default AdminDashboard;

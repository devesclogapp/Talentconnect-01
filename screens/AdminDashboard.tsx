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
    Clock
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeServices: 0,
        pendingVerifications: 0,
        openDisputes: 0,
        totalVolume: 0,
        operatorEarnings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                // Fetch Counts
                const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
                const { count: serviceCount } = await supabase.from('services').select('*', { count: 'exact', head: true });
                const { count: disputeCount } = await supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open');

                // Fetch pending KYC (using user_metadata check)
                const { data: users } = await supabase.from('users').select('user_metadata');
                const pendingKYC = (users || []).filter(u => u.user_metadata?.kyc_status === 'pending').length;

                // Financials
                const { data: payments } = await supabase.from('payments').select('amount_total, operator_fee');
                const pData = (payments || []) as any[];
                const volume = pData.reduce((acc, p) => acc + (p.amount_total || 0), 0) || 0;
                const earnings = pData.reduce((acc, p) => acc + (p.operator_fee || 0), 0) || 0;

                setStats({
                    totalUsers: userCount || 0,
                    activeServices: serviceCount || 0,
                    pendingVerifications: pendingKYC,
                    openDisputes: disputeCount || 0,
                    totalVolume: volume,
                    operatorEarnings: earnings
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
        { label: 'Volume Transacionado', value: `R$ ${stats.totalVolume.toLocaleString()}`, icon: <TrendingUp />, trend: '+12%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Taxas Operadora', value: `R$ ${stats.operatorEarnings.toLocaleString()}`, icon: <CreditCard />, trend: '+8.4%', color: 'text-success', bg: 'bg-success/10' },
        { label: 'Total de Usuários', value: stats.totalUsers, icon: <Users />, trend: '+42', color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
        { label: 'Disputas Abertas', value: stats.openDisputes, icon: <AlertTriangle />, trend: 'Stable', color: 'text-warning', bg: 'bg-warning/10' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="heading-xl text-text-primary">Visão Geral</h1>
                <p className="text-sm text-text-tertiary">Painel central de controle do Talent Connect</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-bg-primary border border-border-subtle p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                                {React.cloneElement(card.icon as React.ReactElement, { size: 24 })}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${card.trend.includes('+') ? 'bg-success/10 text-success' : 'bg-text-tertiary/10 text-text-tertiary'}`}>
                                {card.trend}
                            </span>
                        </div>
                        <p className="text-xs text-text-tertiary font-medium mb-1">{card.label}</p>
                        <h3 className="text-2xl font-black text-text-primary leading-tight">{card.value}</h3>
                    </div>
                ))}
            </div>

            {/* Secondary Layer: Critical Alerts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-bg-primary border border-border-subtle rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-text-primary flex items-center gap-2">
                                <ShieldAlert size={18} className="text-warning" />
                                Pendências Críticas
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {stats.openDisputes > 0 && (
                                <PendingItem
                                    icon={<Activity className="text-error" />}
                                    title="Disputas em Aberto"
                                    desc={`Existem ${stats.openDisputes} disputas aguardando mediação.`}
                                    time="Imediato"
                                />
                            )}
                            {stats.pendingVerifications > 0 && (
                                <PendingItem
                                    icon={<Users className="text-warning" />}
                                    title="Verificações KYC"
                                    desc={`${stats.pendingVerifications} usuários aguardando aprovação de documentos.`}
                                    time="Nesta semana"
                                />
                            )}
                            {stats.openDisputes === 0 && stats.pendingVerifications === 0 && (
                                <p className="text-center py-8 text-text-tertiary text-sm italic">Nenhuma pendência crítica no momento.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mini Charts / Extra Stats */}
                <div className="space-y-6">
                    <div className="bg-black text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">Status Operacional</p>
                            <h4 className="text-xl font-bold mb-4">Infraestrutura OK</h4>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-success w-[98%]"></div>
                                </div>
                                <span className="text-[10px] font-bold">98%</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-white/60">
                                <span className="flex items-center gap-1"><Clock size={10} /> Latência: 42ms</span>
                                <span className="flex items-center gap-1"><ArrowUpRight size={10} /> Online: 14d</span>
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent-primary/20 rounded-full blur-3xl"></div>
                    </div>

                    <div className="bg-bg-primary border border-border-subtle rounded-3xl p-6">
                        <h4 className="font-bold text-text-primary mb-4 text-sm">Distribuição de Lucro</h4>
                        <div className="space-y-3">
                            <ProfitRow label="Taxas App" value="72%" color="bg-accent-primary" />
                            <ProfitRow label="Assinaturas" value="18%" color="bg-blue-500" />
                            <ProfitRow label="Outros" value="10%" color="bg-success" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


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

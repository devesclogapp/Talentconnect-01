import React, { useState, useEffect } from 'react';
import {
    Search,
    Bell,
    Star,
    TrendingUp,
    Clock,
    ChevronRight,
    Filter,
    ArrowUpRight,
    Zap,
    Activity,
    BarChart3,
    Briefcase,
    Calendar,
    Wallet,
    Plus,
    Users,
    Award,
    Target
} from 'lucide-react';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { getProviderOrders } from '../services/ordersService';

interface Props {
    onNavigate: (v: string) => void;
    user?: any;
}

const ProviderDashboard: React.FC<Props> = ({ onNavigate, user }) => {
    const userName = resolveUserName(user);
    const userAvatar = resolveUserAvatar(user);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        completedCount: 0,
        pendingCount: 0,
        growth: 0
    });
    const [recentRequests, setRecentRequests] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const orders: any[] = await getProviderOrders();

                // Calculate Stats
                const completed = orders?.filter(o => o.status === 'completed') || [];
                const total = completed.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

                // Monthly
                const now = new Date();
                const thisMonth = completed.filter(o => {
                    const d = new Date(o.scheduled_at || o.created_at);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                });
                const monthTotal = thisMonth.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

                // Last Month for Growth
                const lastMonth = completed.filter(o => {
                    const d = new Date(o.scheduled_at || o.created_at);
                    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
                });
                const lastMonthTotal = lastMonth.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
                const growth = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : (monthTotal > 0 ? 100 : 0);

                // Requests (status 'sent')
                const pending = orders?.filter(o => o.status === 'sent') || [];

                setStats({
                    totalRevenue: total,
                    monthlyRevenue: monthTotal,
                    completedCount: completed.length,
                    pendingCount: pending.length,
                    growth
                });
                setRecentRequests(pending.slice(0, 3));
            } catch (error) {
                console.error("Dashboard diagnostic error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="min-h-screen bg-bg-primary pb-32 animate-fade-in relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[150px] -z-10"></div>

            {/* Portfolio Command Center Header */}
            <header className="px-6 pt-12 pb-8 bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-subtle">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-[24px] border-2 border-accent-primary p-0.5 overflow-hidden shadow-glow">
                                <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-[20px]" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success border-2 border-bg-secondary rounded-full flex items-center justify-center">
                                <Zap size={12} className="text-white" fill="currentColor" />
                            </div>
                        </div>
                        <div>
                            <p className="meta !text-[8px] !lowercase text-text-tertiary leading-none mb-1">provider terminal</p>
                            <h2 className="heading-xl tracking-tight">{userName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                                <span className="meta !text-[8px] text-success">Operações Ativas</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Display - Financial Dashboard Style */}
                <div className="space-y-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="meta !text-[9px] text-text-tertiary mb-2">Valor Total do Portfolio</p>
                            <h1 className="heading-4xl tracking-tighter mb-2">
                                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h1>
                            <div className="flex items-center gap-3">
                                <span className={`flex items-center gap-1.5 text-[11px] font-black ${stats.growth >= 0 ? 'text-success bg-success/10' : 'text-error bg-error/10'} px-3 py-1.5 rounded-full uppercase tracking-wider`}>
                                    {stats.growth >= 0 ? <ArrowUpRight size={14} /> : <TrendingDown size={14} className="rotate-90" />}
                                    {Math.abs(stats.growth).toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-text-tertiary font-medium">vs mês anterior</span>
                            </div>
                        </div>
                        <button
                            onClick={() => onNavigate('MY_SERVICES')}
                            className="w-16 h-16 rounded-2xl bg-accent-primary text-bg-primary flex items-center justify-center shadow-glow transition-transform"
                        >
                            <Plus size={28} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Revenue Breakdown Pills */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary/50 rounded-full border border-border-subtle whitespace-nowrap">
                            <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
                            <span className="meta !text-[9px] text-text-tertiary uppercase tracking-tighter opacity-60">Ganhos Mensais</span>
                            <span className="text-[10px] font-bold text-text-primary">R$ {stats.monthlyRevenue.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary/50 rounded-full border border-border-subtle whitespace-nowrap">
                            <div className="w-2 h-2 rounded-full bg-warning"></div>
                            <span className="meta !text-[9px] text-text-tertiary uppercase tracking-tighter opacity-60">Pendentes</span>
                            <span className="text-[10px] font-bold text-text-primary">{stats.pendingCount}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-6 mt-8">
                {/* Quick Actions Matrix */}
                <div className="grid grid-cols-4 gap-3 mb-12">
                    {[
                        { id: 'MY_SERVICES', label: 'Serviços', icon: <Briefcase />, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
                        { id: 'AGENDA', label: 'Agenda', icon: <Calendar />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { id: 'EARNINGS', label: 'Financeiro', icon: <Wallet />, color: 'text-warning', bg: 'bg-warning/10' },
                        { id: 'RECEIVED_ORDERS', label: 'Pedidos', icon: <Activity />, color: 'text-text-secondary', bg: 'bg-bg-tertiary' }
                    ].map(action => (
                        <button
                            key={action.id}
                            className="flex flex-col items-center gap-3 interactive group"
                            onClick={() => onNavigate(action.id)}
                        >
                            <div className={`w-16 h-16 rounded-2xl ${action.bg} border border-border-subtle shadow-md flex items-center justify-center transition-all group-active:scale-95`}>
                                <div className={action.color}>{action.icon}</div>
                            </div>
                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* Performance Analytics */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="heading-lg tracking-tight mb-1">Performance</h3>
                            <p className="meta !text-[8px] !lowercase text-text-tertiary">Métricas operacionais reais</p>
                        </div>
                        <button className="w-10 h-10 rounded-xl bg-bg-secondary border border-border-subtle flex items-center justify-center text-accent-primary">
                            <BarChart3 size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="card-stat group interactive">
                            <div className="absolute right-[-10px] top-[-10px] opacity-5 transition-transform duration-500">
                                <Users size={80} />
                            </div>
                            <p className="card-stat__label flex items-center gap-1.5 relative z-10">
                                <Target size={14} className="text-accent-primary" /> Clientes Atendidos
                            </p>
                            <div className="flex items-baseline gap-2 relative z-10">
                                <span className="card-stat__value">{stats.completedCount}</span>
                            </div>
                        </div>

                        <div className="card-stat group interactive">
                            <p className="card-stat__label flex items-center gap-1.5">
                                <Award size={14} className="text-warning" /> Taxa de Sucesso
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="card-stat__value">{stats.completedCount > 0 ? '100%' : '0%'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Incoming Requests Pipeline */}
                <section className="pb-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="heading-lg tracking-tight mb-1">Novas Solicitações</h3>
                            <p className="meta !text-[8px] !lowercase text-text-tertiary">Oportunidades de contrato pendentes</p>
                        </div>
                        <button
                            onClick={() => onNavigate('RECEIVED_ORDERS')}
                            className="text-accent-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                        >
                            Ver Todos <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentRequests.length === 0 ? (
                            <div className="p-8 text-center bg-bg-tertiary/20 rounded-[28px] border border-dashed border-border-subtle">
                                <p className="meta text-text-tertiary uppercase tracking-widest !text-[10px]">Sem solicitações pendentes</p>
                            </div>
                        ) : (
                            recentRequests.map((req, i) => (
                                <div
                                    key={req.id}
                                    className="card-transaction group cursor-pointer"
                                    onClick={() => {
                                        // No AppStore logic needs to handle selection, usually ReceivedOrders does this, 
                                        // but we can at least navigate there
                                        onNavigate('RECEIVED_ORDERS');
                                    }}
                                >
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-accent-primary/10 border-accent-primary/20 text-accent-primary">
                                        <Users size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="heading-md mb-0.5">{req.client?.name || 'Cliente'}</h5>
                                        <p className="meta !text-[9px] !lowercase text-text-tertiary">{req.service_title_snapshot || req.service?.title || 'Serviço'} • {new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-text-primary">R$ {req.total_amount?.toFixed(2)}</p>
                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md bg-warning/10 text-warning`}>
                                            PENDENTE
                                        </span>
                                    </div>
                                    <ChevronRight size={18} className="text-text-tertiary transition-colors" />
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

const TrendingDown = ({ size, className }: any) => (
    <Activity size={size} className={className} /> // Placeholder for a down trend icon if not imported
);

export default ProviderDashboard;

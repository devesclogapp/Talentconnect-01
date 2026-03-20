import React, { useState, useEffect } from 'react';
import {
    Search,
    Bell,
    TrendingUp,
    ChevronRight,
    ArrowUpRight,
    Zap,
    Activity,
    BarChart3,
    Briefcase,
    Calendar,
    Wallet,
    Users,
    Award,
    Target,
    ArrowRight,
    Shield
} from 'lucide-react';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { getProviderOrders } from '../services/ordersService';
import { supabase } from '../services/supabaseClient';
import MetricCard from '../components/dashboard/MetricCard';

interface Props {
    onNavigate: (v: string) => void;
    onOpenNegotiation?: (negotiation: any) => void;
    user?: any;
    isDarkMode?: boolean;
    onToggleDarkMode?: () => void;
    onAddService?: () => void;
}

const ProviderDashboard: React.FC<Props> = ({
    onNavigate,
    user
}) => {
    const userName = resolveUserName(user);
    const userAvatar = resolveUserAvatar(user);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        grossRevenue: 0,
        operatorFees: 0,
        monthlyRevenue: 0,
        pendingCount: 0,
        scheduledCount: 0,
        completedCount: 0,
        growth: 0
    });
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [showFinancialDetails, setShowFinancialDetails] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch Profile for KYC status
                const { data: profileData } = await supabase
                    .from('provider_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                setProfile(profileData);

                // Self-Healing Logic: If metadata says submitted but DB is empty, sync them
                if (user?.user_metadata?.documents_status === 'submitted' && (!(profileData as any) || !(profileData as any).doc_front_path)) {
                    console.log("Self-healing: Syncing KYC data from metadata to database...");
                    const metadata = user.user_metadata;
                    const syncData: any = {
                        user_id: user.id,
                        doc_front_path: metadata.doc_front_path,
                        doc_back_path: metadata.doc_back_path,
                        selfie_path: metadata.selfie_path,
                        documents_status: 'submitted'
                    };

                    const { data: updatedProfile, error: syncError } = await (supabase
                        .from('provider_profiles') as any)
                        .upsert(syncData)
                        .select()
                        .single();

                    if (!syncError) setProfile(updatedProfile);
                }

                const orders: any[] = await getProviderOrders();

                const getPaymentDetails = (order: any) => {
                    const payment = Array.isArray(order.payment) ? order.payment[0] : order.payment;
                    return {
                        net: payment?.provider_amount || 0,
                        gross: payment?.amount_total || order.total_amount || 0,
                        fee: payment?.operator_fee || ((order.total_amount || 0) - (payment?.provider_amount || 0))
                    };
                };

                const completed = orders?.filter(o => o.status === 'completed') || [];

                const totals = completed.reduce((acc, curr) => {
                    const { net, gross, fee } = getPaymentDetails(curr);
                    return {
                        net: acc.net + net,
                        gross: acc.gross + gross,
                        fee: acc.fee + fee
                    };
                }, { net: 0, gross: 0, fee: 0 });

                const now = new Date();
                const thisMonth = completed.filter(o => {
                    const d = new Date(o.scheduled_at || o.created_at);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                });

                const monthTotal = thisMonth.reduce((acc, curr) => {
                    const { net } = getPaymentDetails(curr);
                    return acc + net;
                }, 0);

                const lastMonth = completed.filter(o => {
                    const d = new Date(o.scheduled_at || o.created_at);
                    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
                });

                const lastMonthTotal = lastMonth.reduce((acc, curr) => {
                    const { net } = getPaymentDetails(curr);
                    return acc + net;
                }, 0);

                const growth = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : (monthTotal > 0 ? 100 : 0);

                const pending = orders?.filter(o => o.status === 'sent') || [];
                const scheduled = orders?.filter(o => ['paid_escrow_held', 'awaiting_start_confirmation', 'accepted'].includes(o.status)) || [];

                setStats({
                    totalRevenue: totals.net,
                    grossRevenue: totals.gross,
                    operatorFees: totals.fee,
                    monthlyRevenue: monthTotal,
                    completedCount: completed.length,
                    pendingCount: pending.length,
                    scheduledCount: scheduled.length,
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

        const subscription = supabase
            .channel('provider-dashboard-orders')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                },
                () => {
                    fetchDashboardData();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="min-h-screen bg-bg-primary pb-32 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[150px] -z-10"></div>

            <header className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-accent-primary p-0.5 overflow-hidden shadow-glow">
                                <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-full" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success border-2 border-bg-primary rounded-full flex items-center justify-center">
                                <Zap size={10} className="text-white" fill="currentColor" />
                            </div>
                        </div>
                        <div>
                            <p className="meta !text-[11px] !lowercase text-text-tertiary leading-none mb-0.5">terminal do profissional</p>
                            <h2 className="heading-lg text-text-primary">{userName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                                <span className="meta !text-[11px] text-success">Operações Ativas</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onNavigate('NOTIFICATIONS')} className="btn-icon relative">
                            <Bell size={18} className="text-text-secondary" />
                            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-accent-primary rounded-full shadow-glow"></span>
                        </button>
                        <button className="btn-icon">
                            <Search size={18} className="text-text-secondary" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-6 mb-6">
                {(() => {
                    const status = profile?.documents_status || user?.user_metadata?.documents_status || 'pending';
                    const isVerified = status === 'approved';
                    const isSubmitted = status === 'submitted';

                    if (isVerified) return null;

                    const bgColor = isSubmitted ? 'bg-blue-500/5 border-blue-500/20' : 'bg-warning/5 border-warning/20';
                    const iconColor = isSubmitted ? 'bg-blue-500/10 text-blue-500' : 'bg-warning/10 text-warning';
                    const textColor = isSubmitted ? 'text-blue-500' : 'text-warning';
                    const title = isSubmitted ? 'Verificação em Análise' : 'Verificação Necessária';
                    const description = isSubmitted ? 'Seus documentos estão sendo revisados.' : 'Envie seus documentos para desbloquear recursos.';
                    const isInteractive = !isVerified && !isSubmitted;

                    return (
                        <div
                            className={`p-4 rounded-2xl border ${bgColor} flex items-center justify-between group ${isInteractive ? 'interactive' : ''}`}
                            onClick={() => {
                                if (isVerified) return;
                                if (isSubmitted) {
                                    alert('Seus documentos já foram enviados e estão em análise.');
                                    return;
                                }
                                onNavigate('DOCUMENT_SUBMISSION');
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${textColor}`}>
                                        {title}
                                    </h3>
                                    <p className="text-[11px] text-text-tertiary max-w-[200px] leading-tight mt-0.5">
                                        {description}
                                    </p>
                                </div>
                            </div>
                            {isInteractive && <ChevronRight size={18} className="text-warning/50" />}
                        </div>
                    );
                })()}
            </div>

            <div className="px-6 mb-8">
                <div className="bg-black text-white rounded-[32px] p-6 shadow-2xl relative overflow-hidden border border-white/10">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-end justify-between">
                            <div
                                className="cursor-pointer transition-opacity active:opacity-70"
                                onClick={() => setShowFinancialDetails(!showFinancialDetails)}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <p className="text-[11px] font-semibold text-neutral-200 tracking-wide uppercase">
                                        Valor Líquido do Portfolio
                                    </p>
                                    <div
                                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase cursor-pointer transition-all ${showFinancialDetails
                                            ? 'bg-accent-primary text-white'
                                            : 'bg-white/20 text-white border border-white/20'
                                            }`}
                                    >
                                        {showFinancialDetails ? 'Detalhado' : 'Resumo'}
                                    </div>
                                </div>

                                <h1 className="heading-4xl mb-2 text-white">
                                    R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </h1>

                                {showFinancialDetails && (
                                    <div className="mb-4 space-y-1 animate-slide-down">
                                        <div className="flex items-center gap-2 text-xs text-neutral-300">
                                            <span className="w-16">Total Bruto:</span>
                                            <span className="font-normal">R$ {stats.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-error">
                                            <span className="w-16">Operadora:</span>
                                            <span className="font-normal">- R$ {stats.operatorFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="h-px bg-white/10 w-32 my-1"></div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`flex items-center gap-1.5 text-[12px] font-bold ${stats.growth >= 0
                                        ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                                        : 'text-red-300 bg-red-500/20 border border-red-500/30'
                                        } px-3 py-1.5 rounded-full`}>
                                        {stats.growth >= 0 ? <ArrowUpRight size={14} /> : <Activity size={14} className="rotate-90" />}
                                        {Math.abs(stats.growth).toFixed(1)}%
                                    </span>
                                    <span className="text-[11px] text-neutral-300 font-medium">vs mês anterior</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1 pb-2 mt-4 border-t border-white/10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate('RECEIVED_ORDERS:pending');
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-full border border-white/20 whitespace-nowrap interactive hover:bg-white/15 transition-colors"
                            >
                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                                <span className="text-[11px] font-semibold text-neutral-200">Pendentes</span>
                                <span className="text-[12px] font-black text-white ml-0.5">{stats.pendingCount}</span>
                                <ArrowRight size={11} className="text-neutral-300 ml-1" />
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate('RECEIVED_ORDERS:accepted');
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-full border border-white/20 whitespace-nowrap interactive hover:bg-white/15 transition-colors"
                            >
                                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                                <span className="text-[11px] font-semibold text-neutral-200">A Iniciar</span>
                                <span className="text-[12px] font-black text-white ml-0.5">{stats.scheduledCount}</span>
                                <ArrowRight size={11} className="text-neutral-300 ml-1" />
                            </button>
                        </div>
                    </div>
                    <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-accent-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
                </div>
            </div>

            <main className="px-6 mt-8">
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
                            <span className="text-[11px] font-medium text-text-secondary tracking-normal">{action.label}</span>
                        </button>
                    ))}
                </div>

                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="heading-lg mb-1">Performance</h3>
                            <p className="meta !text-[11px] !lowercase text-text-tertiary">Métricas operacionais reais</p>
                        </div>
                        <button className="w-10 h-10 rounded-xl bg-bg-secondary border border-border-subtle flex items-center justify-center text-accent-primary">
                            <BarChart3 size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                            label="Clientes"
                            value={stats.completedCount}
                            icon={Users}
                            description="Total de atendimentos"
                        />
                        <MetricCard
                            label="Sucesso"
                            value={stats.completedCount > 0 ? "100%" : "0%"}
                            icon={Award}
                            description="Taxa de conclusão"
                        />
                    </div>
                </section>

                <section className="pb-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="heading-lg mb-1">Novas Solicitações</h3>
                            <p className="meta !text-[11px] !lowercase text-text-tertiary">Oportunidades de contrato pendentes</p>
                        </div>
                        <button
                            onClick={() => onNavigate('RECEIVED_ORDERS')}
                            className="text-accent-primary text-[11px] font-medium tracking-normal flex items-center gap-1"
                        >
                            Ver Todos <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentRequests.length === 0 ? (
                            <div className="p-8 text-center bg-bg-tertiary/20 rounded-[28px] border border-dashed border-border-subtle">
                                <p className="meta text-text-tertiary tracking-normal !text-[11px]">Sem solicitações pendentes</p>
                            </div>
                        ) : (
                            recentRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="card-transaction group cursor-pointer"
                                    onClick={() => onNavigate('RECEIVED_ORDERS')}
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
                                        <span className={`text-[11px] font-medium px-2 py-1 rounded-md bg-warning/10 text-warning`}>
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

export default ProviderDashboard;

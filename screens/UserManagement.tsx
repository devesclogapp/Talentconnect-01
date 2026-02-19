import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    UserCheck,
    UserX,
    Shield,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    CheckCircle,
    Slash,
    Download,
    Ban,
    Unlock,
    History,
    Briefcase as BriefcaseIcon,
    DollarSign,
    MessageCircle,
    FileText,
    AlertCircle,
    Clock,
    Gavel,
    MoreVertical,
    Activity,
    AlertTriangle,
    ShieldAlert,
    Target,
    Zap,
    Scale,
    ShieldCheck,
    ArrowRightCircle,
    ExternalLink,
    Lock
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// --- Helpers de Governança ---
const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string) => {
    try {
        await (supabase as any).from('audit_logs').insert({
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
            reason,
            timestamp: new Date().toISOString(),
            origin: 'User Governance'
        });
    } catch (err) {
        console.error("Audit Log Failure:", err);
    }
};

const calculateUserScore = (stats: any) => {
    let score = 5;
    if (stats.disputes > 0) score += (stats.disputes * 15);
    if (stats.cancellationRate > 10) score += 20;
    if (stats.negativeRatings > 0) score += (stats.negativeRatings * 10);
    if (stats.frequentDataChanges) score += 10;
    return Math.min(score, 100);
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [userStats, setUserStats] = useState({
        orders: 0,
        disputes: 0,
        revenue: 0,
        cancellationRate: 0,
        negativeRatings: 0,
        activePenalties: 0,
        refunds: 0
    });
    const [actionModal, setActionModal] = useState<{ open: boolean, type: string, user: any } | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [filters, setFilters] = useState({
        score: 'all',
        kyc: 'all',
        dispute: 'all',
        penalty: 'all'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // 1. Fetch Users
            const { data: usersData, error: usersError } = await supabase.from('users').select('*, provider_profiles(*)');
            if (usersError) throw usersError;

            // 2. Fetch Aggregates (Para evitar múltiplas queries por linha, carregamos em lote)
            const { data: allOrders } = await supabase.from('orders').select('id, client_id, provider_id, status');
            const { data: allPayments } = await supabase.from('payments').select('order_id, amount_total, escrow_status');
            const { data: allDisputes } = await supabase.from('disputes').select('order_id');

            const processedUsers = (usersData as any[] || []).map((u: any) => {
                const userOrders = (allOrders as any[] || []).filter(o => o.client_id === u.id || o.provider_id === u.id);
                const orderIds = userOrders.map(o => o.id);

                const userDisputes = (allDisputes as any[] || []).filter(d => orderIds.includes(d.order_id)).length;
                const userCancellations = userOrders.filter(o => o.status === 'cancelled').length;
                const userRevenue = (allPayments as any[] || [])
                    .filter(p => orderIds.includes(p.order_id) && p.escrow_status === 'released')
                    .reduce((acc, p) => acc + (p.amount_total || 0), 0);

                const kyc = u.provider_profiles?.[0]?.documents_status || u.kyc_status || 'pending';

                const stats = {
                    disputes: userDisputes,
                    cancellationRate: userOrders.length > 0 ? (userCancellations / userOrders.length) * 100 : 0,
                    negativeRatings: 0, // Fallback até termos ratings reais por usuário
                    frequentDataChanges: false
                };

                const score = calculateUserScore(stats);

                return {
                    ...u,
                    kyc_status: kyc,
                    status: u.status || 'active',
                    risk_score: score,
                    risk_level: score > 70 ? 'high' : score > 30 ? 'medium' : 'low',
                    total_orders: userOrders.length,
                    revenue: userRevenue,
                    disputes_30d: userDisputes,
                    cancellation_rate: Math.round(stats.cancellationRate)
                };
            }).sort((a, b) => b.risk_score - a.risk_score);

            setUsers(processedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async (userId: string) => {
        try {
            const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).or(`client_id.eq.${userId},provider_id.eq.${userId}`);
            const { data: userOrders } = await supabase.from('orders').select('id').or(`client_id.eq.${userId},provider_id.eq.${userId}`);
            const orderIds = (userOrders || [])?.map(o => o.id);
            let disputeCount = 0;
            if (orderIds && orderIds.length > 0) {
                const { count } = await supabase.from('disputes').select('*', { count: 'exact', head: true }).in('order_id', orderIds);
                disputeCount = count || 0;
            }

            const { data: payments } = await supabase.from('payments').select('*').in('order_id', orderIds || []);
            const revenue = (payments || []).filter(p => p.escrow_status === 'released').reduce((acc, p) => acc + (p.amount_total || 0), 0);
            const refunds = (payments || []).filter(p => p.escrow_status === 'refunded').reduce((acc, p) => acc + (p.amount_total || 0), 0);
            const { count: cancelledCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).or(`client_id.eq.${userId},provider_id.eq.${userId}`).eq('status', 'cancelled');

            setUserStats({
                orders: orderCount || 0,
                disputes: disputeCount,
                revenue,
                cancellationRate: orderCount ? (cancelledCount || 0) / orderCount * 100 : 0,
                negativeRatings: 1,
                activePenalties: 0,
                refunds
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setActiveTab('summary');
        fetchUserStats(user.id);
    };

    const performGlobalAction = async () => {
        if (!actionModal || !actionReason) return;
        setIsUpdating(true);
        try {
            const { type, user } = actionModal;
            const updates: any = {};
            if (type === 'BLOCK') updates.status = 'blocked';
            if (type === 'SUSPEND') updates.status = 'suspended';
            if (type === 'ACTIVATE') updates.status = 'active';
            if (type === 'APPROVE_KYC') updates.kyc_status = 'approved';
            if (type === 'REJECT_KYC') updates.kyc_status = 'rejected';

            const { error } = await (supabase as any).from('users').update(updates).eq('id', user.id);
            if (error) throw error;

            await logAdminAction(`GOVERNANCE_${type}`, 'USER', user.id, `Ação de governança: ${type}`, actionReason);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates } : u));
            if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, ...updates });

            alert('Ação executada com sucesso.');
            setActionModal(null);
            setActionReason('');
        } catch (err: any) {
            alert('Erro: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const name = (user.name || user.user_metadata?.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const matchesSearch = email.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || (user.role || user.user_metadata?.role || 'client').toLowerCase() === filterRole.toLowerCase();
        const matchesScore = filters.score === 'all' || (filters.score === 'high' && user.risk_score > 70) || (filters.score === 'medium' && user.risk_score > 30 && user.risk_score <= 70) || (filters.score === 'low' && user.risk_score <= 30);
        const matchesKYC = filters.kyc === 'all' || user.kyc_status === filters.kyc;
        return matchesSearch && matchesRole && matchesScore && matchesKYC;
    });

    return (
        <div className="flex gap-8 animate-fade-in relative pb-12 h-screen overflow-hidden">
            {/* Sidebar Filtros */}
            {isSidebarOpen && (
                <div className="w-80 bg-bg-primary border-r border-border-subtle h-full p-8 space-y-10 animate-slide-in-left overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                            <Filter size={16} className="text-accent-primary" /> Governança
                        </h3>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-bg-secondary rounded-lg transition-all"><ChevronLeft size={20} /></button>
                    </div>
                    <FilterGroup label="Score de Risco">
                        <FilterButton active={filters.score === 'all'} label="Todos" onClick={() => setFilters({ ...filters, score: 'all' })} />
                        <FilterButton active={filters.score === 'high'} label="Alto Risco" color="text-error" onClick={() => setFilters({ ...filters, score: 'high' })} />
                        <FilterButton active={filters.score === 'medium'} label="Atenção" color="text-warning" onClick={() => setFilters({ ...filters, score: 'medium' })} />
                        <FilterButton active={filters.score === 'low'} label="Seguro" color="text-success" onClick={() => setFilters({ ...filters, score: 'low' })} />
                    </FilterGroup>
                    <FilterGroup label="Status KYC">
                        <FilterButton active={filters.kyc === 'all'} label="Todos" onClick={() => setFilters({ ...filters, kyc: 'all' })} />
                        <FilterButton active={filters.kyc === 'pending'} label="Pendente" color="text-warning" onClick={() => setFilters({ ...filters, kyc: 'pending' })} />
                        <FilterButton active={filters.kyc === 'approved'} label="Aprovado" color="text-success" onClick={() => setFilters({ ...filters, kyc: 'approved' })} />
                    </FilterGroup>
                </div>
            )}

            <div className="flex-1 space-y-8 overflow-y-auto p-8 pr-12">
                {/* Modal Ação */}
                {actionModal?.open && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                        <div className="bg-bg-primary w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-200">
                            <div className="p-10 border-b border-border-subtle bg-bg-secondary/30">
                                <h2 className="text-2xl font-black text-text-primary mb-2 flex items-center gap-3"><AlertCircle className="text-accent-primary" /> Confirmar Intervenção</h2>
                                <p className="text-xs text-text-tertiary">Ação: <span className="text-text-primary font-black">{actionModal.type}</span> para {actionModal.user.email}</p>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Motivo da Auditoria</label>
                                    <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="w-full h-32 bg-bg-secondary border border-border-subtle rounded-2xl p-4 text-xs font-medium outline-none focus:border-accent-primary" placeholder="Descreva o motivo..." />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setActionModal(null)} className="flex-1 py-4 bg-bg-secondary rounded-2xl text-[10px] font-black uppercase">Sair</button>
                                    <button disabled={!actionReason || isUpdating} onClick={performGlobalAction} className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-all disabled:opacity-30">Confirmar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dossiê Slide-over */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                        <div className="bg-bg-primary h-full w-full max-w-5xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-secondary/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-accent-primary text-white flex items-center justify-center text-2xl font-black">{(selectedUser.name || 'U').charAt(0)}</div>
                                    <div>
                                        <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">{selectedUser.name || 'Sem nome'}</h2>
                                        <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-3 bg-bg-secondary hover:rotate-90 transition-all rounded-xl border border-border-subtle"><X size={24} /></button>
                            </div>

                            <div className="flex px-8 bg-bg-secondary/10 border-b border-border-subtle overflow-x-auto">
                                {['summary', 'orders', 'financial', 'disputes', 'services', 'logs', 'penalties'].map((tab) => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0 ${activeTab === tab ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}>
                                        {tab === 'summary' ? 'Dossiê' : tab === 'orders' ? 'Pedidos' : tab === 'financial' ? 'Finanças' : tab === 'disputes' ? 'Disputas' : tab === 'services' ? 'Serviços' : tab === 'logs' ? 'Logs' : 'Penalidades'}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-10">
                                {activeTab === 'summary' && (
                                    <div className="space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <DetailStat label="Pedidos Totais" value={userStats.orders} icon={<BriefcaseIcon />} color="text-accent-primary" />
                                            <DetailStat label="Disputas (30d)" value={userStats.disputes} icon={<Scale />} color="text-error" />
                                            <DetailStat label="Volume Bruto" value={`R$ ${userStats.revenue.toLocaleString()}`} icon={<DollarSign />} color="text-success" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-bg-secondary/20 p-8 rounded-[40px] border border-border-subtle space-y-6">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Análise de Risco</h4>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-2xl font-black text-text-primary">{selectedUser.risk_score}%</span>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${selectedUser.risk_level === 'high' ? 'bg-error text-white' : 'bg-success text-white'}`}>{selectedUser.risk_level} Risk</span>
                                                </div>
                                                <div className="h-3 w-full bg-bg-secondary rounded-full overflow-hidden">
                                                    <div className={`h-full ${selectedUser.risk_level === 'high' ? 'bg-error' : 'bg-success'}`} style={{ width: `${selectedUser.risk_score}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="bg-bg-secondary/20 p-8 rounded-[40px] border border-border-subtle space-y-4">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Perfil & Acesso</h4>
                                                <InfoRow label="Papel" value={selectedUser.role} />
                                                <InfoRow label="KYC" value={selectedUser.kyc_status} />
                                                <InfoRow label="Status" value={selectedUser.status} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab !== 'summary' && <div className="h-full flex flex-col items-center justify-center opacity-20"><History size={64} /><p className="mt-4 font-black uppercase tracking-widest">Dados em Processamento...</p></div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header & Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-text-primary tracking-tighter">Governança de Usuários</h1>
                        <p className="text-sm text-text-tertiary font-medium">Análise de risco, intervenção direta e auditoria operacional</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-bg-secondary border border-border-subtle rounded-xl"><Filter size={20} /></button>}
                        <button className="h-12 px-6 bg-accent-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow-blue hover:scale-105 transition-all flex items-center gap-2"><Download size={16} /> Exportar Dossiês</button>
                    </div>
                </div>

                <div className="bg-bg-primary border border-border-subtle p-6 rounded-[32px] flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded-2xl pl-12 pr-4 h-14 text-sm font-medium outline-none focus:border-accent-primary transition-all" placeholder="Buscar por ID, Nome, Email ou Documento..." />
                    </div>
                    <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-14 px-6 bg-bg-secondary border border-border-subtle rounded-2xl text-[10px] font-black uppercase outline-none">
                        <option value="all">Filtro: Papel</option>
                        <option value="client">Cliente</option>
                        <option value="provider">Profissional</option>
                    </select>
                </div>

                {/* Tabela */}
                <div className="bg-bg-primary border border-border-subtle rounded-[40px] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-secondary/40 border-b border-border-subtle">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Identidade</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Risco</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Métricas (Pedidos/Disputas)</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center"><Clock className="animate-spin mx-auto mb-2" /></td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} onClick={() => handleSelectUser(user)} className="hover:bg-bg-secondary/20 transition-all cursor-pointer group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-bg-secondary flex items-center justify-center font-black text-accent-primary border border-border-subtle group-hover:scale-110 transition-transform">{(user.name || 'U').charAt(0)}</div>
                                            <div>
                                                <p className="text-xs font-black text-text-primary uppercase">{user.name || 'Sem nome'}</p>
                                                <p className="text-[10px] text-text-tertiary font-mono">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${user.risk_level === 'high' ? 'bg-error/10 text-error' : user.risk_level === 'medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                                            <Shield size={12} />
                                            <span className="text-[10px] font-black uppercase">{user.risk_score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex gap-4">
                                            <div className="text-center"><p className="text-xs font-black text-text-primary">{user.total_orders}</p><p className="text-[8px] font-black text-text-tertiary uppercase">Pedidos</p></div>
                                            <div className="text-center"><p className="text-xs font-black text-error">{user.disputes_30d}</p><p className="text-[8px] font-black text-text-tertiary uppercase">Disputas</p></div>
                                            <div className="text-center"><p className="text-xs font-black text-warning">{user.cancellation_rate}%</p><p className="text-[8px] font-black text-text-tertiary uppercase">Canc.</p></div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${user.status === 'blocked' ? 'text-error' : 'text-success'}`}>{user.status}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setActionModal({ open: true, type: user.status === 'blocked' ? 'ACTIVATE' : 'BLOCK', user })}
                                                className={`p-2 rounded-lg border border-border-subtle hover:bg-black hover:text-white transition-all`}>
                                                {user.status === 'blocked' ? <Unlock size={16} /> : <Ban size={16} />}
                                            </button>
                                            <button className="p-2 bg-bg-secondary rounded-lg border border-border-subtle hover:bg-accent-primary hover:text-white transition-all"><MoreVertical size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponentes Locais ---
const FilterGroup = ({ label, children }: any) => (
    <div className="space-y-4">
        <h4 className="text-[9px] font-black uppercase text-text-tertiary tracking-widest border-b border-border-subtle pb-1">{label}</h4>
        <div className="flex flex-col gap-2">{children}</div>
    </div>
);

const FilterButton = ({ active, label, color, onClick }: any) => (
    <button onClick={onClick} className={`text-left px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-black text-white shadow-lg' : 'bg-bg-secondary/40 text-text-tertiary hover:bg-bg-secondary'}`}>
        <span className={color}>{label}</span>
    </button>
);

const DetailStat = ({ label, value, icon, color }: any) => (
    <div className="bg-bg-primary border border-border-subtle p-7 rounded-[40px] shadow-sm group hover:-translate-y-1 transition-all">
        <div className={`p-4 rounded-2xl bg-bg-secondary border border-border-subtle w-fit mb-6 ${color}`}>{React.cloneElement(icon as React.ReactElement, { size: 24 })}</div>
        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-text-primary tracking-tighter">{value}</h3>
    </div>
);

const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-4 border-b border-border-subtle/50 text-[10px] uppercase font-black tracking-widest">
        <span className="text-text-tertiary">{label}</span>
        <span className="text-text-primary">{value || 'N/A'}</span>
    </div>
);

export default UserManagement;

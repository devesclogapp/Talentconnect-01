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
    Gavel
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [userStats, setUserStats] = useState({ orders: 0, disputes: 0, revenue: 0 });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async (userId: string) => {
        try {
            // Conta pedidos vinculados (como cliente ou prestador)
            const { count: orderCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .or(`client_id.eq.${userId},provider_id.eq.${userId}`);

            // Conta disputas abertas/envolvidas
            // Nota: disputas estão vinculadas a pedidos
            const { data: userOrders } = await supabase
                .from('orders')
                .select('id')
                .or(`client_id.eq.${userId},provider_id.eq.${userId}`);

            const orderIds = (userOrders as any[])?.map(o => o.id) || [];
            let disputeCount = 0;
            if (orderIds.length > 0) {
                const { count } = await supabase
                    .from('disputes')
                    .select('*', { count: 'exact', head: true })
                    .in('order_id', orderIds);
                disputeCount = count || 0;
            }

            // Calcula receita (se for prestador) ou gastos (se for cliente)
            const { data: payments } = await supabase
                .from('payments')
                .select('amount_total, provider_amount')
                .in('order_id', orderIds)
                .eq('escrow_status', 'released');

            const totalRevenue = (payments as any[])?.reduce((acc, p) => acc + (p.amount_total || 0), 0) || 0;

            setUserStats({
                orders: orderCount || 0,
                disputes: disputeCount,
                revenue: totalRevenue
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
            setUserStats({ orders: 0, disputes: 0, revenue: 0 });
        }
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setActiveTab('summary');
        fetchUserStats(user.id);
    };

    const updateUserStatus = async (userId: string, updates: any) => {
        try {
            setIsUpdating(true);
            const { error } = await (supabase as any)
                .from('users')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, ...updates });
            }
            alert('Usuário atualizado com sucesso!');
        } catch (error: any) {
            alert('Erro ao atualizar: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Nome', 'Email', 'Papel', 'KYC', 'Status', 'Risco', 'Criado em'];
        const rows = filteredUsers.map(u => [
            u.id,
            u.name || u.user_metadata?.name || '',
            u.email || '',
            u.role || u.user_metadata?.role || 'client',
            u.kyc_status || 'pending',
            u.status || 'active',
            u.risk_score || 0,
            u.created_at
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredUsers = users.filter(user => {
        const name = (user.name || user.user_metadata?.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const matchesSearch = email.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || (user.role || user.user_metadata?.role || 'client').toLowerCase() === filterRole.toLowerCase();
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6 animate-fade-in relative pb-12">
            {/* User Details Slide-over/Panel */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="bg-bg-primary h-full w-full max-w-4xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">
                        {/* Detail Header */}
                        <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-secondary/30">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-2xl font-black text-accent-primary border border-accent-primary/20`}>
                                    {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-full h-full object-cover" /> : (selectedUser.name || 'U').charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">{selectedUser.name || 'Sem nome'}</h2>
                                    <p className="text-xs text-text-tertiary flex items-center gap-1.5 font-medium">
                                        <Mail size={12} /> {selectedUser.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateUserStatus(selectedUser.id, { status: selectedUser.status === 'blocked' ? 'active' : 'blocked' })}
                                    className={`p-3 rounded-xl border transition-all ${selectedUser.status === 'blocked' ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}
                                >
                                    {selectedUser.status === 'blocked' ? <Unlock size={20} /> : <Ban size={20} />}
                                </button>
                                <button onClick={() => setSelectedUser(null)} className="p-3 bg-bg-secondary hover:bg-bg-tertiary rounded-xl transition-colors border border-border-subtle">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex px-8 bg-bg-secondary/10 border-b border-border-subtle">
                            {['summary', 'orders', 'financial', 'disputes', 'logs'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'
                                        }`}
                                >
                                    {tab === 'summary' ? 'Resumo' :
                                        tab === 'orders' ? 'Pedidos' :
                                            tab === 'financial' ? 'Financeiro' :
                                                tab === 'disputes' ? 'Disputas' : 'Logs/Auditoria'}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {activeTab === 'summary' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <DetailStat label="Total Pedidos" value={userStats.orders} icon={<BriefcaseIcon size={16} />} color="text-blue-500" />
                                        <DetailStat label="Disputas" value={userStats.disputes} icon={<MessageCircle size={16} />} color="text-error" />
                                        <DetailStat label="Volume Financeiro" value={`R$ ${userStats.revenue}`} icon={<DollarSign size={16} />} color="text-success" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Status and Risk */}
                                        <div className="bg-bg-secondary/20 border border-border-subtle rounded-[32px] p-6 space-y-6">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Governança & Risco</h4>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-text-primary">Score de Risco</span>
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${selectedUser.risk_level === 'high' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                                        {selectedUser.risk_score || 0}% - {selectedUser.risk_level || 'low'}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden">
                                                    <div className={`h-full ${selectedUser.risk_level === 'high' ? 'bg-error' : 'bg-success'}`} style={{ width: `${selectedUser.risk_score || 5}%` }}></div>
                                                </div>

                                                <div className="pt-4 flex flex-col gap-2">
                                                    <button
                                                        onClick={() => updateUserStatus(selectedUser.id, { kyc_status: 'approved' })}
                                                        disabled={selectedUser.kyc_status === 'approved'}
                                                        className="w-full py-3 bg-success/10 text-success border border-success/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-success/20 transition-all disabled:opacity-30"
                                                    >
                                                        Aprovar KYC Manualmente
                                                    </button>
                                                    <button
                                                        onClick={() => updateUserStatus(selectedUser.id, { kyc_status: 'rejected' })}
                                                        disabled={selectedUser.kyc_status === 'rejected'}
                                                        className="w-full py-3 bg-error/10 text-error border border-error/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-error/20 transition-all disabled:opacity-30"
                                                    >
                                                        Rejeitar KYC / Solicitar Novos
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Basic Info */}
                                        <div className="bg-bg-secondary/20 border border-border-subtle rounded-[32px] p-6 space-y-6">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Informações Básicas</h4>
                                            <div className="space-y-4">
                                                <InfoRow label="Tipo de Conta" value={selectedUser.role || 'Client'} />
                                                <InfoRow label="Status" value={selectedUser.status || 'Active'} />
                                                <InfoRow label="Membro desde" value={new Date(selectedUser.created_at).toLocaleDateString('pt-BR')} />
                                                <InfoRow label="Último Acesso" value={selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleDateString('pt-BR') : 'Sem registro'} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'summary' && (
                                <div className="py-20 text-center opacity-40">
                                    <History size={48} className="mx-auto mb-4" strokeWidth={1} />
                                    <p className="text-sm font-bold uppercase tracking-widest">Módulo em Integração</p>
                                    <p className="text-xs mt-2">Os dados desta aba estão sendo sincronizados e estarão disponíveis em breve.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="heading-xl text-text-primary">Gestão de Usuários</h1>
                    <p className="text-sm text-text-tertiary">Controle total de governança, KYC e risco operacional</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToCSV} className="px-6 py-2.5 bg-bg-secondary border border-border-subtle rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-bg-tertiary transition-all">
                        <Download size={18} /> Exportar CSV
                    </button>
                    <button className="px-6 py-2.5 bg-accent-primary text-white rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-glow-blue hover:scale-105 transition-all">
                        <UserCheck size={18} /> Adicionar Usuário
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-[32px] flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary/50 border border-border-subtle rounded-2xl pl-12 pr-4 py-3 text-xs outline-none focus:border-accent-primary transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="bg-bg-secondary border border-border-subtle rounded-xl px-6 py-2 text-xs outline-none font-bold text-text-primary"
                    >
                        <option value="all">Filtro: Todos os Papéis</option>
                        <option value="client">Clientes</option>
                        <option value="provider">Prestadores</option>
                        <option value="operator">Operadores</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-bg-primary border border-border-subtle rounded-[32px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-secondary/30 border-b border-border-subtle">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Identidade</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Role/Conta</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-center">KYC / Risco</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-text-tertiary flex flex-col items-center gap-4">
                                        <Clock className="animate-spin mx-auto" size={32} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando Usuários...</span>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-text-tertiary">
                                        <Slash size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-bold">Nenhum usuário encontrado para os filtros atuais.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-bg-secondary/20 transition-all group cursor-pointer" onClick={() => handleSelectUser(user)}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-accent-primary/5 flex items-center justify-center text-accent-primary font-black text-xs border border-accent-primary/10 overflow-hidden group-hover:scale-110 transition-transform">
                                                    {user.avatar_url || user.user_metadata?.avatar_url ? (
                                                        <img src={user.avatar_url || user.user_metadata?.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (user.name || user.user_metadata?.name || 'U').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-text-primary uppercase tracking-tight">{user.name || user.user_metadata?.name || 'Sem nome'}</p>
                                                    <p className="text-[10px] text-text-tertiary font-mono">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${(user.role || user.user_metadata?.role) === 'provider' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                (user.role || user.user_metadata?.role) === 'operator' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                                                    'bg-bg-tertiary border-border-subtle text-text-tertiary'
                                                }`}>
                                                {user.role || user.user_metadata?.role || 'client'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.kyc_status === 'approved' ? 'bg-success' : user.kyc_status === 'rejected' ? 'bg-error' : 'bg-warning'}`}></div>
                                                    <span className="text-[9px] font-black uppercase text-text-secondary">{user.kyc_status || 'Pendente'}</span>
                                                </div>
                                                <div className="w-16 h-1 bg-bg-secondary rounded-full overflow-hidden">
                                                    <div className={`h-full ${user.risk_level === 'high' ? 'bg-error' : 'bg-success'}`} style={{ width: `${user.risk_score || 5}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${user.status === 'blocked' ? 'text-error' : 'text-success'}`}>
                                                {user.status === 'blocked' ? 'Bloqueado' : 'Ativo'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2.5 bg-bg-secondary hover:bg-accent-primary hover:text-white rounded-xl transition-all shadow-sm">
                                                <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DetailStat = ({ label, value, icon, color }: any) => (
    <div className="bg-bg-primary border border-border-subtle p-5 rounded-[28px] shadow-sm">
        <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg bg-bg-secondary ${color}`}>
                {icon}
            </div>
            <span className="text-[9px] font-black uppercase text-text-tertiary tracking-widest">{label}</span>
        </div>
        <h4 className="text-xl font-black text-text-primary">{value}</h4>
    </div>
);

const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-border-subtle/50 text-xs">
        <span className="text-text-tertiary font-bold uppercase tracking-widest">{label}</span>
        <span className="text-text-primary font-bold">{value}</span>
    </div>
);

export default UserManagement;

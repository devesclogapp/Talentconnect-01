import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    User,
    Mail,
    Clock,
    Activity,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Lock,
    Unlock,
    ChevronRight,
    RefreshCw,
    FileText,
    TrendingUp,
    Star,
    X,
    ArrowUp,
    ArrowDown,
    Eye
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';

const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from('audit_logs').insert({
            action,
            entity_type: entityType,
            entity_id: entityId,
            actor_user_id: user?.id,
            payload_json: { details, reason, origin: 'ERP UserManagement' }
        });
    } catch (err) { console.error("Audit log failed:", err); }
};

const calculateUserRisk = (user: any) => {
    let score = 5;
    if (user.kyc_status === 'rejected') score += 50;
    if (user.kyc_status === 'pending' || user.kyc_status === 'none') score += 10;
    if (user.openDisputes > 0) score += user.openDisputes * 20;
    if (user.cancelledOrders > 2) score += 15;
    return Math.min(score, 100);
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterRisk, setFilterRisk] = useState('all');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [dossierTab, setDossierTab] = useState('profile');
    const [actionModal, setActionModal] = useState<{ type: string; user: any } | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [sortField, setSortField] = useState<'risk' | 'created' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('users').select('*');
            if (error) throw error;

            const allOrdersRes = await supabase.from('orders').select('id, client_id, provider_id, status');
            const allDisputesRes = await supabase.from('disputes').select('id, order_id, status');
            let allRatingsRes: { data: any[] | null } = { data: null };
            try { allRatingsRes = await supabase.from('ratings').select('provider_id, score') as any; } catch (_) { /* ratings table may not exist */ }
            const profilesRes = await supabase.from('provider_profiles').select('user_id, documents_status, bio');

            const allOrders = (allOrdersRes.data || []) as any[];
            const allDisputes = (allDisputesRes.data || []) as any[];
            const allRatings = (allRatingsRes.data || []) as any[];
            const allProfiles = (profilesRes.data || []) as any[];

            const enriched = (data || []).map((u: any) => {
                const clientOrders = allOrders.filter(o => o.client_id === u.id);
                const providerOrders = allOrders.filter(o => o.provider_id === u.id);
                const clientOrderIds = clientOrders.map(o => o.id);
                const providerOrderIds = providerOrders.map(o => o.id);

                const openDisputes = allDisputes.filter(d => clientOrderIds.includes(d.order_id) && d.status === 'open').length;
                const cancelledOrders = clientOrders.filter(o => o.status === 'cancelled').length;
                const completedOrders = clientOrders.filter(o => o.status === 'completed').length + providerOrders.filter(o => o.status === 'completed').length;

                const userRatings = allRatings.filter(r => r.provider_id === u.id);
                const avgRating = userRatings.length > 0 ? userRatings.reduce((s: number, r: any) => s + (r.score || 0), 0) / userRatings.length : null;

                const profile = allProfiles.find(p => p.user_id === u.id);

                const riskData = { ...u, openDisputes, cancelledOrders };
                const riskScore = calculateUserRisk(riskData);

                return {
                    ...u,
                    openDisputes,
                    cancelledOrders,
                    completedOrders,
                    totalClientOrders: clientOrders.length,
                    totalProviderOrders: providerOrders.length,
                    avgRating,
                    profile,
                    riskScore,
                    riskLevel: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low'
                };
            });

            setUsers(enriched);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const performAction = async () => {
        if (!actionModal || !actionReason || isProcessing) return;
        setIsProcessing(true);
        try {
            const { type, user } = actionModal;
            const updates: any = {};
            if (type === 'BLOCK') updates.active = false;
            if (type === 'ACTIVATE') updates.active = true;
            if (type === 'KYC_APPROVE') updates.kyc_status = 'approved';
            if (type === 'KYC_REJECT') updates.kyc_status = 'rejected';

            await (supabase as any).from('users').update(updates).eq('id', user.id);
            await logAdminAction(`GOVERNANCE_${type}`, 'USER', user.id, `Ação de governança: ${type}`, actionReason);

            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates } : u));
            if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, ...updates });

            alert('Ação aplicada com sucesso.');
            setActionModal(null);
            setActionReason('');
        } catch (err: any) {
            alert('Erro: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleSort = (field: 'risk' | 'created') => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const filteredUsers = users
        .filter(u => {
            const name = resolveUserName(u).toLowerCase();
            const email = (u.email || '').toLowerCase();
            const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === 'all' || u.role === filterRole;
            const matchesRisk = filterRisk === 'all' || u.riskLevel === filterRisk;
            return matchesSearch && matchesRole && matchesRisk;
        })
        .sort((a, b) => {
            if (!sortField) return 0;
            if (sortField === 'risk') return sortDir === 'desc' ? b.riskScore - a.riskScore : a.riskScore - b.riskScore;
            if (sortField === 'created') return sortDir === 'desc'
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return 0;
        });

    const getRoleStyle = (role: string) => {
        if (role === 'provider') return 'bg-accent-primary/10 text-accent-primary';
        if (role === 'operator') return 'bg-info/10 text-info';
        return 'bg-bg-secondary text-text-tertiary';
    };

    const getKycStyle = (status: string) => {
        if (status === 'approved') return 'bg-success/10 text-success';
        if (status === 'rejected') return 'bg-error/10 text-error';
        if (status === 'submitted') return 'bg-warning/10 text-warning';
        return 'bg-bg-secondary text-text-tertiary';
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

    return (
        <div className="space-y-6 animate-fade-in pb-12">

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div
                        className="w-full max-w-md overflow-hidden animate-in zoom-in-95"
                        style={{
                            background: 'var(--bg-primary)',
                            borderRadius: '14px',
                            border: '1px solid rgba(0,0,0,0.06)',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.15)'
                        }}
                    >
                        <div className="p-7 border-b border-border-subtle" style={{ background: 'var(--bg-secondary)' }}>
                            <h2 className="text-[18px] font-semibold text-text-primary">Intervenção de Usuário</h2>
                            <p className="text-xs text-text-tertiary mt-1">Usuário: <strong>{resolveUserName(actionModal.user)}</strong></p>
                        </div>
                        <div className="p-7 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Justificativa (Auditoria)</label>
                                <textarea
                                    value={actionReason}
                                    onChange={e => setActionReason(e.target.value)}
                                    className="w-full h-28 rounded-[8px] p-4 text-xs outline-none focus:border-accent-primary transition-all resize-none"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)', color: 'var(--text-primary)' }}
                                    placeholder="Descreva o motivo para auditoria..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setActionModal(null)}
                                    className="flex-1 py-3 rounded-[8px] text-[10px] font-semibold uppercase text-text-primary transition-all hover:bg-bg-tertiary"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)' }}
                                >Cancelar</button>
                                <button
                                    disabled={!actionReason || isProcessing}
                                    onClick={performAction}
                                    className="flex-1 py-3 rounded-[8px] text-[10px] font-semibold uppercase text-white transition-all hover:opacity-90 disabled:opacity-30"
                                    style={{ background: actionModal.type === 'BLOCK' || actionModal.type === 'KYC_REJECT' ? 'var(--error)' : 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                                >
                                    {isProcessing ? 'Processando...' : 'Confirmar & Logar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Dossier Slide-over */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div
                        className="h-full w-full max-w-4xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col"
                        style={{ background: 'var(--bg-primary)' }}
                    >
                        <div className="p-6 border-b border-border-subtle flex items-center justify-between" style={{ background: 'var(--bg-secondary)' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[8px] bg-accent-primary text-white flex items-center justify-center font-semibold text-base">
                                    {resolveUserName(selectedUser).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-text-primary">{resolveUserName(selectedUser)}</h2>
                                    <p className="text-[10px] text-text-tertiary font-mono">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 rounded-[8px] hover:bg-bg-tertiary transition-colors border border-border-subtle"><X size={20} /></button>
                        </div>

                        <div className="flex px-6 border-b border-border-subtle overflow-x-auto" style={{ background: 'var(--bg-secondary)' }}>
                            {['profile', 'orders', 'risk', 'actions'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setDossierTab(tab)}
                                    className={`px-5 py-4 text-[10px] font-semibold uppercase tracking-widest border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                                >
                                    {tab === 'profile' ? 'Perfil' : tab === 'orders' ? 'Pedidos' : tab === 'risk' ? 'Risco & KYC' : 'Ações Admin'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            {dossierTab === 'profile' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <UserStat label="Pedidos Feitos" value={selectedUser.totalClientOrders} color="text-accent-primary" />
                                        <UserStat label="Serviços Prestados" value={selectedUser.totalProviderOrders} color="text-success" />
                                        <UserStat label="Disputas Abertas" value={selectedUser.openDisputes} color={selectedUser.openDisputes > 0 ? "text-error" : "text-text-tertiary"} />
                                        <UserStat label="Avaliação Média" value={selectedUser.avgRating ? `${selectedUser.avgRating.toFixed(1)} ★` : '—'} color="text-warning" />
                                    </div>
                                    <div
                                        className="p-6 space-y-3"
                                        style={{ background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}
                                    >
                                        <InfoRow label="E-mail" value={selectedUser.email} />
                                        <InfoRow label="Função" value={selectedUser.role} />
                                        <InfoRow label="KYC Status" value={selectedUser.kyc_status || 'Não iniciado'} />
                                        <InfoRow label="Conta criada em" value={formatDate(selectedUser.created_at)} />
                                        <InfoRow label="ID do Usuário" value={selectedUser.id?.slice(0, 16) + '...'} />
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'risk' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <div
                                        className="p-6 flex items-center justify-between"
                                        style={{ background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}
                                    >
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase text-text-tertiary tracking-widest mb-1">Score de Risco</p>
                                            <h3 className={`text-4xl font-semibold leading-none ${selectedUser.riskLevel === 'high' ? 'text-error' : selectedUser.riskLevel === 'medium' ? 'text-warning' : 'text-success'}`}>
                                                {selectedUser.riskScore}
                                                <span className="text-base text-text-tertiary font-medium ml-1">/100</span>
                                            </h3>
                                        </div>
                                        <span className={`px-4 py-2 rounded-[6px] text-[10px] font-semibold uppercase tracking-widest ${selectedUser.riskLevel === 'high' ? 'bg-error/10 text-error' : selectedUser.riskLevel === 'medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                                            {selectedUser.riskLevel === 'high' ? 'Alto Risco' : selectedUser.riskLevel === 'medium' ? 'Atenção' : 'Seguro'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'actions' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                    <h4 className="text-[10px] font-semibold uppercase text-text-tertiary tracking-widest">Painel de Intervenção Operacional</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <ActionCard icon={<Lock size={20} />} label="Bloquear Conta" desc="Suspende acesso imediato." color="text-error" onClick={() => setActionModal({ type: 'BLOCK', user: selectedUser })} />
                                        <ActionCard icon={<Unlock size={20} />} label="Reativar Conta" desc="Restaura acesso completo." color="text-success" onClick={() => setActionModal({ type: 'ACTIVATE', user: selectedUser })} />
                                        <ActionCard icon={<CheckCircle2 size={20} />} label="Aprovar KYC" desc="Valida documentos do profissional." color="text-accent-primary" onClick={() => setActionModal({ type: 'KYC_APPROVE', user: selectedUser })} />
                                        <ActionCard icon={<XCircle size={20} />} label="Recusar KYC" desc="Rejeita o processo de verificação." color="text-warning" onClick={() => setActionModal({ type: 'KYC_REJECT', user: selectedUser })} />
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'orders' && (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 animate-in fade-in">
                                    <Activity size={48} className="animate-pulse" />
                                    <p className="mt-4 text-sm font-semibold uppercase tracking-widest">Histórico de Pedidos em breve</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-semibold text-text-primary">Gestão de Usuários</h1>
                    <p className="text-[13px] text-text-secondary mt-0.5">KYC, risco, governança e controle de acesso</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="p-2.5 rounded-[8px] border border-border-subtle hover:rotate-180 transition-all duration-500"
                    style={{ background: 'var(--bg-secondary)' }}
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Total de Usuários" value={users.length} icon={<Users size={14} />} />
                <KpiCard label="Alto Risco" value={users.filter(u => u.riskLevel === 'high').length} icon={<ShieldAlert size={14} />} color="text-error" />
                <KpiCard label="KYC Pendente" value={users.filter(u => u.kyc_status === 'submitted').length} icon={<Clock size={14} />} color="text-warning" />
                <KpiCard label="KYC Aprovado" value={users.filter(u => u.kyc_status === 'approved').length} icon={<ShieldCheck size={14} />} color="text-success" />
            </div>

            {/* Toolbar */}
            <div
                className="flex flex-col md:flex-row gap-3 p-4"
                style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '10px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, email ou ID..."
                        className="w-full h-10 rounded-[8px] pl-10 pr-4 text-sm outline-none focus:border-accent-primary transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)', color: 'var(--text-primary)' }}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { val: 'all', label: 'Todos' },
                        { val: 'client', label: 'Clientes' },
                        { val: 'provider', label: 'Profissionais' }
                    ].map(opt => (
                        <button
                            key={opt.val}
                            onClick={() => setFilterRole(opt.val)}
                            className="h-10 px-4 rounded-[8px] text-[10px] font-semibold uppercase tracking-widest transition-all duration-[120ms]"
                            style={filterRole === opt.val
                                ? { background: 'var(--text-primary)', color: '#FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                                : { background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: '1px solid rgba(0,0,0,0.06)' }
                            }
                        >{opt.label}</button>
                    ))}
                    <select
                        value={filterRisk}
                        onChange={e => setFilterRisk(e.target.value)}
                        className="h-10 px-4 rounded-[8px] text-[10px] font-semibold uppercase outline-none transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)', color: 'var(--text-tertiary)' }}
                    >
                        <option value="all">Todos os Riscos</option>
                        <option value="high">Alto Risco</option>
                        <option value="medium">Atenção</option>
                        <option value="low">Seguros</option>
                    </select>
                </div>
            </div>

            {/* User Table */}
            <div
                style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '10px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    overflow: 'hidden'
                }}
            >
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border-subtle" style={{ background: 'var(--bg-secondary)' }}>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Usuário</th>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Papel / KYC</th>
                            <th
                                className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary cursor-pointer select-none hover:text-text-primary transition-colors"
                                onClick={() => toggleSort('risk')}
                            >
                                <span className="flex items-center gap-1.5">
                                    Risco {sortField === 'risk' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}
                                </span>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Pedidos</th>
                            <th
                                className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary cursor-pointer select-none hover:text-text-primary transition-colors"
                                onClick={() => toggleSort('created')}
                            >
                                <span className="flex items-center gap-1.5">
                                    Cadastro {sortField === 'created' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}
                                </span>
                            </th>
                            <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Dossiê</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {loading ? (
                            <tr><td colSpan={6} className="py-20 text-center">
                                <RefreshCw className="animate-spin mx-auto mb-3 text-accent-primary" size={24} />
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Sincronizando Usuários...</p>
                            </td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={6} className="py-20 text-center opacity-30">
                                <Users size={40} className="mx-auto mb-3" />
                                <p className="text-[10px] font-semibold uppercase tracking-widest">Nenhum usuário encontrado</p>
                            </td></tr>
                        ) : filteredUsers.map(u => (
                            <tr
                                key={u.id}
                                className="transition-all cursor-pointer"
                                onClick={() => setSelectedUser(u)}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-[6px] bg-accent-primary/10 text-accent-primary flex items-center justify-center font-semibold text-xs shrink-0">
                                            {resolveUserName(u).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-text-primary leading-tight">{resolveUserName(u)}</p>
                                            <p className="text-[10px] text-text-tertiary font-mono mt-0.5">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-semibold uppercase w-fit ${getRoleStyle(u.role)}`}>{u.role}</span>
                                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-semibold uppercase w-fit ${getKycStyle(u.kyc_status)}`}>{u.kyc_status || 'sem kyc'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-20 rounded-full bg-bg-tertiary overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${u.riskLevel === 'high' ? 'bg-error' : u.riskLevel === 'medium' ? 'bg-warning' : 'bg-success'}`}
                                                style={{ width: `${u.riskScore}%` }}
                                            />
                                        </div>
                                        <span className={`text-[10px] font-semibold ${u.riskLevel === 'high' ? 'text-error' : u.riskLevel === 'medium' ? 'text-warning' : 'text-success'}`}>{u.riskScore}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium text-text-primary">{u.totalClientOrders + u.totalProviderOrders}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] text-text-tertiary font-mono">{formatDate(u.created_at)}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        className="p-2 rounded-[6px] border border-border-subtle hover:bg-text-primary hover:text-white hover:border-transparent transition-all duration-[120ms]"
                                        style={{ background: 'var(--bg-secondary)' }}
                                    >
                                        <Eye size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Sub-components ---
const KpiCard = ({ label, value, icon, color }: any) => (
    <div
        className="p-5"
        style={{
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
    >
        <div className={`p-2 rounded-[6px] bg-bg-secondary border border-border-subtle w-fit mb-4 ${color || 'text-text-secondary'}`}>{icon}</div>
        <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-xl font-semibold leading-none ${color || 'text-text-primary'}`}>{value}</h3>
    </div>
);

const UserStat = ({ label, value, color }: any) => (
    <div
        className="p-5"
        style={{
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
    >
        <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-xl font-semibold leading-none ${color}`}>{value}</h3>
    </div>
);

const ActionCard = ({ icon, label, desc, color, onClick }: any) => (
    <button
        onClick={onClick}
        className={`p-5 text-left rounded-[10px] border border-border-subtle hover:shadow-md transition-all duration-[120ms] group ${color}`}
        style={{ background: 'var(--bg-secondary)' }}
    >
        <div className="transition-transform group-hover:scale-110 mb-4 w-fit">{icon}</div>
        <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
        <p className="text-[10px] text-text-tertiary leading-relaxed">{desc}</p>
    </button>
);

const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border-subtle last:border-0">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest">{label}</span>
        <span className="text-xs font-medium text-text-primary font-mono">{value || '—'}</span>
    </div>
);

const getRoleStyle = (role: string) => {
    if (role === 'provider') return 'bg-accent-primary/10 text-accent-primary';
    if (role === 'operator') return 'bg-info/10 text-info';
    return 'bg-bg-secondary text-text-tertiary border border-border-subtle';
};

const getKycStyle = (status: string) => {
    if (status === 'approved') return 'bg-success/10 text-success';
    if (status === 'rejected') return 'bg-error/10 text-error';
    if (status === 'submitted') return 'bg-warning/10 text-warning';
    return 'bg-bg-secondary text-text-tertiary border border-border-subtle';
};

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default UserManagement;

import React, { useState, useEffect } from 'react';
import {
    Users, Search, ShieldCheck, ShieldAlert, ShieldX,
    Clock, Activity, AlertTriangle, CheckCircle2, XCircle,
    Lock, Unlock, ChevronRight, RefreshCw, TrendingUp, Star, X,
    ArrowUp, ArrowDown, Eye
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import KpiCard from '../components/erp/KpiCard';
import StatusBadge from '../components/erp/StatusBadge';
import RiskBar from '../components/erp/RiskBar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from('audit_logs').insert({
            action, entity_type: entityType, entity_id: entityId,
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
            try { allRatingsRes = await supabase.from('ratings').select('provider_id, score') as any; } catch (_) { }
            const profilesRes = await supabase.from('provider_profiles').select('user_id, documents_status, bio, doc_front_path, doc_back_path, selfie_path');
            const allOrders = (allOrdersRes.data || []) as any[];
            const allDisputes = (allDisputesRes.data || []) as any[];
            const allRatings = (allRatingsRes.data || []) as any[];
            const allProfiles = (profilesRes.data || []) as any[];
            const enriched = (data || []).map((u: any) => {
                const clientOrders = allOrders.filter(o => o.client_id === u.id);
                const providerOrders = allOrders.filter(o => o.provider_id === u.id);
                const clientOrderIds = clientOrders.map(o => o.id);
                const openDisputes = allDisputes.filter(d => clientOrderIds.includes(d.order_id) && d.status === 'open').length;
                const cancelledOrders = clientOrders.filter(o => o.status === 'cancelled').length;
                const completedOrders = clientOrders.filter(o => o.status === 'completed').length + providerOrders.filter(o => o.status === 'completed').length;
                const userRatings = allRatings.filter(r => r.provider_id === u.id);
                const avgRating = userRatings.length > 0 ? userRatings.reduce((s: number, r: any) => s + (r.score || 0), 0) / userRatings.length : null;
                const profile = allProfiles.find(p => p.user_id === u.id);
                let kycStatus = profile?.documents_status || u.kyc_status || 'pending';

                // Robustness: If files exist but status is still pending, it means it's submitted for analysis
                if (kycStatus === 'pending' && profile?.doc_front_path) {
                    kycStatus = 'submitted';
                }

                const riskData = { ...u, openDisputes, cancelledOrders, kyc_status: kycStatus };
                const riskScore = calculateUserRisk(riskData);
                return {
                    ...u, openDisputes, cancelledOrders, completedOrders,
                    totalClientOrders: clientOrders.length, totalProviderOrders: providerOrders.length,
                    avgRating, profile, riskScore, kyc_status: kycStatus,
                    riskLevel: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low'
                };
            });
            setUsers(enriched);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const performAction = async () => {
        if (!actionModal || !actionReason || isProcessing) return;
        setIsProcessing(true);
        try {
            const { type, user } = actionModal;
            const updates: any = {};
            if (type === 'BLOCK') updates.active = false;
            if (type === 'ACTIVATE') updates.active = true;
            if (type === 'KYC_APPROVE') {
                updates.kyc_status = 'approved';
                await supabase.from('provider_profiles').update({ documents_status: 'approved' }).eq('user_id', user.id);
            }
            if (type === 'KYC_REJECT') {
                updates.kyc_status = 'rejected';
                await supabase.from('provider_profiles').update({ documents_status: 'rejected' }).eq('user_id', user.id);
            }
            try {
                // Try update users table as well (governance)
                await (supabase as any).from('users').update(updates).eq('id', user.id);
            } catch (userErr) {
                console.warn("Could not update users table, but profile was updated:", userErr);
            }
            await logAdminAction(`GOVERNANCE_${type}`, 'USER', user.id, `Ação de governança: ${type}`, actionReason);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates } : u));
            if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, ...updates });
            toast.success('Ação aplicada com sucesso e registrada em auditoria.');
            setActionModal(null); setActionReason('');
        } catch (err: any) { toast.error('Erro: ' + err.message); }
        finally { setIsProcessing(false); }
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

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

    return (
        <div className="space-y-5 pb-12">

            {/* ── AlertDialog — Confirmação de Ação ── */}
            <AlertDialog open={!!actionModal} onOpenChange={(open) => { if (!open) { setActionModal(null); setActionReason(''); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Intervenção de Usuário</AlertDialogTitle>
                        <AlertDialogDescription>
                            Usuário: <strong>{actionModal && resolveUserName(actionModal.user)}</strong>. Esta ação será registrada em auditoria.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Justificativa (Auditoria)</label>
                        <textarea
                            value={actionReason} onChange={e => setActionReason(e.target.value)}
                            className="w-full h-24 rounded-lg p-3 text-xs outline-none bg-background border border-border text-foreground focus:border-primary transition-all resize-none"
                            placeholder="Descreva o motivo para auditoria..."
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setActionModal(null); setActionReason(''); }}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={!actionReason || isProcessing}
                            onClick={performAction}
                            className={actionModal?.type === 'BLOCK' || actionModal?.type === 'KYC_REJECT' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
                        >
                            {isProcessing ? (
                                <span className="relative inline-block">
                                    Processando
                                    <span className="absolute left-full ml-1 top-0">...</span>
                                </span>
                            ) : 'Confirmar & Logar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Sheet — Dossier de Usuário ── */}
            <Sheet open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
                <SheetContent side="right" className="w-full max-w-xl p-0 flex flex-col gap-0 overflow-hidden">
                    {selectedUser && (
                        <>
                            <SheetHeader className="px-5 py-4 border-b border-border bg-card flex-row items-center gap-3 space-y-0">
                                <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                                    {resolveUserName(selectedUser).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <SheetTitle className="text-sm font-semibold text-foreground leading-tight">{resolveUserName(selectedUser)}</SheetTitle>
                                    <p className="text-[10px] text-muted-foreground font-mono truncate">{selectedUser.email}</p>
                                </div>
                            </SheetHeader>

                            <div className="flex px-5 border-b border-border bg-card">
                                {['profile', 'orders', 'risk', 'actions'].map(tab => (
                                    <button key={tab} onClick={() => setDossierTab(tab)}
                                        className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-widest border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                                        {tab === 'profile' ? 'Perfil' : tab === 'orders' ? 'Pedidos' : tab === 'risk' ? 'Risco & KYC' : 'Ações Admin'}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {dossierTab === 'profile' && (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: 'Pedidos Feitos', value: selectedUser.totalClientOrders, color: 'text-primary' },
                                                { label: 'Serviços Prestados', value: selectedUser.totalProviderOrders, color: 'text-green-600 dark:text-green-400' },
                                                { label: 'Disputas Abertas', value: selectedUser.openDisputes, color: selectedUser.openDisputes > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground' },
                                                { label: 'Avaliação Média', value: selectedUser.avgRating ? `${selectedUser.avgRating.toFixed(1)} ★` : '—', color: 'text-yellow-500' },
                                            ].map(s => (
                                                <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                                                    <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                                            {[
                                                { label: 'E-mail', value: selectedUser.email },
                                                { label: 'Função', value: selectedUser.role },
                                                { label: 'KYC Status', value: selectedUser.kyc_status || 'Não iniciado' },
                                                { label: 'Conta criada', value: formatDate(selectedUser.created_at) },
                                                { label: 'ID', value: selectedUser.id?.slice(0, 16) + '...' },
                                            ].map(row => (
                                                <div key={row.label} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0">
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{row.label}</span>
                                                    <span className="text-xs font-medium text-foreground font-mono">{row.value || '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {dossierTab === 'risk' && (
                                    <div className="space-y-6">
                                        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Score de Risco</p>
                                                <h3 className={`text-4xl font-semibold leading-none ${selectedUser.riskLevel === 'high' ? 'text-red-500' : selectedUser.riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                                                    {selectedUser.riskScore}<span className="text-base text-muted-foreground font-medium ml-1">/100</span>
                                                </h3>
                                            </div>
                                            <StatusBadge status={selectedUser.riskLevel === 'high' ? 'open' : selectedUser.riskLevel === 'medium' ? 'in_review' : 'resolved'} size="md" />
                                        </div>

                                        {/* KYC Documents Section */}
                                        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Documentação KYC</p>
                                                <StatusBadge status={selectedUser.kyc_status || 'pending'} size="sm" />
                                            </div>

                                            {selectedUser.profile?.doc_front_path ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Frente do Documento</p>
                                                        <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center relative group">
                                                            <img
                                                                src={supabase.storage.from('documents').getPublicUrl(selectedUser.profile.doc_front_path).data.publicUrl}
                                                                className="w-full h-full object-contain cursor-zoom-in transition-transform group-hover:scale-105"
                                                                onClick={() => window.open(supabase.storage.from('documents').getPublicUrl(selectedUser.profile.doc_front_path).data.publicUrl, '_blank')}
                                                            />
                                                        </div>
                                                    </div>

                                                    {selectedUser.profile.doc_back_path && (
                                                        <div>
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Verso do Documento</p>
                                                            <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center relative group">
                                                                <img
                                                                    src={supabase.storage.from('documents').getPublicUrl(selectedUser.profile.doc_back_path).data.publicUrl}
                                                                    className="w-full h-full object-contain cursor-zoom-in transition-transform group-hover:scale-105"
                                                                    onClick={() => window.open(supabase.storage.from('documents').getPublicUrl(selectedUser.profile.doc_back_path).data.publicUrl, '_blank')}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedUser.profile.selfie_path && (
                                                        <div>
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Selfie de Verificação</p>
                                                            <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center relative group">
                                                                <img
                                                                    src={supabase.storage.from('documents').getPublicUrl(selectedUser.profile.selfie_path).data.publicUrl}
                                                                    className="w-full h-full object-cover cursor-zoom-in transition-transform group-hover:scale-105"
                                                                    onClick={() => window.open(supabase.storage.from('documents').getPublicUrl(selectedUser.profile.selfie_path).data.publicUrl, '_blank')}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-10 text-center bg-muted/30 rounded-lg border border-dashed border-border">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Nenhum documento enviado</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {dossierTab === 'actions' && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">Painel de Intervenção Operacional</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { icon: <Lock size={18} />, label: 'Bloquear Conta', desc: 'Suspende acesso imediato.', type: 'BLOCK', color: 'text-red-600 dark:text-red-400 hover:bg-red-500/10' },
                                                { icon: <Unlock size={18} />, label: 'Reativar Conta', desc: 'Restaura acesso completo.', type: 'ACTIVATE', color: 'text-green-600 dark:text-green-400 hover:bg-green-500/10' },
                                                { icon: <CheckCircle2 size={18} />, label: 'Aprovar KYC', desc: 'Valida documentos.', type: 'KYC_APPROVE', color: 'text-primary hover:bg-primary/10' },
                                                { icon: <XCircle size={18} />, label: 'Recusar KYC', desc: 'Rejeita verificação.', type: 'KYC_REJECT', color: 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10' },
                                            ].map(a => (
                                                <button key={a.type} onClick={() => setActionModal({ type: a.type, user: selectedUser })}
                                                    className={`p-4 text-left bg-card border border-border rounded-xl transition-all group ${a.color}`}>
                                                    <div className="mb-3 transition-transform group-hover:scale-110">{a.icon}</div>
                                                    <p className="text-xs font-semibold text-foreground mb-1">{a.label}</p>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{a.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {dossierTab === 'orders' && (
                                    <div className="h-48 flex flex-col items-center justify-center text-muted-foreground opacity-40">
                                        <Activity size={40} className="mb-3 animate-pulse" />
                                        <p className="text-xs font-semibold uppercase tracking-widest">Histórico em breve</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Gestão de Usuários</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">KYC, risco, governança e controle de acesso</p>
                </div>
                <button onClick={fetchUsers}
                    className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:rotate-180 transition-all duration-500">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* ── Loading — Skeleton ── */}
            {loading ? (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
                                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-2.5 w-48" />
                                </div>
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* ── KPI Strip ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KpiCard label="Total de Usuários" value={users.length} icon={<Users size={16} />} />
                        <KpiCard label="Alto Risco" value={users.filter(u => u.riskLevel === 'high').length}
                            icon={<ShieldAlert size={16} />} color="text-red-600 dark:text-red-400" bg="bg-red-500/10" />
                        <KpiCard label="KYC Pendente" value={users.filter(u => u.kyc_status === 'submitted').length}
                            icon={<Clock size={16} />} color="text-yellow-600 dark:text-yellow-400" bg="bg-yellow-500/10" />
                        <KpiCard label="KYC Aprovado" value={users.filter(u => u.kyc_status === 'approved').length}
                            icon={<ShieldCheck size={16} />} color="text-green-600 dark:text-green-400" bg="bg-green-500/10" />
                    </div>

                    {/* ── Toolbar ── */}
                    <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nome, email ou ID..."
                                className="w-full h-9 rounded-lg pl-9 pr-4 text-sm outline-none bg-background border border-border text-foreground focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            {[{ val: 'all', label: 'Todos' }, { val: 'client', label: 'Clientes' }, { val: 'provider', label: 'Profissionais' }].map(opt => (
                                <button key={opt.val} onClick={() => setFilterRole(opt.val)}
                                    className={`h-9 px-4 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all ${filterRole === opt.val ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground border border-border'}`}>
                                    {opt.label}
                                </button>
                            ))}
                            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                                className="h-9 px-3 rounded-lg text-[11px] font-semibold outline-none bg-muted border border-border text-muted-foreground cursor-pointer">
                                <option value="all">Todos os Riscos</option>
                                <option value="high">Alto Risco</option>
                                <option value="medium">Atenção</option>
                                <option value="low">Seguros</option>
                            </select>
                        </div>
                    </div>

                    {/* ── Users Table ── */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Usuário</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Papel / KYC</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('risk')}>
                                        <span className="flex items-center gap-1.5">Risco {sortField === 'risk' ? (sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />) : null}</span>
                                    </th>
                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pedidos</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('created')}>
                                        <span className="flex items-center gap-1.5">Cadastro {sortField === 'created' ? (sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />) : null}</span>
                                    </th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Dossier</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={6} className="py-16 text-center opacity-30">
                                        <Users size={36} className="mx-auto mb-3" />
                                        <p className="text-[10px] font-semibold uppercase tracking-widest">Nenhum usuário</p>
                                    </td></tr>
                                ) : filteredUsers.map(u => (
                                    <tr key={u.id}
                                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-all cursor-pointer"
                                        onClick={() => { setSelectedUser(u); setDossierTab('profile'); }}>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                                                    {resolveUserName(u).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground leading-tight">{resolveUserName(u)}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col gap-1">
                                                <StatusBadge status={u.role} />
                                                <StatusBadge status={u.kyc_status || 'pending'} />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5"><RiskBar score={u.riskScore} /></td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-medium text-foreground tabular-nums">{u.totalClientOrders + u.totalProviderOrders}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-[10px] text-muted-foreground font-mono">{formatDate(u.created_at)}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button className="p-1.5 rounded-lg border border-border hover:bg-foreground hover:text-background hover:border-transparent transition-all">
                                                <Eye size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserManagement;

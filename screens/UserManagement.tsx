import React, { useState, useEffect } from 'react';
import {
    Users, Search, ShieldCheck, ShieldAlert, ShieldX,
    Clock, Activity, AlertTriangle, CheckCircle2, XCircle,
    Lock, Unlock, ChevronRight, RefreshCw, TrendingUp, Star, X,
    ArrowUp, ArrowDown, Eye, Briefcase, Zap, Scale, ArrowRight
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
                await (supabase.from('provider_profiles') as any).update({
                    documents_status: 'approved',
                    kyc_notes: 'Documentação validada por auditoria admin.'
                }).eq('user_id', user.id);
            }
            if (type === 'KYC_REJECT') {
                updates.kyc_status = 'rejected';
                await (supabase.from('provider_profiles') as any).update({
                    documents_status: 'rejected',
                    kyc_notes: actionReason || 'Documentação recusada por inconsistência nos dados.'
                }).eq('user_id', user.id);
            }
            try {
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
        <div className="space-y-6 pb-12 animate-fade-in">

            {/* ── AlertDialog ── */}
            <AlertDialog open={!!actionModal} onOpenChange={(open) => { if (!open) { setActionModal(null); setActionReason(''); } }}>
                <AlertDialogContent className="bg-folio-surface border border-folio-border rounded-[32px] p-8 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-black text-folio-text tracking-tight">Intervenção de Usuário</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-medium text-folio-text-dim/70 mt-2">
                            Ação crítica para o usuário: <strong className="text-folio-text">{actionModal && resolveUserName(actionModal.user)}</strong>. Justificativa obrigatória para auditoria.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3 py-6">
                        <label className="text-xs font-black text-folio-text-dim tracking-[3px] opacity-40">Motivo da Decisão</label>
                        <textarea
                            value={actionReason} onChange={e => setActionReason(e.target.value)}
                            className="w-full h-32 rounded-2xl p-4 text-sm outline-none bg-folio-bg border border-folio-border text-folio-text focus:border-folio-accent transition-all resize-none shadow-inner"
                            placeholder="Descreva as evidências consideradas..."
                        />
                    </div>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel onClick={() => { setActionModal(null); setActionReason(''); }} className="h-12 px-6 rounded-2xl border border-folio-border text-xs font-black tracking-widest text-folio-text-dim hover:bg-folio-bg transition-all">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={!actionReason || isProcessing}
                            onClick={performAction}
                            className={`h-12 px-8 rounded-2xl border-none text-xs font-black tracking-widest text-white shadow-glow transition-all active:scale-95 ${actionModal?.type === 'BLOCK' || actionModal?.type === 'KYC_REJECT' ? 'bg-[#E24B4A] hover:bg-[#CC2200]' : 'bg-folio-accent hover:opacity-90'}`}
                        >
                            {isProcessing ? 'Processando...' : 'Confirmar & registrar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Sheet — Dossier ── */}
            <Sheet open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
                <SheetContent side="right" className="w-full max-w-xl p-0 flex flex-col gap-0 overflow-hidden bg-folio-bg border-l border-folio-border shadow-2xl">
                    {selectedUser && (
                        <>
                            <SheetHeader className="px-8 py-6 border-b border-folio-border bg-folio-surface flex-row items-center gap-4 space-y-0">
                                <div className="w-14 h-14 rounded-2xl bg-folio-bg border border-folio-border text-folio-accent flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
                                    {resolveUserName(selectedUser).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <SheetTitle className="text-lg font-black text-folio-text tracking-tight leading-none">{resolveUserName(selectedUser)}</SheetTitle>
                                        <span className="px-2 py-0.5 rounded-md bg-folio-accent/10 border border-folio-accent/20 text-folio-accent text-xs font-black tracking-widest">{selectedUser.role}</span>
                                    </div>
                                    <p className="text-xs text-folio-text-dim/60 font-mono tracking-tight font-medium">{selectedUser.email}</p>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="w-10 h-10 rounded-xl bg-folio-bg border border-folio-border flex items-center justify-center text-folio-text-dim hover:text-folio-text transition-colors">
                                    <X size={18} />
                                </button>
                            </SheetHeader>

                            <div className="flex px-8 border-b border-folio-border bg-folio-surface gap-2">
                                {['profile', 'orders', 'risk', 'actions'].map(tab => (
                                    <button key={tab} onClick={() => setDossierTab(tab)}
                                        className={`px-4 py-4 text-xs font-black tracking-[2px] border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-folio-accent text-folio-accent' : 'border-transparent text-folio-text-dim hover:text-folio-text'}`}>
                                        {tab === 'profile' ? 'Perfil' : tab === 'orders' ? 'Pedidos' : tab === 'risk' ? 'Risco & KYC' : 'Ações'}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {dossierTab === 'profile' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { label: 'Pedidos Realizados', value: selectedUser.totalClientOrders, color: 'text-folio-accent', icon: <Briefcase size={12} /> },
                                                { label: 'Serviços Prestados', value: selectedUser.totalProviderOrders, color: 'text-[#1DB97A]', icon: <Zap size={12} /> },
                                                { label: 'Disputas Ativas', value: selectedUser.openDisputes, color: selectedUser.openDisputes > 0 ? 'text-[#E24B4A]' : 'text-folio-text-dim', icon: <Scale size={12} /> },
                                                { label: 'Score Avaliação', value: selectedUser.avgRating ? `${selectedUser.avgRating.toFixed(1)} ★` : '—', color: 'text-[#F5C842]', icon: <Star size={12} /> },
                                            ].map(s => (
                                                <div key={s.label} className="bg-folio-surface border border-folio-border rounded-[24px] p-5 shadow-sm group hover:shadow-glow-dim transition-all">
                                                    <div className="flex items-center gap-2 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <span className={s.color}>{s.icon}</span>
                                                        <p className="text-xs text-folio-text-dim font-black tracking-[2px]">{s.label}</p>
                                                    </div>
                                                    <p className={`text-2xl font-black tabular-nums tracking-tighter ${s.color}`}>{s.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-folio-surface border border-folio-border rounded-[28px] p-6 space-y-4 shadow-folio">
                                            <p className="text-xs font-black text-folio-text-dim/40 tracking-[3px] mb-2">Detalhes da Identidade</p>
                                            {[
                                                { label: 'E-mail Principal', value: selectedUser.email },
                                                { label: 'Perfil de Acesso', value: selectedUser.role },
                                                { label: 'Verificação KYC', value: selectedUser.kyc_status || 'Pendente' },
                                                { label: 'Membro desde', value: formatDate(selectedUser.created_at) },
                                                { label: 'Identificador Global', value: selectedUser.id },
                                            ].map(row => (
                                                <div key={row.label} className="flex flex-col gap-1 border-b border-folio-border last:border-0 pb-4 last:pb-0">
                                                    <span className="text-xs font-black text-folio-text-dim/50 tracking-[2px]">{row.label}</span>
                                                    <span className="text-xs font-bold text-folio-text font-mono truncate">{row.value || '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {dossierTab === 'risk' && (
                                    <div className="space-y-8">
                                        <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 flex items-center justify-between shadow-folio relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <ShieldAlert size={80} />
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-xs font-black text-folio-text-dim tracking-[3px] mb-2">Score de Risco Operacional</p>
                                                <h3 className={`text-6xl font-black leading-none tracking-tighter tabular-nums ${selectedUser.riskScore > 60 ? 'text-[#E24B4A]' : selectedUser.riskScore > 30 ? 'text-[#F5C842]' : 'text-[#1DB97A]'}`}>
                                                    {selectedUser.riskScore}<span className="text-xl text-folio-text-dim/30 font-black ml-2 tracking-tight">/100</span>
                                                </h3>
                                            </div>
                                            <div className="relative z-10">
                                                <div className={`px-4 py-2 rounded-xl font-black text-sm tracking-[2px] border ${selectedUser.riskLevel === 'high' ? 'bg-[#E24B4A]/10 border-[#E24B4A]/30 text-[#E24B4A]' : 'bg-[#1DB97A]/10 border-[#1DB97A]/30 text-[#1DB97A]'
                                                    }`}>
                                                    {selectedUser.riskLevel === 'high' ? 'Crítico' : 'Seguro'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 space-y-6 shadow-folio">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="text-folio-accent" size={20} />
                                                    <h4 className="text-sm font-black text-folio-text tracking-widest">Documentação Comprobatória</h4>
                                                </div>
                                                <div className={`px-3 py-1 rounded-lg border text-xs font-black tracking-widest ${selectedUser.kyc_status === 'approved' ? 'bg-success/10 border-success/20 text-success' :
                                                    selectedUser.kyc_status === 'submitted' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                        'bg-folio-bg border-folio-border text-folio-text-dim'
                                                    }`}>
                                                    {selectedUser.kyc_status}
                                                </div>
                                            </div>

                                            {selectedUser.profile?.doc_front_path ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <KycImageCard
                                                        title="Frente do Documento"
                                                        path={selectedUser.profile.doc_front_path}
                                                    />
                                                    {selectedUser.profile.doc_back_path && (
                                                        <KycImageCard
                                                            title="Verso do Documento"
                                                            path={selectedUser.profile.doc_back_path}
                                                        />
                                                    )}
                                                    <div className="md:col-span-2">
                                                        <KycImageCard
                                                            title="Selfie de Confirmação"
                                                            path={selectedUser.profile.selfie_path}
                                                            aspect="aspect-video"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-16 text-center bg-folio-bg/50 rounded-[28px] border-2 border-dashed border-folio-border">
                                                    <p className="text-xs font-black text-folio-text-dim tracking-[3px] opacity-40">Aguardando envio de documentação</p>
                                                    <p className="text-xs text-folio-text-dim/60 mt-2 font-medium">Nenhum arquivo localizado no storage para este perfil.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {dossierTab === 'actions' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Lock className="text-[#E24B4A]" size={20} />
                                            <h4 className="text-sm font-black text-folio-text tracking-widest">Controles de Governança</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { icon: <Lock size={20} />, label: 'Bloquear Conta', desc: 'Suspende acesso imediato.', type: 'BLOCK', color: 'text-[#E24B4A] hover:bg-[#E24B4A]/10 border-[#E24B4A]/20' },
                                                { icon: <Unlock size={20} />, label: 'Reativar Conta', desc: 'Restaura acesso completo.', type: 'ACTIVATE', color: 'text-[#1DB97A] hover:bg-[#1DB97A]/10 border-[#1DB97A]/20' },
                                                { icon: <CheckCircle2 size={20} />, label: 'Aprovar KYC', desc: 'Finaliza verificação.', type: 'KYC_APPROVE', color: 'text-folio-accent hover:bg-folio-accent/10 border-folio-accent/20' },
                                                { icon: <XCircle size={20} />, label: 'Recusar KYC', desc: 'Invalida documentos.', type: 'KYC_REJECT', color: 'text-[#F5C842] hover:bg-[#F5C842]/10 border-[#F5C842]/20' },
                                            ].map(a => (
                                                <button key={a.type} onClick={() => setActionModal({ type: a.type, user: selectedUser })}
                                                    className={`p-6 text-left bg-folio-surface border rounded-[28px] transition-all group flex flex-col shadow-sm hover:shadow-glow-dim ${a.color}`}>
                                                    <div className="mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6">{a.icon}</div>
                                                    <p className="text-sm font-black text-folio-text mb-2 tracking-tight">{a.label}</p>
                                                    <p className="text-xs font-medium text-folio-text-dim leading-relaxed opacity-70">{a.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {dossierTab === 'orders' && (
                                    <div className="py-24 flex flex-col items-center justify-center text-folio-text-dim opacity-30 text-center">
                                        <Activity size={64} className="mb-4 animate-pulse text-folio-accent" />
                                        <p className="text-xs font-black tracking-[4px]">Monitoramento em Tempo Real</p>
                                        <p className="text-xs font-medium mt-2">Indexando histórico de transações...</p>
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
                    <h1 className="text-2xl font-black text-folio-text tracking-tight leading-none">Gestão de Usuários</h1>
                    <p className="text-xs font-bold text-folio-text-dim/50 tracking-[2px] mt-2">Governança, KYC e Análise de Risco</p>
                </div>
                <button onClick={fetchUsers}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl border border-folio-border bg-folio-surface text-folio-text-dim hover:text-folio-accent hover:rotate-180 transition-all duration-700 shadow-sm">
                    <RefreshCw size={18} />
                </button>
            </div>

            {loading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-[28px] bg-folio-surface border border-folio-border" />)}
                    </div>
                </div>
            ) : (
                <>
                    {/* ── KPI Strip ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Total de Usuários" value={users.length} icon={<Users size={18} />} trend="Global" tooltip="Volume total de clientes e profissionais cadastrados no banco de dados." />
                        <KpiCard label="Alto Risco" value={users.filter(u => u.riskLevel === 'high').length}
                            icon={<ShieldAlert size={18} />} color="text-[#E24B4A]" bg="bg-[#E24B4A]/10" trend="Crítico" tooltip="Usuários com comportamento suspeito, alto índice de cancelamento ou denúncias." />
                        <KpiCard label="KYC em Análise" value={users.filter(u => u.kyc_status === 'submitted').length}
                            icon={<Clock size={18} />} color="text-[#F5C842]" bg="bg-[#F5C842]/10" trend="Pendente" tooltip="Profissionais que enviaram documentos e aguardam validação humana para operar." />
                        <KpiCard label="Verificados" value={users.filter(u => u.kyc_status === 'approved').length}
                            icon={<ShieldCheck size={18} />} color="text-[#1DB97A]" bg="bg-[#1DB97A]/10" trend="Aprovado" tooltip="Usuários com identidade validada e aptos a transacionar na plataforma." />
                    </div>

                    {/* ── Toolbar ── */}
                    <div className="bg-folio-surface border border-folio-border rounded-[24px] p-4 flex flex-col md:flex-row gap-4 shadow-folio">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-folio-text-dim" size={16} />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                placeholder="ID, Email ou Nome do usuário..."
                                className="w-full h-11 rounded-xl pl-11 pr-4 text-sm outline-none bg-folio-bg border border-folio-border text-folio-text focus:border-folio-accent transition-all placeholder:text-folio-text-dim/30"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            {[{ val: 'all', label: 'Todos' }, { val: 'client', label: 'Clientes' }, { val: 'provider', label: 'Profissionais' }].map(opt => (
                                <button key={opt.val} onClick={() => setFilterRole(opt.val)}
                                    className={`h-11 px-5 rounded-xl text-xs font-black tracking-[1.5px] transition-all border ${filterRole === opt.val ? 'bg-folio-accent border-folio-accent text-white shadow-glow' : 'bg-folio-bg border-folio-border text-folio-text-dim hover:text-folio-text hover:border-folio-text-dim/30'}`}>
                                    {opt.label}
                                </button>
                            ))}
                            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                                className="h-11 px-4 rounded-xl text-xs font-black outline-none bg-folio-bg border border-folio-border text-folio-text-dim cursor-pointer tracking-[1.5px] focus:border-folio-accent transition-all">
                                <option value="all">Todos os Riscos</option>
                                <option value="high">Alto Risco</option>
                                <option value="medium">Atenção</option>
                                <option value="low">Seguros</option>
                            </select>
                        </div>
                    </div>

                    {/* ── Users List ── */}
                    <div className="space-y-4">
                        <div className="hidden md:grid grid-cols-12 px-8 py-4 bg-folio-surface2/30 rounded-2xl border border-folio-border/50">
                            <div className="col-span-4 text-xs font-black text-folio-text-dim tracking-[2px]">Usuário / Protocolo</div>
                            <div className="col-span-2 text-xs font-black text-folio-text-dim tracking-[2px]">Papel / Verificação</div>
                            <div className="col-span-2 text-xs font-black text-folio-text-dim tracking-[2px] cursor-pointer hover:text-folio-accent transition-colors" onClick={() => toggleSort('risk')}>
                                <span className="flex items-center gap-2">SCORE RISCO {sortField === 'risk' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}</span>
                            </div>
                            <div className="col-span-1 text-xs font-black text-folio-text-dim tracking-[2px]">Pedidos</div>
                            <div className="col-span-2 text-xs font-black text-folio-text-dim tracking-[2px] cursor-pointer hover:text-folio-accent transition-colors" onClick={() => toggleSort('created')}>
                                <span className="flex items-center gap-2">CADASTRO {sortField === 'created' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}</span>
                            </div>
                            <div className="col-span-1 text-right text-xs font-black text-folio-text-dim tracking-[2px]">Ação</div>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <div className="py-24 text-center bg-folio-surface border border-dashed border-folio-border rounded-[32px] opacity-40">
                                <Users size={56} className="mx-auto mb-4 text-folio-accent" />
                                <p className="text-sm font-black tracking-[3px]">Nenhum usuário localizado</p>
                            </div>
                        ) : filteredUsers.map(u => (
                            <div key={u.id}
                                className="grid grid-cols-12 items-center px-8 py-5 bg-folio-surface border border-folio-border rounded-[32px] hover:border-folio-accent/40 shadow-sm hover:shadow-glow-dim transition-all duration-300 group cursor-pointer"
                                onClick={() => { setSelectedUser(u); setDossierTab('profile'); }}>

                                <div className="col-span-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-folio-bg border border-folio-border flex items-center justify-center font-black text-lg text-folio-accent shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        {resolveUserName(u).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-folio-text tracking-tight">{resolveUserName(u)}</p>
                                        <p className="text-xs text-folio-text-dim/50 font-mono mt-1 group-hover:text-folio-accent transition-colors">{u.email}</p>
                                    </div>
                                </div>

                                <div className="col-span-2 flex flex-col gap-1.5 justify-center">
                                    <div className={`px-2 py-0.5 rounded-lg border text-xs font-black tracking-widest text-center ${u.role === 'provider' ? 'bg-folio-accent/10 border-folio-accent/20 text-folio-accent' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                        }`}>
                                        {u.role}
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-lg border text-xs font-black tracking-widest text-center ${u.kyc_status === 'approved' ? 'bg-[#1DB97A]/10 border-[#1DB97A]/20 text-[#1DB97A]' : 'bg-[#F5C842]/10 border-[#F5C842]/20 text-[#F5C842]'
                                        }`}>
                                        KYC: {u.kyc_status || 'none'}
                                    </div>
                                </div>

                                <div className="col-span-2 px-4">
                                    <RiskBar score={u.riskScore} />
                                </div>

                                <div className="col-span-1 text-center">
                                    <span className="text-sm font-black text-folio-text tabular-nums tracking-tighter shadow-glow px-2 py-1 bg-folio-bg rounded-xl border border-folio-border">
                                        {u.totalClientOrders + u.totalProviderOrders}
                                    </span>
                                </div>

                                <div className="col-span-2 text-center">
                                    <span className="text-xs font-bold text-folio-text-dim/60 font-mono tracking-widest">{formatDate(u.created_at)}</span>
                                </div>

                                <div className="col-span-1 text-right">
                                    <button className="w-10 h-10 flex items-center justify-center rounded-2xl border border-folio-border bg-folio-bg text-folio-text-dim group-hover:bg-folio-accent group-hover:text-white group-hover:border-folio-accent transition-all shadow-sm">
                                        <Eye size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const KycImageCard = ({ title, path, aspect = 'aspect-[16/10]' }: { title: string, path: string, aspect?: string }) => {
    const imageUrl = supabase.storage.from('documents').getPublicUrl(path).data.publicUrl;

    return (
        <div className="space-y-2 group">
            <p className="text-xs font-black text-folio-text-dim/50 tracking-[2px] ml-1 group-hover:text-folio-accent transition-colors">
                {title}
            </p>
            <div className={`${aspect} rounded-[24px] overflow-hidden border border-folio-border bg-folio-bg flex items-center justify-center relative group shadow-inner`}>
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-contain cursor-zoom-in transition-all duration-500 group-hover:scale-105"
                    onClick={() => window.open(imageUrl, '_blank')}
                    onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.parentElement.innerHTML = `
                            <div class="flex flex-col items-center gap-2 text-folio-text-dim opacity-30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                <span class="text-xs font-black tracking-widest">Erro no Carregamento</span>
                            </div>
                        `;
                    }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-md p-2 rounded-lg text-white">
                    <Eye size={14} />
                </div>
            </div>
        </div>
    );
};

export default UserManagement;

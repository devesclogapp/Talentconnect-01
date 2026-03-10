import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, MessageSquare, ShieldAlert, Search, CheckCircle2,
    XCircle, Gavel, Clock, DollarSign, Activity, ShieldCheck, Scale,
    History, FileText, Zap, Lock, RefreshCw, Eye, Package, Percent
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import { useAppStore } from '../store';
import KpiCard from '../components/erp/KpiCard';
import StatusBadge from '../components/erp/StatusBadge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

const AdminDisputes: React.FC = () => {
    const { viewFilters, setViewFilters } = useAppStore();

    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState(viewFilters?.status || 'all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [dossierTab, setDossierTab] = useState('summary');

    // AlertDialog state
    const [pendingAction, setPendingAction] = useState<'analyze' | 'resolve_release' | 'resolve_refund' | null>(null);
    const [actionReason, setActionReason] = useState('');

    useEffect(() => {
        fetchDisputes();
        return () => setViewFilters(null);
    }, []);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    *,
                    order:orders (
                        id, status, total_amount, scheduled_at,
                        location_text, pricing_mode, notes,
                        client:users!client_id (id, email, name),
                        provider:users!provider_id (id, email, name),
                        service:services (id, title)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDisputes(data || []);
        } catch (error) {
            console.error('Error fetching disputes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async (orderId: string) => {
        try {
            const { data } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('order_id', orderId)
                .order('timestamp', { ascending: false });
            setAuditLogs(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectDispute = (dispute: any) => {
        setSelectedDispute(dispute);
        setDossierTab('summary');
        setAuditLogs([]);
        fetchAuditLogs(dispute.order_id);
    };

    const performAction = async () => {
        if (!selectedDispute || !pendingAction) return;
        const disputeId = selectedDispute.id;
        try {
            setIsProcessing(disputeId);
            if (pendingAction === 'analyze') {
                await (supabase as any).from('disputes').update({ status: 'in_review' }).eq('id', disputeId);
                toast.success('Protocolo de mediação ativado e disputa em análise.');
            } else {
                const decision = pendingAction === 'resolve_release' ? 'release_to_provider' : 'refund_to_client';
                await (supabase as any).from('disputes').update({
                    status: 'resolved',
                    resolved_at: new Date().toISOString()
                }).eq('id', disputeId);
                await (supabase as any).from('audit_logs').insert({
                    order_id: selectedDispute.order_id,
                    action: 'JUDICIAL_DECISION',
                    details: `Disputa resolvida: ${decision}. Motivo: ${actionReason}`,
                    timestamp: new Date().toISOString()
                });
                toast.success('Sentença aplicada com sucesso e registrada em auditoria.');
            }
            fetchDisputes();
            setSelectedDispute(null);
        } catch (err: any) {
            toast.error('Falha na operação: ' + err.message);
        } finally {
            setIsProcessing(null);
            setPendingAction(null);
            setActionReason('');
        }
    };

    const filteredDisputes = disputes.filter(d => {
        const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            (d.id || '').toLowerCase().includes(search) ||
            (d.reason || '').toLowerCase().includes(search) ||
            resolveUserName(d.order?.client).toLowerCase().includes(search) ||
            resolveUserName(d.order?.provider).toLowerCase().includes(search);
        return matchesStatus && matchesSearch;
    });

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    const formatCurrency = (v: number) => `R$ ${(v || 0).toFixed(2)}`;

    return (
        <div className="space-y-5 pb-12">

            {/* ── AlertDialog — Confirmação de Sentença ── */}
            <AlertDialog open={!!pendingAction} onOpenChange={(open) => { if (!open) { setPendingAction(null); setActionReason(''); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction === 'analyze' ? 'Elevar para Análise Crítica' :
                                pendingAction === 'resolve_release' ? 'Liberar Pagamento ao Profissional' :
                                    'Estornar Valor ao Cliente'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction === 'analyze'
                                ? 'A disputa será marcada como "Em Análise" e o protocolo de mediação será ativado.'
                                : 'Esta decisão é irreversível e será registrada no log de auditoria.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {pendingAction !== 'analyze' && (
                        <div className="space-y-2 py-2">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                Justificativa da Sentença (Auditoria)
                            </label>
                            <textarea
                                value={actionReason}
                                onChange={e => setActionReason(e.target.value)}
                                className="w-full h-24 rounded-lg p-3 text-xs outline-none bg-background border border-border text-foreground focus:border-primary transition-all resize-none"
                                placeholder="Descreva o motivo da decisão para auditoria..."
                            />
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setPendingAction(null); setActionReason(''); }}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={pendingAction !== 'analyze' && !actionReason || isProcessing === selectedDispute?.id}
                            onClick={performAction}
                            className={pendingAction === 'resolve_refund' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
                        >
                            {isProcessing ? 'Processando...' : 'Confirmar Sentença'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Sheet — Painel de Mediação ── */}
            <Sheet open={!!selectedDispute} onOpenChange={(open) => { if (!open) setSelectedDispute(null); }}>
                <SheetContent side="right" className="w-full max-w-2xl p-0 flex flex-col gap-0 overflow-hidden">
                    {selectedDispute && (
                        <>
                            <SheetHeader className="px-5 py-4 border-b border-border bg-card flex-row items-center gap-3 space-y-0">
                                <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                                    <Scale size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <SheetTitle className="text-sm font-semibold text-foreground leading-tight">
                                        Centro de Mediação
                                    </SheetTitle>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            #{selectedDispute.id.slice(0, 8)}
                                        </span>
                                        <StatusBadge status={selectedDispute.status} />
                                    </div>
                                </div>
                            </SheetHeader>

                            {/* Tabs */}
                            <div className="flex px-5 border-b border-border bg-card overflow-x-auto">
                                {[
                                    { id: 'summary', label: 'Resumo', icon: <Scale size={12} /> },
                                    { id: 'order', label: 'Contrato', icon: <FileText size={12} /> },
                                    { id: 'financial', label: 'Financeiro', icon: <DollarSign size={12} /> },
                                    { id: 'logs', label: 'Auditoria', icon: <History size={12} /> },
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => setDossierTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest border-b-2 transition-all shrink-0 ${dossierTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">

                                {/* ── Tab: Resumo ── */}
                                {dossierTab === 'summary' && (
                                    <div className="space-y-5">
                                        {/* Motivo */}
                                        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-destructive uppercase tracking-widest mb-1">Motivo da Disputa</p>
                                                    <p className="text-base font-semibold text-foreground">{selectedDispute.reason || 'Inconformidade Geral'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Valor</p>
                                                    <p className="text-lg font-semibold text-foreground">{formatCurrency(selectedDispute.order?.total_amount)}</p>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-border text-xs text-muted-foreground italic leading-relaxed bg-muted/30 rounded-lg p-3">
                                                "{selectedDispute.reason || 'Nenhum detalhe adicional fornecido.'}"
                                            </div>
                                        </div>

                                        {/* Partes */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                {
                                                    label: 'Reclamante',
                                                    user: selectedDispute.opened_by === 'client' ? selectedDispute.order?.client : selectedDispute.order?.provider,
                                                    role: selectedDispute.opened_by === 'client' ? 'Cliente' : 'Profissional',
                                                    accent: true
                                                },
                                                {
                                                    label: 'Parte Notificada',
                                                    user: selectedDispute.opened_by === 'client' ? selectedDispute.order?.provider : selectedDispute.order?.client,
                                                    role: selectedDispute.opened_by === 'client' ? 'Profissional' : 'Cliente',
                                                    accent: false
                                                }
                                            ].map(p => (
                                                <div key={p.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0 ${p.accent ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                                        {resolveUserName(p.user).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{p.label}</p>
                                                        <p className="text-xs font-semibold text-foreground truncate">{resolveUserName(p.user)}</p>
                                                        <p className="text-[10px] text-muted-foreground">{p.role}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Ações */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Sentença Operacional</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setPendingAction('resolve_release')}
                                                    disabled={selectedDispute.status === 'resolved'}
                                                    className="p-4 text-left bg-green-500/5 border border-green-500/20 rounded-xl hover:bg-green-500/10 hover:border-green-500/50 transition-all group disabled:opacity-40 disabled:pointer-events-none">
                                                    <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Liberar ao Profissional</p>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">Serviço executado. Valor liberado ao prestador.</p>
                                                </button>
                                                <button
                                                    onClick={() => setPendingAction('resolve_refund')}
                                                    disabled={selectedDispute.status === 'resolved'}
                                                    className="p-4 text-left bg-destructive/5 border border-destructive/20 rounded-xl hover:bg-destructive/10 hover:border-destructive/50 transition-all group disabled:opacity-40 disabled:pointer-events-none">
                                                    <div className="w-8 h-8 rounded-lg bg-destructive text-destructive-foreground flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                        <XCircle size={16} />
                                                    </div>
                                                    <p className="text-xs font-semibold text-destructive mb-1">Estornar ao Cliente</p>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">Estorno integral. Profissional não recebe.</p>
                                                </button>
                                            </div>
                                            {selectedDispute.status === 'open' && (
                                                <button
                                                    onClick={() => setPendingAction('analyze')}
                                                    className="w-full h-12 bg-foreground text-background rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3">
                                                    <Zap size={14} className="text-primary" />
                                                    Elevar para Protocolo de Análise Crítica
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Tab: Contrato ── */}
                                {dossierTab === 'order' && (
                                    <div className="space-y-4">
                                        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><FileText size={12} /> Dados do Pedido</p>
                                            {[
                                                { label: 'Serviço', value: selectedDispute.order?.service?.title || 'N/A' },
                                                { label: 'Agendamento', value: selectedDispute.order?.scheduled_at ? new Date(selectedDispute.order.scheduled_at).toLocaleString('pt-BR') : 'Não definido' },
                                                { label: 'Modalidade', value: selectedDispute.order?.pricing_mode === 'hourly' ? 'Por Hora' : 'Valor Fixo' },
                                                { label: 'Endereço', value: selectedDispute.order?.location_text || 'Não declarado' },
                                            ].map(row => (
                                                <div key={row.label} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0">
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{row.label}</span>
                                                    <span className="text-xs font-medium text-foreground text-right ml-4 truncate max-w-[200px]">{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-card border border-border rounded-xl p-4 flex gap-3 items-center">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <ShieldCheck size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1">Nota de Governança</p>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                    Este pedido usa Contrato de Execução Instantânea. A liberação depende da análise deste painel.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Tab: Financeiro ── */}
                                {dossierTab === 'financial' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Custódia Total', value: formatCurrency(selectedDispute.order?.total_amount), icon: <DollarSign size={14} />, color: 'text-foreground' },
                                                { label: 'Taxa APP (10%)', value: formatCurrency((selectedDispute.order?.total_amount || 0) * 0.1), icon: <Percent size={14} />, color: 'text-destructive' },
                                                { label: 'Repasse Líquido', value: formatCurrency((selectedDispute.order?.total_amount || 0) * 0.9), icon: <Activity size={14} />, color: 'text-green-600 dark:text-green-400' },
                                            ].map(s => (
                                                <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                                                    <div className={`mb-2 ${s.color}`}>{s.icon}</div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                                                    <p className={`text-sm font-semibold ${s.color}`}>{s.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                                                    <Lock size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground">ESCROW: RETIDO</p>
                                                    <p className="text-[10px] text-muted-foreground">Protocolo Antifraude Ativo</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-lg text-[10px] font-semibold uppercase tracking-widest border border-yellow-500/20 animate-pulse">
                                                Aguardando Sentença
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* ── Tab: Auditoria ── */}
                                {dossierTab === 'logs' && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <History size={12} /> Fatos Imutáveis — Audit Log
                                        </p>
                                        {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                                            <div key={i} className="relative pl-5 border-l-2 border-border pb-4 group">
                                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-muted border-2 border-border group-hover:border-primary transition-all" />
                                                <p className="text-[10px] text-muted-foreground font-mono mb-1 flex items-center gap-1.5">
                                                    <Clock size={10} />
                                                    {new Date(log.timestamp).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                </p>
                                                <p className="text-xs font-semibold text-foreground mb-1">{log.action?.split('_').join(' ')}</p>
                                                <div className="p-2.5 bg-muted/50 rounded-lg text-[10px] text-muted-foreground leading-relaxed">{log.details}</div>
                                            </div>
                                        )) : (
                                            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground opacity-40">
                                                <Activity size={32} className="mb-2 animate-pulse" />
                                                <p className="text-[10px] font-semibold uppercase tracking-widest">Sincronizando Logs...</p>
                                            </div>
                                        )}
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
                    <h1 className="text-xl font-semibold text-foreground">Gestão de Disputas</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Análise de litígios e mediação de pagamentos em escrow</p>
                </div>
                <button onClick={fetchDisputes}
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
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* ── KPI Strip ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KpiCard label="Total de Disputas" value={disputes.length} icon={<Gavel size={16} />} />
                        <KpiCard label="Abertas" value={disputes.filter(d => d.status === 'open').length}
                            icon={<AlertTriangle size={16} />} color="text-destructive" bg="bg-destructive/10" />
                        <KpiCard label="Em Análise" value={disputes.filter(d => d.status === 'in_review').length}
                            icon={<Clock size={16} />} color="text-yellow-600 dark:text-yellow-400" bg="bg-yellow-500/10" />
                        <KpiCard label="Resolvidas" value={disputes.filter(d => d.status === 'resolved').length}
                            icon={<ShieldCheck size={16} />} color="text-green-600 dark:text-green-400" bg="bg-green-500/10" />
                    </div>

                    {/* ── Toolbar ── */}
                    <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar ID, motivo ou usuários..."
                                className="w-full h-9 rounded-lg pl-9 pr-4 text-sm outline-none bg-background border border-border text-foreground focus:border-primary transition-all"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="h-9 px-3 rounded-lg text-[11px] font-semibold outline-none bg-muted border border-border text-muted-foreground cursor-pointer">
                            <option value="all">Todos os Status</option>
                            <option value="open">Abertas</option>
                            <option value="in_review">Em Análise</option>
                            <option value="resolved">Resolvidas</option>
                        </select>
                    </div>

                    {/* ── Table ── */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Caso / Data</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Motivo / Reclamante</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Valor Bloqueado</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Analisar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDisputes.length === 0 ? (
                                    <tr><td colSpan={5} className="py-16 text-center opacity-30">
                                        <ShieldCheck size={36} className="mx-auto mb-3" />
                                        <p className="text-[10px] font-semibold uppercase tracking-widest">Nenhum litígio pendente</p>
                                    </td></tr>
                                ) : filteredDisputes.map(dispute => (
                                    <tr key={dispute.id}
                                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-all cursor-pointer"
                                        onClick={() => handleSelectDispute(dispute)}>
                                        <td className="px-5 py-3.5">
                                            <p className="text-xs font-semibold text-foreground font-mono">#{dispute.id.slice(0, 8)}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(dispute.created_at)}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-xs font-semibold text-foreground leading-tight">{dispute.reason || 'Conflito de Execução'}</p>
                                            <p className="text-[10px] text-primary mt-0.5">
                                                Por: {dispute.opened_by === 'client' ? resolveUserName(dispute.order?.client) : resolveUserName(dispute.order?.provider)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-semibold text-foreground tabular-nums">
                                                {formatCurrency(dispute.order?.total_amount)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={dispute.status} />
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

export default AdminDisputes;

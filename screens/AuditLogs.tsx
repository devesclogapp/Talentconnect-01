import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, RefreshCw, Download, ChevronRight, FileText, Shield,
    Zap, GitBranch, AlertCircle, User, Clock, DollarSign, Activity,
    Package, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
    ExternalLink, Info
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Skeleton } from '../components/ui/skeleton';
import KpiCard from '../components/erp/KpiCard';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────
interface AuditLog {
    id: string; action: string; entity_type?: string; entity_id?: string;
    actor_user_id?: string; payload_json?: any; created_at?: string;
    order_id?: string; details?: string; timestamp?: string; reason?: string;
}
interface OrderMeta {
    id: string; status: string; pricing_mode?: string; total_amount?: number;
    scheduled_at?: string; location_text?: string; client_name?: string;
    client_email?: string; provider_name?: string; provider_email?: string;
    service_title?: string; payment_status?: string; payment_amount?: number;
}
interface NegotiationGroup {
    id: string; orderId: string; logs: AuditLog[]; startTime: string;
    endTime: string; lastAction: string; meta?: OrderMeta;
    status: 'clean' | 'attention' | 'critical';
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
const getLogTime = (log: AuditLog) => log.created_at || log.timestamp || '';

const getActionTag = (action: string) => {
    const a = (action || '').toUpperCase();
    if (a.includes('BLOCK') || a.includes('BAN') || a.includes('CANCEL') || a.includes('REFUND') || a.includes('REJECT'))
        return { cls: 'bg-destructive/10 text-destructive border border-destructive/20', dot: 'bg-destructive' };
    if (a.includes('PAYMENT') || a.includes('RELEASE') || a.includes('COMPLETE') || a.includes('APPROVE'))
        return { cls: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20', dot: 'bg-green-500' };
    if (a.includes('DISPUTE') || a.includes('RISK') || a.includes('WARN') || a.includes('SLA'))
        return { cls: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20', dot: 'bg-yellow-500' };
    if (a.includes('ORDER') || a.includes('SERVICE') || a.includes('USER'))
        return { cls: 'bg-primary/10 text-primary border border-primary/20', dot: 'bg-primary' };
    return { cls: 'bg-muted text-muted-foreground border border-border', dot: 'bg-muted-foreground' };
};

const getActionIcon = (action: string, size = 12) => {
    const a = (action || '').toUpperCase();
    if (a.includes('PAYMENT') || a.includes('RELEASE')) return <DollarSign size={size} />;
    if (a.includes('DISPUTE')) return <AlertTriangle size={size} />;
    if (a.includes('COMPLETE')) return <CheckCircle2 size={size} />;
    if (a.includes('CANCEL') || a.includes('REFUND') || a.includes('BLOCK')) return <XCircle size={size} />;
    if (a.includes('USER') || a.includes('KYC')) return <User size={size} />;
    if (a.includes('ORDER')) return <Package size={size} />;
    return <Activity size={size} />;
};

const formatDateTime = (ts: string) =>
    ts ? new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const formatDate = (ts: string) =>
    ts ? new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatTime = (ts: string) =>
    ts ? new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

const orderStatusLabel: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground' },
    sent: { label: 'Enviado', cls: 'bg-primary/10 text-primary' },
    accepted: { label: 'Aceito', cls: 'bg-primary/10 text-primary' },
    awaiting_payment: { label: 'Aguardando Pgto', cls: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    paid_escrow_held: { label: 'Pgto Retido', cls: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    in_execution: { label: 'Em Execução', cls: 'bg-primary/10 text-primary' },
    completed: { label: 'Concluído', cls: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    cancelled: { label: 'Cancelado', cls: 'bg-destructive/10 text-destructive' },
    disputed: { label: 'Disputado', cls: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    rejected: { label: 'Recusado', cls: 'bg-destructive/10 text-destructive' },
};

const statusBg = (s: 'clean' | 'attention' | 'critical') =>
    s === 'critical' ? 'bg-destructive' : s === 'attention' ? 'bg-yellow-500' : 'bg-green-500';

const statusRing = (s: 'clean' | 'attention' | 'critical') =>
    s === 'critical' ? 'border-destructive/30 ring-destructive/10' : s === 'attention' ? 'border-yellow-500/30 ring-yellow-500/10' : 'border-border';

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────
const SectionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="flex items-center gap-2 px-1 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label}</p>
    </div>
);

const DossierRow = ({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) => (
    <div className="flex justify-between items-start gap-3 py-2 border-b border-border last:border-0">
        <span className="text-xs font-semibold text-muted-foreground tracking-widest shrink-0">{label}</span>
        <span className={`text-xs text-right font-medium truncate max-w-[180px] ${highlight ? 'text-foreground font-semibold' : 'text-foreground'}`}>{value || '—'}</span>
    </div>
);

// ─────────────────────────────────────────────────────────
// HOOK — COLUNAS REDIMENSIONÁVEIS
// ─────────────────────────────────────────────────────────
const useResizableColumns = (initialWidths: number[]) => {
    const [widths, setWidths] = React.useState(initialWidths);
    const resizing = React.useRef<{ colIndex: number; startX: number; startW: number } | null>(null);

    const onMouseDown = React.useCallback((colIndex: number, e: React.MouseEvent) => {
        e.preventDefault();
        resizing.current = { colIndex, startX: e.clientX, startW: widths[colIndex] };

        const onMove = (me: MouseEvent) => {
            if (!resizing.current) return;
            const delta = me.clientX - resizing.current.startX;
            const newW = Math.max(60, resizing.current.startW + delta);
            setWidths(prev => prev.map((w, i) => i === resizing.current!.colIndex ? newW : w));
        };
        const onUp = () => {
            resizing.current = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [widths]);

    return { widths, onMouseDown };
};

// ─────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────
const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'negotiations' | 'system'>('all');
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [selectedNegotiation, setSelectedNegotiation] = useState<NegotiationGroup | null>(null);
    const [orderMeta, setOrderMeta] = useState<Record<string, OrderMeta>>({});

    // Widths: Ação | Entidade | Detalhes | Agente | Timestamp
    const { widths: colWidths, onMouseDown: onColResize } = useResizableColumns([160, 140, 320, 160, 150]);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const { data: rawData, error } = await supabase
                .from('audit_logs').select('*')
                .order('created_at', { ascending: false }).limit(500);
            if (error) throw error;
            const rawLogs = (rawData || []) as AuditLog[];
            setLogs(rawLogs);

            const orderIds = Array.from(new Set(
                rawLogs.map(l => l.order_id ?? (l.entity_type === 'ORDER' ? l.entity_id : null))
                    .filter((id): id is string => Boolean(id))
            ));
            if (!orderIds.length) return;

            const [ordersRes, paymentsRes] = await Promise.all([
                supabase.from('orders').select(`
                    id, status, pricing_mode, scheduled_at, location_text,
                    client:users!client_id (id, name, email),
                    provider:users!provider_id (id, name, email),
                    service:services (id, title)
                `).in('id', orderIds),
                supabase.from('payments').select('order_id, amount_total, escrow_status').in('order_id', orderIds)
            ]);

            const metaMap: Record<string, OrderMeta> = {};
            const payments = (paymentsRes.data || []) as any[];
            (ordersRes.data || []).forEach((o: any) => {
                const payment = payments.find((p) => p.order_id === o.id);
                metaMap[o.id] = {
                    id: o.id, status: o.status || 'unknown', pricing_mode: o.pricing_mode,
                    scheduled_at: o.scheduled_at, location_text: o.location_text,
                    client_name: o.client?.name || o.client?.email || 'Cliente',
                    client_email: o.client?.email,
                    provider_name: o.provider?.name || o.provider?.email || 'Profissional',
                    provider_email: o.provider?.email,
                    service_title: o.service?.title || 'Serviço',
                    payment_status: payment?.escrow_status,
                    payment_amount: payment?.amount_total,
                };
            });
            setOrderMeta(metaMap);
        } catch (err) {
            console.error('AuditLogs fetch error:', err);
            toast.error('Erro ao carregar logs de auditoria.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        const ch = supabase.channel('audit-logs-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, payload => {
                setLogs(prev => [payload.new as AuditLog, ...prev]);
            }).subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [fetchLogs]);

    const { negotiations, standalone } = React.useMemo(() => {
        const orderGroups: Record<string, AuditLog[]> = {};
        const standalone: AuditLog[] = [];
        logs.forEach(log => {
            const refId = log.order_id ?? (log.entity_type === 'ORDER' ? log.entity_id : null);
            if (refId) { if (!orderGroups[refId]) orderGroups[refId] = []; orderGroups[refId].push(log); }
            else standalone.push(log);
        });
        const negotiations: NegotiationGroup[] = Object.entries(orderGroups).map(([orderId, groupLogs]) => {
            const sorted = [...groupLogs].sort((a, b) => new Date(getLogTime(a)).getTime() - new Date(getLogTime(b)).getTime());
            const lastAction = sorted[sorted.length - 1]?.action || '';
            const hasError = sorted.some(l => { const a = (l.action || '').toUpperCase(); return a.includes('DISPUTE') || a.includes('CANCEL') || a.includes('REFUND') || a.includes('BLOCK'); });
            const hasWarn = sorted.some(l => { const a = (l.action || '').toUpperCase(); return a.includes('RISK') || a.includes('REJECT') || a.includes('WARN'); });
            return {
                id: `neg-${orderId}`, orderId, logs: sorted,
                startTime: getLogTime(sorted[0]),
                endTime: getLogTime(sorted[sorted.length - 1]),
                lastAction, meta: orderMeta[orderId],
                status: (hasError ? 'critical' : hasWarn ? 'attention' : 'clean') as 'clean' | 'attention' | 'critical',
            };
        }).sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
        return { negotiations, standalone };
    }, [logs, orderMeta]);

    const { filteredNeg, filteredSta } = React.useMemo(() => {
        const q = searchTerm.toLowerCase();
        const negMatch = (n: NegotiationGroup) =>
            n.orderId.toLowerCase().includes(q) || (n.meta?.client_name || '').toLowerCase().includes(q) ||
            (n.meta?.provider_name || '').toLowerCase().includes(q) || (n.meta?.service_title || '').toLowerCase().includes(q) ||
            n.logs.some(l => (l.action || '').toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q));
        const staMatch = (l: AuditLog) =>
            (l.action || '').toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q) || (l.entity_type || '').toLowerCase().includes(q);
        if (activeFilter === 'negotiations') return { filteredNeg: negotiations.filter(negMatch), filteredSta: [] };
        if (activeFilter === 'system') return { filteredNeg: [], filteredSta: standalone.filter(staMatch) };
        return { filteredNeg: negotiations.filter(negMatch), filteredSta: standalone.filter(staMatch) };
    }, [negotiations, standalone, searchTerm, activeFilter]);

    const exportToCSV = () => {
        const header = 'ID,Action,EntityType,EntityId,OrderRef,Actor,Details,Timestamp';
        const rows = logs.map(l =>
            `"${l.id}","${l.action || ''}","${l.entity_type || ''}","${l.entity_id || ''}","${l.order_id || ''}","${l.actor_user_id || ''}","${(l.details || l.payload_json?.details || '').replace(/"/g, "''")}","${getLogTime(l)}"`
        );
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `audit_trail_${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exportado com sucesso.');
    };

    return (
        <div className="space-y-5 pb-12">

            {/* ── Sheet — Dossiê da Negociação ── */}
            <Sheet open={!!selectedNegotiation} onOpenChange={(open) => { if (!open) setSelectedNegotiation(null); }}>
                <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden">
                    {selectedNegotiation && (
                        <>
                            <SheetHeader className="px-5 py-4 border-b border-border bg-card flex-row items-center gap-3 space-y-0">
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusBg(selectedNegotiation.status)}`} />
                                <div className="flex-1 min-w-0">
                                    <SheetTitle className="text-sm font-semibold text-foreground">Dossiê de Negociação</SheetTitle>
                                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">#{selectedNegotiation.orderId.slice(0, 16)}</p>
                                </div>
                                <span className={`text-[9px] font-semibold px-2 py-1 rounded-full ${selectedNegotiation.status === 'critical' ? 'bg-destructive/10 text-destructive' :
                                    selectedNegotiation.status === 'attention' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                                        'bg-green-500/10 text-green-600 dark:text-green-400'}`}>
                                    {selectedNegotiation.status === 'critical' ? '⚠ Crítico' : selectedNegotiation.status === 'attention' ? '⚡ Atenção' : '✓ Normal'}
                                </span>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {selectedNegotiation.meta ? (
                                    <>
                                        {/* Partes */}
                                        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                                            <p className="text-[9px] font-semibold tracking-widest text-muted-foreground">Partes da Negociação</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs shrink-0">
                                                    {(selectedNegotiation.meta.client_name || 'C').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-foreground">{selectedNegotiation.meta.client_name}</p>
                                                    <p className="text-[9px] text-muted-foreground font-mono">{selectedNegotiation.meta.client_email}</p>
                                                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Cliente</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pl-4 opacity-40">
                                                <div className="w-px h-3 bg-border" />
                                                <ArrowRight size={10} className="text-muted-foreground" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-muted border border-border text-foreground flex items-center justify-center font-semibold text-xs shrink-0">
                                                    {(selectedNegotiation.meta.provider_name || 'P').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-foreground">{selectedNegotiation.meta.provider_name}</p>
                                                    <p className="text-[9px] text-muted-foreground font-mono">{selectedNegotiation.meta.provider_email}</p>
                                                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Profissional</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dados do Pedido */}
                                        <div className="bg-card border border-border rounded-xl p-4">
                                            <p className="text-[9px] font-semibold tracking-widest text-muted-foreground mb-3">Dados do Pedido</p>
                                            <DossierRow label="Serviço" value={selectedNegotiation.meta.service_title} />
                                            <DossierRow label="Modalidade" value={selectedNegotiation.meta.pricing_mode === 'hourly' ? 'Por Hora' : 'Valor Fixo'} />
                                            <DossierRow label="Status" value={orderStatusLabel[selectedNegotiation.meta.status]?.label || selectedNegotiation.meta.status} />
                                            <DossierRow label="Agendamento" value={selectedNegotiation.meta.scheduled_at ? formatDate(selectedNegotiation.meta.scheduled_at) : undefined} />
                                            <DossierRow label="Local" value={selectedNegotiation.meta.location_text || undefined} />
                                            {selectedNegotiation.meta.payment_amount != null && (
                                                <DossierRow label="Valor Total" value={`R$ ${selectedNegotiation.meta.payment_amount.toFixed(2)}`} highlight />
                                            )}
                                            {selectedNegotiation.meta.payment_status && (
                                                <DossierRow label="Escrow" value={selectedNegotiation.meta.payment_status} />
                                            )}
                                        </div>

                                        {/* Resumo de atividade */}
                                        <div className="bg-card border border-border rounded-xl p-4">
                                            <p className="text-[9px] font-semibold tracking-widest text-muted-foreground mb-3">Resumo de Atividade</p>
                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                <div>
                                                    <p className="text-base font-semibold text-foreground">{selectedNegotiation.logs.length}</p>
                                                    <p className="text-[8px] font-medium text-muted-foreground uppercase">Eventos</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground">{formatDate(selectedNegotiation.startTime)}</p>
                                                    <p className="text-[8px] font-medium text-muted-foreground uppercase">Início</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground">{formatDate(selectedNegotiation.endTime)}</p>
                                                    <p className="text-[8px] font-medium text-muted-foreground uppercase">Último</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-16 text-center opacity-30">
                                        <Info size={32} className="mx-auto mb-3" />
                                        <p className="text-[10px] font-semibold tracking-widest">Metadados do pedido não encontrados</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Audit Trail</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Registros imutáveis organizados por negociação e evento</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchLogs} title="Recarregar"
                        className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:rotate-180 transition-all duration-500">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={exportToCSV}
                        className="h-9 px-4 rounded-lg text-[10px] font-semibold tracking-widest bg-foreground text-background hover:opacity-90 transition-all flex items-center gap-2">
                        <Download size={13} /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* ── Loading Skeleton ── */}
            {loading ? (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
                                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3 w-48" />
                                    <Skeleton className="h-2.5 w-32" />
                                </div>
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* ── KPIs ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KpiCard label="Total de Eventos" value={logs.length} icon={<FileText size={14} />} />
                        <KpiCard label="Fluxos de Negociação" value={negotiations.length} icon={<GitBranch size={14} />} color="text-primary" bg="bg-primary/10" />
                        <KpiCard label="Situações Críticas" value={negotiations.filter(n => n.status === 'critical').length}
                            icon={<AlertTriangle size={14} />} color="text-destructive" bg="bg-destructive/10" />
                        <KpiCard label="Eventos de Sistema" value={standalone.length} icon={<Shield size={14} />} />
                    </div>

                    {/* ── Toolbar ── */}
                    <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar cliente, profissional, serviço, ação ou ID..."
                                className="w-full h-9 rounded-lg pl-9 pr-4 text-sm outline-none bg-background border border-border text-foreground focus:border-primary transition-all" />
                        </div>
                        <div className="flex gap-1.5">
                            {(['all', 'negotiations', 'system'] as const).map(f => (
                                <button key={f} onClick={() => setActiveFilter(f)}
                                    className={`h-9 px-3 rounded-lg text-[10px] font-semibold tracking-widest transition-all ${activeFilter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                                    {f === 'all' ? 'Todos' : f === 'negotiations' ? 'Negociações' : 'Sistema'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Conteúdo ── */}
                    {(filteredNeg.length + filteredSta.length) === 0 ? (
                        <div className="py-24 text-center opacity-30">
                            <AlertCircle size={40} className="mx-auto mb-3" />
                            <p className="text-[10px] font-semibold tracking-widest">Nenhum evento encontrado</p>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* ── Negociações ── */}
                            {filteredNeg.length > 0 && (
                                <div className="space-y-2">
                                    <SectionLabel icon={<GitBranch size={13} />} label={`Fluxos de Negociação (${filteredNeg.length})`} />
                                    <div className="space-y-1.5">
                                        {filteredNeg.map(group => {
                                            const isExpanded = expandedGroup === group.id;
                                            const isSelected = selectedNegotiation?.id === group.id;
                                            const statusInfo = group.meta ? orderStatusLabel[group.meta.status] : null;

                                            return (
                                                <div key={group.id}
                                                    className={`bg-card rounded-xl border overflow-hidden transition-all ${statusRing(group.status)} ${isSelected ? 'ring-2' : ''}`}>
                                                    {/* Barra de status no topo */}
                                                    <div className={`h-0.5 w-full opacity-60 ${statusBg(group.status)}`} />

                                                    <div className="flex items-stretch">
                                                        {/* Expandir timeline */}
                                                        <button onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                                                            className="flex items-center gap-3 flex-1 p-4 text-left transition-all hover:bg-muted/30">
                                                            {/* Ícone status */}
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${group.status === 'critical' ? 'bg-destructive/10 text-destructive' :
                                                                group.status === 'attention' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                                                                    'bg-green-500/10 text-green-600 dark:text-green-400'}`}>
                                                                {group.status === 'critical' ? <AlertTriangle size={14} /> : group.status === 'attention' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <span className="text-xs font-semibold text-foreground truncate">
                                                                        {group.meta?.service_title || 'Pedido sem serviço'}
                                                                    </span>
                                                                    {statusInfo && (
                                                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusInfo.cls}`}>
                                                                            {statusInfo.label}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                    {group.meta?.client_name && (
                                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                            <User size={9} /> {group.meta.client_name}
                                                                            <ArrowRight size={8} className="opacity-40" />
                                                                            {group.meta.provider_name}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                                                        {group.logs.length} evento{group.logs.length !== 1 ? 's' : ''}
                                                                    </span>
                                                                    {group.meta?.payment_amount != null && (
                                                                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                                                            <DollarSign size={8} /> R$ {group.meta.payment_amount.toFixed(2)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 hidden sm:block text-right mr-2">
                                                                <p className="text-[9px] text-muted-foreground">{formatDate(group.startTime)}</p>
                                                                <p className="text-[9px] font-mono text-muted-foreground opacity-60">{formatTime(group.startTime)}</p>
                                                            </div>

                                                            <ChevronRight size={14} className={`shrink-0 text-muted-foreground transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </button>

                                                        {/* Abrir dossiê */}
                                                        <button onClick={() => setSelectedNegotiation(isSelected ? null : group)}
                                                            title="Ver dossiê de negociação"
                                                            className={`px-4 flex items-center border-l border-border transition-all hover:bg-primary/5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                                            <ExternalLink size={13} />
                                                        </button>
                                                    </div>

                                                    {/* Timeline expandida */}
                                                    {isExpanded && (
                                                        <div className="border-t border-border px-5 py-4 bg-muted/20">
                                                            {group.meta && (
                                                                <div className="mb-4 p-3 rounded-lg bg-card border border-border grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                    {[
                                                                        { label: 'Serviço', value: group.meta.service_title },
                                                                        { label: 'Cliente', value: group.meta.client_name },
                                                                        { label: 'Profissional', value: group.meta.provider_name },
                                                                        { label: 'Modalidade', value: group.meta.pricing_mode === 'hourly' ? 'Por Hora' : 'Valor Fixo' },
                                                                    ].map(item => (
                                                                        <div key={item.label}>
                                                                            <p className="text-[9px] font-semibold text-muted-foreground tracking-widest mb-0.5">{item.label}</p>
                                                                            <p className="text-[10px] font-medium text-foreground truncate">{item.value || '—'}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className="space-y-0">
                                                                {group.logs.map((log, i) => {
                                                                    const tag = getActionTag(log.action);
                                                                    const isLast = i === group.logs.length - 1;
                                                                    const detail = log.details || log.payload_json?.details || log.payload_json?.reason || null;
                                                                    return (
                                                                        <div key={log.id || i} className="flex gap-3">
                                                                            <div className="flex flex-col items-center shrink-0">
                                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${tag.cls}`}>
                                                                                    {getActionIcon(log.action, 10)}
                                                                                </div>
                                                                                {!isLast && <div className="w-px flex-1 mt-1 mb-1 bg-border" />}
                                                                            </div>
                                                                            <div className="flex-1 pb-3">
                                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${tag.cls}`}>
                                                                                        {log.action?.split('_').join(' ') || 'EVENTO'}
                                                                                    </span>
                                                                                    <span className="text-[9px] text-muted-foreground font-mono">{formatTime(getLogTime(log))}</span>
                                                                                    <span className="text-[9px] text-muted-foreground ml-auto">{formatDate(getLogTime(log))}</span>
                                                                                </div>
                                                                                {detail && <p className="text-[10px] text-muted-foreground leading-relaxed italic">&ldquo;{detail}&rdquo;</p>}
                                                                                <div className="flex items-center gap-3 mt-1">
                                                                                    <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                                                                                        <User size={8} /> {log.actor_user_id ? `Agente: ${log.actor_user_id.slice(0, 8)}...` : 'Sistema'}
                                                                                    </span>
                                                                                    {log.entity_type && (
                                                                                        <span className="text-[9px] text-muted-foreground font-mono">
                                                                                            {log.entity_type} · {(log.entity_id || '').slice(0, 8)}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Eventos de Sistema ── */}
                            {filteredSta.length > 0 && (
                                <div className="space-y-2">
                                    <SectionLabel icon={<Zap size={13} />} label={`Eventos de Sistema (${filteredSta.length})`} />
                                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                                        {/* Scroll horizontal para tabela com colunas largas */}
                                        <div className="overflow-x-auto">
                                            <table className="text-left border-collapse"
                                                style={{ width: colWidths.reduce((a, b) => a + b, 0) + 40, tableLayout: 'fixed', minWidth: '100%' }}>
                                                <colgroup>
                                                    {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                                                </colgroup>
                                                <thead>
                                                    <tr className="border-b border-border bg-muted/50">
                                                        {(['Ação', 'Entidade', 'Detalhes', 'Agente', 'Timestamp'] as const).map((label, i) => (
                                                            <th key={label}
                                                                className="relative px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground select-none group"
                                                                style={{ width: colWidths[i], overflow: 'hidden' }}>
                                                                <span className="truncate block pr-3">{label}</span>
                                                                {/* Divisor arrastável — igual às planilhas */}
                                                                {i < 4 && (
                                                                    <div
                                                                        onMouseDown={(e) => onColResize(i, e)}
                                                                        className="absolute right-0 top-0 h-full w-4 flex items-center justify-center cursor-col-resize z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        title="Arraste para redimensionar"
                                                                    >
                                                                        <div className="w-[2px] h-4 bg-primary rounded-full" />
                                                                    </div>
                                                                )}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredSta.slice(0, 100).map((log, i) => {
                                                        const tag = getActionTag(log.action);
                                                        return (
                                                            <tr key={log.id || i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-all">
                                                                <td className="px-4 py-3" style={{ overflow: 'hidden' }}>
                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase whitespace-nowrap ${tag.cls}`}>
                                                                        {log.action?.split('_').join(' ') || 'EVENT'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3" style={{ overflow: 'hidden' }}>
                                                                    <p className="text-[10px] text-muted-foreground font-mono truncate">{log.entity_type || '—'}</p>
                                                                    {log.entity_id && (
                                                                        <p className="text-[10px] text-muted-foreground font-mono opacity-60 truncate">{log.entity_id}</p>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3" style={{ overflow: 'hidden' }}>
                                                                    <p className="text-xs text-muted-foreground" style={{ whiteSpace: colWidths[2] > 250 ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {log.details || log.payload_json?.details || '—'}
                                                                    </p>
                                                                </td>
                                                                <td className="px-4 py-3" style={{ overflow: 'hidden' }}>
                                                                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                                                                        {log.actor_user_id || 'Sistema'}
                                                                    </p>
                                                                </td>
                                                                <td className="px-4 py-3" style={{ overflow: 'hidden' }}>
                                                                    <p className="text-[10px] font-medium text-muted-foreground font-mono whitespace-nowrap">{formatDate(getLogTime(log))}</p>
                                                                    <p className="text-[10px] font-mono text-muted-foreground opacity-60 whitespace-nowrap">{formatTime(getLogTime(log))}</p>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditLogs;

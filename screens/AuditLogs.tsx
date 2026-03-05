import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    RefreshCw,
    Download,
    ChevronRight,
    FileText,
    Shield,
    Zap,
    GitBranch,
    Layers,
    AlertCircle,
    X,
    User,
    Clock,
    DollarSign,
    Activity,
    Package,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    MessageSquare,
    ArrowRight,
    ExternalLink,
    Info,
    ChevronDown
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ─────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────
interface AuditLog {
    id: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    actor_user_id?: string;
    payload_json?: any;
    created_at?: string;
    order_id?: string;
    details?: string;
    timestamp?: string;
    reason?: string;
}

interface OrderMeta {
    id: string;
    status: string;
    pricing_mode?: string;
    total_amount?: number;
    scheduled_at?: string;
    location_text?: string;
    client_name?: string;
    client_email?: string;
    provider_name?: string;
    provider_email?: string;
    service_title?: string;
    payment_status?: string;
    payment_amount?: number;
}

interface NegotiationGroup {
    id: string;
    orderId: string;
    logs: AuditLog[];
    startTime: string;
    endTime: string;
    lastAction: string;
    meta?: OrderMeta;
    status: 'clean' | 'attention' | 'critical';
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

/** Retorna o timestamp mais confiável do log */
const getLogTime = (log: AuditLog): string =>
    log.created_at || log.timestamp || '';

/** Ação → cor de badge */
const getActionTag = (action: string) => {
    const a = (action || '').toUpperCase();
    if (a.includes('BLOCK') || a.includes('BAN') || a.includes('CANCEL') || a.includes('REFUND') || a.includes('REJECT'))
        return { style: { background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }, dot: '#ef4444' };
    if (a.includes('PAYMENT') || a.includes('RELEASE') || a.includes('COMPLETE') || a.includes('APPROVE'))
        return { style: { background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }, dot: '#10b981' };
    if (a.includes('DISPUTE') || a.includes('RISK') || a.includes('WARN') || a.includes('SLA'))
        return { style: { background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }, dot: '#f59e0b' };
    if (a.includes('ORDER') || a.includes('SERVICE') || a.includes('USER'))
        return { style: { background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }, dot: '#6366f1' };
    return { style: { background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', border: '1px solid rgba(0,0,0,0.06)' }, dot: '#9ca3af' };
};

/** Ícone por tipo de ação */
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

const formatDateTime = (ts: string) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
};

const formatDate = (ts: string) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (ts: string) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const orderStatusLabel: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: '#9ca3af' },
    sent: { label: 'Enviado', color: '#6366f1' },
    accepted: { label: 'Aceito', color: '#6366f1' },
    awaiting_payment: { label: 'Aguardando Pagamento', color: '#f59e0b' },
    paid_escrow_held: { label: 'Pagamento Retido', color: '#10b981' },
    in_execution: { label: 'Em Execução', color: '#6366f1' },
    completed: { label: 'Concluído', color: '#10b981' },
    cancelled: { label: 'Cancelado', color: '#ef4444' },
    disputed: { label: 'Disputado', color: '#f59e0b' },
    rejected: { label: 'Recusado', color: '#ef4444' },
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

    // ── Fetch principal ──────────────────────────────────
    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);

            // 1) Buscar todos os audit_logs
            const { data: rawData, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);

            if (error) throw error;
            const rawLogs = (rawData || []) as AuditLog[];
            setLogs(rawLogs);

            // 2) Coletar order IDs vinculados
            const orderIds = Array.from(new Set(
                rawLogs
                    .map(l => l.order_id ?? (l.entity_type === 'ORDER' ? l.entity_id : null))
                    .filter((id): id is string => Boolean(id))
            ));

            if (!orderIds.length) return;

            // 3) Buscar metadados dos pedidos (paralelo)
            const [ordersRes, paymentsRes] = await Promise.all([
                supabase
                    .from('orders')
                    .select(`
                        id, status, pricing_mode, scheduled_at, location_text,
                        client:users!client_id  (id, name, email),
                        provider:users!provider_id (id, name, email),
                        service:services (id, title)
                    `)
                    .in('id', orderIds),
                supabase
                    .from('payments')
                    .select('order_id, amount_total, escrow_status')
                    .in('order_id', orderIds)
            ]);

            const ordersData = (ordersRes.data || []) as any[];
            const paymentsData = (paymentsRes.data || []) as any[];

            const metaMap: Record<string, OrderMeta> = {};
            ordersData.forEach(o => {
                const payment = paymentsData.find(p => p.order_id === o.id);
                metaMap[o.id] = {
                    id: o.id,
                    status: o.status || 'unknown',
                    pricing_mode: o.pricing_mode,
                    scheduled_at: o.scheduled_at,
                    location_text: o.location_text,
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
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();

        // Realtime: novos logs
        const ch = supabase
            .channel('audit-logs-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, payload => {
                setLogs(prev => [payload.new as AuditLog, ...prev]);
            })
            .subscribe();

        return () => { supabase.removeChannel(ch); };
    }, [fetchLogs]);

    // ── Agrupamento de logs por negociação ───────────────
    const { negotiations, standalone } = React.useMemo(() => {
        const orderGroups: Record<string, AuditLog[]> = {};
        const standalone: AuditLog[] = [];

        logs.forEach(log => {
            // Tenta vincular ao pedido via order_id ou entity_id
            const refId = log.order_id ?? (log.entity_type === 'ORDER' ? log.entity_id : null);
            if (refId) {
                if (!orderGroups[refId]) orderGroups[refId] = [];
                orderGroups[refId].push(log);
            } else {
                standalone.push(log);
            }
        });

        const negotiations: NegotiationGroup[] = Object.entries(orderGroups)
            .map(([orderId, groupLogs]) => {
                const sorted = [...groupLogs].sort(
                    (a, b) => new Date(getLogTime(a)).getTime() - new Date(getLogTime(b)).getTime()
                );
                const lastAction = sorted[sorted.length - 1]?.action || '';
                const hasError = sorted.some(l => {
                    const a = (l.action || '').toUpperCase();
                    return a.includes('DISPUTE') || a.includes('CANCEL') || a.includes('REFUND') || a.includes('BLOCK');
                });
                const hasWarn = sorted.some(l => {
                    const a = (l.action || '').toUpperCase();
                    return a.includes('RISK') || a.includes('REJECT') || a.includes('WARN');
                });

                return {
                    id: `neg-${orderId}`,
                    orderId,
                    logs: sorted,
                    startTime: getLogTime(sorted[0]),
                    endTime: getLogTime(sorted[sorted.length - 1]),
                    lastAction,
                    meta: orderMeta[orderId],
                    status: (hasError ? 'critical' : hasWarn ? 'attention' : 'clean') as 'clean' | 'attention' | 'critical',
                };
            })
            .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

        return { negotiations, standalone };
    }, [logs, orderMeta]);

    // ── Filtro + Busca ───────────────────────────────────
    const { filteredNeg, filteredSta } = React.useMemo(() => {
        const q = searchTerm.toLowerCase();

        const negMatch = (n: NegotiationGroup) =>
            n.orderId.toLowerCase().includes(q) ||
            (n.meta?.client_name || '').toLowerCase().includes(q) ||
            (n.meta?.provider_name || '').toLowerCase().includes(q) ||
            (n.meta?.service_title || '').toLowerCase().includes(q) ||
            n.logs.some(l => (l.action || '').toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q));

        const staMatch = (l: AuditLog) =>
            (l.action || '').toLowerCase().includes(q) ||
            (l.details || '').toLowerCase().includes(q) ||
            (l.entity_type || '').toLowerCase().includes(q);

        if (activeFilter === 'negotiations') return { filteredNeg: negotiations.filter(negMatch), filteredSta: [] };
        if (activeFilter === 'system') return { filteredNeg: [], filteredSta: standalone.filter(staMatch) };
        return { filteredNeg: negotiations.filter(negMatch), filteredSta: standalone.filter(staMatch) };
    }, [negotiations, standalone, searchTerm, activeFilter]);

    // ── Export CSV ───────────────────────────────────────
    const exportToCSV = () => {
        const header = 'ID,Action,EntityType,EntityId,OrderRef,Actor,Details,Timestamp';
        const rows = logs.map(l =>
            `"${l.id}","${l.action || ''}","${l.entity_type || ''}","${l.entity_id || ''}","${l.order_id || ''}","${l.actor_user_id || ''}","${(l.details || l.payload_json?.details || '').replace(/"/g, "''")}","${getLogTime(l)}"`
        );
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_trail_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────
    return (
        <div className="flex gap-0 h-full animate-fade-in overflow-hidden">

            {/* ── Painel Principal ─────────────────────── */}
            <div className="flex-1 flex flex-col space-y-5 overflow-y-auto p-6 pb-12">

                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[22px] font-semibold text-text-primary">Audit Trail</h1>
                        <p className="text-[13px] text-text-secondary mt-0.5">
                            Registros imutáveis organizados por negociação e evento
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchLogs}
                            title="Recarregar"
                            className="p-2.5 rounded-[8px] border border-border-subtle transition-all duration-500 hover:rotate-180"
                            style={{ background: 'var(--bg-secondary)' }}
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="h-10 px-5 rounded-[8px] text-[10px] font-semibold uppercase tracking-widest text-white flex items-center gap-2 hover:opacity-90 transition-all"
                            style={{ background: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                        >
                            <Download size={13} /> Exportar CSV
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard label="Total de Eventos" value={logs.length} icon={<FileText size={13} />} />
                    <KpiCard label="Fluxos de Negociação" value={negotiations.length} icon={<GitBranch size={13} />} color="text-accent-primary" />
                    <KpiCard label="Situações Críticas" value={negotiations.filter(n => n.status === 'critical').length} icon={<AlertTriangle size={13} />} color="text-error" />
                    <KpiCard label="Eventos de Sistema" value={standalone.length} icon={<Shield size={13} />} />
                </div>

                {/* Toolbar */}
                <div
                    className="flex flex-col md:flex-row gap-3 p-4"
                    style={{ background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por cliente, profissional, serviço, ação ou ID..."
                            className="w-full h-10 rounded-[8px] pl-10 pr-4 text-sm outline-none transition-all"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div className="flex gap-2">
                        {([
                            { id: 'all', label: 'Todos' },
                            { id: 'negotiations', label: 'Negociações' },
                            { id: 'system', label: 'Sistema' },
                        ] as const).map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id)}
                                className="h-10 px-4 rounded-[8px] text-[10px] font-semibold uppercase tracking-widest transition-all duration-[120ms]"
                                style={activeFilter === f.id
                                    ? { background: 'var(--text-primary)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                                    : { background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: '1px solid rgba(0,0,0,0.06)' }
                                }
                            >{f.label}</button>
                        ))}
                    </div>
                </div>

                {/* Conteúdo */}
                {loading ? (
                    <div className="py-32 text-center">
                        <RefreshCw size={28} className="animate-spin mx-auto text-text-tertiary mb-4" />
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Consolidando Registros de Auditoria...</p>
                    </div>
                ) : (filteredNeg.length + filteredSta.length) === 0 ? (
                    <div className="py-32 text-center opacity-30">
                        <AlertCircle size={48} className="mx-auto mb-4" />
                        <p className="text-sm font-semibold uppercase tracking-widest">Nenhum evento encontrado</p>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* ── NEGOCIAÇÕES ────────────────────────── */}
                        {filteredNeg.length > 0 && (
                            <div className="space-y-2">
                                <SectionLabel icon={<GitBranch size={13} />} label={`Fluxos de Negociação (${filteredNeg.length})`} />

                                {filteredNeg.map(group => {
                                    const isExpanded = expandedGroup === group.id;
                                    const isSelected = selectedNegotiation?.id === group.id;
                                    const tag = getActionTag(group.lastAction);
                                    const statusInfo = group.meta ? orderStatusLabel[group.meta.status] : null;

                                    return (
                                        <div
                                            key={group.id}
                                            style={{
                                                background: 'var(--bg-primary)',
                                                borderRadius: '10px',
                                                border: isSelected
                                                    ? '1px solid rgba(99,102,241,0.4)'
                                                    : group.status === 'critical'
                                                        ? '1px solid rgba(239,68,68,0.2)'
                                                        : '1px solid rgba(0,0,0,0.06)',
                                                boxShadow: isSelected ? '0 0 0 2px rgba(99,102,241,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
                                                overflow: 'hidden',
                                                transition: 'all 150ms ease-out'
                                            }}
                                        >
                                            {/* Linha de status colorida no topo */}
                                            <div className="h-0.5 w-full" style={{
                                                background: group.status === 'critical' ? '#ef4444' : group.status === 'attention' ? '#f59e0b' : '#10b981',
                                                opacity: 0.6
                                            }} />

                                            {/* Header do grupo */}
                                            <div className="flex items-stretch">
                                                {/* Botão expandir/colapsar timeline */}
                                                <button
                                                    onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                                                    className="flex items-center gap-4 flex-1 p-4 text-left transition-all hover:bg-bg-secondary/40"
                                                >
                                                    {/* Ícone status */}
                                                    <div className="shrink-0">
                                                        <div
                                                            className="w-9 h-9 rounded-[8px] flex items-center justify-center"
                                                            style={{
                                                                background: group.status === 'critical' ? 'rgba(239,68,68,0.1)' : group.status === 'attention' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                                                color: group.status === 'critical' ? '#ef4444' : group.status === 'attention' ? '#f59e0b' : '#10b981'
                                                            }}
                                                        >
                                                            {group.status === 'critical' ? <AlertTriangle size={16} /> : group.status === 'attention' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                                                        </div>
                                                    </div>

                                                    {/* Informações da negociação */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            {/* Serviço */}
                                                            <span className="text-xs font-semibold text-text-primary truncate">
                                                                {group.meta?.service_title || 'Pedido sem serviço'}
                                                            </span>
                                                            {/* Status do pedido */}
                                                            {statusInfo && (
                                                                <span
                                                                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                                                                    style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}
                                                                >
                                                                    {statusInfo.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            {/* Cliente → Profissional */}
                                                            {group.meta?.client_name && (
                                                                <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                                                                    <User size={10} /> {group.meta.client_name}
                                                                    <ArrowRight size={9} className="opacity-40" />
                                                                    {group.meta.provider_name}
                                                                </span>
                                                            )}
                                                            {/* Nº de eventos */}
                                                            <span className="text-[9px] font-semibold text-text-tertiary px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                                                                {group.logs.length} evento{group.logs.length !== 1 ? 's' : ''}
                                                            </span>
                                                            {/* Valor */}
                                                            {group.meta?.payment_amount != null && (
                                                                <span className="text-[9px] font-semibold text-text-tertiary flex items-center gap-1">
                                                                    <DollarSign size={9} /> R$ {group.meta.payment_amount.toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Timestamps + chevron */}
                                                    <div className="shrink-0 text-right hidden sm:block">
                                                        <p className="text-[9px] text-text-tertiary mb-0.5">Início</p>
                                                        <p className="text-[10px] font-medium text-text-primary">{formatDate(group.startTime)}</p>
                                                        <p className="text-[9px] text-text-tertiary font-mono">{formatTime(group.startTime)}</p>
                                                    </div>

                                                    <div
                                                        className="shrink-0 text-text-tertiary transition-transform duration-[120ms]"
                                                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                                                    >
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </button>

                                                {/* Botão abrir dossiê lateral */}
                                                <button
                                                    onClick={() => setSelectedNegotiation(isSelected ? null : group)}
                                                    className="px-4 flex items-center justify-center border-l border-border-subtle transition-all hover:bg-accent-primary/5"
                                                    title="Ver dossiê completo"
                                                    style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>

                                            {/* ── Timeline expandida ──────────────────── */}
                                            {isExpanded && (
                                                <div
                                                    className="border-t border-border-subtle px-6 py-5"
                                                    style={{ background: 'var(--bg-secondary)' }}
                                                >
                                                    {/* Contexto rápido da negociação */}
                                                    {group.meta && (
                                                        <div
                                                            className="mb-5 p-4 rounded-[8px] grid grid-cols-2 md:grid-cols-4 gap-4"
                                                            style={{ background: 'var(--bg-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
                                                        >
                                                            <NegCtxItem label="Serviço" value={group.meta.service_title} />
                                                            <NegCtxItem label="Cliente" value={group.meta.client_name} sub={group.meta.client_email} />
                                                            <NegCtxItem label="Profissional" value={group.meta.provider_name} sub={group.meta.provider_email} />
                                                            <NegCtxItem label="Modalidade" value={group.meta.pricing_mode === 'hourly' ? 'Por Hora' : 'Valor Fixo'} />
                                                        </div>
                                                    )}

                                                    {/* Timeline vertical */}
                                                    <div className="space-y-0">
                                                        {group.logs.map((log, i) => {
                                                            const tag = getActionTag(log.action);
                                                            const isLast = i === group.logs.length - 1;
                                                            const detail = log.details
                                                                || log.payload_json?.details
                                                                || log.payload_json?.reason
                                                                || null;
                                                            const actorName = log.actor_user_id
                                                                ? `Agente: ${log.actor_user_id.slice(0, 8)}...`
                                                                : 'Sistema';

                                                            return (
                                                                <div key={log.id || i} className="flex gap-4">
                                                                    {/* Linha + nó */}
                                                                    <div className="flex flex-col items-center shrink-0">
                                                                        <div
                                                                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                                                                            style={{ background: `${tag.dot}18`, color: tag.dot, border: `1.5px solid ${tag.dot}40` }}
                                                                        >
                                                                            {getActionIcon(log.action, 12)}
                                                                        </div>
                                                                        {!isLast && <div className="w-px flex-1 mt-1 mb-1" style={{ background: 'var(--border-subtle)' }} />}
                                                                    </div>

                                                                    {/* Conteúdo do evento */}
                                                                    <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
                                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span
                                                                                    className="px-2 py-0.5 rounded-[4px] text-[9px] font-semibold uppercase"
                                                                                    style={tag.style}
                                                                                >
                                                                                    {log.action?.split('_').join(' ') || 'EVENTO'}
                                                                                </span>
                                                                                <span className="text-[9px] text-text-tertiary font-mono">
                                                                                    {formatTime(getLogTime(log))}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-[9px] text-text-tertiary shrink-0">{formatDate(getLogTime(log))}</span>
                                                                        </div>

                                                                        {/* Detalhes do log */}
                                                                        {detail && (
                                                                            <p className="text-[10px] text-text-secondary leading-relaxed italic mt-1 mb-1">
                                                                                "{detail}"
                                                                            </p>
                                                                        )}

                                                                        {/* Actor + metadados extras */}
                                                                        <div className="flex items-center gap-3 flex-wrap mt-1">
                                                                            <span className="text-[9px] text-text-tertiary font-mono flex items-center gap-1">
                                                                                <User size={9} /> {actorName}
                                                                            </span>
                                                                            {log.entity_type && (
                                                                                <span className="text-[9px] text-text-tertiary font-mono">
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
                        )}

                        {/* ── EVENTOS SISTEMA ────────────────────── */}
                        {filteredSta.length > 0 && (
                            <div className="space-y-2">
                                <SectionLabel icon={<Zap size={13} />} label={`Eventos de Sistema (${filteredSta.length})`} />

                                <div style={{
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                    overflow: 'hidden'
                                }}>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border-subtle" style={{ background: 'var(--bg-secondary)' }}>
                                                <th className="px-5 py-3.5 text-[9px] font-semibold uppercase tracking-widest text-text-tertiary">Ação</th>
                                                <th className="px-5 py-3.5 text-[9px] font-semibold uppercase tracking-widest text-text-tertiary">Entidade</th>
                                                <th className="px-5 py-3.5 text-[9px] font-semibold uppercase tracking-widest text-text-tertiary">Detalhes</th>
                                                <th className="px-5 py-3.5 text-[9px] font-semibold uppercase tracking-widest text-text-tertiary">Agente</th>
                                                <th className="px-5 py-3.5 text-[9px] font-semibold uppercase tracking-widest text-text-tertiary text-right">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-subtle">
                                            {filteredSta.slice(0, 100).map((log, i) => {
                                                const tag = getActionTag(log.action);
                                                return (
                                                    <tr key={log.id || i} className="transition-all hover:bg-bg-secondary/50">
                                                        <td className="px-5 py-3">
                                                            <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-semibold uppercase" style={tag.style}>
                                                                {log.action?.split('_').join(' ') || 'EVENT'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <p className="text-[9px] text-text-tertiary font-mono uppercase">{log.entity_type || '—'}</p>
                                                            {log.entity_id && <p className="text-[9px] text-text-tertiary font-mono opacity-60">{log.entity_id.slice(0, 10)}...</p>}
                                                        </td>
                                                        <td className="px-5 py-3 max-w-xs">
                                                            <p className="text-[10px] text-text-secondary truncate">
                                                                {log.details || log.payload_json?.details || '—'}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <p className="text-[9px] text-text-tertiary font-mono">
                                                                {log.actor_user_id ? log.actor_user_id.slice(0, 10) + '...' : 'Sistema'}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <p className="text-[9px] font-medium text-text-tertiary font-mono">{formatDate(getLogTime(log))}</p>
                                                            <p className="text-[9px] font-mono text-text-tertiary opacity-60">{formatTime(getLogTime(log))}</p>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── PAINEL DOSSIÊ DA NEGOCIAÇÃO ──────────── */}
            {selectedNegotiation && (
                <div
                    className="w-[420px] shrink-0 border-l border-border-subtle flex flex-col overflow-hidden"
                    style={{ background: 'var(--bg-primary)' }}
                >
                    {/* Cabeçalho do dossiê */}
                    <div className="p-5 border-b border-border-subtle" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-text-primary">Dossiê de Negociação</h3>
                            <button
                                onClick={() => setSelectedNegotiation(null)}
                                className="p-1.5 rounded-[6px] hover:bg-bg-tertiary transition-colors border border-border-subtle"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <p className="text-[10px] font-mono text-text-tertiary">#{selectedNegotiation.orderId.slice(0, 16)}</p>

                        {/* Status badge */}
                        <div className="mt-3">
                            <span
                                className="px-3 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest"
                                style={{
                                    background: selectedNegotiation.status === 'critical' ? 'rgba(239,68,68,0.1)' : selectedNegotiation.status === 'attention' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                    color: selectedNegotiation.status === 'critical' ? '#ef4444' : selectedNegotiation.status === 'attention' ? '#f59e0b' : '#10b981'
                                }}
                            >
                                {selectedNegotiation.status === 'critical' ? '⚠ Atenção Crítica' : selectedNegotiation.status === 'attention' ? '⚡ Monitorar' : '✓ Normal'}
                            </span>
                        </div>
                    </div>

                    {/* Metadados do pedido */}
                    <div className="overflow-y-auto flex-1 p-5 space-y-5">
                        {selectedNegotiation.meta ? (
                            <>
                                {/* Partes envolvidas */}
                                <div
                                    className="p-4 rounded-[8px] space-y-3"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)' }}
                                >
                                    <p className="text-[9px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">Partes da Negociação</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-[6px] bg-accent-primary text-white flex items-center justify-center font-semibold text-xs shrink-0">
                                            {(selectedNegotiation.meta.client_name || 'C').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-text-primary">{selectedNegotiation.meta.client_name}</p>
                                            <p className="text-[9px] text-text-tertiary font-mono">{selectedNegotiation.meta.client_email}</p>
                                            <span className="text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-bg-tertiary text-text-tertiary">Cliente</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-4">
                                        <div className="w-px h-4 bg-border-subtle" />
                                        <ArrowRight size={10} className="text-text-tertiary" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-[6px] bg-bg-tertiary text-text-primary flex items-center justify-center font-semibold text-xs shrink-0 border border-border-subtle">
                                            {(selectedNegotiation.meta.provider_name || 'P').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-text-primary">{selectedNegotiation.meta.provider_name}</p>
                                            <p className="text-[9px] text-text-tertiary font-mono">{selectedNegotiation.meta.provider_email}</p>
                                            <span className="text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-bg-tertiary text-text-tertiary">Profissional</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Detalhes do pedido */}
                                <div
                                    className="p-4 rounded-[8px] space-y-2"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)' }}
                                >
                                    <p className="text-[9px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">Dados do Pedido</p>
                                    <DossierRow label="Serviço" value={selectedNegotiation.meta.service_title} />
                                    <DossierRow label="Modalidade" value={selectedNegotiation.meta.pricing_mode === 'hourly' ? 'Por Hora' : 'Valor Fixo'} />
                                    <DossierRow label="Status atual" value={orderStatusLabel[selectedNegotiation.meta.status]?.label || selectedNegotiation.meta.status} />
                                    <DossierRow label="Agendamento" value={selectedNegotiation.meta.scheduled_at ? formatDate(selectedNegotiation.meta.scheduled_at) : '—'} />
                                    <DossierRow label="Local" value={selectedNegotiation.meta.location_text || '—'} />
                                    {selectedNegotiation.meta.payment_amount != null && (
                                        <DossierRow label="Valor Total" value={`R$ ${selectedNegotiation.meta.payment_amount.toFixed(2)}`} highlight />
                                    )}
                                    {selectedNegotiation.meta.payment_status && (
                                        <DossierRow label="Escrow" value={selectedNegotiation.meta.payment_status} />
                                    )}
                                </div>

                                {/* Resumo de eventos */}
                                <div
                                    className="p-4 rounded-[8px]"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)' }}
                                >
                                    <p className="text-[9px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">Resumo de Atividade</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center">
                                            <p className="text-base font-semibold text-text-primary">{selectedNegotiation.logs.length}</p>
                                            <p className="text-[8px] font-medium text-text-tertiary uppercase">Eventos</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-base font-semibold text-text-primary">{formatDate(selectedNegotiation.startTime)}</p>
                                            <p className="text-[8px] font-medium text-text-tertiary uppercase">Início</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-base font-semibold text-text-primary">{formatDate(selectedNegotiation.endTime)}</p>
                                            <p className="text-[8px] font-medium text-text-tertiary uppercase">Último</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Negociação sem meta = pedido não encontrado */
                            <div className="py-16 text-center opacity-30">
                                <Info size={32} className="mx-auto mb-3" />
                                <p className="text-[10px] font-semibold uppercase tracking-widest">Metadados do pedido não encontrados</p>
                                <p className="text-[9px] text-text-tertiary mt-2">ID: {selectedNegotiation.orderId}</p>
                            </div>
                        )}

                        {/* Timeline completa no painel */}
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">
                                Timeline Completa ({selectedNegotiation.logs.length} eventos)
                            </p>
                            <div className="space-y-0">
                                {selectedNegotiation.logs.map((log, i) => {
                                    const tag = getActionTag(log.action);
                                    const isLast = i === selectedNegotiation.logs.length - 1;
                                    const detail = log.details || log.payload_json?.details || log.payload_json?.reason;
                                    return (
                                        <div key={log.id || i} className="flex gap-3">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center z-10"
                                                    style={{ background: `${tag.dot}18`, color: tag.dot, border: `1.5px solid ${tag.dot}30` }}
                                                >
                                                    {getActionIcon(log.action, 10)}
                                                </div>
                                                {!isLast && <div className="w-px flex-1 mt-1 mb-1" style={{ background: 'var(--border-subtle)' }} />}
                                            </div>
                                            <div className="flex-1 pb-3">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    <span className="px-1.5 py-0.5 rounded-[3px] text-[8px] font-semibold uppercase" style={tag.style}>
                                                        {log.action?.split('_').join(' ') || 'EVENTO'}
                                                    </span>
                                                    <span className="text-[8px] text-text-tertiary font-mono">
                                                        {formatTime(getLogTime(log))} · {formatDate(getLogTime(log))}
                                                    </span>
                                                </div>
                                                {detail && (
                                                    <p className="text-[9px] text-text-secondary leading-relaxed italic">"{detail}"</p>
                                                )}
                                                {log.actor_user_id && (
                                                    <p className="text-[8px] text-text-tertiary font-mono mt-0.5">
                                                        {log.actor_user_id.slice(0, 12)}...
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, color }: any) => (
    <div
        className="p-4 flex items-center gap-3"
        style={{ background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
        <div className={`p-2 rounded-[6px] bg-bg-secondary border border-border-subtle ${color || 'text-text-secondary'}`}>{icon}</div>
        <div>
            <p className="text-[9px] font-medium text-text-tertiary uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-lg font-semibold text-text-primary leading-none">{value}</p>
        </div>
    </div>
);

const SectionLabel = ({ icon, label }: any) => (
    <div className="flex items-center gap-2 px-1 mb-1">
        <span className="text-text-tertiary">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">{label}</span>
    </div>
);

const NegCtxItem = ({ label, value, sub }: any) => (
    <div>
        <p className="text-[8px] font-semibold uppercase tracking-widest text-text-tertiary mb-0.5">{label}</p>
        <p className="text-[10px] font-medium text-text-primary truncate">{value || '—'}</p>
        {sub && <p className="text-[9px] text-text-tertiary font-mono truncate">{sub}</p>}
    </div>
);

const DossierRow = ({ label, value, highlight }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
        <span className="text-[9px] font-medium text-text-tertiary uppercase tracking-widest">{label}</span>
        <span className={`text-[10px] font-semibold ${highlight ? 'text-accent-primary' : 'text-text-primary'} font-mono text-right max-w-[60%] truncate`}>{value}</span>
    </div>
);

export default AuditLogs;

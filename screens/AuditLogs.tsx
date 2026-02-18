import React, { useState, useEffect } from 'react';
import {
    History,
    Search,
    Filter,
    Shield,
    Database,
    User as UserIcon,
    AlertCircle,
    CheckCircle2,
    Info,
    ArrowUpDown,
    Package,
    ArrowRight,
    ChevronRight,
    ChevronDown,
    Clock,
    Activity,
    MessageSquare,
    DollarSign,
    Scale,
    ShieldCheck,
    FileText,
    Download
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';

interface NegotiationGroup {
    id: string;
    clientName: string;
    providerName: string;
    serviceTitle: string;
    lastCreatedAt: string;
    lastAction: string;
    logs: any[];
}

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEvent, setFilterEvent] = useState('all');
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [orderMetadata, setOrderMetadata] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchLogs();

        const channel = supabase
            .channel('audit_log_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'audit_logs'
                },
                (payload) => {
                    console.log('🔔 Novo log detectado:', payload);
                    fetchLogs();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const actionMap: Record<string, { label: string, color: string }> = {
        'INSERT': { label: 'Criação', color: 'bg-emerald-500/10 text-emerald-500' },
        'UPDATE': { label: 'Atualização', color: 'bg-blue-500/10 text-blue-500' },
        'DELETE': { label: 'Remoção', color: 'bg-rose-500/10 text-rose-500' },
        'ORDER_CREATED': { label: 'Pedido Criado', color: 'bg-indigo-500/10 text-indigo-500' },
        'ORDER_ACCEPTED': { label: 'Aceito', color: 'bg-emerald-500/10 text-emerald-500' },
        'ORDER_REJECTED': { label: 'Recusado', color: 'bg-rose-500/10 text-rose-500' },
        'ORDER_COUNTER_OFFER': { label: 'Contraproposta', color: 'bg-amber-500/10 text-amber-500' },
        'EXECUTION_STARTED_MARK': { label: 'Início Sinalizado', color: 'bg-cyan-500/10 text-cyan-500' },
        'EXECUTION_STARTED_CONFIRM': { label: 'Presença Confirmada', color: 'bg-emerald-500/10 text-emerald-500' },
        'EXECUTION_FINISHED_MARK': { label: 'Fim Sinalizado', color: 'bg-cyan-500/10 text-cyan-500' },
        'EXECUTION_FINISHED_CONFIRM': { label: 'Conclusão Confirmada', color: 'bg-emerald-500/10 text-emerald-500' },
        'DISPUTE_OPENED': { label: 'Disputa Aberta', color: 'bg-rose-500/10 text-rose-500' },
        'PAYMENT_CAPTURED': { label: 'Pagamento Capturado', color: 'bg-emerald-500/10 text-emerald-500' },
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data: auditData, error: auditError } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    actor:users!actor_user_id (
                        name,
                        email
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(200);

            if (auditError) throw auditError;

            const currentLogs = auditData || [];
            setLogs(currentLogs);

            // Buscar metadados dos pedidos em lote
            const orderIds = Array.from(new Set(
                currentLogs
                    .filter(l => l.entity_type === 'orders' || l.entity_type === 'disputes' || l.entity_type === 'executions')
                    .map(l => {
                        if (l.entity_type === 'orders') return l.entity_id;
                        if (l.entity_type === 'disputes' && l.payload_json?.order_id) return l.payload_json.order_id;
                        if (l.entity_type === 'executions' && l.payload_json?.order_id) return l.payload_json.order_id;
                        return l.entity_id;
                    })
                    .filter(id => id && id.length > 20) // Garantir IDs válidos do UUID
            ));

            if (orderIds.length > 0) {
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        client:users!client_id(name, email),
                        provider:users!provider_id(name, email),
                        service:services!service_id(title)
                    `)
                    .in('id', orderIds);

                const meta: Record<string, any> = {};
                ordersData?.forEach(o => { meta[o.id] = o; });
                setOrderMetadata(meta);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Evento', 'Ator', 'Entidade', 'Data', 'Descricao'];
        const rows = logs.map(l => [
            l.id,
            l.action,
            l.actor?.name || l.actor?.email || 'System',
            `${l.entity_type}:${l.entity_id}`,
            new Date(l.created_at).toISOString(),
            (l.payload_json?.details || l.payload_json?.description || '').replace(/,/g, ';')
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Agrupamento de logs por negociação
    const getGroupedLogs = () => {
        const groups: Record<string, NegotiationGroup> = {};
        const standalone: any[] = [];

        logs.forEach(log => {
            const isOrderRelated = log.entity_type === 'orders' || log.entity_type === 'disputes' || log.entity_type === 'executions';
            let orderId = null;

            if (log.entity_type === 'orders') {
                orderId = log.entity_id;
            } else if (log.entity_type === 'disputes' && log.payload_json?.order_id) {
                orderId = log.payload_json.order_id;
            } else if (log.entity_type === 'executions' && log.payload_json?.order_id) {
                orderId = log.payload_json.order_id;
            }

            if (isOrderRelated && orderId) {
                if (!groups[orderId]) {
                    const meta = orderMetadata[orderId];
                    groups[orderId] = {
                        id: orderId,
                        clientName: resolveUserName(meta?.client),
                        providerName: resolveUserName(meta?.provider),
                        serviceTitle: meta?.service?.title || 'Serviço Personalizado',
                        lastCreatedAt: log.created_at,
                        lastAction: log.action,
                        logs: []
                    };
                }
                groups[orderId].logs.push(log);
            } else {
                standalone.push(log);
            }
        });

        // Sort logs within each group by created_at descending
        Object.values(groups).forEach(group => {
            group.logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });

        return {
            negotiations: Object.values(groups).sort((a, b) =>
                new Date(b.lastCreatedAt).getTime() - new Date(a.lastCreatedAt).getTime()
            ),
            standalone: standalone.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        };
    };

    const { negotiations, standalone } = getGroupedLogs();

    const filteredNegotiations = negotiations.filter(n => {
        const search = searchTerm.toLowerCase();
        return n.clientName.toLowerCase().includes(search) ||
            n.providerName.toLowerCase().includes(search) ||
            n.serviceTitle.toLowerCase().includes(search) ||
            n.id.includes(search);
    });

    return (
        <div className="space-y-6 animate-fade-in relative pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="heading-xl text-text-primary">Registros de Auditoria</h1>
                    <p className="text-sm text-text-tertiary">Logs imutáveis organizados por trilha de negociação</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchLogs}
                        className={`p-2 bg-bg-primary border border-border-subtle rounded-xl text-text-tertiary hover:text-text-primary transition-all ${loading ? 'animate-spin' : ''}`}
                    >
                        <History size={20} />
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Download size={18} />
                        Exportar Relatório
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl flex flex-wrap gap-3 items-center shadow-sm">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, prestador, serviço ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-accent-primary transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary bg-bg-secondary px-4 py-2.5 rounded-xl border border-border-subtle">
                    <History size={14} /> {negotiations.length} Trilhas Ativas
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-4">
                {loading && logs.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-2 border-accent-primary border-t-transparent animate-spin mx-auto"></div>
                        <p className="text-xs font-black uppercase text-text-tertiary tracking-widest">Sincronizando com a Ledger...</p>
                    </div>
                ) : (
                    <>
                        {/* Negotiation List */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-4 ml-2">Fluxos de Negociação</h3>
                            {filteredNegotiations.length === 0 ? (
                                <div className="p-12 text-center bg-bg-secondary/10 border-2 border-dashed border-border-subtle rounded-[32px]">
                                    <Package size={32} className="mx-auto text-text-tertiary opacity-30 mb-4" />
                                    <p className="text-xs font-bold text-text-tertiary">Nenhuma negociação encontrada para o filtro atual.</p>
                                </div>
                            ) : filteredNegotiations.map((group) => (
                                <div
                                    key={group.id}
                                    className={`bg-bg-primary border border-border-subtle rounded-[24px] overflow-hidden transition-all shadow-sm ${expandedGroup === group.id ? 'ring-2 ring-accent-primary/20 bg-accent-primary/[0.02]' : 'hover:border-accent-primary/50'}`}
                                >
                                    {/* Group Header */}
                                    <button
                                        onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                                        className="w-full px-6 py-5 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-6 text-left">
                                            <div className="w-12 h-12 rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center text-accent-primary shrink-0 relative group-hover:scale-105 transition-transform">
                                                <History size={20} />
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-bg-primary">
                                                    {group.logs.length}
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-accent-primary uppercase tracking-widest">Negociação</span>
                                                    <span className="text-[9px] font-mono text-text-tertiary">#{group.id.slice(0, 8)}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm font-black text-text-primary uppercase truncate">{group.serviceTitle}</p>
                                                    <ArrowRight size={14} className="text-text-tertiary shrink-0" />
                                                    <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                                                        <span>{group.clientName}</span>
                                                        <span className="opacity-30">&</span>
                                                        <span>{group.providerName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="hidden md:block text-right">
                                                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Última Atividade</p>
                                                <p className="text-xs font-bold text-text-primary">{new Date(group.lastCreatedAt).toLocaleString('pt-BR')}</p>
                                            </div>
                                            <div className={`p-2 rounded-lg bg-bg-secondary border border-border-subtle transition-transform ${expandedGroup === group.id ? 'rotate-180 bg-accent-primary/10 border-accent-primary/30 text-accent-primary' : 'text-text-tertiary group-hover:text-text-primary'}`}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </div>
                                    </button>

                                    {/* Timeline Expansion */}
                                    {expandedGroup === group.id && (
                                        <div className="px-6 pb-6 pt-2 animate-slide-down">
                                            <div className="border-t border-border-subtle/50 pt-6 space-y-4">
                                                <div className="relative pl-8 space-y-8 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-accent-primary before:via-border-subtle before:to-transparent">
                                                    {group.logs.map((log, idx) => (
                                                        <div key={log.id} className="relative group/log">
                                                            {/* Dot Indicator */}
                                                            <div className={`absolute -left-[35px] top-1.5 w-4 h-4 rounded-full border-2 border-bg-primary shadow-sm z-10 transition-all group-hover/log:scale-125 ${idx === 0 ? 'bg-accent-primary ring-4 ring-accent-primary/10' : 'bg-border-subtle'}`}></div>

                                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                                <div className="space-y-1.5 flex-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${actionMap[log.action]?.color || 'bg-bg-secondary text-text-primary'}`}>
                                                                            {actionMap[log.action]?.label || log.action?.split('_').join(' ')}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-tight flex items-center gap-1">
                                                                            <UserIcon size={10} /> {log.actor?.name || log.actor?.email || 'Sistema'}
                                                                        </span>
                                                                        <span className="text-[10px] text-text-tertiary opacity-50 flex items-center gap-1">
                                                                            <Clock size={10} /> {new Date(log.created_at).toLocaleString('pt-BR')}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs font-semibold text-text-secondary leading-relaxed bg-bg-secondary/40 p-3 rounded-xl border border-border-subtle/20 group-hover/log:bg-bg-secondary/60 transition-colors">
                                                                        ↳ {log.payload_json?.details || log.payload_json?.description || 'Evento registrado via protocolo técnico automático.'}
                                                                        {log.payload_json?.amount && <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-black">R$ {log.payload_json.amount}</span>}
                                                                    </p>
                                                                </div>

                                                                {/* Technical Context Mini-Panel */}
                                                                <div className="hidden lg:flex flex-col items-end shrink-0 gap-1 opacity-40 group-hover/log:opacity-100 transition-opacity">
                                                                    <span className="text-[8px] font-black text-text-tertiary tracking-widest uppercase">Entity Trace</span>
                                                                    <span className="text-[9px] font-mono text-text-primary bg-bg-secondary px-2 py-1 rounded border border-border-subtle">
                                                                        {log.id.slice(0, 12)}...
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Standalone Logs Section */}
                        {standalone.length > 0 && (
                            <div className="mt-12 space-y-4">
                                <div className="flex items-center gap-4 px-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Eventos de Sistema / Diversos</h3>
                                    <div className="h-px flex-1 bg-border-subtle/30"></div>
                                </div>
                                <div className="bg-bg-primary border border-border-subtle rounded-[24px] overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-bg-secondary/30 border-b border-border-subtle">
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-tertiary">Atividade</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-tertiary">Contexto</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-tertiary text-right">Data/Hora</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-subtle/50">
                                            {standalone.map(log => (
                                                <tr key={log.id} className="hover:bg-bg-secondary/20 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-bg-secondary flex items-center justify-center text-text-tertiary group-hover:text-accent-primary transition-colors">
                                                                {log.entity_type === 'payments' ? <Database size={14} /> : <Shield size={14} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{actionMap[log.action]?.label || log.action}</p>
                                                                <p className="text-[9px] text-text-tertiary font-bold uppercase">{log.actor?.name || log.actor?.email || 'Sistema'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-[10px] text-text-secondary leading-snug max-w-md truncate">
                                                            {log.payload_json?.details || log.payload_json?.description || 'Ação administrativa interna.'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="text-[10px] text-text-tertiary font-medium">
                                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;

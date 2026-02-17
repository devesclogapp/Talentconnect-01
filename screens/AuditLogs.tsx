import React, { useState, useEffect } from 'react';
import {
    History,
    Search,
    Filter,
    Shield,
    Activity,
    Database,
    User as UserIcon,
    AlertCircle,
    CheckCircle2,
    Info,
    ArrowUpDown
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEvent, setFilterEvent] = useState('all');

    useEffect(() => {
        fetchLogs();

        // Real-time subscription
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

    // Mapeamento de ações para labels legíveis
    const actionMap: Record<string, { label: string, color: string }> = {
        'INSERT': { label: 'Criação', color: 'bg-success/10 text-success' },
        'UPDATE': { label: 'Atualização', color: 'bg-blue-500/10 text-blue-500' },
        'DELETE': { label: 'Remoção', color: 'bg-error/10 text-error' },
        'ORDER_CREATED': { label: 'Pedido Criado', color: 'bg-accent-primary/10 text-accent-primary' },
        'ORDER_ACCEPTED': { label: 'Aceito', color: 'bg-success/10 text-success' },
        'ORDER_REJECTED': { label: 'Recusado', color: 'bg-error/10 text-error' },
        'ORDER_COUNTER_OFFER': { label: 'Contraproposta', color: 'bg-warning/10 text-warning' },
        'EXECUTION_STARTED_MARK': { label: 'Início Sinalizado', color: 'bg-blue-500/10 text-blue-500' },
        'EXECUTION_STARTED_CONFIRM': { label: 'Presença Confirmada', color: 'bg-success/10 text-success' },
        'EXECUTION_FINISHED_MARK': { label: 'Fim Sinalizado', color: 'bg-blue-500/10 text-blue-500' },
        'EXECUTION_FINISHED_CONFIRM': { label: 'Conclusão Confirmada', color: 'bg-success/10 text-success' },
        'DISPUTE_OPENED': { label: 'Disputa Aberta', color: 'bg-error/10 text-error' },
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    actor:users!actor_user_id (
                        name,
                        email
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.warn('Audit logs table not found or empty:', error);
                setLogs([]);
            } else {
                setLogs(data || []);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Evento', 'Ator', 'Entidade', 'Status', 'Data', 'Descricao'];
        const rows = filteredLogs.map(l => [
            l.id,
            l.action,
            l.actor?.name || l.actor?.email || 'System',
            `${l.entity_type}:${l.entity_id?.split('-')[0]}`,
            'SUCCESS',
            new Date(l.created_at).toISOString(),
            (l.payload_json?.details || '').replace(/,/g, ';')
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
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

    const filteredLogs = logs.filter(log => {
        const matchesEvent = filterEvent === 'all' || log.action === filterEvent;
        const search = searchTerm.toLowerCase();
        const actorName = (log.actor?.name || log.actor?.email || '').toLowerCase();
        const matchesSearch =
            actorName.includes(search) ||
            (log.action || '').toLowerCase().includes(search) ||
            (log.payload_json?.details || '').toLowerCase().includes(search);
        return matchesEvent && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="heading-xl text-text-primary">Registros de Auditoria</h1>
                    <p className="text-sm text-text-tertiary">Rastreabilidade completa de todas as ações no sistema</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchLogs}
                        className={`p-2 bg-bg-primary border border-border-subtle rounded-xl text-text-tertiary hover:text-text-primary transition-all ${loading ? 'animate-spin' : ''}`}
                        title="Recarregar Logs"
                    >
                        <History size={20} />
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="btn-primary flex items-center gap-2"
                    >
                        Baixar Registros
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por ator, evento ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-accent-primary transition-all"
                    />
                </div>
                <select
                    value={filterEvent}
                    onChange={(e) => setFilterEvent(e.target.value)}
                    className="bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none font-medium"
                >
                    <option value="all">Qualquer Evento</option>
                    <optgroup label="Banco de Dados">
                        <option value="INSERT">INSERT (Criação)</option>
                        <option value="UPDATE">UPDATE (Alteração)</option>
                        <option value="DELETE">DELETE (Remoção)</option>
                    </optgroup>
                    <optgroup label="Operacional">
                        <option value="ORDER_CREATED">ORDER_CREATED</option>
                        <option value="ORDER_ACCEPTED">ORDER_ACCEPTED</option>
                        <option value="ORDER_COUNTER_OFFER">ORDER_COUNTER_OFFER</option>
                        <option value="EXECUTION_STARTED_CONFIRM">EXECUTION_STARTED_CONFIRM</option>
                        <option value="DISPUTE_OPENED">DISPUTE_OPENED</option>
                    </optgroup>
                </select>
            </div>

            {/* Logs Table */}
            <div className="bg-bg-primary border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-secondary/50 border-b border-border-subtle">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Evento</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Ator (Executor)</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Entidade</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Data/Hora</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading && logs.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-text-tertiary text-xs">Carregando logs do sistema...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-text-tertiary text-xs">Nenhum evento registrado.</td></tr>
                            ) : filteredLogs.map((log) => (
                                <React.Fragment key={log.id}>
                                    <tr className="hover:bg-bg-secondary/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-tertiary group-hover:bg-accent-primary/10 group-hover:text-accent-primary transition-colors">
                                                    {log.entity_type === 'payments' ? <Database size={14} /> : log.action?.includes('USER') ? <UserIcon size={14} /> : <Shield size={14} />}
                                                </div>
                                                <span className={`text-[10px] font-black tracking-tight px-2 py-0.5 rounded-md ${actionMap[log.action]?.color || 'bg-bg-secondary text-text-primary'}`}>
                                                    {actionMap[log.action]?.label || log.action}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-text-secondary">{log.actor?.name || log.actor?.email || 'Sistema'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-text-tertiary font-medium">
                                                <span className="uppercase opacity-50 text-[9px] mr-1">{log.entity_type}:</span>
                                                <span className="font-mono">#{log.entity_id?.substring(0, 8)}</span>
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[10px] text-text-tertiary font-medium">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </td>
                                    </tr>
                                    <tr className="bg-bg-secondary/5">
                                        <td colSpan={4} className="px-6 py-3 border-b border-border-subtle">
                                            <p className="text-[11px] text-text-tertiary italic leading-relaxed pl-10">
                                                ↳ {log.payload_json?.details || log.payload_json?.description || 'Ação registrada via gatilho de banco de dados.'}
                                                {log.payload_json?.amount && <span className="ml-2 font-bold text-success"> (R$ {log.payload_json.amount})</span>}
                                            </p>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;

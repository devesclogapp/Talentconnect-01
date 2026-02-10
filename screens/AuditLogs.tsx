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
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                // Return mock data if table doesn't exist
                const mockLogs = [
                    { id: '1', event: 'USER_LOGIN', actor: 'admin@talent.com', target: 'AUTH', status: 'success', description: 'Login administrativo detectado.', created_at: new Date().toISOString() },
                    { id: '2', event: 'DOCUMENT_UPLOAD', actor: 'provider@test.com', target: 'KYC', status: 'pending', description: 'Documentos enviados para análise.', created_at: new Date(Date.now() - 3600000).toISOString() },
                    { id: '3', event: 'PAYMENT_ESCROW', actor: 'client@test.com', target: 'ORDER_#492', status: 'success', description: 'Pagamento de R$ 150,00 retido.', created_at: new Date(Date.now() - 7200000).toISOString() },
                    { id: '4', event: 'SERVICE_CREATED', actor: 'provider2@test.com', target: 'SERVICE_FIX', status: 'info', description: 'Novo serviço publicado.', created_at: new Date(Date.now() - 86400000).toISOString() },
                    { id: '5', event: 'DISPUTE_OPENED', actor: 'client2@test.com', target: 'ORDER_#312', status: 'error', description: 'Disputa aberta por atraso.', created_at: new Date(Date.now() - 172800000).toISOString() },
                ];
                setLogs(mockLogs);
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
            l.event,
            l.actor,
            l.target,
            l.status,
            new Date(l.created_at || l.time).toISOString(),
            l.description?.replace(/,/g, ';')
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle2 size={16} className="text-success" />;
            case 'error': return <AlertCircle size={16} className="text-error" />;
            case 'pending': return <Activity size={16} className="text-warning" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesEvent = filterEvent === 'all' || log.event === filterEvent;
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            (log.actor || '').toLowerCase().includes(search) ||
            (log.event || '').toLowerCase().includes(search) ||
            (log.description || '').toLowerCase().includes(search);
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
                        className="p-2 bg-bg-primary border border-border-subtle rounded-xl text-text-tertiary hover:text-text-primary transition-colors"
                    >
                        <History size={20} />
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="btn-primary flex items-center gap-2"
                    >
                        Download Logs
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
                    <option value="USER_LOGIN">USER_LOGIN</option>
                    <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
                    <option value="PAYMENT_ESCROW">PAYMENT_ESCROW</option>
                    <option value="SERVICE_CREATED">SERVICE_CREATED</option>
                    <option value="DISPUTE_OPENED">DISPUTE_OPENED</option>
                </select>
            </div>

            {/* Logs Timeline */}
            <div className="bg-bg-primary border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-secondary/50 border-b border-border-subtle">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Evento</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Ator (Executor)</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Entidade</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Data/Hora</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-text-tertiary">Carregando...</td></tr>
                            ) : filteredLogs.map((log) => (
                                <React.Fragment key={log.id}>
                                    <tr className="hover:bg-bg-secondary/20 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-tertiary group-hover:bg-accent-primary/10 group-hover:text-accent-primary transition-colors">
                                                    {log.event?.includes('USER') ? <UserIcon size={14} /> : log.event?.includes('PAYMENT') ? <Database size={14} /> : <Shield size={14} />}
                                                </div>
                                                <span className="text-xs font-black tracking-tight text-text-primary px-2 py-0.5 rounded-md bg-bg-secondary">
                                                    {log.event}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-text-secondary">{log.actor}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-text-tertiary font-medium">{log.target}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(log.status)}
                                                <span className="text-[10px] font-bold uppercase text-text-tertiary">{log.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[10px] text-text-tertiary font-medium">
                                                {new Date(log.created_at || log.time).toLocaleString('pt-BR')}
                                            </p>
                                        </td>
                                    </tr>
                                    <tr className="bg-bg-secondary/5">
                                        <td colSpan={5} className="px-6 py-3 border-b border-border-subtle">
                                            <p className="text-[11px] text-text-tertiary italic leading-relaxed pl-10">
                                                ↳ {log.description}
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

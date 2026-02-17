import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    MessageSquare,
    User,
    ShieldAlert,
    ChevronRight,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Gavel,
    Clock,
    DollarSign,
    ArrowRightCircle,
    Activity,
    ShieldCheck,
    Scale,
    X,
    History,
    FileText
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import { useAppStore } from '../store';

const AdminDisputes: React.FC = () => {
    const { viewFilters, setViewFilters } = useAppStore();

    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState(viewFilters?.status || 'all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

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
                        id,
                        status,
                        total_amount,
                        client:users!client_id (id, email, user_metadata),
                        provider:users!provider_id (id, email, user_metadata),
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
        setAuditLogs([]);
        fetchAuditLogs(dispute.order_id);
    };

    const handleAction = async (action: 'analyze' | 'resolve_release' | 'resolve_refund') => {
        if (!selectedDispute) return;
        const disputeId = selectedDispute.id;

        try {
            setIsProcessing(disputeId);

            if (action === 'analyze') {
                await (supabase as any).from('disputes').update({ status: 'in_review' }).eq('id', disputeId);
                alert('Protocolo de mediação ativado.');
            } else {
                const decision = action === 'resolve_release' ? 'release_to_provider' : 'refund_to_client';
                const notes = prompt('Justificativa da Decisão (Obrigatório para Auditoria):');
                if (!notes) return;

                // Transação atômica simulada
                await (supabase as any).from('disputes').update({
                    status: 'resolved',
                    resolved_at: new Date().toISOString()
                }).eq('id', disputeId);

                // Log Audit Log
                await (supabase as any).from('audit_logs').insert({
                    order_id: selectedDispute.order_id,
                    action: 'JUDICIAL_DECISION',
                    details: `Disputa resolvida: ${decision}. Motivo: ${notes}`,
                    timestamp: new Date().toISOString()
                });

                alert('Sentença aplicada com sucesso!');
            }

            fetchDisputes();
            setSelectedDispute(null);
        } catch (err: any) {
            alert('Falha na operação: ' + err.message);
        } finally {
            setIsProcessing(null);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open': return 'bg-error/10 text-error border-error/20';
            case 'in_review': return 'bg-warning/10 text-warning border-warning/20';
            case 'resolved': return 'bg-success/10 text-success border-success/20';
            default: return 'bg-bg-tertiary text-text-tertiary border-border-subtle';
        }
    };

    const filteredDisputes = disputes.filter(d => {
        const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            (d.id || '').toLowerCase().includes(search) ||
            (d.reason_code || '').toLowerCase().includes(search) ||
            resolveUserName(d.order?.client).toLowerCase().includes(search) ||
            resolveUserName(d.order?.provider).toLowerCase().includes(search);

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-fade-in relative pb-10">
            {/* Judge Panel Modaly (Slide-over) */}
            {selectedDispute && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="bg-bg-primary h-full w-full max-w-5xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-border-subtle bg-bg-secondary/30 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 rounded-2xl bg-error text-white shadow-glow-red">
                                    <Scale size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Centro de Mediação</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest bg-bg-secondary px-2 py-0.5 rounded">Protocolo #{selectedDispute.id.slice(0, 12)}</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${getStatusStyle(selectedDispute.status)}`}>
                                            {selectedDispute.status === 'open' ? 'Aberto' : selectedDispute.status === 'in_review' ? 'Em Análise' : selectedDispute.status === 'resolved' ? 'Resolvido' : selectedDispute.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDispute(null)} className="p-3 bg-bg-secondary hover:bg-bg-tertiary border border-border-subtle rounded-xl transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                {/* Case Details */}
                                <div className="space-y-6">
                                    <div className="bg-bg-secondary/10 border border-border-subtle rounded-[40px] p-8 space-y-8">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-[10px] font-black text-error uppercase tracking-[0.2em] mb-2">Motivo da Disputa</h4>
                                                <h3 className="text-2xl font-black text-text-primary">{selectedDispute.reason_code || 'Inconformidade Geral'}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-text-tertiary uppercase mb-1">Valor do Litígio</p>
                                                <p className="text-2xl font-black text-text-primary">R$ {selectedDispute.order?.total_amount?.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-bg-primary/50 border border-dashed border-border-subtle rounded-3xl italic text-sm text-text-secondary leading-relaxed">
                                            "{selectedDispute.description || 'Nenhum detalhe adicional fornecido.'}"
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-bg-secondary/30 rounded-3xl border border-border-subtle">
                                                <p className="text-[9px] font-black text-text-tertiary uppercase mb-2">Reclamante</p>
                                                <p className="text-sm font-black text-text-primary">{selectedDispute.opened_by_role === 'client' ? resolveUserName(selectedDispute.order?.client) : resolveUserName(selectedDispute.order?.provider)}</p>
                                                <p className="text-[10px] text-text-tertiary mt-1 opacity-60 uppercase font-bold">{selectedDispute.opened_by_role === 'client' ? 'Cliente' : 'Prestador'}</p>
                                            </div>
                                            <div className="p-5 bg-bg-secondary/30 rounded-3xl border border-border-subtle">
                                                <p className="text-[9px] font-black text-text-tertiary uppercase mb-2">Parte Notificada</p>
                                                <p className="text-sm font-black text-text-primary">{selectedDispute.opened_by_role === 'client' ? resolveUserName(selectedDispute.order?.provider) : resolveUserName(selectedDispute.order?.client)}</p>
                                                <p className="text-[10px] text-text-tertiary mt-1 opacity-60 uppercase font-bold">{selectedDispute.opened_by_role === 'client' ? 'Prestador' : 'Cliente'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Panel */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Scale size={14} /> Sentença Operacional
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                onClick={() => handleAction('resolve_release')}
                                                className="p-6 bg-success/5 border-2 border-dashed border-success/30 hover:border-success rounded-3xl text-left transition-all group"
                                            >
                                                <p className="text-sm font-black text-success uppercase mb-1">Liberar p/ Prestador</p>
                                                <p className="text-[10px] text-text-tertiary">O serviço é considerado executado. Repasse o valor imediatamente.</p>
                                            </button>
                                            <button
                                                onClick={() => handleAction('resolve_refund')}
                                                className="p-6 bg-error/5 border-2 border-dashed border-error/30 hover:border-error rounded-3xl text-left transition-all group"
                                            >
                                                <p className="text-sm font-black text-error uppercase mb-1">Estornar p/ Cliente</p>
                                                <p className="text-[10px] text-text-tertiary">Estorno total do valor bloqueado em escrow para o cliente.</p>
                                            </button>
                                        </div>

                                        {selectedDispute.status === 'open' && (
                                            <button
                                                onClick={() => handleAction('analyze')}
                                                className="w-full h-14 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-accent-primary transition-all flex items-center justify-center gap-2"
                                            >
                                                <Clock size={16} /> Iniciar Protocolo de Análise
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Facts Timeline Sidebar */}
                            <div className="w-[380px] border-l border-border-subtle bg-bg-secondary/10 flex flex-col">
                                <div className="p-8 border-b border-border-subtle bg-bg-primary/50">
                                    <h3 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                                        <History size={16} className="text-accent-primary" />
                                        Fatos Imutáveis
                                    </h3>
                                    <p className="text-[9px] text-text-tertiary font-medium mt-1">Audit logs do pedido vinculado</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                                        <div key={i} className="relative pl-6 border-l border-border-subtle pb-2">
                                            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-accent-primary border-2 border-white shadow-sm"></div>
                                            <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">{new Date(log.timestamp).toLocaleString('pt-BR')}</p>
                                            <p className="text-xs font-black text-text-primary uppercase leading-tight mb-1">{log.action?.replace('_', ' ')}</p>
                                            <p className="text-[10px] text-text-tertiary italic leading-relaxed">{log.details}</p>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center opacity-40">
                                            <Activity size={32} className="mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Aguardando logs...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="heading-xl text-text-primary">Gestão de Disputas</h1>
                    <p className="text-sm text-text-tertiary font-medium">Análise de litígios e mediação de pagamentos em escrow</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-2.5 shadow-sm">
                        <AlertTriangle size={18} className="text-error" />
                        <span className="text-[10px] font-black text-error uppercase tracking-widest">{disputes.filter(d => d.status === 'open').length} Críticos</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar ID, motivo ou usuários..."
                        className="w-full bg-bg-secondary/50 border border-border-subtle rounded-2xl pl-12 pr-4 py-3 text-xs outline-none focus:border-accent-primary transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-bg-secondary border border-border-subtle rounded-2xl px-6 py-3 text-xs outline-none font-black uppercase tracking-widest text-text-primary"
                    >
                        <option value="all">Status Gerais</option>
                        <option value="open">Abertos</option>
                        <option value="in_review">Em Análise</option>
                        <option value="resolved">Resolvidos</option>
                    </select>
                </div>
            </div>

            {/* Disputes List (Table View for ERP Efficiency) */}
            <div className="bg-bg-primary border border-border-subtle rounded-[40px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-secondary/50 border-b border-border-subtle">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">ID Casos</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Motivo / Reclamante</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Valor Bloqueado</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Análise</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-text-tertiary">
                                        <Clock className="animate-spin mx-auto mb-4" size={32} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Casos...</p>
                                    </td>
                                </tr>
                            ) : filteredDisputes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-text-tertiary opacity-40">
                                        <ShieldCheck size={48} className="mx-auto mb-4" />
                                        <p className="text-sm font-bold">Nenhum litígio pendente.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDisputes.map((dispute) => (
                                    <tr
                                        key={dispute.id}
                                        className="hover:bg-bg-secondary/20 transition-all group cursor-pointer"
                                        onClick={() => handleSelectDispute(dispute)}
                                    >
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">#{dispute.id.slice(0, 8)}</p>
                                            <p className="text-[10px] text-text-tertiary font-medium">{new Date(dispute.created_at).toLocaleDateString('pt-BR')}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="text-xs font-black text-text-primary uppercase tracking-tight mb-1">{dispute.reason_code || 'Conflito de Execução'}</p>
                                                <p className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">Por: {dispute.opened_by_role === 'client' ? resolveUserName(dispute.order?.client) : resolveUserName(dispute.order?.provider)}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-text-primary">R$ {dispute.order?.amount_total?.toFixed(2)}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(dispute.status)}`}>
                                                {dispute.status === 'open' ? 'Aberto' : dispute.status === 'in_review' ? 'Em Análise' : dispute.status === 'resolved' ? 'Resolvido' : dispute.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2.5 bg-bg-secondary hover:bg-error hover:text-white rounded-xl transition-all shadow-sm">
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

export default AdminDisputes;

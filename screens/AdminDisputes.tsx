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
    DollarSign
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';

const AdminDisputes: React.FC = () => {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    *,
                    order:order_id (
                        id,
                        status,
                        amount_total,
                        client:client_id (id, email, user_metadata),
                        provider:provider_id (id, email, user_metadata),
                        service:service_id (title)
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

    const handleAction = async (disputeId: string, action: 'analyze' | 'resolve_release' | 'resolve_refund') => {
        try {
            setIsProcessing(disputeId);
            const dispute = disputes.find(d => d.id === disputeId);
            if (!dispute) return;

            if (action === 'analyze') {
                await (supabase as any).from('disputes').update({ status: 'in_review' }).eq('id', disputeId);
                setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'in_review' } : d));
                alert('Disputa marcada como em análise.');
            }
            else if (action === 'resolve_release') {
                if (!confirm('Deseja LIBERAR o pagamento para o prestador e encerrar esta disputa?')) return;

                // 1. Update dispute status
                await (supabase as any).from('disputes').update({ status: 'resolved' }).eq('id', disputeId);
                // 2. Update order status to completed
                await (supabase as any).from('orders').update({ status: 'completed' }).eq('id', dispute.order_id);
                // 3. Update payment status to released
                await (supabase as any).from('payments').update({ escrow_status: 'released' }).eq('order_id', dispute.order_id);

                setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'resolved' } : d));
                alert('Pagamento liberado e disputa resolvida com sucesso!');
            }
            else if (action === 'resolve_refund') {
                if (!confirm('Deseja REEMBOLSAR o cliente integralmente e encerrar esta disputa?')) return;

                // 1. Update dispute status
                await (supabase as any).from('disputes').update({ status: 'resolved' }).eq('id', disputeId);
                // 2. Update order status to cancelled
                await (supabase as any).from('orders').update({ status: 'cancelled' }).eq('id', dispute.order_id);
                // 3. Update payment status to refunded
                await (supabase as any).from('payments').update({ escrow_status: 'refunded' }).eq('order_id', dispute.order_id);

                setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'resolved' } : d));
                alert('Cliente reembolsado e disputa resolvida!');
            }
        } catch (err: any) {
            alert('Operação falhou: ' + err.message);
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
            (d.reason || '').toLowerCase().includes(search) ||
            (d.order_id || '').toLowerCase().includes(search) ||
            resolveUserName(d.order?.client).toLowerCase().includes(search) ||
            resolveUserName(d.order?.provider).toLowerCase().includes(search);

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="heading-xl text-text-primary">Gestão de Disputas</h1>
                    <p className="text-sm text-text-tertiary">Mediação e resolução de conflitos entre usuários</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-2 shadow-sm">
                        <ShieldAlert size={18} className="text-error" />
                        <span className="text-xs font-black text-error uppercase">{disputes.filter(d => d.status === 'open').length} Urgentes</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por ID, motivo ou usuários..."
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-accent-primary transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none font-medium"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="open">Abertas (Novas)</option>
                        <option value="in_review">Em Análise</option>
                        <option value="resolved">Resolvidas</option>
                    </select>
                </div>
            </div>

            {/* Disputes Grid */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="py-20 text-center text-text-tertiary flex flex-col items-center gap-4">
                        <Clock className="animate-spin" size={32} />
                        <span className="font-bold uppercase tracking-widest text-[10px]">Sincronizando Casos...</span>
                    </div>
                ) : filteredDisputes.length === 0 ? (
                    <div className="py-20 text-center bg-bg-primary border border-border-subtle rounded-3xl opacity-50 shadow-inner">
                        <MessageSquare size={48} className="mx-auto mb-4" strokeWidth={1} />
                        <p className="text-sm font-medium">Nenhuma disputa encontrada.</p>
                    </div>
                ) : (
                    filteredDisputes.map((dispute) => (
                        <div key={dispute.id} className={`bg-bg-primary border ${dispute.status === 'open' ? 'border-error/30' : 'border-border-subtle'} rounded-[32px] p-8 hover:shadow-xl transition-all group relative overflow-hidden active:scale-[0.99]`}>
                            {/* Accent line for priority */}
                            {dispute.status === 'open' && <div className="absolute top-0 left-0 right-0 h-1.5 bg-error/40"></div>}

                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Left Side: Status & Info */}
                                <div className="lg:w-1/4 space-y-6">
                                    <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest text-center shadow-sm ${getStatusStyle(dispute.status)}`}>
                                        {dispute.status.replace('_', ' ')}
                                    </div>
                                    <div className="bg-bg-secondary/40 rounded-[24px] p-5 space-y-4 border border-border-subtle/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter">Protocolo</span>
                                            <span className="text-[11px] font-mono text-text-primary px-2 bg-bg-primary rounded-md">#{dispute.id.slice(0, 8)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter">Valor Retido</span>
                                            <span className="text-[13px] font-black text-text-primary">R$ {dispute.order?.amount_total?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter">Iniciada em</span>
                                            <span className="text-[11px] font-medium text-text-primary">{new Date(dispute.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: The Case */}
                                <div className="flex-1 space-y-5">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-error/10 rounded-2xl text-error mt-1 shadow-sm">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-1">
                                                Motivo: {dispute.reason || 'Conflito na Execução'}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs font-bold text-accent-primary">
                                                <DollarSign size={14} />
                                                <span>{dispute.order?.service?.title || 'Serviço Personalizado'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 rounded-3xl border border-border-subtle bg-bg-secondary/10 hover:bg-bg-secondary/30 transition-colors">
                                            <p className="text-[9px] font-black uppercase text-text-tertiary mb-3 flex items-center gap-1.5 px-1">
                                                <User size={10} className="text-accent-primary" />
                                                Reclamante <span className="opacity-50 ml-auto">({dispute.opened_by === 'client' ? 'Cliente' : 'Prestador'})</span>
                                            </p>
                                            <p className="text-sm font-bold text-text-primary px-1">
                                                {dispute.opened_by === 'client' ? resolveUserName(dispute.order?.client) : resolveUserName(dispute.order?.provider)}
                                            </p>
                                        </div>
                                        <div className="p-5 rounded-3xl border border-border-subtle bg-bg-secondary/10 hover:bg-bg-secondary/30 transition-colors">
                                            <p className="text-[9px] font-black uppercase text-text-tertiary mb-3 px-1">Parte Notificada</p>
                                            <p className="text-sm font-bold text-text-primary px-1">
                                                {dispute.opened_by === 'client' ? resolveUserName(dispute.order?.provider) : resolveUserName(dispute.order?.client)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-bg-tertiary/20 border border-dashed border-border-subtle text-xs text-text-secondary leading-relaxed relative">
                                        <span className="absolute -top-3 left-4 px-2 bg-white text-[9px] font-black uppercase tracking-widest border border-border-subtle rounded-md">Relato do Caso</span>
                                        "{dispute.description || 'O usuário não forneceu detalhes adicionais na abertura do chamado.'}"
                                    </div>
                                </div>

                                {/* Right Side: Actions */}
                                <div className="lg:w-64 flex flex-col gap-3 justify-center">
                                    <button
                                        disabled={dispute.status === 'resolved' || isProcessing === dispute.id}
                                        onClick={() => handleAction(dispute.id, 'analyze')}
                                        className="w-full h-12 bg-accent-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-glow-blue transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2"
                                    >
                                        <Gavel size={16} /> Analisar Caso
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            disabled={dispute.status === 'resolved' || isProcessing === dispute.id}
                                            onClick={() => handleAction(dispute.id, 'resolve_release')}
                                            className="h-14 bg-success/10 text-success border border-success/20 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-success/20 transition-all disabled:opacity-30"
                                            title="Liberar Pagamento ao Prestador"
                                        >
                                            <CheckCircle2 size={20} />
                                            <span className="text-[8px] font-black uppercase">Liberar</span>
                                        </button>
                                        <button
                                            disabled={dispute.status === 'resolved' || isProcessing === dispute.id}
                                            onClick={() => handleAction(dispute.id, 'resolve_refund')}
                                            className="h-14 bg-error/10 text-error border border-error/20 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-error/20 transition-all disabled:opacity-30"
                                            title="Reembolsar Cliente Integral"
                                        >
                                            <XCircle size={20} />
                                            <span className="text-[8px] font-black uppercase">Estornar</span>
                                        </button>
                                    </div>

                                    <button className="w-full h-12 bg-bg-secondary border border-border-subtle text-text-primary rounded-2xl text-[10px] font-bold hover:bg-bg-tertiary transition-all flex items-center justify-center gap-2">
                                        <MessageSquare size={16} /> Chat de Mediação
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDisputes;


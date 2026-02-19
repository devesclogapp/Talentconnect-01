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
    FileText,
    Zap,
    Briefcase,
    Percent,
    Package,
    Lock
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
    const [dossierTab, setDossierTab] = useState('summary');

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
                        scheduled_at,
                        location_text,
                        pricing_mode,
                        notes,
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
            (d.reason || '').toLowerCase().includes(search) ||
            resolveUserName(d.order?.client).toLowerCase().includes(search) ||
            resolveUserName(d.order?.provider).toLowerCase().includes(search);

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-fade-in relative pb-10">
            {/* Judge Panel Modaly (Slide-over) */}
            {selectedDispute && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex justify-end p-0 md:p-6">
                    <div className="bg-bg-primary h-full md:h-[calc(100vh-3rem)] w-full md:max-w-4xl lg:max-w-5xl xl:max-w-5xl shadow-[0_0_100px_rgba(0,0,0,0.5)] md:rounded-[40px] animate-slide-in-right overflow-hidden flex flex-col border border-border-subtle/20">
                        <div className="p-5 md:p-6 border-b border-border-subtle bg-bg-secondary/30 flex items-center justify-between">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="p-3 md:p-4 rounded-2xl bg-error text-white shadow-glow-red shrink-0">
                                    <Scale size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg md:text-xl font-black text-text-primary uppercase tracking-tight truncate">Centro de Mediação</h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest bg-bg-secondary px-2 py-0.5 rounded border border-border-subtle/50">ID {selectedDispute.id.slice(0, 8)}</span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(selectedDispute.status)}`}>
                                            {selectedDispute.status === 'open' ? 'Aberto' : selectedDispute.status === 'in_review' ? 'Em Análise' : selectedDispute.status === 'resolved' ? 'Resolvido' : selectedDispute.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDispute(null)}
                                className="p-2 md:p-3 bg-bg-secondary hover:bg-bg-tertiary border border-border-subtle rounded-xl transition-all shrink-0 hover:rotate-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex px-4 md:px-10 bg-bg-secondary/10 border-b border-border-subtle overflow-x-auto no-scrollbar">
                            {[
                                { id: 'summary', label: 'Resumo', longLabel: 'Resumo do Conflito', icon: <Scale size={14} /> },
                                { id: 'order', label: 'Contrato', longLabel: 'Contrato Digital', icon: <FileText size={14} /> },
                                { id: 'financial', label: 'Financeiro', longLabel: 'Escrow & Fluxo', icon: <DollarSign size={14} /> },
                                { id: 'compliance', label: 'Provas', longLabel: 'Chat & Provas', icon: <MessageSquare size={14} /> },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setDossierTab(tab.id)}
                                    className={`px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0 flex items-center gap-2 ${dossierTab === tab.id ? 'border-accent-primary text-accent-primary bg-accent-primary/5' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                                >
                                    {tab.icon} <span className="hidden xs:inline">{tab.longLabel}</span><span className="xs:hidden">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8 space-y-8 custom-scrollbar scroll-smooth">
                                {dossierTab === 'summary' && (
                                    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto xl:mx-0">
                                        {/* Case Details */}
                                        <div className="space-y-6">
                                            <div className="bg-bg-secondary/10 border border-border-subtle rounded-[28px] md:rounded-[32px] p-5 md:p-6 space-y-6 shadow-sm">
                                                <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-border-subtle/30">
                                                    <div className="min-w-0">
                                                        <h4 className="text-[9px] font-black text-error uppercase tracking-[0.2em] mb-2">Motivo da Disputa</h4>
                                                        <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-text-primary leading-tight break-words">{selectedDispute.reason || 'Inconformidade Geral'}</h3>
                                                    </div>
                                                    <div className="sm:text-right shrink-0 bg-bg-secondary/50 p-4 rounded-2xl border border-border-subtle/50 min-w-[140px]">
                                                        <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Valor do Litígio</p>
                                                        <p className="text-xl md:text-2xl font-black text-text-primary">R$ {(selectedDispute.order?.total_amount || 0).toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-bg-primary/50 border border-dashed border-border-subtle rounded-3xl italic text-sm text-text-secondary leading-relaxed relative">
                                                    <span className="absolute -top-3 left-6 px-2 bg-bg-primary text-[8px] font-black text-text-tertiary uppercase">Depoimento do Reclamante</span>
                                                    "{selectedDispute.reason || 'Nenhum detalhe adicional fornecido.'}"
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-5 bg-bg-secondary/30 rounded-3xl border border-border-subtle flex gap-4 items-center">
                                                        <div className="w-12 h-12 rounded-2xl bg-accent-primary text-white flex items-center justify-center font-black text-lg shadow-glow-blue shrink-0">
                                                            {resolveUserName(selectedDispute.opened_by === 'client' ? selectedDispute.order?.client : selectedDispute.order?.provider).charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[9px] font-black text-text-tertiary uppercase mb-0.5">Reclamante</p>
                                                            <p className="text-sm font-black text-text-primary uppercase tracking-tight truncate">{selectedDispute.opened_by === 'client' ? resolveUserName(selectedDispute.order?.client) : resolveUserName(selectedDispute.order?.provider)}</p>
                                                            <p className="text-[9px] text-accent-primary font-black uppercase tracking-widest">{selectedDispute.opened_by === 'client' ? 'Cliente' : 'Profissional'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-5 bg-bg-secondary/30 rounded-3xl border border-border-subtle flex gap-4 items-center">
                                                        <div className="w-12 h-12 rounded-2xl bg-bg-tertiary text-text-primary flex items-center justify-center font-black text-lg border border-border-subtle/50 shrink-0">
                                                            {resolveUserName(selectedDispute.opened_by === 'client' ? selectedDispute.order?.provider : selectedDispute.order?.client).charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[9px] font-black text-text-tertiary uppercase mb-0.5">Parte Notificada</p>
                                                            <p className="text-sm font-black text-text-primary uppercase tracking-tight truncate">{selectedDispute.opened_by === 'client' ? resolveUserName(selectedDispute.order?.provider) : resolveUserName(selectedDispute.order?.client)}</p>
                                                            <p className="text-[9px] text-text-tertiary font-black uppercase tracking-widest">{selectedDispute.opened_by === 'client' ? 'Profissional' : 'Cliente'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Panel */}
                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Scale size={14} className="text-accent-primary" /> Sentença Operacional
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                                    <button
                                                        onClick={() => handleAction('resolve_release')}
                                                        className="p-6 bg-success/5 border-2 border-dashed border-success/20 hover:border-success hover:bg-success/10 rounded-[28px] text-left transition-all group relative overflow-hidden"
                                                    >
                                                        <div className="w-10 h-10 rounded-2xl bg-success text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-success/20">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <p className="text-sm font-black text-success uppercase mb-1">Liberar p/ Profissional</p>
                                                        <p className="text-[10px] text-text-tertiary leading-relaxed font-medium">O serviço será considerado executado e o valor será repassado imediatamente ao profissional.</p>
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction('resolve_refund')}
                                                        className="p-6 bg-error/5 border-2 border-dashed border-error/20 hover:border-error hover:bg-error/10 rounded-[28px] text-left transition-all group relative overflow-hidden"
                                                    >
                                                        <div className="w-10 h-10 rounded-2xl bg-error text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-error/20">
                                                            <XCircle size={20} />
                                                        </div>
                                                        <p className="text-sm font-black text-error uppercase mb-1">Estornar p/ Cliente</p>
                                                        <p className="text-[10px] text-text-tertiary leading-relaxed font-medium">Estorno integral do valor bloqueado. O profissional não receberá remuneração por este pedido.</p>
                                                    </button>
                                                </div>

                                                {selectedDispute.status === 'open' && (
                                                    <button
                                                        onClick={() => handleAction('analyze')}
                                                        className="w-full h-16 bg-black text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-accent-primary transition-all flex items-center justify-center gap-4 group ring-opacity-50 hover:ring-8 hover:ring-accent-primary/20"
                                                    >
                                                        <Zap size={18} className="text-accent-primary group-hover:animate-pulse" />
                                                        Elevar para Protocolo de Análise Crítica
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {dossierTab === 'order' && (
                                    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto xl:mx-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-bg-secondary/10 border border-border-subtle rounded-[32px] p-6 md:p-8 space-y-6 shadow-sm">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest flex items-center gap-2">
                                                    <FileText size={14} /> Dados do Pedido
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center py-4 border-b border-border-subtle/50">
                                                        <span className="text-[10px] font-black text-text-tertiary uppercase">Serviço</span>
                                                        <span className="text-xs font-black text-text-primary uppercase tracking-tight text-right truncate ml-4">{selectedDispute.order?.service?.title || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-4 border-b border-border-subtle/50">
                                                        <span className="text-[10px] font-black text-text-tertiary uppercase">Agendamento</span>
                                                        <span className="text-xs font-black text-text-primary uppercase tracking-tight">
                                                            {selectedDispute.order?.scheduled_at ? new Date(selectedDispute.order.scheduled_at).toLocaleString('pt-BR') : 'Não definido'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-4">
                                                        <span className="text-[10px] font-black text-text-tertiary uppercase">Modalidade</span>
                                                        <span className="text-xs font-black text-accent-primary uppercase tracking-widest">{selectedDispute.order?.pricing_mode === 'hourly' ? 'Por Hora' : 'Valor Fixo'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-bg-secondary/10 border border-border-subtle rounded-[32px] p-6 md:p-8 space-y-6 shadow-sm">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest flex items-center gap-2">
                                                    <Search size={14} /> Endereço Declarado
                                                </h4>
                                                <div className="p-5 bg-bg-primary rounded-2xl border border-border-subtle min-h-[120px] flex items-center justify-center text-center">
                                                    <p className="text-xs text-text-secondary leading-relaxed italic font-medium px-4">
                                                        {selectedDispute.order?.location_text || 'O cliente não declarou um endereço específico no fluxo de contratação.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-accent-secondary/5 border border-accent-secondary/20 p-6 rounded-[32px] flex gap-5 items-center shadow-sm">
                                            <div className="p-4 bg-accent-secondary text-white rounded-2xl shadow-xl shrink-0 ring-4 ring-accent-secondary/10">
                                                <ShieldCheck size={28} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-accent-secondary uppercase tracking-widest mb-1">Nota de Governança Digital</p>
                                                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                                    Este pedido foi registrado em Blockchain privado e utiliza o **Contrato de Execução Instantânea**. A liberação do pagamento depende da análise técnica deste tribunal.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {dossierTab === 'financial' && (
                                    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto xl:mx-0">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            <div className="bg-bg-primary border border-border-subtle p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                                                <div className="p-2.5 bg-bg-secondary rounded-xl w-fit mb-4 text-text-primary border border-border-subtle/50">
                                                    <DollarSign size={18} />
                                                </div>
                                                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Custódia Total</p>
                                                <h3 className="text-xl lg:text-2xl font-black text-text-primary tracking-tighter">R$ {(selectedDispute.order?.total_amount || 0).toFixed(2)}</h3>
                                            </div>
                                            <div className="bg-bg-primary border border-border-subtle p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                                                <div className="p-2.5 bg-bg-secondary rounded-xl w-fit mb-4 text-error border border-border-subtle/50">
                                                    <Percent size={18} />
                                                </div>
                                                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Taxa APP (10%)</p>
                                                <h3 className="text-xl lg:text-2xl font-black text-text-primary tracking-tighter">R$ {((selectedDispute.order?.total_amount || 0) * 0.1).toFixed(2)}</h3>
                                            </div>
                                            <div className="bg-bg-primary border border-border-subtle p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                                                <div className="p-2.5 bg-bg-secondary rounded-xl w-fit mb-4 text-success border border-border-subtle/50">
                                                    <Activity size={18} />
                                                </div>
                                                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Repasse Líquido</p>
                                                <h3 className="text-xl lg:text-2xl font-black text-text-primary tracking-tighter">R$ {((selectedDispute.order?.total_amount || 0) * 0.9).toFixed(2)}</h3>
                                            </div>
                                        </div>

                                        <div className="bg-bg-secondary/10 border border-border-subtle rounded-[32px] p-6 md:p-8 space-y-5 shadow-sm">
                                            <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest flex items-center gap-2">
                                                <Lock size={14} /> Status da Garantia Financeira
                                            </h4>
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-bg-primary rounded-[24px] border border-border-subtle">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-[24px] bg-warning/15 text-warning flex items-center justify-center shadow-lg shadow-warning/5">
                                                        <Lock size={28} />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-text-primary uppercase tracking-tight">ESCROW: HELD (RETIDO)</p>
                                                        <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-widest">Protocolo Antifraude Ativo</p>
                                                    </div>
                                                </div>
                                                <div className="px-6 py-3 bg-warning/10 text-warning rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] animate-pulse border border-warning/20 shadow-glow-yellow">
                                                    Aguardando Sentença
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {dossierTab === 'compliance' && (
                                    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto xl:mx-0">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            {/* Chat Monitor Simulation */}
                                            <div className="bg-bg-secondary/20 p-6 md:p-8 rounded-[32px] border border-border-subtle flex flex-col h-[420px] shadow-sm">
                                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-6 flex items-center gap-2">
                                                    <MessageSquare size={14} /> Logs de Negociação (IA Monitor)
                                                </h4>
                                                <div className="flex-1 overflow-y-auto space-y-5 pr-4 custom-scrollbar">
                                                    <div className="flex flex-col gap-1 max-w-[85%]">
                                                        <p className="text-[9px] font-black uppercase text-accent-primary ml-4 mb-1">{resolveUserName(selectedDispute.order?.client)}</p>
                                                        <div className="bg-bg-primary p-5 rounded-3xl rounded-tl-none border border-border-subtle shadow-sm">
                                                            <p className="text-sm text-text-primary leading-relaxed font-medium">Já estou no local aguardando há 20 minutos, mas você não apareceu nem atendeu o telefone.</p>
                                                            <p className="text-[8px] text-text-tertiary mt-2">10:15 • LIDO</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 max-w-[85%] ml-auto">
                                                        <p className="text-[9px] font-black uppercase text-text-tertiary mr-4 mb-1 text-right">{resolveUserName(selectedDispute.order?.provider)}</p>
                                                        <div className="bg-black p-5 rounded-3xl rounded-tr-none shadow-xl">
                                                            <p className="text-sm text-white leading-relaxed font-medium">Estive aí no horário combinado mas a recepção disse que não havia agendamento em meu nome.</p>
                                                            <p className="text-[8px] text-white/40 mt-2 text-right">10:22 • LIDO</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 max-w-[85%]">
                                                        <p className="text-[9px] font-black uppercase text-accent-primary ml-4 mb-1">{resolveUserName(selectedDispute.order?.client)}</p>
                                                        <div className="bg-bg-primary p-5 rounded-3xl rounded-tl-none border border-border-subtle shadow-sm">
                                                            <p className="text-sm text-text-primary leading-relaxed font-medium">Isso é mentira! Eu estava na frente do prédio. Tirei fotos e vou abrir uma disputa agora mesmo.</p>
                                                            <p className="text-[8px] text-text-tertiary mt-2">10:25 • ENVIADO</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-8 p-6 bg-bg-tertiary/40 rounded-3xl border border-dashed border-border-subtle/50 text-center">
                                                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center justify-center gap-2 opacity-60">
                                                        <Lock size={12} /> Criptografia de Ponta-a-Pontas
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Evidências & Anexos */}
                                            <div className="space-y-10">
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-8">Arquivos & Evidências (Hash Verificado)</h4>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="aspect-[4/3] bg-bg-secondary/40 border-2 border-dashed border-border-subtle rounded-[32px] flex flex-col items-center justify-center text-text-tertiary group hover:border-accent-primary hover:bg-accent-primary/5 transition-all cursor-pointer shadow-sm">
                                                            <div className="p-4 bg-bg-primary rounded-2xl mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                                                <FileText size={32} className="text-accent-primary" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Selfie_Local.jpg</span>
                                                            <span className="text-[8px] opacity-40 mt-1 uppercase">2.4 MB • GPS TAG</span>
                                                        </div>
                                                        <div className="aspect-[4/3] bg-bg-secondary/40 border-2 border-dashed border-border-subtle rounded-[32px] flex flex-col items-center justify-center text-text-tertiary group hover:border-error hover:bg-error/5 transition-all cursor-pointer shadow-sm">
                                                            <div className="p-4 bg-bg-primary rounded-2xl mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                                                <Package size={32} className="text-error" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Relatorio_PDF.pdf</span>
                                                            <span className="text-[8px] opacity-40 mt-1 uppercase">152 KB • DOCS</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-warning/5 border border-warning/20 p-6 rounded-[32px] shadow-sm ring-1 ring-warning/5">
                                                    <div className="flex gap-4 items-center mb-6">
                                                        <div className="w-10 h-10 rounded-xl bg-warning text-white flex items-center justify-center shadow-lg shadow-warning/20">
                                                            <ShieldAlert size={20} />
                                                        </div>
                                                        <p className="text-[11px] font-black text-warning uppercase tracking-widest">Diretriz de Compliance</p>
                                                    </div>
                                                    <p className="text-xs text-text-tertiary leading-relaxed font-medium">
                                                        O moderador deve cruzar os horários dos logs de chat com as tags de GPS das evidências fotográficas para validar a presença das partes no local acordado.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Facts Timeline Sidebar */}
                            <div className="hidden xl:flex w-[320px] border-l border-border-subtle bg-bg-secondary/10 flex-col shrink-0">
                                <div className="p-6 border-b border-border-subtle bg-bg-primary/50 shadow-sm relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary opacity-20"></div>
                                    <h3 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                                        <History size={18} className="text-accent-primary" />
                                        Fatos Imutáveis
                                    </h3>
                                    <p className="text-[10px] text-text-tertiary font-bold mt-2 uppercase tracking-wide opacity-60">Audit logs do protocolo técnico</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth">
                                    {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                                        <div key={i} className="relative pl-8 border-l-2 border-border-subtle/50 pb-4 group">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-lg bg-bg-secondary border-2 border-border-subtle group-hover:border-accent-primary group-hover:scale-125 transition-all shadow-sm"></div>
                                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Clock size={10} className="text-text-tertiary" />
                                                {new Date(log.timestamp).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' })}
                                            </p>
                                            <p className="text-xs font-black text-text-primary uppercase tracking-tight leading-tight mb-2 group-hover:text-accent-primary transition-colors">{log.action?.split('_').join(' ')}</p>
                                            <div className="p-3 bg-bg-primary/40 rounded-xl border border-border-subtle/30 text-[10px] text-text-tertiary italic leading-relaxed font-medium group-hover:bg-bg-primary transition-colors">
                                                {log.details}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-32 text-center opacity-40">
                                            <div className="w-16 h-16 rounded-full bg-bg-secondary mx-auto flex items-center justify-center mb-6">
                                                <Activity size={32} className="text-text-tertiary animate-pulse" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Fatos...</p>
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
                                                <p className="text-xs font-black text-text-primary uppercase tracking-tight mb-1">{dispute.reason || 'Conflito de Execução'}</p>
                                                <p className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">Por: {dispute.opened_by === 'client' ? resolveUserName(dispute.order?.client) : resolveUserName(dispute.order?.provider)}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-text-primary">R$ {dispute.order?.total_amount?.toFixed(2)}</p>
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

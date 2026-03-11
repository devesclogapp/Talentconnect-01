import React, { useState } from 'react';
import {
    Scale, User, Briefcase, FileText, DollarSign, History,
    Zap, Package, Clock, MapPin, ShieldCheck, Activity,
    AlertTriangle, CheckCircle2, ChevronRight
} from 'lucide-react';
import SmartTag from './SmartTag';
import TrustScore from './TrustScore';
import DecisionIntelligence from './DecisionIntelligence';
import StatusBadge from './StatusBadge';
import { resolveUserName } from '../../utils/userUtils';

interface NegotiationDossierProps {
    data: any; // The full negotiation (order + dispute + payments + executions)
    auditLogs: any[];
    onBack?: () => void;
}

const NegotiationDossier: React.FC<NegotiationDossierProps> = ({ data, auditLogs, onBack }) => {
    const [activeTab, setActiveTab] = useState('summary');

    if (!data) return <div className="p-8 text-center text-muted-foreground italic">Selecione uma negociação para visualizar o dossiê.</div>;

    const order = data.order || data;
    const client = order.client || data.client;
    const provider = order.provider || data.provider;
    const service = order.service || data.service;
    const payment = data.payment || (order.payments && order.payments[0]);
    const execution = Array.isArray(order.executions) ? order.executions[0] : order.executions;

    const tabs = [
        { id: 'summary', label: 'Resumo', icon: <Scale size={14} /> },
        { id: 'intelligence', label: 'Investigação', icon: <Zap size={14} /> },
        { id: 'contract', label: 'Contrato', icon: <FileText size={14} /> },
        { id: 'financial', label: 'Financeiro', icon: <DollarSign size={14} /> },
        { id: 'audit', label: 'Auditoria', icon: <History size={14} /> },
    ];

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header Mini Dossier */}
            <div className="px-6 py-4 border-b border-border bg-card/50">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        N
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Negociação</h2>
                            <span className="text-[10px] font-mono text-muted-foreground">#{order.id?.slice(0, 16)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={order.status} />
                            <SmartTag type="CLIENTE" label={resolveUserName(client)} data={{ ...client, trustScore: 82 }} />
                            <ChevronRight size={10} className="text-muted-foreground opacity-30" />
                            <SmartTag type="PROFISSIONAL" label={resolveUserName(provider)} data={{ ...provider, trustScore: 75 }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex px-6 border-b border-border bg-card overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all shrink-0
                            border-b-2 
                            ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}
                        `}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === 'summary' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Package size={14} className="text-primary" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Objeto da Negociação</h3>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <p className="text-sm font-bold text-foreground">{service?.title || 'Contrato de Serviço Digital'}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                        Modalidade: {order.pricing_mode === 'hourly' ? 'Por Hora' : 'Valor Fixo'} •
                                        Agendamento: {new Date(order.scheduled_at).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Valor do Contrato</p>
                                    <p className="text-lg font-black text-foreground">R$ {order.total_amount?.toFixed(2)}</p>
                                </div>
                            </div>
                        </section>

                        <DecisionIntelligence negotiationData={{ order, dispute: data.dispute }} />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <User size={12} className="text-blue-500" /> Histórico Cliente
                                </p>
                                <div className="flex items-center gap-2">
                                    <TrustScore score={82} size="sm" />
                                </div>
                                <div className="text-[9px] text-muted-foreground font-medium">
                                    Crescimento de confiança em 12% nos últimos 3 meses.
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <Briefcase size={12} className="text-orange-500" /> Histórico Prof.
                                </p>
                                <div className="flex items-center gap-2">
                                    <TrustScore score={75} size="sm" />
                                </div>
                                <div className="text-[9px] text-muted-foreground font-medium">
                                    Score impactado por 2 cancelamentos tardios.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'intelligence' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <Activity size={14} /> Análise Operacional (Investigação)
                            </p>

                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-xl border border-border flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                                        <MapPin size={18} className="text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Geolocalização</p>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${execution?.location_lat ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {execution?.location_lat ? 'SINAL OK' : 'SEM SINAL'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-medium mt-1">
                                            {execution?.location_lat ? `Coordenadas: ${execution.location_lat}, ${execution.location_lng}` : 'Não foi possível detectar o profissional no local.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-muted/30 rounded-xl border border-border flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                                        <Clock size={18} className="text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fidelidade Temporal</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="text-center flex-1">
                                                <p className="text-[8px] text-muted-foreground uppercase font-bold">Agendado</p>
                                                <p className="text-xs font-bold">{new Date(order.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <div className="w-px h-6 bg-border" />
                                            <div className="text-center flex-1">
                                                <p className="text-[8px] text-muted-foreground uppercase font-bold">Início Real</p>
                                                <p className="text-xs font-bold">{execution?.started_at ? new Date(execution.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                                            </div>
                                            <div className="w-px h-6 bg-border" />
                                            <div className="text-center flex-1">
                                                <p className="text-[8px] text-muted-foreground uppercase font-bold">Atraso</p>
                                                <p className={`text-xs font-bold ${execution?.started_at && new Date(execution.started_at).getTime() > new Date(order.scheduled_at).getTime() ? 'text-red-500' : 'text-green-500'}`}>
                                                    {execution?.started_at ? `${Math.floor((new Date(execution.started_at).getTime() - new Date(order.scheduled_at).getTime()) / 60000)}m` : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest p-1">Sinais Comportamentais</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-card border border-border border-l-4 border-l-blue-500">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Taxa de Conclusão (Prof.)</p>
                                    <p className="text-sm font-black">94.2%</p>
                                </div>
                                <div className="p-3 rounded-xl bg-card border border-border border-l-4 border-l-red-500">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Índice de Disputas (Cli.)</p>
                                    <p className="text-sm font-black">8.5% <span className="text-[8px] text-red-500 font-bold ml-1">↑ ALTO</span></p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'contract' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><FileText size={14} /> Detalhes Estruturais do Pedido</p>
                            <div className="space-y-3">
                                {[
                                    { label: 'ID Negociação', value: order.id, mono: true },
                                    { label: 'Serviço', value: service?.title },
                                    { label: 'Agendamento Original', value: new Date(order.scheduled_at).toLocaleString('pt-BR') },
                                    { label: 'Modalidade', value: order.pricing_mode === 'hourly' ? 'POR HORA' : 'VALOR FIXO' },
                                    { label: 'Local de Execução', value: order.location_text || 'Endereço não fornecido' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start pt-3 border-t border-border first:border-0 first:pt-0">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">{item.label}</span>
                                        <span className={`text-[10px] font-bold text-foreground text-right max-w-[200px] break-all ${item.mono ? 'font-mono' : ''}`}>{item.value || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-card border border-border rounded-2xl p-5">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Custódia (Escrow)</p>
                                <p className="text-2xl font-black text-foreground tabular-nums">R$ {order.total_amount?.toFixed(2)}</p>
                                <div className="mt-4 flex items-center gap-2 px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-lg w-fit">
                                    <ShieldCheck size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Retido</span>
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-2xl p-5">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Repasse Previsto</p>
                                <p className="text-2xl font-black text-green-600 dark:text-green-400 tabular-nums">R$ {(order.total_amount * 0.9).toFixed(2)}</p>
                                <div className="mt-4 flex items-center gap-2 px-2 py-1 bg-green-500/10 text-green-600 rounded-lg w-fit">
                                    <Activity size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Liquidável</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-muted/30 border border-border rounded-2xl p-4 flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-primary">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-foreground">Taxa da Plataforma (10%)</p>
                                <p className="text-[10px] text-muted-foreground">Valor a ser retido: R$ {(order.total_amount * 0.1).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
                            <History size={14} /> Linha do Tempo Imutável
                        </p>
                        <div className="space-y-0 relative">
                            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
                            {auditLogs.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground italic text-xs">Nenhum evento registrado ainda.</div>
                            ) : auditLogs.map((log, i) => (
                                <div key={i} className="flex gap-4 relative pl-8 pb-6 last:pb-0 group">
                                    <div className="absolute left-[11px] top-1 w-2 h-2 rounded-full bg-card border-2 border-primary ring-4 ring-background z-10" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-mono text-muted-foreground uppercase">{new Date(log.created_at || log.timestamp).toLocaleString('pt-BR')}</span>
                                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-muted rounded uppercase tracking-widest">{log.action?.split('_').join(' ')}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-foreground leading-tight">
                                            {log.details || log.action?.split('_').join(' ')}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[8px] font-bold text-muted-foreground flex items-center gap-1">
                                                <User size={8} /> Agente: {log.actor_user_id?.slice(0, 8) || 'SISTEMA'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-card/30 flex gap-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex-1 h-12 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                    >
                        Voltar
                    </button>
                )}
            </div>
        </div>
    );
};

export default NegotiationDossier;

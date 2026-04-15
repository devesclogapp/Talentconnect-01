import React, { useState } from 'react';
import {
    Scale, User, Briefcase, FileText, DollarSign, History,
    Zap, Package, Clock, MapPin, ShieldCheck, Activity,
    AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft
} from 'lucide-react';
import SmartTag from './SmartTag';
import TrustScore from './TrustScore';
import DecisionIntelligence from './DecisionIntelligence';
import StatusBadge from './StatusBadge';
import { resolveUserName } from '../../utils/userUtils';
import { formatNumber } from '../../utils/format';

interface NegotiationDossierProps {
    data: any; // The full negotiation (order + dispute + payments + executions)
    auditLogs: any[];
    onBack?: () => void;
}

const NegotiationDossier: React.FC<NegotiationDossierProps> = ({ data, auditLogs, onBack }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -200 : 200;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

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
        { id: 'audit', label: 'Rastro de Auditoria', icon: <History size={14} /> },
    ];

    return (
        <div className="flex flex-col h-full bg-folio-bg text-folio-text">
            {/* Header Mini Dossier */}
            <div className="px-6 py-5 border-b border-folio-border bg-folio-surface2/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-folio-accent shadow-glow text-white flex items-center justify-center font-bold text-lg shrink-0 border-2 border-white/10">
                        N
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold text-folio-text-dim/60">Dossiê de negociação</h2>
                            <span className="text-xs font-mono text-folio-text-dim/40 bg-folio-surface px-1.5 py-0.5 rounded border border-folio-border">#{order.id?.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 overflow-x-auto no-scrollbar pb-1">
                            <StatusBadge status={order.status} />
                            <SmartTag type="CLIENTE" label={resolveUserName(client)} data={{ ...client, trustScore: 82 }} />
                            <ChevronRight size={10} className="text-folio-text-dim/30 shrink-0" />
                            <SmartTag type="PROFISSIONAL" label={resolveUserName(provider)} data={{ ...provider, trustScore: 75 }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="relative flex items-center bg-folio-surface/30 border-b border-folio-border/50 group">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 z-20 h-full px-2 flex items-center bg-gradient-to-r from-folio-bg via-folio-bg/80 to-transparent text-folio-text-dim hover:text-folio-accent transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronLeft size={16} strokeWidth={3} />
                </button>

                <div
                    ref={scrollRef}
                    className="flex-1 flex px-8 overflow-x-auto no-scrollbar scroll-smooth"
                >
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-5 py-4 text-xs font-bold transition-all shrink-0
                                border-b-2 relative
                                ${activeTab === tab.id ? 'border-folio-accent text-folio-text' : 'border-transparent text-folio-text-dim hover:text-folio-text'}
                            `}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 z-20 h-full px-2 flex items-center bg-gradient-to-l from-folio-bg via-folio-bg/80 to-transparent text-folio-text-dim hover:text-folio-accent transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronRight size={16} strokeWidth={3} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {activeTab === 'summary' && (
                    <div className="space-y-6 animate-fade-in">
                        <section className="bg-folio-surface border border-folio-border shadow-folio rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-folio-accent-dim flex items-center justify-center text-folio-accent">
                                    <Package size={16} />
                                </div>
                                <h3 className="text-xs font-bold text-folio-text">Objeto da negociação</h3>
                            </div>
                            <div className="flex justify-between items-end gap-4 p-4 bg-folio-bg rounded-xl border border-folio-border/50">
                                <div>
                                    <p className="text-sm font-bold text-folio-text">{service?.title || 'Contrato de serviço digital'}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-folio-surface border border-folio-border rounded-lg">
                                            <div className={`w-1.5 h-1.5 rounded-full ${order.pricing_mode === 'hourly' ? 'bg-blue-500' : 'bg-folio-accent'}`} />
                                            <span className="text-xs font-bold ">{order.pricing_mode === 'hourly' ? 'Por hora' : 'Valor fixo'}</span>
                                        </div>
                                        <span className="text-xs font-medium text-folio-text-dim opacity-60">
                                            {new Date(order.scheduled_at).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-folio-text-dim mb-1">Valor auditado</p>
                                    <p className="text-2xl font-black text-folio-text">R$ {formatNumber(order.total_amount)}</p>
                                </div>
                            </div>
                        </section>

                        <DecisionIntelligence negotiationData={{ order, dispute: data.dispute }} />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-folio-surface border border-folio-border shadow-folio rounded-2xl p-5 space-y-4">
                                <p className="text-xs font-bold text-folio-text-dim  flex items-center gap-2">
                                    <User size={14} className="text-blue-500" /> Histórico cliente
                                </p>
                                <div className="flex items-center gap-3">
                                    <TrustScore score={82} size="md" />
                                    <div className="flex-1">
                                        <div className="h-1.5 w-full bg-folio-bg rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[82%]" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-folio-text-dim font-medium leading-relaxed italic">
                                    "Crescimento de confiança em 12% nos últimos 3 meses."
                                </p>
                            </div>
                            <div className="bg-folio-surface border border-folio-border shadow-folio rounded-2xl p-5 space-y-4">
                                <p className="text-xs font-bold text-folio-text-dim  flex items-center gap-2">
                                    <Briefcase size={14} className="text-folio-accent" /> Histórico prof.
                                </p>
                                <div className="flex items-center gap-3">
                                    <TrustScore score={75} size="md" />
                                    <div className="flex-1">
                                        <div className="h-1.5 w-full bg-folio-bg rounded-full overflow-hidden">
                                            <div className="h-full bg-folio-accent w-[75%]" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-folio-text-dim font-medium leading-relaxed italic">
                                    "Score impactado por 2 cancelamentos tardios."
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'intelligence' && (
                    <div className="space-y-6 animate-fade-in">
                        <section className="bg-folio-surface border border-folio-border shadow-folio rounded-2xl p-6 space-y-5">
                            <p className="text-xs font-bold text-folio-accent  flex items-center gap-2">
                                <Activity size={16} /> Investigação assistida
                            </p>

                            <div className="space-y-4">
                                <div className="p-5 bg-folio-bg rounded-2xl border border-folio-border flex items-start gap-5">
                                    <div className="w-11 h-11 rounded-xl bg-folio-surface border border-folio-border flex items-center justify-center shrink-0 shadow-sm">
                                        <MapPin size={20} className="text-folio-text-dim" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold  text-folio-text-dim/60">Sinal de presença</p>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${execution?.location_lat ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                {execution?.location_lat ? 'Rastreamento ativo' : 'Sem coordenadas'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium mt-2 text-folio-text italic">
                                            {execution?.location_lat ? `Coordenadas verificadas: ${execution.location_lat}, ${execution.location_lng}` : 'Não foi possível detectar a geolocalização do operador no momento do acionamento.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 bg-folio-bg rounded-2xl border border-folio-border flex items-start gap-5">
                                    <div className="w-11 h-11 rounded-xl bg-folio-surface border border-folio-border flex items-center justify-center shrink-0 shadow-sm">
                                        <Clock size={20} className="text-folio-text-dim" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold  text-folio-text-dim/60 mb-3">Linha do tempo de execução</p>
                                        <div className="flex items-center gap-4 bg-folio-surface p-4 rounded-xl border border-folio-border/50">
                                            <div className="text-center flex-1">
                                                <p className="text-xs text-folio-text-dim font-bold ">Acordado</p>
                                                <p className="text-xs font-bold text-folio-text">{new Date(order.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <div className="w-px h-6 bg-folio-border" />
                                            <div className="text-center flex-1">
                                                <p className="text-xs text-folio-text-dim font-bold ">Início real</p>
                                                <p className="text-xs font-bold text-folio-text">{execution?.started_at ? new Date(execution.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                                            </div>
                                            <div className="w-px h-6 bg-folio-border" />
                                            <div className="text-center flex-1">
                                                <p className="text-xs text-folio-text-dim font-bold ">Divergência</p>
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
                            <p className="text-xs font-bold text-folio-text-dim p-1">Alertas preditivos de risco</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-folio-surface border border-folio-border border-l-[6px] border-l-blue-500 shadow-sm">
                                    <p className="text-xs font-bold text-folio-text-dim mb-1">SLA do profissional</p>
                                    <p className="text-md font-black text-folio-text">94.2% <span className="text-xs font-medium opacity-50 ml-1">v. médio</span></p>
                                </div>
                                <div className="p-4 rounded-2xl bg-folio-surface border border-folio-border border-l-[6px] border-l-red-500 shadow-sm">
                                    <p className="text-xs font-bold text-folio-text-dim mb-1">Recorrência de disputas</p>
                                    <p className="text-md font-black text-folio-text">8.5% <span className="text-xs text-red-500 font-bold ml-1">Crítico</span></p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'contract' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-folio-surface border border-folio-border shadow-folio rounded-2xl p-6 space-y-5">
                            <p className="text-xs font-bold text-folio-text-dim  flex items-center gap-2"><FileText size={16} /> Cláusulas do pedido</p>
                            <div className="space-y-1">
                                {[
                                    { label: 'ID único', value: order.id, mono: true },
                                    { label: 'Serviço', value: service?.title },
                                    { label: 'Agendamento', value: new Date(order.scheduled_at).toLocaleString('pt-BR') },
                                    { label: 'Modo de preço', value: order.pricing_mode === 'hourly' ? 'Por hora' : 'Valor fixo' },
                                    { label: 'Ponto de execução', value: order.location_text || 'GPS Local' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-4 border-b border-folio-border/50 last:border-0 h-14">
                                        <span className="text-xs font-bold text-folio-text-dim  shrink-0">{item.label}</span>
                                        <span className={`text-xs font-bold text-folio-text text-right max-w-[300px] truncate ${item.mono ? 'font-mono opacity-60' : ''}`}>{item.value || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-folio-surface border border-folio-border shadow-folio rounded-2xl p-6">
                                <p className="text-xs font-bold text-folio-text-dim  mb-2">Custódia ativa</p>
                                <p className="text-3xl font-black text-folio-text tabular-nums">R$ {formatNumber(order.total_amount)}</p>
                                <div className="mt-5 flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-xl w-fit border border-yellow-500/20">
                                    <ShieldCheck size={14} />
                                    <span className="text-xs font-black ">Protegido em garantia</span>
                                </div>
                            </div>
                            <div className="bg-folio-surface border border-folio-border shadow-folio rounded-2xl p-6">
                                <p className="text-xs font-bold text-folio-text-dim  mb-2">Repasse estimado</p>
                                <p className="text-3xl font-black text-[#1DB97A] tabular-nums">R$ {formatNumber(order.total_amount * 0.9)}</p>
                                <div className="mt-5 flex items-center gap-2 px-3 py-1.5 bg-[#1DB97A]/10 text-[#1DB97A] rounded-xl w-fit border border-[#1DB97A]/20">
                                    <Activity size={14} />
                                    <span className="text-xs font-black ">Liquidável</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-folio-surface2/30 border border-folio-border rounded-2xl p-5 flex gap-4 items-center shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-folio-surface border border-folio-border flex items-center justify-center text-folio-accent shadow-sm">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-folio-text">Taxa da plataforma (10%)</p>
                                <p className="text-xs text-folio-text-dim opacity-70">Provisionamento para operadora: R$ {formatNumber(order.total_amount * 0.1)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="space-y-6 animate-fade-in">
                        <p className="text-xs font-bold text-folio-text-dim flex items-center gap-2 px-1">
                            <History size={16} /> Linha do tempo imutável
                        </p>
                        <div className="space-y-0 relative pb-10">
                            <div className="absolute left-[17px] top-0 bottom-0 w-[2px] bg-folio-border/60" />
                            {auditLogs.length === 0 ? (
                                <div className="p-12 text-center text-folio-text-dim italic text-xs">Aguardando registro do primeiro evento operacional...</div>
                            ) : auditLogs.map((log, i) => (
                                <div key={i} className="flex gap-5 relative pl-12 pb-8 last:pb-0 group">
                                    <div className="absolute left-0 top-1 w-9 h-9 rounded-full bg-folio-surface border-2 border-folio-border flex items-center justify-center z-10 shadow-sm transition-all group-hover:border-folio-accent group-hover:scale-110">
                                        <Activity size={14} className="text-folio-text-dim group-hover:text-folio-accent" />
                                    </div>
                                    <div className="flex-1 space-y-2 bg-folio-surface p-4 rounded-2xl border border-folio-border shadow-sm group-hover:shadow-folio transition-all">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono text-folio-text-dim/60 font-bold">{new Date(log.created_at || log.timestamp).toLocaleString('pt-BR')}</span>
                                            <span className="text-xs font-black px-2 py-0.5 bg-folio-bg rounded-lg border border-folio-border text-folio-text opacity-70">{log.action?.split('_').join(' ').toLowerCase()}</span>
                                        </div>
                                        <p className="text-xs font-bold text-folio-text leading-tight tracking-tight">
                                            {log.details || log.action?.split('_').join(' ').toLowerCase()}
                                        </p>
                                        <div className="flex items-center gap-3 pt-1 border-t border-folio-border/40 mt-2">
                                            <span className="text-xs font-bold text-folio-text-dim flex items-center gap-1.5">
                                                <User size={10} className="text-folio-accent" /> Agente: {log.actor_user_id?.slice(0, 8) || 'Sistema'}
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
            <div className="p-6 border-t border-folio-border bg-folio-surface/30 backdrop-blur-md flex gap-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex-1 h-12 rounded-2xl border border-folio-border bg-folio-surface text-xs font-bold text-folio-text  hover:bg-folio-bg transition-all active:scale-95 shadow-sm"
                    >
                        Fechar dossiê
                    </button>
                )}
            </div>
        </div>
    );
};

export default NegotiationDossier;

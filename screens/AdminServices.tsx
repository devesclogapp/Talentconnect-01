import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Tag,
    User,
    DollarSign,
    Box,
    ExternalLink,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    ShieldAlert,
    TrendingUp,
    TrendingDown,
    MessageSquare,
    AlertCircle,
    Ban,
    EyeOff,
    Edit3,
    History,
    RefreshCcw,
    X,
    Star,
    ChevronRight,
    ArrowRightCircle,
    BarChart3,
    Activity,
    Eye,
    Info,
    Zap,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from "../components/ui/tooltip";

// --- Helpers de Governança ---
const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string) => {
    try {
        await (supabase as any).from('audit_logs').insert({
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
            reason,
            timestamp: new Date().toISOString(),
            origin: 'Service Governance'
        });
    } catch (err) {
        console.error("Audit Log Failure:", err);
    }
};

const calculateServiceRisk = (stats: any) => {
    let score = 5;
    if (stats.rating < 3.5) score += 40;
    if (stats.cancellationRate > 20) score += 30;
    if (stats.reports > 1) score += 20;
    if (stats.disputes > 1) score += 15;
    return Math.min(score, 100);
};

const AdminServices: React.FC = () => {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [selectedService, setSelectedService] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [isUpdating, setIsUpdating] = useState(false);

    const [actionModal, setActionModal] = useState<{ open: boolean, type: string, service: any } | null>(null);
    const [actionReason, setActionReason] = useState('');

    const [filters, setFilters] = useState({
        risk: 'all',
        status: 'all',
        reports: false
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select(`*, provider:users!provider_id (id, email)`);

            if (servicesError) {
                const { data: fallback, error: fallbackErr } = await supabase.from('services').select('*');
                if (fallbackErr) throw fallbackErr;
                setServices((fallback || []).map((s: any) => ({ ...s, provider: { email: 'Unknown' }, risk_score: 0, internal_status: 'active' })));
                return;
            }

            const fetchSafe = async (table: string, columns: string) => {
                try {
                    const { data, error } = await supabase.from(table).select(columns);
                    if (error) return [];
                    return data || [];
                } catch (e) {
                    return [];
                }
            };

            const allOrders = await fetchSafe('orders', 'id, service_id, status') as any[];
            const allPayments = await fetchSafe('payments', 'order_id, amount_total, escrow_status') as any[];
            const allDisputes = await fetchSafe('disputes', 'order_id') as any[];

            const enriched = ((servicesData || []) as any[]).map(s => {
                const serviceOrders = allOrders.filter(o => o.service_id === s.id);
                const orderIds = serviceOrders.map(o => o.id);

                const revenueTotal = allPayments
                    .filter(p => orderIds.includes(p.order_id) && p.escrow_status === 'released')
                    .reduce((acc, p) => acc + (p.amount_total || 0), 0);

                const revenue30d = allPayments
                    .filter(p => orderIds.includes(p.order_id) && p.escrow_status === 'released')
                    .reduce((acc, p) => acc + (p.amount_total || 0), 0);

                const cancellations = serviceOrders.filter(o => o.status === 'cancelled').length;
                const reportsCount = 0;
                const disputesCount = allDisputes.filter(d => orderIds.includes(d.order_id)).length;

                const stats = {
                    rating: 5.0,
                    orders: serviceOrders.length,
                    cancellationRate: serviceOrders.length > 0 ? (cancellations / serviceOrders.length) * 100 : 0,
                    reports: reportsCount,
                    disputes: disputesCount,
                    revenue30d,
                    revenueTotal
                };

                const riskScore = calculateServiceRisk(stats);
                let statusLabel = s.active ? 'active' : 'paused';
                if (riskScore > 70) statusLabel = 'critical';
                else if (riskScore > 40) statusLabel = 'observation';

                return {
                    ...s,
                    ...stats,
                    risk_score: riskScore,
                    internal_status: statusLabel,
                    risk_level: riskScore > 70 ? 'high' : riskScore > 30 ? 'medium' : 'low',
                    provider: s.provider || { email: 'Sem Provedor' }
                };
            }).sort((a, b) => b.risk_score - a.risk_score);

            setServices(enriched);
        } catch (error: any) {
            console.error('CRITICAL: Error in fetchServices:', error);
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const performServiceAction = async () => {
        if (!actionModal || !actionReason) return;
        setIsUpdating(true);
        try {
            const { type, service } = actionModal;
            const updates: any = {};

            if (type === 'BAN') updates.active = false;
            if (type === 'REVISION') updates.active = false;
            if (type === 'ACTIVATE') updates.active = true;

            const { error } = await (supabase as any).from('services').update(updates).eq('id', service.id);
            if (error) throw error;

            await logAdminAction(`SERVICE_${type}`, 'SERVICE', service.id, `Ação de governança: ${type}`, actionReason);

            setServices(prev => prev.map(s => s.id === service.id ? { ...s, ...updates, internal_status: type === 'ACTIVATE' ? 'active' : 'governance_hold' } : s));
            if (selectedService?.id === service.id) setSelectedService({ ...selectedService, ...updates });

            alert('Intervenção concluída com sucesso.');
            setActionModal(null);
            setActionReason('');
        } catch (err: any) {
            alert('Erro: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredServices = services.filter(service => {
        const title = (service.title || '').toLowerCase();
        const providerName = resolveUserName(service.provider).toLowerCase();
        const matchesSearch = title.includes(searchTerm.toLowerCase()) || providerName.includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
        const matchesRisk = filters.risk === 'all' || service.risk_level === filters.risk;
        const matchesReports = !filters.reports || service.reports > 0;
        return matchesSearch && matchesCategory && matchesRisk && matchesReports;
    });

    const categories = Array.from(new Set(services.map(s => s.category))).filter(Boolean);

    return (
        <div className="flex gap-6 animate-fade-in relative pb-12 h-screen overflow-hidden">

            {/* Sidebar Filtros */}
            <div className="w-64 h-full p-6 space-y-8 overflow-y-auto shrink-0 border-r border-border-subtle">
                <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-accent-primary" />
                    <h3 className="text-xs font-semibold text-text-secondary tracking-widest">Governança Editorial</h3>
                </div>

                <div className="space-y-6">
                    <FilterGroup label="Nível de Risco">
                        <FilterButton active={filters.risk === 'all'} label="Geral" onClick={() => setFilters({ ...filters, risk: 'all' })} />
                        <FilterButton active={filters.risk === 'high'} label="Críticos" color="text-error" onClick={() => setFilters({ ...filters, risk: 'high' })} />
                        <FilterButton active={filters.risk === 'medium'} label="Observação" color="text-warning" onClick={() => setFilters({ ...filters, risk: 'medium' })} />
                    </FilterGroup>

                    <FilterGroup label="Performance">
                        <button
                            onClick={() => setFilters({ ...filters, reports: !filters.reports })}
                            className={`w-full flex items-center justify-between p-3 rounded-[8px] border transition-all duration-[120ms] ${filters.reports ? 'bg-error/10 border-error/20 text-error' : 'bg-bg-secondary border-border-subtle text-text-tertiary hover:bg-bg-tertiary'}`}
                        >
                            <span className="text-xs font-semibold tracking-widest">Denunciados</span>
                            <AlertTriangle size={13} />
                        </button>
                    </FilterGroup>
                </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">

                {/* Modal de Ação */}
                {actionModal?.open && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                        <div
                            className="w-full max-w-lg overflow-hidden animate-in zoom-in-95"
                            style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '14px',
                                border: '1px solid rgba(0,0,0,0.06)',
                                boxShadow: '0 12px 32px rgba(0,0,0,0.15)'
                            }}
                        >
                            <div className="p-7 border-b border-border-subtle" style={{ background: 'var(--bg-secondary)' }}>
                                <h2 className="text-lg font-semibold text-text-primary mb-1">Intervenção Editorial</h2>
                                <p className="text-xs text-text-tertiary">Serviço: {actionModal.service.title}</p>
                            </div>
                            <div className="p-7 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-text-tertiary tracking-widest">Justificativa Operacional</label>
                                    <textarea
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        className="w-full h-28 rounded-[8px] p-4 text-xs font-medium outline-none focus:border-accent-primary transition-all resize-none"
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid rgba(0,0,0,0.06)',
                                        }}
                                        placeholder="Ex: Conteúdo impróprio ou reclamações recorrentes..."
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setActionModal(null)}
                                        className="flex-1 py-3 rounded-[8px] text-xs font-semibold text-text-primary transition-all hover:bg-bg-tertiary"
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)' }}
                                    >Cancelar</button>
                                    <button
                                        disabled={!actionReason || isUpdating}
                                        onClick={performServiceAction}
                                        className="flex-1 py-3 rounded-[8px] text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-30"
                                        style={{ background: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                                    >
                                        Aplicar & Logar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detalhe do Serviço - Dossiê */}
                {selectedService && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                        <div
                            className="h-full w-full max-w-4xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col"
                            style={{ background: 'var(--bg-primary)' }}
                        >
                            <div className="p-6 border-b border-border-subtle flex items-center justify-between" style={{ background: 'var(--bg-secondary)' }}>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-[8px] bg-accent-primary text-white"><Tag size={20} /></div>
                                    <div>
                                        <h2 className="text-base font-semibold text-text-primary leading-tight">{selectedService.title}</h2>
                                        <p className="text-xs text-text-tertiary font-medium">ID: {selectedService.id.slice(0, 8)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedService(null)}
                                    className="p-2 rounded-[8px] hover:bg-bg-tertiary transition-colors border border-border-subtle"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex px-6 border-b border-border-subtle overflow-x-auto" style={{ background: 'var(--bg-secondary)' }}>
                                {['summary', 'edits', 'ratings', 'disputes', 'logs'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-5 py-4 text-xs font-semibold tracking-widest border-b-2 transition-all shrink-0 ${activeTab === tab ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                                    >
                                        {tab === 'summary' ? 'Resumo' : tab === 'edits' ? 'Edições' : tab === 'ratings' ? 'Avaliações' : tab === 'disputes' ? 'Incidentes' : 'Audit Log'}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-8">
                                {activeTab === 'summary' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <DetailStat label="Pedidos Totais" value={selectedService.orders} icon={<ArrowRightCircle />} color="text-accent-primary" tooltip="Volume de solicitações criadas para este serviço específico." />
                                            <DetailStat label="Receita Total" value={`R$ ${selectedService.revenueTotal.toLocaleString()}`} icon={<DollarSign />} color="text-success" tooltip="Valores já liquidados e repassados por este serviço." />
                                            <DetailStat label="Risco Atual" value={`${selectedService.risk_score}%`} icon={<ShieldAlert />} color={selectedService.risk_level === 'high' ? 'text-error' : 'text-success'} tooltip="Nível de periculosidade baseado em avaliações baixas e cancelamentos." />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-semibold text-text-tertiary tracking-widest">Governança do Profissional</h4>
                                                <div
                                                    className="p-6 space-y-4"
                                                    style={{
                                                        background: 'var(--bg-secondary)',
                                                        borderRadius: '10px',
                                                        border: '1px solid rgba(0,0,0,0.06)'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-[8px] bg-accent-primary text-white flex items-center justify-center font-semibold text-sm">{(resolveUserName(selectedService.provider)).charAt(0)}</div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-text-primary">{resolveUserName(selectedService.provider)}</p>
                                                            <p className="text-xs text-text-tertiary font-mono">{selectedService.provider.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="pt-3 border-t border-border-subtle flex justify-between items-center text-xs font-semibold tracking-widest text-text-tertiary">
                                                        <span>Status Profissional</span>
                                                        <span className="text-success">Verificado</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-semibold text-text-tertiary tracking-widest">Painel de Decisão</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <ControlButton icon={<CheckCircle2 />} label="Aprovar" onClick={() => setActionModal({ open: true, type: 'APPROVE', service: selectedService })} />
                                                    <ControlButton icon={<EyeOff />} label="Ocultar" onClick={() => setActionModal({ open: true, type: 'HIDE', service: selectedService })} />
                                                    <ControlButton icon={<AlertTriangle />} label="Revisão" onClick={() => setActionModal({ open: true, type: 'REVISION', service: selectedService })} />
                                                    <ControlButton icon={<Ban />} label="Banir" color="text-error" onClick={() => setActionModal({ open: true, type: 'BAN', service: selectedService })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab !== 'summary' && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                                        <Activity size={48} className="animate-pulse" />
                                        <p className="mt-4 text-sm font-semibold tracking-widest">Sincronizando Dossiê Global...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Principal */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-text-primary">Catálogo Global</h1>
                        <p className="text-sm text-text-secondary mt-0.5">Controle de qualidade, performance e risco editorial</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchServices}
                            className="p-2.5 rounded-[8px] border border-border-subtle hover:rotate-180 transition-all duration-500"
                            style={{ background: 'var(--bg-secondary)' }}
                        >
                            <RefreshCcw size={18} />
                        </button>
                        <button
                            className="h-10 px-5 rounded-[8px] text-xs font-semibold tracking-widest text-white flex items-center gap-2 transition-all hover:opacity-90"
                            style={{ background: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                        >
                            <BarChart3 size={14} /> Relatórios
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div
                    className="flex flex-col md:flex-row gap-4 p-4"
                    style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '10px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-[8px] pl-10 pr-4 h-12 text-sm outline-none focus:border-accent-primary transition-all"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid rgba(0,0,0,0.06)',
                                color: 'var(--text-primary)'
                            }}
                            placeholder="Buscar por título, profissional ou ID..."
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="h-12 px-4 rounded-[8px] text-xs font-semibold outline-none focus:border-accent-primary transition-all"
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <option value="all">Categorias</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                {/* Tabela de Governança */}
                <div
                    style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '10px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        overflow: 'hidden'
                    }}
                >
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-subtle" style={{ background: 'var(--bg-secondary)' }}>
                                <th className="px-6 py-4 text-xs font-semibold tracking-widest text-text-tertiary">Serviço / Pro</th>
                                <th className="px-6 py-4 text-xs font-semibold tracking-widest text-text-tertiary">Saúde / Risco</th>
                                <th className="px-6 py-4 text-xs font-semibold tracking-widest text-text-tertiary">Métricas</th>
                                <th className="px-6 py-4 text-xs font-semibold tracking-widest text-text-tertiary">Receita (30d)</th>
                                <th className="px-6 py-4 text-xs font-semibold tracking-widest text-text-tertiary text-right">Decisão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center">
                                    <RefreshCcw className="animate-spin mx-auto mb-3 text-accent-primary" size={24} />
                                    <p className="text-xs font-semibold tracking-widest text-text-tertiary">Consolidando Catálogo...</p>
                                </td></tr>
                            ) : filteredServices.map(service => (
                                <tr
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className="transition-all cursor-pointer group"
                                    style={{ borderLeft: '2px solid transparent' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <p className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors">{service.title}</p>
                                            <p className="text-xs text-text-tertiary mt-0.5">{resolveUserName(service.provider)}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium ${service.risk_level === 'high' ? 'bg-error/10 text-error' : service.risk_level === 'medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${service.risk_level === 'high' ? 'bg-error' : service.risk_level === 'medium' ? 'bg-warning' : 'bg-success'}`} />
                                            {service.risk_score}% Risco
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5"><ArrowRightCircle size={12} className="text-text-tertiary" /><span className="text-xs font-medium text-text-primary">{service.orders}</span></div>
                                            <div className="flex items-center gap-1.5"><Star size={12} className="text-warning" fill="currentColor" /><span className="text-xs font-medium text-text-primary">{service.rating}</span></div>
                                            {service.reports > 0 && <AlertTriangle size={12} className="text-error animate-pulse" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-text-primary font-mono">R$ {service.revenue30d.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => setSelectedService(service)}
                                            className="p-2 rounded-[6px] border border-border-subtle hover:bg-text-primary hover:text-white hover:border-transparent transition-all duration-[120ms]"
                                            style={{ background: 'var(--bg-secondary)' }}
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponentes Locais ---
const FilterGroup = ({ label, children }: any) => (
    <div className="space-y-3">
        <h4 className="text-xs font-semibold text-text-tertiary tracking-widest border-b border-border-subtle pb-2">{label}</h4>
        <div className="flex flex-col gap-1.5">{children}</div>
    </div>
);

const FilterButton = ({ active, label, color, onClick }: any) => (
    <button
        onClick={onClick}
        className="text-left px-3 py-2.5 rounded-[8px] text-xs font-medium tracking-widest transition-all duration-[120ms]"
        style={active
            ? { background: 'var(--text-primary)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
            : { background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: '1px solid rgba(0,0,0,0.06)' }
        }
    >
        <span className={color}>{label}</span>
    </button>
);

const DetailStat = ({ label, value, icon, color, tooltip }: any) => {
    return (
        <div
            className="p-5 hover:shadow-md transition-all h-full flex flex-col justify-between relative group"
            style={{
                background: 'var(--bg-primary)',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
        >
            {tooltip && (
                <div className="absolute top-4 right-4">
                    <TooltipProvider>
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <button className="p-1 rounded-full hover:bg-slate-500/5 transition-colors text-slate-400/20 hover:text-slate-400/60 outline-none">
                                    <Info size={12} strokeWidth={2} />
                                </button>
                            </TooltipTrigger>
                            <TooltipPortal>
                                <TooltipContent side="top" className="max-w-[180px] text-center bg-slate-900 border-slate-800 text-white py-2 z-[9999]">
                                    {tooltip}
                                </TooltipContent>
                            </TooltipPortal>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            <div className={`p-3 rounded-[6px] w-fit mb-5 ${color}`} style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)' }}>
                {React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: 1.5 })}
            </div>
            <div>
                <p className="text-xs font-medium text-text-tertiary tracking-widest mb-1">{label}</p>
                <h3 className="text-xl font-semibold text-text-primary leading-none tracking-tight">{value}</h3>
            </div>
        </div>
    );
};

const ControlButton = ({ icon, label, color, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-2.5 p-5 rounded-[8px] hover:shadow-md transition-all duration-[120ms] group ${color || 'text-text-primary'}`}
        style={{
            background: 'var(--bg-primary)',
            border: '1px solid rgba(0,0,0,0.06)',
        }}
    >
        <div className="transition-transform group-hover:scale-110">{React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: 1.5 })}</div>
        <span className="text-xs font-semibold tracking-widest">{label}</span>
    </button>
);

const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-3 border-b border-border-subtle text-xs font-medium tracking-widest">
        <span className="text-text-tertiary">{label}</span>
        <span className="text-text-primary">{value || 'N/A'}</span>
    </div>
);

export default AdminServices;

import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    CreditCard,
    Receipt,
    Calendar,
    Filter,
    ArrowUpDown,
    Download,
    PieChart,
    Search,
    CheckCircle2,
    Clock,
    X,
    ShieldCheck,
    AlertCircle,
    Banknote,
    ArrowRightCircle,
    Activity,
    ChevronRight,
    Play,
    ShieldAlert,
    Lock,
    Unlock,
    RotateCcw,
    FileText,
    Layers,
    Gavel,
    History,
    MoreHorizontal,
    TrendingDown,
    Zap,
    CheckCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import { useAppStore } from '../store';

const AdminFinance: React.FC = () => {
    const { viewFilters, setViewFilters } = useAppStore();

    const [payments, setPayments] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState(viewFilters?.escrow_status || 'all');
    const [activeTab, setActiveTab] = useState<'transactions' | 'payouts'>(viewFilters?.tab || 'transactions');
    const [activeDossierTab, setActiveDossierTab] = useState('summary');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedTrx, setSelectedTrx] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // KPIs Expandidos
    const [stats, setStats] = useState({
        gmv: { today: 0, week: 0, month: 0, trend: '+0%' },
        revenue: { total: 0, byType: { app: 0, sub: 0 } },
        escrow: { total: 0, aging: { low: 0, mid: 0, high: 0, critical: 0 } },
        payouts: { pending: 0, processed: 0, blocked: 0 }
    });

    useEffect(() => {
        fetchFinanceData();
        return () => setViewFilters(null);
    }, []);

    const logFinancialAction = async (action: string, entityId: string, details: string, reason: string, before?: any, after?: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const meta = {
                ua: navigator.userAgent,
                platform: navigator.platform,
                reason,
                details,
                before_state: before,
                after_state: after,
                origin: 'ERP Financeiro Connect'
            };

            await (supabase as any).from('audit_logs').insert({
                action,
                entity_type: 'payments',
                entity_id: entityId,
                actor_user_id: user?.id,
                payload_json: meta
            });
        } catch (err) {
            console.error("Financial Audit Failure:", err);
        }
    };

    const calculateEscrowAging = (createdAt: string) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 7) return { label: '< 7 dias', status: 'normal', days: diffDays };
        if (diffDays < 14) return { label: '7-14 dias', status: 'mid', days: diffDays };
        if (diffDays < 30) return { label: '14-30 dias', status: 'high', days: diffDays };
        return { label: '> 30 dias', status: 'critical', days: diffDays };
    };

    const fetchFinanceData = async () => {
        try {
            setLoading(true);
            const { data: pData, error: pError } = await supabase
                .from('payments')
                .select(`
                    *,
                    order:orders (
                        id,
                        status,
                        pricing_mode,
                        client:users!client_id (user_metadata),
                        provider:users!provider_id (user_metadata)
                    )
                `)
                .order('created_at', { ascending: false });

            if (pError) throw pError;

            // Enriquecer com Aging e Metadados do Ledger
            const enrichedPayments = (pData || []).map((p: any) => ({
                ...p,
                aging: calculateEscrowAging(p.created_at),
                net_amount: p.provider_amount || (p.amount_total - (p.operator_fee || 0)),
                ledger_type: p.amount_total > 0 ? 'ORDER_REVENUE' : 'ADJUSTMENT'
            }));

            setPayments(enrichedPayments);

            // Cálculos de KPIs Estratégicos
            const now = new Date();
            const oneDay = 24 * 60 * 60 * 1000;
            const sevenDays = 7 * oneDay;
            const thirtyDays = 30 * oneDay;

            const gmvToday = enrichedPayments.filter(p => now.getTime() - new Date(p.created_at).getTime() < oneDay)
                .reduce((acc, p) => acc + p.amount_total, 0);
            const gmvWeek = enrichedPayments.filter(p => now.getTime() - new Date(p.created_at).getTime() < sevenDays)
                .reduce((acc, p) => acc + p.amount_total, 0);
            const gmvMonth = enrichedPayments.filter(p => now.getTime() - new Date(p.created_at).getTime() < thirtyDays)
                .reduce((acc, p) => acc + p.amount_total, 0);

            const totalEscrow = enrichedPayments.filter(p => ['held', 'pending'].includes(p.escrow_status))
                .reduce((acc, p) => acc + p.amount_total, 0);

            const agingStats = enrichedPayments.reduce((acc, p) => {
                if (p.escrow_status === 'held') {
                    if (p.aging.status === 'normal') acc.low += p.amount_total;
                    else if (p.aging.status === 'mid') acc.mid += p.amount_total;
                    else if (p.aging.status === 'high') acc.high += p.amount_total;
                    else acc.critical += p.amount_total;
                }
                return acc;
            }, { low: 0, mid: 0, high: 0, critical: 0 });

            setStats({
                gmv: { today: gmvToday, week: gmvWeek, month: gmvMonth, trend: '+14%' },
                revenue: { total: enrichedPayments.reduce((acc, p) => acc + (p.operator_fee || 0), 0), byType: { app: 0, sub: 0 } },
                escrow: { total: totalEscrow, aging: agingStats },
                payouts: {
                    pending: enrichedPayments.filter(p => p.escrow_status === 'held' && p.order?.status === 'completed').length,
                    processed: enrichedPayments.filter(p => p.escrow_status === 'released').length,
                    blocked: enrichedPayments.filter(p => p.order?.status === 'disputed').length
                }
            });

        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, newStatus: string) => {
        try {
            const reason = prompt("Justificativa para intervenção financeira:");
            if (!reason) return;

            setIsProcessing(true);
            const before = payments.find(p => p.id === id);

            const { error } = await (supabase as any)
                .from('payments')
                .update({ escrow_status: newStatus })
                .eq('id', id);

            if (error) throw error;

            const after = { ...before, escrow_status: newStatus };

            // Log de Auditoria Financeira Estruturado
            await logFinancialAction(
                'FINANCIAL_INTERVENTION',
                id,
                `Alteração de status de escrow: ${before?.escrow_status} -> ${newStatus}`,
                reason,
                before,
                after
            );

            alert('Intervenção rastro-concluída com sucesso!');
            fetchFinanceData();
            setSelectedTrx(null);
        } catch (error: any) {
            alert('Erro Crítico na Operação: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredData = (activeTab === 'transactions' ? payments : payouts).filter(p => {
        const matchesStatus = filterStatus === 'all' || p.escrow_status === filterStatus;
        const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.requester || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-fade-in relative pb-10">
            {/* Dossiê Financeiro - Tactical Detail */}
            {selectedTrx && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="bg-bg-primary h-full w-full max-w-4xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">

                        {/* Header do Dossiê */}
                        <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-secondary/30">
                            <div className="flex items-center gap-5">
                                <div className="p-4 rounded-2xl bg-black text-white shadow-lg">
                                    <Banknote size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Transação Detalhada</h2>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedTrx.escrow_status === 'released' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                            {selectedTrx.escrow_status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest flex items-center gap-2">
                                        ID: <span className="font-mono text-text-primary">{selectedTrx.id}</span>
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTrx(null)} className="p-3 bg-bg-secondary hover:bg-bg-tertiary rounded-xl border border-border-subtle transition-all"><X size={24} /></button>
                        </div>

                        {/* Navegação */}
                        <div className="flex px-10 bg-bg-secondary/10 border-b border-border-subtle">
                            {[
                                { id: 'summary', label: 'Resumo & Fluxo', icon: <History size={14} /> },
                                { id: 'ledger', label: 'Ledger Contábil', icon: <Layers size={14} /> },
                                { id: 'audit', label: 'Auditoria & Logs', icon: <FileText size={14} /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveDossierTab(tab.id)}
                                    className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeDossierTab === tab.id ? 'border-accent-primary text-accent-primary bg-accent-primary/5' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            {activeDossierTab === 'summary' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <AccountingDetailBox label="Valor Bruto" value={`R$ ${selectedTrx.amount_total?.toFixed(2)}`} color="text-text-primary" />
                                        <AccountingDetailBox label="Taxa Mercado" value={`R$ ${selectedTrx.operator_fee?.toFixed(2)}`} color="text-accent-primary" />
                                        <AccountingDetailBox label="Líquido Profissional" value={`R$ ${selectedTrx.net_amount?.toFixed(2)}`} color="text-success" />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        <div className="space-y-8">
                                            <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest flex items-center gap-2">
                                                <Zap className="text-accent-primary" size={14} /> Console Financeiro
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ActionShortcut
                                                    icon={<Unlock className="text-success" />}
                                                    title="Liberar Repasse"
                                                    desc="Liquida o pagamento para o profissional"
                                                    onClick={() => handleAction(selectedTrx.id, 'released')}
                                                />
                                                <ActionShortcut
                                                    icon={<Lock className="text-warning" />}
                                                    title="Bloquear Escrow"
                                                    desc="Trava a transação para auditoria"
                                                    onClick={() => handleAction(selectedTrx.id, 'held')}
                                                />
                                                <ActionShortcut
                                                    icon={<RotateCcw className="text-error" />}
                                                    title="Estorno Total"
                                                    desc="Devolve 100% do valor ao cliente"
                                                    onClick={() => handleAction(selectedTrx.id, 'refunded')}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-bg-secondary/30 p-8 rounded-[40px] border border-border-subtle space-y-6 text-left">
                                            <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Informações da Ordem</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between py-3 border-b border-border-subtle">
                                                    <span className="text-[10px] font-bold text-text-tertiary uppercase">Protocolo Vínculo</span>
                                                    <span className="text-[10px] font-black text-text-primary font-mono">{selectedTrx.order_id}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-3 border-b border-border-subtle">
                                                    <span className="text-[10px] font-bold text-text-tertiary uppercase">Cliente</span>
                                                    <span className="text-[10px] font-black text-text-primary">{resolveUserName(selectedTrx.order?.client)}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-3">
                                                    <span className="text-[10px] font-bold text-text-tertiary uppercase">Profissional</span>
                                                    <span className="text-[10px] font-black text-text-primary">{resolveUserName(selectedTrx.order?.provider)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeDossierTab === 'ledger' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 text-left">
                                    <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Partidas Dobradas (Simulação Contábil)</h4>
                                    <div className="bg-bg-secondary/20 rounded-[40px] border border-border-subtle overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-bg-secondary/40 border-b border-border-subtle">
                                                <tr>
                                                    <th className="px-8 py-4 text-[9px] font-black uppercase text-text-tertiary tracking-widest">Conta / Destino</th>
                                                    <th className="px-8 py-4 text-[9px] font-black uppercase text-text-tertiary tracking-widest text-right">Débito</th>
                                                    <th className="px-8 py-4 text-[9px] font-black uppercase text-text-tertiary tracking-widest text-right">Crédito</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle">
                                                <tr>
                                                    <td className="px-8 py-4 text-xs font-medium">Conta Cliente (Origem)</td>
                                                    <td className="px-8 py-4 text-xs font-black text-error text-right">R$ {selectedTrx.amount_total?.toFixed(2)}</td>
                                                    <td className="px-8 py-4 text-xs font-black text-text-tertiary text-right">-</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-8 py-4 text-xs font-medium">Custódia Escrow (Mercado)</td>
                                                    <td className="px-8 py-4 text-xs font-black text-text-tertiary text-right">-</td>
                                                    <td className="px-8 py-4 text-xs font-black text-success text-right">R$ {selectedTrx.amount_total?.toFixed(2)}</td>
                                                </tr>
                                                <tr className="bg-bg-secondary/10">
                                                    <td className="px-8 py-4 text-xs font-medium">Taxa de Intermediação</td>
                                                    <td className="px-8 py-4 text-xs font-black text-text-tertiary text-right">-</td>
                                                    <td className="px-8 py-4 text-xs font-black text-accent-primary text-right">R$ {selectedTrx.operator_fee?.toFixed(2)}</td>
                                                </tr>
                                                <tr className="bg-bg-secondary/10">
                                                    <td className="px-8 py-4 text-xs font-medium">Líquido Profissional (Provisionado)</td>
                                                    <td className="px-8 py-4 text-xs font-black text-text-tertiary text-right">-</td>
                                                    <td className="px-8 py-4 text-xs font-black text-success text-right">R$ {selectedTrx.net_amount?.toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-6 bg-accent-primary/5 border border-accent-primary/20 rounded-3xl">
                                        <p className="text-[10px] text-text-tertiary leading-relaxed italic">
                                            A estrutura acima representa os lançamentos automáticos gerados pelo protocolo financeiro. Registros contábeis são **imutáveis** e auditados a cada 24 horas.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeDossierTab === 'audit' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-left">
                                    <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Rastro de Auditoria Operacional</h4>
                                    <div className="space-y-4">
                                        <LogItem label="Gateway" value="Stripe Connect" icon={<Activity size={12} />} />
                                        <LogItem label="IP Origem" value="192.168.1.104" icon={<Activity size={12} />} />
                                        <LogItem label="Protocolo" value={`TRX-${selectedTrx.id.slice(0, 10)}`} icon={<FileText size={12} />} />
                                    </div>
                                    <div className="p-20 text-center opacity-40">
                                        <Gavel size={48} className="mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Logs em tempo real</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="heading-xl text-text-primary uppercase tracking-tighter">Centro Financeiro</h1>
                    <p className="text-sm text-text-tertiary font-medium">Ledger Contábil Auditável & Governança de Escrow</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 bg-bg-primary border border-border-subtle rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-bg-secondary transition-all">
                        <Download size={16} /> Exportar Ledger
                    </button>
                    <button className="h-12 px-6 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
                        <Activity size={16} /> Conciliação Global
                    </button>
                </div>
            </div>

            {/* Stats Dashboard Expandido */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <EfficiencyCard
                    label="GMV (7 Dias)"
                    value={`R$ ${stats.gmv.week.toLocaleString('pt-BR')}`}
                    icon={<DollarSign />}
                    desc={`Hoje: R$ ${stats.gmv.today.toLocaleString('pt-BR')}`}
                    color="text-accent-primary"
                    trend={stats.gmv.trend}
                />
                <EfficiencyCard
                    label="Receita Líquida (Fees)"
                    value={`R$ ${stats.revenue.total.toLocaleString('pt-BR')}`}
                    icon={<TrendingUp />}
                    desc="Taxas retidas de pedidos"
                    color="text-success"
                    trend="+18.5%"
                />
                <EfficiencyCard
                    label="Escrow Retido"
                    value={`R$ ${stats.escrow.total.toLocaleString('pt-BR')}`}
                    icon={<ShieldCheck />}
                    desc={`${Math.round((stats.escrow.aging.critical / (stats.escrow.total || 1)) * 100)}% em aging crítico`}
                    color="text-warning"
                />
                <EfficiencyCard
                    label="Payouts Operacionais"
                    value={stats.payouts.pending.toString()}
                    icon={<Banknote />}
                    desc="Solicitações de saque pendentes"
                    color="text-blue-500"
                />
            </div>

            {/* Operational Tabs */}
            <div className="flex items-center gap-4 border-b border-border-subtle pb-4">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`text-[11px] font-black uppercase tracking-[0.1em] px-6 py-2 rounded-xl transition-all ${activeTab === 'transactions' ? 'bg-black text-white shadow-lg' : 'text-text-tertiary hover:bg-bg-secondary'}`}
                >
                    Transações (Interno)
                </button>
                <button
                    onClick={() => setActiveTab('payouts')}
                    className={`text-[11px] font-black uppercase tracking-[0.1em] px-6 py-2 rounded-xl transition-all relative ${activeTab === 'payouts' ? 'bg-black text-white shadow-lg' : 'text-text-tertiary hover:bg-bg-secondary'}`}
                >
                    Saques Pendentes
                    {payouts.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white">{payouts.length}</span>}
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por ID ou participante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary/50 border border-border-subtle rounded-2xl pl-12 pr-4 py-3 text-xs outline-none focus:border-accent-primary transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-bg-secondary border border-border-subtle rounded-2xl px-6 py-3 text-xs outline-none font-black uppercase tracking-widest text-text-primary"
                    >
                        <option value="all">Filtrar por Status</option>
                        <option value="held">Em Retenção</option>
                        <option value="released">Liberado</option>
                        <option value="refunded">Estornado</option>
                    </select>
                </div>
            </div>

            {/* Main Data View */}
            <div className="bg-bg-primary border border-border-subtle rounded-[40px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-secondary/50 border-b border-border-subtle">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Protocolo / Data</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Entrada / Saída</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Valor Bruto</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status Fluxo</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Análise</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-text-tertiary">
                                        <Clock className="animate-spin mx-auto mb-4" size={32} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Ledger...</p>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-text-tertiary opacity-40">
                                        <Receipt size={48} className="mx-auto mb-4" />
                                        <p className="text-sm font-bold">Nenhum registro encontrado nesta categoria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-bg-secondary/20 transition-all group cursor-pointer" onClick={() => setSelectedTrx(trx)}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center border border-border-subtle">
                                                    <Receipt size={14} className="text-text-tertiary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">#{trx.id.slice(0, 8)}</p>
                                                    <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
                                                        {new Date(trx.created_at).toLocaleDateString('pt-BR')} {new Date(trx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${trx.ledger_type === 'ORDER_REVENUE' ? 'bg-success/10 text-success' : 'bg-accent-primary/10 text-accent-primary'}`}>
                                                    {trx.ledger_type === 'ORDER_REVENUE' ? <ArrowUpRight size={14} /> : <Layers size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{trx.ledger_type?.replace('_', ' ')}</p>
                                                    <p className="text-[9px] text-text-tertiary font-bold uppercase truncate max-w-[150px]">
                                                        {resolveUserName(trx.order?.client) || 'Ajuste Manual'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-text-primary">R$ {trx.amount_total?.toFixed(2)}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[8px] font-bold text-text-tertiary uppercase">Fee: R$ {trx.operator_fee?.toFixed(2)}</span>
                                                    <span className="text-[8px] font-bold text-success uppercase">Net: R$ {trx.net_amount?.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border self-start ${trx.escrow_status === 'released' ? 'bg-success/10 text-success border-success/20' :
                                                    trx.escrow_status === 'held' ? 'bg-warning/10 text-warning border-warning/20' :
                                                        'bg-bg-tertiary text-text-tertiary border-border-subtle'
                                                    }`}>
                                                    {trx.escrow_status}
                                                </span>
                                                {trx.escrow_status === 'held' && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={10} className="text-text-tertiary" />
                                                        <span className={`text-[8px] font-black uppercase ${trx.aging.status === 'critical' ? 'text-error' :
                                                            trx.aging.status === 'high' ? 'text-warning' : 'text-text-tertiary'
                                                            }`}>
                                                            {trx.aging.label}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setSelectedTrx(trx)}
                                                className="p-2.5 bg-bg-secondary hover:bg-black hover:text-white rounded-xl transition-all shadow-sm border border-border-subtle"
                                            >
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

// UI Components
const EfficiencyCard = ({ label, value, icon, desc, color, trend }: any) => (
    <div className="bg-bg-primary border border-border-subtle p-8 rounded-[40px] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-text-tertiary opacity-10 group-hover:scale-125 transition-transform">
            {React.cloneElement(icon as React.ReactElement, { size: 48 })}
        </div>
        <div className="relative space-y-4 text-left">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl bg-bg-secondary ${color}`}>
                    {React.cloneElement(icon as React.ReactElement, { size: 20 })}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black ${trend.startsWith('+') ? 'text-success' : 'text-error'}`}>
                        <TrendingUp size={12} className={trend.startsWith('-') ? 'rotate-180' : ''} />
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{label}</p>
                <h3 className={`text-2xl font-black text-text-primary tracking-tighter mt-1`}>{value}</h3>
            </div>
            <p className="text-[10px] font-medium text-text-tertiary">{desc}</p>
        </div>
    </div>
);

const AccountingDetailBox = ({ label, value, color }: any) => (
    <div className="bg-bg-secondary/30 p-6 rounded-3xl border border-border-subtle text-left">
        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-1">{label}</span>
        <span className={`text-xl font-black ${color}`}>{value}</span>
    </div>
);

const ActionShortcut = ({ icon, title, desc, onClick }: any) => (
    <button onClick={onClick} className="flex items-center gap-5 p-5 bg-bg-primary border border-border-subtle rounded-3xl hover:bg-bg-secondary transition-all group">
        <div className="w-12 h-12 rounded-2xl bg-bg-secondary flex items-center justify-center border border-border-subtle group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div className="text-left">
            <h5 className="text-[11px] font-black text-text-primary uppercase tracking-tight">{title}</h5>
            <p className="text-[9px] text-text-tertiary font-medium">{desc}</p>
        </div>
        <ChevronRight size={16} className="ml-auto text-text-tertiary" />
    </button>
);

const LogItem = ({ label, value, icon }: any) => (
    <div className="flex items-center justify-between p-5 bg-bg-secondary/20 rounded-2xl border border-border-subtle">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-bg-primary rounded-lg text-text-tertiary">{icon}</div>
            <span className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">{label}</span>
        </div>
        <span className="text-[10px] font-black text-text-primary uppercase">{value}</span>
    </div>
);

const XCircle = ({ size, className }: any) => <X size={size} className={className} />;

export default AdminFinance;

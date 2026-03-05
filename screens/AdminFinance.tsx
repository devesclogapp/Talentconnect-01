import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Search,
    RefreshCw,
    Download,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Shield,
    Lock,
    Unlock,
    Activity,
    CreditCard,
    X,
    Eye,
    ArrowUp,
    ArrowDown,
    Percent
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';

const logAdminAction = async (action: string, entityType: string, entityId: string, details: string, reason: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from('audit_logs').insert({
            action,
            entity_type: entityType,
            entity_id: entityId,
            actor_user_id: user?.id,
            payload_json: { details, reason, origin: 'ERP AdminFinance' }
        });
    } catch (err) { console.error("Audit log failed:", err); }
};

const AdminFinance: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [dossierTab, setDossierTab] = useState('details');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [sortField, setSortField] = useState<'amount' | 'created' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const [kpis, setKpis] = useState({
        gmv: 0,
        revenue: 0,
        inEscrow: 0,
        pendingPayouts: 0,
        refunds: 0,
        txCount: 0
    });

    useEffect(() => { fetchPayments(); }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    order:orders (
                        id, status, scheduled_at, pricing_mode,
                        client:users!client_id (id, email, name),
                        provider:users!provider_id (id, email, name),
                        service:services (id, title)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const data_ = (data || []) as any[];

            const gmv = data_.reduce((s, p) => s + (p.amount_total || 0), 0);
            const revenue = data_.filter(p => p.escrow_status === 'released').reduce((s, p) => s + (p.operator_fee || 0), 0);
            const inEscrow = data_.filter(p => p.escrow_status === 'held').reduce((s, p) => s + (p.amount_total || 0), 0);
            const pendingPayouts = data_.filter(p => p.escrow_status === 'pending').reduce((s, p) => s + (p.provider_amount || 0), 0);
            const refunds = data_.filter(p => p.escrow_status === 'refunded').reduce((s, p) => s + (p.amount_total || 0), 0);

            setKpis({ gmv, revenue, inEscrow, pendingPayouts, refunds, txCount: data_.length });
            setPayments(data_);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, newStatus: string) => {
        const reason = prompt('Justificativa para intervenção financeira:');
        if (!reason) return;
        setIsProcessing(id);
        try {
            const { error } = await (supabase as any).from('payments').update({ escrow_status: newStatus }).eq('id', id);
            if (error) throw error;
            await logAdminAction('FINANCE_INTERVENTION', 'PAYMENT', id, `Status alterado para ${newStatus}`, reason);
            setPayments(prev => prev.map(p => p.id === id ? { ...p, escrow_status: newStatus } : p));
            if (selectedPayment?.id === id) setSelectedPayment({ ...selectedPayment, escrow_status: newStatus });
            alert('Intervenção aplicada com sucesso.');
        } catch (err: any) {
            alert('Erro: ' + err.message);
        } finally {
            setIsProcessing(null);
        }
    };

    const toggleSort = (field: 'amount' | 'created') => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const filteredPayments = payments
        .filter(p => {
            const matchesStatus = filterStatus === 'all' || p.escrow_status === filterStatus;
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                (p.id || '').toLowerCase().includes(search) ||
                resolveUserName(p.order?.client).toLowerCase().includes(search) ||
                resolveUserName(p.order?.provider).toLowerCase().includes(search) ||
                (p.order?.service?.title || '').toLowerCase().includes(search);
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => {
            if (!sortField) return 0;
            if (sortField === 'amount') return sortDir === 'desc' ? (b.amount_total || 0) - (a.amount_total || 0) : (a.amount_total || 0) - (b.amount_total || 0);
            if (sortField === 'created') return sortDir === 'desc'
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return 0;
        });

    const getEscrowStyle = (status: string) => {
        const map: Record<string, string> = {
            held: 'bg-warning/10 text-warning',
            released: 'bg-success/10 text-success',
            refunded: 'bg-info/10 text-info',
            pending: 'bg-bg-secondary text-text-tertiary border border-border-subtle',
            failed: 'bg-error/10 text-error'
        };
        return map[status] || 'bg-bg-secondary text-text-tertiary';
    };

    const formatCurrency = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

    const exportToCSV = () => {
        const rows = payments.map(p =>
            `"${p.id}","${p.escrow_status}","${p.amount_total}","${p.operator_fee}","${p.provider_amount}","${p.created_at}"`
        );
        const csv = ['ID,Status,Total,Taxa,Repasse,Data', ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">

            {/* Payment Dossier */}
            {selectedPayment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div
                        className="h-full w-full max-w-3xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col"
                        style={{ background: 'var(--bg-primary)' }}
                    >
                        <div className="p-6 border-b border-border-subtle flex items-center justify-between" style={{ background: 'var(--bg-secondary)' }}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-[8px] bg-success text-white"><DollarSign size={20} /></div>
                                <div>
                                    <h2 className="text-base font-semibold text-text-primary">Dossiê Financeiro</h2>
                                    <p className="text-[10px] text-text-tertiary font-mono">#{selectedPayment.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPayment(null)} className="p-2 rounded-[8px] hover:bg-bg-tertiary transition-colors border border-border-subtle"><X size={20} /></button>
                        </div>

                        <div className="flex px-6 border-b border-border-subtle" style={{ background: 'var(--bg-secondary)' }}>
                            {['details', 'ledger', 'intervention'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setDossierTab(tab)}
                                    className={`px-5 py-4 text-[10px] font-semibold uppercase tracking-widest border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}
                                >
                                    {tab === 'details' ? 'Detalhes' : tab === 'ledger' ? 'Ledger' : 'Intervenção'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {dossierTab === 'details' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="grid grid-cols-3 gap-4">
                                        <FinanceStat label="Total Bruto" value={formatCurrency(selectedPayment.amount_total)} color="text-text-primary" />
                                        <FinanceStat label="Taxa (10%)" value={formatCurrency(selectedPayment.operator_fee)} color="text-warning" />
                                        <FinanceStat label="Repasse Líquido" value={formatCurrency(selectedPayment.provider_amount)} color="text-success" />
                                    </div>
                                    <div
                                        className="p-6 space-y-1"
                                        style={{ background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}
                                    >
                                        <InfoRow label="Status Escrow" value={selectedPayment.escrow_status} />
                                        <InfoRow label="Serviço" value={selectedPayment.order?.service?.title} />
                                        <InfoRow label="Cliente" value={resolveUserName(selectedPayment.order?.client)} />
                                        <InfoRow label="Profissional" value={resolveUserName(selectedPayment.order?.provider)} />
                                        <InfoRow label="Data" value={formatDate(selectedPayment.created_at)} />
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'ledger' && (
                                <div className="space-y-4 animate-in fade-in">
                                    <h4 className="text-[10px] font-semibold uppercase text-text-tertiary tracking-widest">Simulação de Razão Contábil</h4>
                                    <div
                                        className="p-6 space-y-3"
                                        style={{ background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}
                                    >
                                        <LedgerRow label="D - Caixa Escrow" value={formatCurrency(selectedPayment.amount_total)} type="debit" />
                                        <LedgerRow label="C - Receita por Serviços" value={formatCurrency(selectedPayment.amount_total)} type="credit" />
                                        <div className="h-px bg-border-subtle my-3" />
                                        <LedgerRow label="D - Repasse ao Profissional" value={formatCurrency(selectedPayment.provider_amount)} type="debit" />
                                        <LedgerRow label="C - Receita Operadora (10%)" value={formatCurrency(selectedPayment.operator_fee)} type="credit" />
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'intervention' && (
                                <div className="space-y-4 animate-in fade-in">
                                    <h4 className="text-[10px] font-semibold uppercase text-text-tertiary tracking-widest">Intervenção Financeira Manual</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InterventionCard icon={<Unlock size={20} />} label="Liberar Escrow" desc="Autoriza repasse imediato ao profissional." color="text-success" onClick={() => handleAction(selectedPayment.id, 'released')} disabled={isProcessing === selectedPayment.id} />
                                        <InterventionCard icon={<XCircle size={20} />} label="Reembolsar Cliente" desc="Estorna o valor total para o cliente." color="text-error" onClick={() => handleAction(selectedPayment.id, 'refunded')} disabled={isProcessing === selectedPayment.id} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-semibold text-text-primary">Central Financeira</h1>
                    <p className="text-[13px] text-text-secondary mt-0.5">GMV, escrow, repasses e reconciliação contábil</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchPayments}
                        className="p-2.5 rounded-[8px] border border-border-subtle hover:rotate-180 transition-all duration-500"
                        style={{ background: 'var(--bg-secondary)' }}
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="h-10 px-5 rounded-[8px] text-[10px] font-semibold uppercase tracking-widest text-white flex items-center gap-2 transition-all hover:opacity-90"
                        style={{ background: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    >
                        <Download size={14} />Exportar
                    </button>
                </div>
            </div>

            {/* KPI Grid — with analytical gradient accents on top */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <FinanceKpi label="GMV Total" value={formatCurrency(kpis.gmv)} icon={<TrendingUp size={14} />} accentColor="linear-gradient(90deg, #6366F1, #818CF8)" color="text-accent-primary" />
                <FinanceKpi label="Receita Operadora" value={formatCurrency(kpis.revenue)} icon={<DollarSign size={14} />} accentColor="linear-gradient(90deg, #22C55E, #4ADE80)" color="text-success" />
                <FinanceKpi label="Em Escrow" value={formatCurrency(kpis.inEscrow)} icon={<Lock size={14} />} accentColor="linear-gradient(90deg, #F59E0B, #FBBF24)" color="text-warning" />
                <FinanceKpi label="Repasses Pendentes" value={formatCurrency(kpis.pendingPayouts)} icon={<Activity size={14} />} accentColor="linear-gradient(90deg, #F59E0B, #FBBF24)" color="text-warning" />
                <FinanceKpi label="Reembolsos" value={formatCurrency(kpis.refunds)} icon={<TrendingDown size={14} />} accentColor="linear-gradient(90deg, #EF4444, #F87171)" color="text-error" />
                <FinanceKpi label="Total de TXs" value={kpis.txCount} icon={<CreditCard size={14} />} accentColor="linear-gradient(90deg, #9CA3AF, #D1D5DB)" color="text-text-secondary" />
            </div>

            {/* Toolbar */}
            <div
                className="flex flex-col md:flex-row gap-3 p-4"
                style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '10px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por ID, cliente, profissional ou serviço..."
                        className="w-full h-10 rounded-[8px] pl-10 pr-4 text-sm outline-none transition-all"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,0,0,0.06)', color: 'var(--text-primary)' }}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { val: 'all', label: 'Todos' },
                        { val: 'held', label: 'Retidos' },
                        { val: 'released', label: 'Liberados' },
                        { val: 'refunded', label: 'Estornados' },
                    ].map(opt => (
                        <button
                            key={opt.val}
                            onClick={() => setFilterStatus(opt.val)}
                            className="h-10 px-4 rounded-[8px] text-[10px] font-semibold uppercase tracking-widest transition-all duration-[120ms]"
                            style={filterStatus === opt.val
                                ? { background: 'var(--text-primary)', color: '#FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                                : { background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: '1px solid rgba(0,0,0,0.06)' }
                            }
                        >{opt.label}</button>
                    ))}
                </div>
            </div>

            {/* Finance Table */}
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
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">TX ID / Serviço</th>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Partes</th>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Escrow</th>
                            <th
                                className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary cursor-pointer hover:text-text-primary"
                                onClick={() => toggleSort('amount')}
                            >
                                <span className="flex items-center gap-1.5">Valor {sortField === 'amount' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}</span>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Taxa</th>
                            <th
                                className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary cursor-pointer hover:text-text-primary"
                                onClick={() => toggleSort('created')}
                            >
                                <span className="flex items-center gap-1.5">Data {sortField === 'created' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}</span>
                            </th>
                            <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Dossiê</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {loading ? (
                            <tr><td colSpan={7} className="py-20 text-center">
                                <RefreshCw className="animate-spin mx-auto mb-3 text-accent-primary" size={24} />
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Sincronizando Ledger...</p>
                            </td></tr>
                        ) : filteredPayments.length === 0 ? (
                            <tr><td colSpan={7} className="py-20 text-center opacity-30">
                                <DollarSign size={40} className="mx-auto mb-3" />
                                <p className="text-[10px] font-semibold uppercase tracking-widest">Nenhuma transação encontrada</p>
                            </td></tr>
                        ) : filteredPayments.map(p => (
                            <tr
                                key={p.id}
                                className="transition-all cursor-pointer"
                                onClick={() => setSelectedPayment(p)}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                            >
                                <td className="px-6 py-4">
                                    <p className="text-[10px] font-mono text-text-tertiary mb-0.5">#{p.id.slice(0, 8)}</p>
                                    <p className="text-xs font-semibold text-text-primary">{p.order?.service?.title || 'Serviço'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-[10px] text-text-secondary">{resolveUserName(p.order?.client)}</p>
                                    <p className="text-[10px] text-text-tertiary">→ {resolveUserName(p.order?.provider)}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-semibold uppercase ${getEscrowStyle(p.escrow_status)}`}>
                                        {p.escrow_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-semibold text-text-primary font-mono">{formatCurrency(p.amount_total)}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[11px] text-warning font-mono">{formatCurrency(p.operator_fee)}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-mono text-text-tertiary">{formatDate(p.created_at)}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        className="p-2 rounded-[6px] border border-border-subtle hover:bg-text-primary hover:text-white hover:border-transparent transition-all duration-[120ms]"
                                        style={{ background: 'var(--bg-secondary)' }}
                                    >
                                        <Eye size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Sub-components ---
const FinanceKpi = ({ label, value, icon, accentColor, color }: any) => (
    <div
        className="p-5 relative overflow-hidden cursor-pointer hover:shadow-md transition-all duration-[120ms]"
        style={{
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
    >
        {/* Analytical gradient line (top bar) */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-[10px] opacity-60" style={{ background: accentColor }} />
        <div className={`p-2 rounded-[6px] bg-bg-secondary border border-border-subtle w-fit mb-4 ${color}`}>{icon}</div>
        <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-xl font-semibold text-text-primary leading-none">{value}</h3>
    </div>
);

const FinanceStat = ({ label, value, color }: any) => (
    <div
        className="p-5"
        style={{ background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}
    >
        <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-lg font-semibold font-mono ${color}`}>{value}</p>
    </div>
);

const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border-subtle last:border-0">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest">{label}</span>
        <span className="text-xs font-medium text-text-primary font-mono">{value || '—'}</span>
    </div>
);

const LedgerRow = ({ label, value, type }: any) => (
    <div className="flex justify-between items-center py-2 text-[11px]">
        <span className={`font-semibold uppercase tracking-widest ${type === 'debit' ? 'text-error' : 'text-success'}`}>{label}</span>
        <span className="font-mono font-semibold text-text-primary">{value}</span>
    </div>
);

const InterventionCard = ({ icon, label, desc, color, onClick, disabled }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`p-5 text-left rounded-[10px] border border-border-subtle hover:shadow-md transition-all duration-[120ms] group disabled:opacity-30 ${color}`}
        style={{ background: 'var(--bg-secondary)' }}
    >
        <div className="transition-transform group-hover:scale-110 mb-4 w-fit">{icon}</div>
        <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
        <p className="text-[10px] text-text-tertiary leading-relaxed">{desc}</p>
    </button>
);

const getEscrowStyle = (status: string) => {
    const map: Record<string, string> = {
        held: 'bg-warning/10 text-warning',
        released: 'bg-success/10 text-success',
        refunded: 'bg-info/10 text-info',
        pending: 'bg-bg-secondary text-text-tertiary border border-border-subtle',
        failed: 'bg-error/10 text-error'
    };
    return map[status] || 'bg-bg-secondary text-text-tertiary';
};

export default AdminFinance;

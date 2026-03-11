import React, { useState, useEffect } from 'react';
import {
    DollarSign, Search, RefreshCw, Download, TrendingUp, TrendingDown,
    Clock, CheckCircle2, XCircle, AlertTriangle, Shield, Lock, Unlock,
    Activity, CreditCard, X, Eye, ArrowUp, ArrowDown, Percent,
    BarChart3
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import KpiCard from '../components/erp/KpiCard';
import StatusBadge from '../components/erp/StatusBadge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Badge } from '../components/ui/Badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

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
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [showEscrowSheet, setShowEscrowSheet] = useState(false);

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

    const getChartData = () => {
        const days: Record<string, { date: string, gmv: number, revenue: number }> = {};
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            days[dateStr] = { date: dateStr, gmv: 0, revenue: 0 };
        }

        payments.forEach(p => {
            const dStr = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (days[dStr]) {
                days[dStr].gmv += (p.amount_total || 0);
                days[dStr].revenue += (p.operator_fee || 0);
            }
        });

        return Object.values(days);
    };

    const chartData = getChartData();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border p-3 rounded-xl shadow-xl animate-in zoom-in-95 backdrop-blur-md bg-opacity-80">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-1">{label}</p>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center gap-6">
                            <span className="text-[10px] font-medium text-foreground">GMV TOTAL</span>
                            <span className="text-xs font-bold font-mono">R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center gap-6">
                            <span className="text-[10px] font-medium text-emerald-500">RECEITA</span>
                            <span className="text-xs font-bold font-mono text-emerald-500">R$ {payload[1].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-5 animate-fade-in pb-12">

            {/* ── Payment Dossier ── */}
            {selectedPayment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="h-full w-full max-w-2xl bg-background shadow-2xl flex flex-col border-l border-border">
                        <div className="p-5 border-b border-border bg-card flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                                    <DollarSign size={18} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Dossiê Financeiro</h2>
                                    <p className="text-[10px] text-muted-foreground font-mono">#{selectedPayment.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPayment(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex px-5 border-b border-border bg-card">
                            {['details', 'ledger', 'intervention'].map(tab => (
                                <button key={tab} onClick={() => setDossierTab(tab)}
                                    className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-widest border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                                    {tab === 'details' ? 'Detalhes' : tab === 'ledger' ? 'Ledger' : 'Intervenção'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {dossierTab === 'details' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Total Bruto', value: formatCurrency(selectedPayment.amount_total), color: 'text-foreground' },
                                            { label: 'Taxa (10%)', value: formatCurrency(selectedPayment.operator_fee), color: 'text-yellow-500' },
                                            { label: 'Repasse Líquido', value: formatCurrency(selectedPayment.provider_amount), color: 'text-green-600 dark:text-green-400' },
                                        ].map(s => (
                                            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                                                <p className={`text-base font-semibold font-mono ${s.color}`}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                                        {[
                                            { label: 'Status Escrow', value: <StatusBadge status={selectedPayment.escrow_status} size="md" /> },
                                            { label: 'Serviço', value: selectedPayment.order?.service?.title },
                                            { label: 'Cliente', value: resolveUserName(selectedPayment.order?.client) },
                                            { label: 'Profissional', value: resolveUserName(selectedPayment.order?.provider) },
                                            { label: 'Data', value: formatDate(selectedPayment.created_at) },
                                        ].map(row => (
                                            <div key={row.label} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0">
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{row.label}</span>
                                                <span className="text-xs font-medium text-foreground">{row.value || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'ledger' && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest">Simulação de Razão Contábil</p>
                                    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                                        <LedgerRow label="D - Caixa Escrow" value={formatCurrency(selectedPayment.amount_total)} type="debit" />
                                        <LedgerRow label="C - Receita por Serviços" value={formatCurrency(selectedPayment.amount_total)} type="credit" />
                                        <div className="h-px bg-border my-2" />
                                        <LedgerRow label="D - Repasse ao Profissional" value={formatCurrency(selectedPayment.provider_amount)} type="debit" />
                                        <LedgerRow label="C - Receita Operadora (10%)" value={formatCurrency(selectedPayment.operator_fee)} type="credit" />
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'intervention' && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest">Intervenção Financeira Manual</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => handleAction(selectedPayment.id, 'released')} disabled={isProcessing === selectedPayment.id}
                                            className="p-4 text-left bg-card border border-border rounded-xl hover:bg-green-500/10 hover:border-green-500/30 text-green-600 dark:text-green-400 transition-all group disabled:opacity-30">
                                            <Unlock size={18} className="mb-3 group-hover:scale-110 transition-transform" />
                                            <p className="text-xs font-semibold text-foreground mb-1">Liberar Escrow</p>
                                            <p className="text-[10px] text-muted-foreground">Autoriza repasse imediato.</p>
                                        </button>
                                        <button onClick={() => handleAction(selectedPayment.id, 'refunded')} disabled={isProcessing === selectedPayment.id}
                                            className="p-4 text-left bg-card border border-border rounded-xl hover:bg-red-500/10 hover:border-red-500/30 text-red-600 dark:text-red-400 transition-all group disabled:opacity-30">
                                            <XCircle size={18} className="mb-3 group-hover:scale-110 transition-transform" />
                                            <p className="text-xs font-semibold text-foreground mb-1">Reembolsar Cliente</p>
                                            <p className="text-[10px] text-muted-foreground">Estorna o valor total.</p>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Escrow Detail Sheet ── */}
            <Sheet open={showEscrowSheet} onOpenChange={setShowEscrowSheet}>
                <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col border-l border-border bg-background">
                    <div className="p-6 border-b border-border bg-card/50">
                        <SheetHeader className="text-left space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                                    <Lock size={18} />
                                </div>
                                <SheetTitle className="text-lg font-semibold flex items-center gap-2">
                                    Volume em Garantia
                                </SheetTitle>
                            </div>
                            <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
                                Listagem de transações com saldo retido aguardando confirmação de execução ou prazo de segurança.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            {payments.filter(p => p.escrow_status === 'held').length > 0 ? (
                                <div className="grid gap-6">
                                    {payments.filter(p => p.escrow_status === 'held').map((payment, idx, arr) => (
                                        <div key={payment.id} className="group animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                        <Clock size={10} /> Escrow Ativo
                                                    </p>
                                                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {payment.order?.service?.title || 'Serviço Personalizado'}
                                                    </h4>
                                                </div>
                                                <p className="text-sm font-bold text-foreground">
                                                    {formatCurrency(payment.amount_total)}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Profissional</p>
                                                    <p className="text-[11px] font-medium text-foreground truncate">{payment.order?.provider?.name || '---'}</p>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
                                                    <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Taxa Plataforma</p>
                                                    <p className="text-[11px] font-medium text-foreground">{formatCurrency(payment.operator_fee)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px] h-5 px-1.5 py-0 border-border text-muted-foreground bg-background">
                                                    TX: {payment.id.slice(0, 8)}
                                                </Badge>
                                                {new Date(payment.created_at) < (new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)) && (
                                                    <Badge variant="destructive" className="text-[9px] h-5 px-1.5 py-0 bg-red-500/10 text-red-600 dark:text-red-400 border-none">
                                                        Aging {'>'} 10d
                                                    </Badge>
                                                )}
                                            </div>
                                            {idx < arr.length - 1 && <Separator className="mt-6" />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                    <Activity size={32} className="mb-2" />
                                    <p className="text-xs font-semibold uppercase tracking-widest leading-relaxed">
                                        Nenhuma transação<br />em garantia
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Central Financeira</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">GMV, escrow, repasses e reconciliação contábil</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchPayments} className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:rotate-180 transition-all duration-500">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={exportToCSV} className="flex items-center gap-2 px-4 h-9 bg-foreground text-background rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all">
                        <Download size={14} /> Exportar
                    </button>
                </div>
            </div>

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiCard
                    label="GMV Total"
                    value={formatCurrency(kpis.gmv)}
                    icon={<TrendingUp size={16} />}
                    color="text-primary"
                    bg="bg-primary/10"
                />
                <KpiCard
                    label="Receita Operadora"
                    value={formatCurrency(kpis.revenue)}
                    icon={<DollarSign size={16} />}
                    color="text-green-600 dark:text-green-400"
                    bg="bg-green-500/10"
                    trend="+12.5%"
                    trendDir="up"
                />
                <KpiCard
                    label="Em Escrow"
                    value={formatCurrency(kpis.inEscrow)}
                    icon={<Lock size={16} />}
                    color="text-yellow-600 dark:text-yellow-400"
                    bg="bg-yellow-500/10"
                    onClick={() => setShowEscrowSheet(true)}
                />
                <KpiCard
                    label="Repasses Pendentes"
                    value={formatCurrency(kpis.pendingPayouts)}
                    icon={<Activity size={16} />}
                    color="text-orange-600 dark:text-orange-400"
                    bg="bg-orange-500/10"
                />
                <KpiCard
                    label="Reembolsos"
                    value={formatCurrency(kpis.refunds)}
                    icon={<TrendingDown size={16} />}
                    color="text-red-600 dark:text-red-400"
                    bg="bg-red-500/10"
                />
                <KpiCard
                    label="Total de TXs"
                    value={kpis.txCount}
                    icon={<CreditCard size={16} />}
                    color="text-slate-600 dark:text-slate-400"
                    bg="bg-slate-500/10"
                />
            </div>

            {/* ── Analytical Chart ── */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {chartType === 'line' ? <TrendingUp size={14} className="text-primary" /> : <BarChart3 size={14} className="text-primary" />}
                            Performance Financeira
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Visão consolidada de GMV vs Receita Operadora (Últimos 12 dias)</p>
                    </div>
                    <div className="flex bg-muted p-1 rounded-lg border border-border text-[10px]">
                        <button
                            onClick={() => setChartType('line')}
                            className={`px-3 py-1 font-bold uppercase tracking-wider rounded-md transition-all ${chartType === 'line' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Linha
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`px-3 py-1 font-bold uppercase tracking-wider rounded-md transition-all ${chartType === 'bar' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Barras
                        </button>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'line' ? (
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gmvArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01} />
                                    </linearGradient>
                                    <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                                    dy={10}
                                    suppressHydrationWarning
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />

                                <Area
                                    type="monotone"
                                    dataKey="gmv"
                                    stroke="var(--primary)"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#gmvArea)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#revArea)"
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gmvBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.2} />
                                    </linearGradient>
                                    <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                                    dy={10}
                                    suppressHydrationWarning
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
                                <Bar dataKey="gmv" fill="url(#gmvBar)" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="revenue" fill="url(#revBar)" radius={[4, 4, 0, 0]} barSize={10} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-card border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por ID, cliente, profissional ou serviço..."
                        className="w-full h-9 rounded-lg pl-9 pr-4 text-sm outline-none bg-background border border-border text-foreground focus:border-primary transition-all"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[{ val: 'all', label: 'Todos' }, { val: 'held', label: 'Retidos' }, { val: 'released', label: 'Liberados' }, { val: 'refunded', label: 'Estornados' }].map(opt => (
                        <button key={opt.val} onClick={() => setFilterStatus(opt.val)}
                            className={`h-9 px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all ${filterStatus === opt.val ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground border border-border'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Finance Table ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">TX ID / Serviço</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Partes</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Escrow</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('amount')}>
                                <span className="flex items-center gap-1.5">Valor {sortField === 'amount' ? (sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />) : null}</span>
                            </th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Taxa</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('created')}>
                                <span className="flex items-center gap-1.5">Data {sortField === 'created' ? (sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />) : null}</span>
                            </th>
                            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Dossiê</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="py-16 text-center">
                                <RefreshCw className="animate-spin mx-auto mb-3 text-primary" size={22} />
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    <span className="relative inline-block">
                                        Sincronizando Ledger
                                        <span className="absolute left-full ml-1 top-0">...</span>
                                    </span>
                                </p>
                            </td></tr>
                        ) : filteredPayments.length === 0 ? (
                            <tr><td colSpan={7} className="py-16 text-center opacity-30">
                                <DollarSign size={36} className="mx-auto mb-3" />
                                <p className="text-[10px] font-semibold uppercase tracking-widest">Nenhuma transação</p>
                            </td></tr>
                        ) : filteredPayments.map(p => (
                            <tr key={p.id}
                                className="border-b border-border last:border-0 hover:bg-muted/30 transition-all cursor-pointer"
                                onClick={() => setSelectedPayment(p)}>
                                <td className="px-5 py-4">
                                    <p className="text-[10px] font-mono text-muted-foreground mb-0.5">#{p.id.slice(0, 8)}</p>
                                    <p className="text-xs font-semibold text-foreground">{p.order?.service?.title || 'Serviço'}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-[10px] text-foreground">{resolveUserName(p.order?.client)}</p>
                                    <p className="text-[10px] text-muted-foreground">→ {resolveUserName(p.order?.provider)}</p>
                                </td>
                                <td className="px-5 py-4"><StatusBadge status={p.escrow_status} /></td>
                                <td className="px-5 py-4">
                                    <span className="text-xs font-semibold text-foreground font-mono tabular-nums">{formatCurrency(p.amount_total)}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-[11px] text-yellow-500 font-mono tabular-nums">{formatCurrency(p.operator_fee)}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-[10px] font-mono text-muted-foreground">{formatDate(p.created_at)}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <button className="p-1.5 rounded-lg border border-border hover:bg-foreground hover:text-background hover:border-transparent transition-all">
                                        <Eye size={13} />
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
const LedgerRow = ({ label, value, type }: any) => (
    <div className="flex justify-between items-center py-2 text-[11px]">
        <span className={`font-semibold uppercase tracking-widest ${type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{label}</span>
        <span className="font-mono font-semibold text-foreground">{value}</span>
    </div>
);

const getEscrowStyle = (_status: string) => '';

export default AdminFinance;

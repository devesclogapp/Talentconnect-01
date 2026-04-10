import React, { useState, useEffect } from 'react';
import {
    DollarSign, Search, RefreshCw, Download, TrendingUp, TrendingDown,
    Clock, CheckCircle2, XCircle, AlertTriangle, Shield, Lock, Unlock,
    Activity, CreditCard, X, Eye, ArrowUp, ArrowDown, Percent,
    BarChart3, ArrowRight
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
                    <p className="text-xs font-bold text-muted-foreground tracking-widest mb-2 border-b border-border pb-1">{label}</p>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center gap-6">
                            <span className="text-xs font-medium text-foreground">Gmv Total</span>
                            <span className="text-xs font-bold font-mono">R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center gap-6">
                            <span className="text-xs font-medium text-emerald-500">Receita</span>
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
                                    <p className="text-xs text-muted-foreground font-mono">#{selectedPayment.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPayment(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex px-5 border-b border-border bg-card">
                            {['details', 'ledger', 'intervention'].map(tab => (
                                <button key={tab} onClick={() => setDossierTab(tab)}
                                    className={`px-4 py-3 text-xs font-semibold tracking-widest border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
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
                                                <p className="text-xs text-muted-foreground tracking-widest mb-1">{s.label}</p>
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
                                                <span className="text-xs font-semibold text-muted-foreground tracking-widest">{row.label}</span>
                                                <span className="text-xs font-medium text-foreground">{row.value || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {dossierTab === 'ledger' && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-muted-foreground tracking-widest">Simulação de Razão Contábil</p>
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
                                    <p className="text-xs font-semibold text-muted-foreground tracking-widest">Intervenção Financeira Manual</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => handleAction(selectedPayment.id, 'released')} disabled={isProcessing === selectedPayment.id}
                                            className="p-4 text-left bg-card border border-border rounded-xl hover:bg-green-500/10 hover:border-green-500/30 text-green-600 dark:text-green-400 transition-all group disabled:opacity-30">
                                            <Unlock size={18} className="mb-3 group-hover:scale-110 transition-transform" />
                                            <p className="text-xs font-semibold text-foreground mb-1">Liberar Escrow</p>
                                            <p className="text-xs text-muted-foreground">Autoriza repasse imediato.</p>
                                        </button>
                                        <button onClick={() => handleAction(selectedPayment.id, 'refunded')} disabled={isProcessing === selectedPayment.id}
                                            className="p-4 text-left bg-card border border-border rounded-xl hover:bg-red-500/10 hover:border-red-500/30 text-red-600 dark:text-red-400 transition-all group disabled:opacity-30">
                                            <XCircle size={18} className="mb-3 group-hover:scale-110 transition-transform" />
                                            <p className="text-xs font-semibold text-foreground mb-1">Reembolsar Cliente</p>
                                            <p className="text-xs text-muted-foreground">Estorna o valor total.</p>
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
                                                    <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 tracking-widest mb-1 flex items-center gap-1.5">
                                                        <Clock size={10} /> Escrow ativo
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
                                                    <p className="text-[9px] font-bold text-muted-foreground mb-1 tracking-wider">Profissional</p>
                                                    <p className="text-[11px] font-medium text-foreground truncate">{payment.order?.provider?.name || '---'}</p>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
                                                    <p className="text-[9px] font-bold text-muted-foreground mb-1 tracking-wider">Taxa plataforma</p>
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
                                    <p className="text-xs font-semibold tracking-widest leading-relaxed">
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
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mr-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-widest">Live Ledger</span>
                    </div>
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
                    label="Volume transacionado"
                    value={formatCurrency(kpis.gmv)}
                    icon={<TrendingUp size={18} />}
                    trend="Plataforma"
                    tooltip="Soma total de todos os pagamentos realizados pelos clientes (GMV)."
                />
                <KpiCard
                    label="Taxas coletadas"
                    value={formatCurrency(kpis.revenue)}
                    icon={<DollarSign size={18} />}
                    color="text-[#1DB97A]"
                    bg="bg-[#1DB97A]/10"
                    trend="+12.5%"
                    tooltip="Arrecadação líquida da plataforma baseada na taxa de serviço (10%) cobrada dos pedidos."
                />
                <KpiCard
                    label="Garantia protegida"
                    value={formatCurrency(kpis.inEscrow)}
                    icon={<Lock size={18} />}
                    color="text-[#F5C842]"
                    bg="bg-[#F5C842]/10"
                    trend="Em Escrow"
                    onClick={() => setShowEscrowSheet(true)}
                    tooltip="Saldo total retido em escrow aguardando a finalização dos serviços para ser repassado ou estornado."
                />
                <KpiCard
                    label="Repasses pendentes"
                    value={formatCurrency(kpis.pendingPayouts)}
                    icon={<Activity size={18} />}
                    color="text-folio-accent"
                    bg="bg-folio-accent/10"
                    trend="A pagar"
                    tooltip="Valores de serviços já concluídos que estão programados para serem liquidados na conta dos profissionais."
                />
                <KpiCard
                    label="Estornos (Refunds)"
                    value={formatCurrency(kpis.refunds)}
                    icon={<TrendingDown size={18} />}
                    color="text-[#E24B4A]"
                    bg="bg-[#E24B4A]/10"
                    trend="Totais"
                    tooltip="Total de valores devolvidos aos clientes após cancelamentos ou resoluções de disputa favoráveis ao consumidor."
                />
                <KpiCard
                    label="Volume de TXs"
                    value={kpis.txCount}
                    icon={<CreditCard size={18} />}
                    tooltip="Quantidade total de transações financeiras processadas pelo sistema."
                    color="text-folio-text-dim"
                    bg="bg-folio-bg"
                    trend="Transações"
                />
            </div>

            {/* ── Analytical Chart ── */}
            <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 shadow-folio">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-sm font-black text-folio-text tracking-tight flex items-center gap-2">
                            <BarChart3 size={16} className="text-folio-accent" />
                            Performance Operacional
                        </h3>
                        <p className="text-xs font-bold text-folio-text-dim/40 mt-2">Visão consolidada de Fluxo vs Receita (12 Dias)</p>
                    </div>
                    <div className="flex bg-folio-bg p-1 rounded-2xl border border-folio-border">
                        <button
                            onClick={() => setChartType('line')}
                            className={`px-4 py-2 text-xs font-black tracking-widest rounded-xl transition-all ${chartType === 'line' ? 'bg-folio-accent text-white shadow-glow' : 'text-folio-text-dim hover:text-folio-text'}`}
                        >
                            Linear
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`px-4 py-2 text-xs font-black tracking-widest rounded-xl transition-all ${chartType === 'bar' ? 'bg-folio-accent text-white shadow-glow' : 'text-folio-text-dim hover:text-folio-text'}`}
                        >
                            Sazonal
                        </button>
                    </div>
                </div>

                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'line' ? (
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gmvArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1DB97A" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#1DB97A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 900 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }} />

                                <Area
                                    type="monotone"
                                    dataKey="gmv"
                                    stroke="#6366F1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#gmvArea)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6366F1' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#1DB97A"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#revArea)"
                                    activeDot={{ r: 4, strokeWidth: 0, fill: '#1DB97A' }}
                                />
                            </AreaChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gmvBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#1DB97A" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#1DB97A" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 900 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 8 }} />
                                <Bar dataKey="gmv" fill="url(#gmvBar)" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="revenue" fill="url(#revBar)" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-folio-surface border border-folio-border rounded-[24px] p-4 flex flex-col md:flex-row gap-4 shadow-folio">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-folio-text-dim" size={16} />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="ID, Cliente, Profissional ou Serviço..."
                        className="w-full h-11 rounded-xl pl-11 pr-4 text-sm outline-none bg-folio-bg border border-folio-border text-folio-text focus:border-folio-accent transition-all placeholder:text-folio-text-dim/30"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[{ val: 'all', label: 'Todos' }, { val: 'held', label: 'Retidos' }, { val: 'released', label: 'Liberados' }, { val: 'refunded', label: 'Estornados' }].map(opt => (
                        <button key={opt.val} onClick={() => setFilterStatus(opt.val)}
                            className={`h-11 px-5 rounded-xl text-xs font-black tracking-widest transition-all border ${filterStatus === opt.val ? 'bg-folio-accent border-folio-accent text-white shadow-glow' : 'bg-folio-bg border-folio-border text-folio-text-dim hover:text-folio-text hover:border-folio-text-dim/30'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Finance List (Floating Rows) ── */}
            <div className="space-y-4">
                <div className="hidden md:grid grid-cols-12 px-8 py-4 bg-folio-surface2/30 rounded-2xl border border-folio-border/50">
                    <div className="col-span-3 text-xs font-black text-folio-text-dim tracking-widest">TX / Serviço</div>
                    <div className="col-span-3 text-xs font-black text-folio-text-dim tracking-widest">Intervenientes (C → P)</div>
                    <div className="col-span-2 text-xs font-black text-folio-text-dim tracking-widest">Status Escrow</div>
                    <div className="col-span-2 text-xs font-black text-folio-text-dim tracking-widest cursor-pointer hover:text-folio-accent transition-colors" onClick={() => toggleSort('amount')}>
                        <span className="flex items-center gap-2">Valor {sortField === 'amount' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}</span>
                    </div>
                    <div className="col-span-2 text-right text-xs font-black text-folio-text-dim tracking-widest cursor-pointer hover:text-folio-accent transition-colors" onClick={() => toggleSort('created')}>
                        <span className="flex items-center justify-end gap-2">Data {sortField === 'created' ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="grid grid-cols-12 items-center px-8 py-6 bg-folio-surface border border-folio-border rounded-[32px] opacity-60">
                                <div className="col-span-3 space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                                <div className="col-span-3">
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <div className="col-span-2">
                                    <Skeleton className="h-6 w-16 rounded-lg" />
                                </div>
                                <div className="col-span-2">
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="py-24 text-center bg-folio-surface border border-dashed border-folio-border rounded-[32px] opacity-40">
                        <DollarSign size={56} className="mx-auto mb-4 text-folio-accent" />
                        <p className="text-[12px] font-black tracking-[3px]">Sem transações registradas</p>
                    </div>
                ) : filteredPayments.map(p => (
                    <div key={p.id}
                        className="grid grid-cols-12 items-center px-8 py-5 bg-folio-surface border border-folio-border rounded-[32px] hover:border-folio-accent/40 shadow-sm hover:shadow-glow-dim transition-all duration-300 group cursor-pointer"
                        onClick={() => setSelectedPayment(p)}>

                        <div className="col-span-3">
                            <p className="text-xs font-black text-folio-text-dim/40 font-mono mb-1 tracking-tighter">#{p.id.slice(0, 8)}</p>
                            <p className="text-sm font-black text-folio-text tracking-tight truncate">{p.order?.service?.title || 'Serviço'}</p>
                        </div>

                        <div className="col-span-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-folio-text">{resolveUserName(p.order?.client)}</span>
                                <ArrowRight size={10} className="text-folio-text-dim/30" />
                                <span className="text-xs font-bold text-folio-text-dim/60 truncate">{resolveUserName(p.order?.provider)}</span>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <div className={`inline-flex px-3 py-1 rounded-lg border text-xs font-black tracking-widest ${p.escrow_status === 'released' ? 'bg-[#1DB97A]/10 border-[#1DB97A]/20 text-[#1DB97A]' :
                                p.escrow_status === 'held' ? 'bg-[#F5C842]/10 border-[#F5C842]/20 text-[#F5C842]' :
                                    'bg-folio-bg border-folio-border text-folio-text-dim'
                                }`}>
                                {p.escrow_status}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-folio-text tabular-nums tracking-tighter">
                                    {formatCurrency(p.amount_total)}
                                </span>
                                <span className="text-xs font-black text-[#F5C842] tracking-[1px]">Fee: {formatCurrency(p.operator_fee)}</span>
                            </div>
                        </div>

                        <div className="col-span-2 text-right">
                            <p className="text-xs font-bold text-folio-text-dim font-mono tracking-[1px]">{formatDate(p.created_at)}</p>
                            <div className="mt-2 text-folio-text-dim group-hover:text-folio-accent transition-colors flex justify-end">
                                <Eye size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Payment Dossier (Overlay) ── */}
            {selectedPayment && (
                <div className="fixed inset-0 bg-folio-bg/80 backdrop-blur-md z-[100] flex justify-end animate-in fade-in duration-300">
                    <div className="h-full w-full max-w-2xl bg-folio-bg shadow-2xl flex flex-col border-l border-folio-border animate-in slide-in-from-right duration-500">
                        <div className="px-10 py-8 border-b border-folio-border bg-folio-surface flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-folio-bg border border-folio-border text-[#1DB97A] flex items-center justify-center shadow-inner">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-folio-text tracking-tight">Dossiê de Transação</h2>
                                    <p className="text-xs text-folio-text-dim/60 font-mono font-bold tracking-[2px] mt-1">Protocol: {selectedPayment.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPayment(null)} className="w-12 h-12 rounded-2xl bg-folio-bg border border-folio-border flex items-center justify-center text-folio-text-dim hover:text-folio-text transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex px-10 border-b border-folio-border bg-folio-surface gap-2">
                            {['details', 'ledger', 'intervention'].map(tab => (
                                <button key={tab} onClick={() => setDossierTab(tab)}
                                    className={`px-4 py-5 text-xs font-black tracking-[2px] border-b-2 transition-all shrink-0 ${dossierTab === tab ? 'border-folio-accent text-folio-accent' : 'border-transparent text-folio-text-dim hover:text-folio-text'}`}>
                                    {tab === 'details' ? 'Auditoria' : tab === 'ledger' ? 'Razão Contábil' : 'Intervenção'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-8">
                            {dossierTab === 'details' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Bruto', value: formatCurrency(selectedPayment.amount_total), color: 'text-folio-text' },
                                            { label: 'Revenue 10%', value: formatCurrency(selectedPayment.operator_fee), color: 'text-[#F5C842]' },
                                            { label: 'Repasse', value: formatCurrency(selectedPayment.provider_amount), color: 'text-[#1DB97A]' },
                                        ].map(s => (
                                            <div key={s.label} className="bg-folio-surface border border-folio-border rounded-[24px] p-6 shadow-sm">
                                                <p className="text-xs text-folio-text-dim/50 font-black tracking-[2px] mb-2">{s.label}</p>
                                                <p className={`text-lg font-black font-mono tracking-tighter ${s.color}`}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 space-y-6 shadow-folio">
                                        <p className="text-xs font-black text-folio-text-dim/40 tracking-[3px] mb-2">Metadata da Negociação</p>
                                        {[
                                            { label: 'Estado de Escrow', value: <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-black tracking-widest border border-folio-border bg-folio-bg`}>{selectedPayment.escrow_status}</div> },
                                            { label: 'Item de Serviço', value: selectedPayment.order?.service?.title },
                                            { label: 'Emissor (Cliente)', value: resolveUserName(selectedPayment.order?.client) },
                                            { label: 'Beneficiário (Prof.)', value: resolveUserName(selectedPayment.order?.provider) },
                                            { label: 'Timestamp Interno', value: selectedPayment.created_at },
                                        ].map(row => (
                                            <div key={row.label} className="flex flex-col gap-1.5 border-b border-folio-border last:border-0 pb-5 last:pb-0">
                                                <span className="text-xs font-black text-folio-text-dim/50 tracking-[2px]">{row.label}</span>
                                                <span className="text-xs font-bold text-folio-text tracking-tight">{row.value || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {dossierTab === 'ledger' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Activity className="text-folio-accent" size={20} />
                                        <h4 className="text-sm font-black text-folio-text tracking-[2px]">Simulação Ledger Partida Dobrada</h4>
                                    </div>
                                    <div className="bg-folio-surface border border-folio-border rounded-[32px] p-8 space-y-4 shadow-folio">
                                        <LedgerRow label="D - Caixa Escrow (Holding)" value={formatCurrency(selectedPayment.amount_total)} type="debit" />
                                        <LedgerRow label="C - Receita Bruta Diferida" value={formatCurrency(selectedPayment.amount_total)} type="credit" />
                                        <div className="h-px bg-folio-border my-4" />
                                        <LedgerRow label="D - Passivo Repasse Profissional" value={formatCurrency(selectedPayment.provider_amount)} type="debit" />
                                        <LedgerRow label="C - Receita Líquida Operadora" value={formatCurrency(selectedPayment.operator_fee)} type="credit" />
                                    </div>
                                    <p className="text-xs text-folio-text-dim/50 italic leading-relaxed text-center px-10">
                                        * Valores processados via Gateway integrado. O razone acima representa a segregação contábil interna para governança bancária.
                                    </p>
                                </div>
                            )}

                            {dossierTab === 'intervention' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Shield className="text-[#E24B4A]" size={20} />
                                        <h4 className="text-sm font-black text-folio-text tracking-[2px]">Intervenção Financeira Admin</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => handleAction(selectedPayment.id, 'released')} disabled={isProcessing === selectedPayment.id}
                                            className="p-8 text-left bg-folio-surface border border-folio-border rounded-[32px] hover:bg-[#1DB97A]/10 hover:border-[#1DB97A]/30 text-[#1DB97A] transition-all group disabled:opacity-30 shadow-sm hover:shadow-glow-dim">
                                            <Unlock size={24} className="mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                                            <p className="text-sm font-black text-folio-text mb-2 tracking-tight">Liberar Escrow</p>
                                            <p className="text-xs font-medium text-folio-text-dim leading-relaxed opacity-70">Autoriza o repasse imediato ao profissional.</p>
                                        </button>
                                        <button onClick={() => handleAction(selectedPayment.id, 'refunded')} disabled={isProcessing === selectedPayment.id}
                                            className="p-8 text-left bg-folio-surface border border-folio-border rounded-[32px] hover:bg-[#E24B4A]/10 hover:border-[#E24B4A]/30 text-[#E24B4A] transition-all group disabled:opacity-30 shadow-sm hover:shadow-glow-dim">
                                            <XCircle size={24} className="mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                                            <p className="text-sm font-black text-folio-text mb-2 tracking-tight">Efetuar Refund</p>
                                            <p className="text-xs font-medium text-folio-text-dim leading-relaxed opacity-70">Cancela a transação e estorna o valor total ao cliente.</p>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

// --- Sub-components ---
const LedgerRow = ({ label, value, type }: any) => (
    <div className="flex justify-between items-center py-2 text-xs">
        <span className={`font-semibold tracking-widest ${type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{label}</span>
        <span className="font-mono font-semibold text-foreground">{value}</span>
    </div>
);

const getEscrowStyle = (_status: string) => '';

export default AdminFinance;

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
    X
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const AdminFinance: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState({
        totalVolume: 0,
        netRevenue: 0,
        pendingEscrow: 0,
        completedPayouts: 0
    });

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    order:order_id (
                        id,
                        status,
                        client:client_id (user_metadata),
                        provider:provider_id (user_metadata)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const pData = (data || []) as any[];
            setPayments(pData);

            // Calculate Stats
            const volume = pData.reduce((acc, p) => acc + (p.amount_total || 0), 0) || 0;
            const revenue = pData.reduce((acc, p) => acc + (p.operator_fee || 0), 0) || 0;
            const escrow = pData.filter(p => ['held', 'pending'].includes(p.escrow_status))
                .reduce((acc, p) => acc + (p.amount_total || 0), 0) || 0;

            setStats({
                totalVolume: volume,
                netRevenue: revenue,
                pendingEscrow: escrow,
                completedPayouts: volume - escrow
            });

        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePayouts = async () => {
        // Logic: Release all 'held' payments where order is 'completed'
        const payable = payments.filter(p => p.escrow_status === 'held' && p.order?.status === 'completed');

        if (payable.length === 0) {
            alert('Não há pagamentos pendentes de liberação para pedidos concluídos.');
            return;
        }

        if (!confirm(`Desja processar ${payable.length} repasses agora?`)) return;

        try {
            setIsProcessing(true);
            const ids = payable.map(p => p.id);

            const { error } = await (supabase as any)
                .from('payments')
                .update({ escrow_status: 'released' })
                .in('id', ids);

            if (error) throw error;

            alert(`${payable.length} pagamentos foram liberados com sucesso!`);
            fetchFinanceData();
        } catch (error: any) {
            alert('Erro ao processar repasses: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['ID TRX', 'Data', 'Status', 'Valor Bruto', 'Taxa Admin', 'Repasse Prof', 'Order ID'];
        const rows = filteredPayments.map(p => [
            p.id,
            new Date(p.created_at).toLocaleDateString('pt-BR'),
            p.escrow_status,
            p.amount_total,
            p.operator_fee,
            p.provider_amount,
            p.order_id
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `finance_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredPayments = payments.filter(p => {
        const matchesStatus = filterStatus === 'all' || p.escrow_status === filterStatus;
        const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.order_id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-fade-in relative">
            {isProcessing && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200] flex items-center justify-center">
                    <div className="bg-bg-primary p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                        <Clock size={40} className="text-accent-primary animate-spin" />
                        <p className="font-black uppercase tracking-widest text-[10px]">Processando Repasses...</p>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="heading-xl text-text-primary">Centro Financeiro</h1>
                    <p className="text-sm text-text-tertiary">Gestão de transações, taxas e fluxo de caixa</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Download size={18} /> Relatórios
                    </button>
                    <button
                        onClick={handleGeneratePayouts}
                        disabled={isProcessing}
                        className="btn-primary flex items-center gap-2 shadow-glow-blue"
                    >
                        <DollarSign size={18} /> Gerar Repasses
                    </button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FinanceCard
                    label="Volume Bruto"
                    value={`R$ ${stats.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    trend="+15.2%"
                    trendUp={true}
                    icon={<DollarSign />}
                    color="text-accent-primary"
                />
                <FinanceCard
                    label="Receita Líquida (Taxas)"
                    value={`R$ ${stats.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    trend="+8.5%"
                    trendUp={true}
                    icon={<TrendingUp />}
                    color="text-success"
                />
                <FinanceCard
                    label="Retido em Escrow"
                    value={`R$ ${stats.pendingEscrow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    trend="Fluxo Ativo"
                    trendUp={null}
                    icon={<CreditCard />}
                    color="text-warning"
                />
                <FinanceCard
                    label="Ticket Médio"
                    value={`R$ ${(stats.totalVolume / (payments.length || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    trend="Média Global"
                    trendUp={null}
                    icon={<PieChart />}
                    color="text-blue-500"
                />
            </div>

            {/* Toolbar */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por ID da transação ou pedido..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-accent-primary transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none font-medium"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="held">Retido (Held)</option>
                        <option value="released">Liberado (Released)</option>
                        <option value="pending">Pendente</option>
                        <option value="refunded">Reembolsado</option>
                    </select>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-bg-primary border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-bg-secondary/10">
                    <h3 className="font-bold text-text-primary flex items-center gap-2">
                        <Receipt size={18} className="text-accent-primary" />
                        Transações Recentes
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-secondary/30 border-b border-border-subtle">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">ID / Data</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Tipo / Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Valor Bruto</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Taxa (Admin)</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Repasse (Prof)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-tertiary text-sm">Carregando transações...</td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-tertiary text-sm">Nenhuma transação encontrada.</td>
                                </tr>
                            ) : (
                                filteredPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-bg-secondary/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-text-primary uppercase mb-1">TRX-{p.id.slice(0, 8)}</p>
                                            <p className="text-[10px] text-text-tertiary font-medium">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">ESCROW</span>
                                                <span className={`w-min px-2 py-0.5 rounded text-[8px] font-black uppercase ${p.escrow_status === 'released' ? 'bg-success/10 text-success' :
                                                    p.escrow_status === 'held' ? 'bg-warning/10 text-warning' :
                                                        p.escrow_status === 'refunded' ? 'bg-error/10 text-error' :
                                                            'bg-bg-tertiary text-text-tertiary'
                                                    }`}>
                                                    {p.escrow_status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-black text-text-primary">R$ {p.amount_total?.toFixed(2)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-accent-primary">+ R$ {p.operator_fee?.toFixed(2)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-success">R$ {p.provider_amount?.toFixed(2)}</p>
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


const FinanceCard = ({ label, value, trend, trendUp, icon, color }: any) => (
    <div className="bg-bg-primary border border-border-subtle p-6 rounded-3xl overflow-hidden relative group">
        <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl bg-bg-secondary flex items-center justify-center ${color} border border-border-subtle shadow-sm`}>
                {React.cloneElement(icon, { size: 24 })}
            </div>
            {trendUp !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${trendUp ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend}
                </div>
            )}
            {trendUp === null && (
                <div className="px-2 py-1 rounded-full bg-bg-secondary text-text-tertiary text-[10px] font-bold">
                    {trend}
                </div>
            )}
        </div>
        <p className="text-xs text-text-tertiary font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-black text-text-primary">{value}</h3>
        <div className={`absolute -right-8 -bottom-8 w-24 h-24 ${color} opacity-[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
    </div>
);

export default AdminFinance;

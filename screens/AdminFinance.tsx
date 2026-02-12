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
    Play
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';

const AdminFinance: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeTab, setActiveTab] = useState<'transactions' | 'payouts'>('transactions');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedTrx, setSelectedTrx] = useState<any>(null);
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
            const { data: pData, error: pError } = await supabase
                .from('payments')
                .select(`
                    *,
                    order:orders (
                        id,
                        status,
                        client:users!client_id (user_metadata),
                        provider:users!provider_id (user_metadata)
                    )
                `)
                .order('created_at', { ascending: false });

            if (pError) throw pError;
            setPayments(pData || []);

            // Fetch real Payouts from transactions table
            const { data: transData, error: transError } = await supabase
                .from('transactions')
                .select('*')
                .eq('type', 'payout')
                .order('created_at', { ascending: false });

            if (!transError) {
                setPayouts(transData || []);
            } else {
                console.warn('Transactions table not found, using fallback simulated payouts', transError);
                // Fallback simulation based on completed orders with held escrow
                const simulatedPayouts = (pData || [])
                    .filter(p => p.escrow_status === 'held' && p.order?.status === 'completed')
                    .map(p => ({
                        ...p,
                        type: 'payout_request',
                        requester: resolveUserName(p.order?.provider)
                    }));
                setPayouts(simulatedPayouts);
            }

            // Calculate Stats
            const volume = (pData || []).reduce((acc, p) => acc + (p.amount_total || 0), 0);
            const revenue = (pData || []).reduce((acc, p) => acc + (p.operator_fee || 0), 0);
            const escrow = (pData || []).filter(p => ['held', 'pending'].includes(p.escrow_status))
                .reduce((acc, p) => acc + (p.amount_total || 0), 0);

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

    const handleAction = async (id: string, newStatus: string) => {
        try {
            setIsProcessing(true);
            const { error } = await (supabase as any)
                .from('payments')
                .update({ escrow_status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Log Audit
            await (supabase as any).from('audit_logs').insert({
                action: 'FINANCIAL_RECONCILIATION',
                details: `Pagamento ${id} alterado para status ${newStatus} pela operadora.`,
                timestamp: new Date().toISOString()
            });

            alert('Transação atualizada com sucesso!');
            fetchFinanceData();
            setSelectedTrx(null);
        } catch (error: any) {
            alert('Erro: ' + error.message);
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
            {/* Transaction Details Modal */}
            {selectedTrx && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-bg-primary w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-border-subtle bg-bg-secondary/30 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent-primary text-white rounded-2xl shadow-glow-blue">
                                    <Banknote size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-text-primary uppercase tracking-tight">Detalhes Financeiros</h2>
                                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">TRX #{selectedTrx.id.slice(0, 12)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTrx(null)} className="p-2 hover:bg-bg-secondary rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-bg-secondary/30 p-5 rounded-3xl border border-border-subtle">
                                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-2">Valor Bruto</span>
                                    <span className="text-xl font-black text-text-primary">R$ {selectedTrx.amount_total?.toFixed(2)}</span>
                                </div>
                                <div className="bg-bg-secondary/30 p-5 rounded-3xl border border-border-subtle">
                                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-2">Status Escrow</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-bg-primary border border-border-subtle`}>
                                        {selectedTrx.escrow_status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Participantes</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-4 bg-bg-secondary/20 rounded-2xl">
                                        <span className="text-xs font-bold text-text-primary uppercase">Cliente</span>
                                        <span className="text-xs text-text-secondary">{resolveUserName(selectedTrx.order?.client)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-bg-secondary/20 rounded-2xl">
                                        <span className="text-xs font-bold text-text-primary uppercase">Prestador</span>
                                        <span className="text-xs text-text-secondary">{resolveUserName(selectedTrx.order?.provider)}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedTrx.escrow_status === 'held' && (
                                <div className="pt-4 border-t border-border-subtle space-y-4">
                                    <p className="text-[10px] font-black text-error uppercase text-center tracking-widest">Ações de Conciliação</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleAction(selectedTrx.id, 'released')}
                                            className="h-14 bg-success text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow-green hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={18} /> Liberar Repasse
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedTrx.id, 'refunded')}
                                            className="h-14 bg-error text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow-red hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} /> Reembolsar
                                        </button>
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
                    <h1 className="heading-xl text-text-primary">Centro Financeiro</h1>
                    <p className="text-sm text-text-tertiary font-medium">Gestão de transações, taxas e fluxo de caixa operacional</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 bg-bg-primary border border-border-subtle rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-bg-secondary transition-all">
                        <Download size={16} /> Exportar Ledger
                    </button>
                    <button className="h-12 px-6 bg-accent-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-glow-blue hover:scale-105 transition-all">
                        <Activity size={16} /> Conciliação Global
                    </button>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FinanceCard label="GMV (Volume Bruto)" value={`R$ ${stats.totalVolume.toFixed(2)}`} icon={<DollarSign size={20} />} trend="+12%" color="text-accent-primary" />
                <FinanceCard label="Taxas (Líquido)" value={`R$ ${stats.netRevenue.toFixed(2)}`} icon={<TrendingUp size={20} />} trend="+18.5%" color="text-success" />
                <FinanceCard label="Em Escrow" value={`R$ ${stats.pendingEscrow.toFixed(2)}`} icon={<ShieldCheck size={20} />} trend="Seguro" color="text-warning" />
                <FinanceCard label="Payouts Realizados" value={`R$ ${stats.completedPayouts.toFixed(2)}`} icon={<Banknote size={20} />} trend="OK" color="text-blue-500" />
            </div>

            {/* Operational Tabs */}
            <div className="flex items-center gap-4 border-b border-border-subtle pb-4">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`text-[11px] font-black uppercase tracking-[0.1em] px-6 py-2 rounded-xl transition-all ${activeTab === 'transactions' ? 'bg-black text-white shadow-lg' : 'text-text-tertiary hover:bg-bg-secondary'}`}
                >
                    Transações (Internal)
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
                                    <tr key={trx.id} className="hover:bg-bg-secondary/20 transition-all group">
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">#{trx.id.slice(0, 8)}</p>
                                            <p className="text-[10px] text-text-tertiary font-mono">{new Date(trx.created_at).toLocaleDateString('pt-BR')}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${activeTab === 'payouts' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                                    {activeTab === 'payouts' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{activeTab === 'payouts' ? 'Saque (Payout)' : 'Depósito (Escrow)'}</p>
                                                    <p className="text-[9px] text-text-tertiary uppercase truncate max-w-[150px]">{trx.requester || resolveUserName(trx.order?.client)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-text-primary">R$ {trx.amount_total?.toFixed(2)}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${trx.escrow_status === 'released' ? 'bg-success/10 text-success border-success/20' :
                                                trx.escrow_status === 'held' ? 'bg-warning/10 text-warning border-warning/20' :
                                                    'bg-bg-tertiary text-text-tertiary border-border-subtle'
                                                }`}>
                                                {trx.escrow_status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setSelectedTrx(trx)}
                                                className="p-2.5 bg-bg-secondary hover:bg-black hover:text-white rounded-xl transition-all shadow-sm"
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
const FinanceCard = ({ label, value, trend, icon, color }: any) => (
    <div className="bg-bg-primary border border-border-subtle p-7 rounded-[40px] shadow-sm relative overflow-hidden group">
        <div className="flex items-start justify-between mb-6">
            <div className={`p-4 rounded-2xl bg-bg-secondary border border-border-subtle shadow-sm ${color}`}>
                {icon}
            </div>
            <div className="px-3 py-1 bg-bg-secondary rounded-full text-[9px] font-black text-text-tertiary uppercase tracking-widest">
                {trend}
            </div>
        </div>
        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-text-primary tracking-tight">{value}</h3>
        <div className={`absolute -right-8 -bottom-8 w-24 h-24 ${color} opacity-[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
    </div>
);

const XCircle = ({ size, className }: any) => <X size={size} className={className} />;

export default AdminFinance;

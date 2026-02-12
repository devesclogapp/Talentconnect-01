import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    MapPin,
    Calendar,
    DollarSign,
    User,
    Package,
    Shield,
    X,
    History,
    FileText,
    ArrowRightCircle,
    Activity,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';

const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    client:users!client_id (id, email, user_metadata),
                    provider:users!provider_id (id, email, user_metadata),
                    service:services (id, title, pricing_mode, base_price),
                    payment:payments (*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching admin orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async (orderId: string) => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('order_id', orderId)
                .order('timestamp', { ascending: false });

            if (data) setAuditLogs(data);
        } catch (err) {
            console.error("Audit log error:", err);
        }
    };

    const handleSelectOrder = (order: any) => {
        setSelectedOrder(order);
        setAuditLogs([]);
        fetchAuditLogs(order.id);
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            setIsUpdating(true);
            const oldStatus = selectedOrder?.status;

            const { error } = await (supabase as any)
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Log Manual do Admin
            await (supabase as any).from('audit_logs').insert({
                order_id: orderId,
                action: 'ADMIN_INTERVENTION',
                old_status: oldStatus,
                new_status: newStatus,
                details: `Intervenção pela Operadora. Status alterado manualmente por um administrador.`,
                timestamp: new Date().toISOString()
            });

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
            fetchAuditLogs(orderId);
            alert('Protocolo de intervenção registrado com sucesso!');
        } catch (error: any) {
            alert('Falha na intervenção: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const base = "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit";
        switch (status) {
            case 'completed':
                return <span className={`${base} bg-success/10 text-success border border-success/20`}><CheckCircle size={12} /> Concluído</span>;
            case 'cancelled':
            case 'rejected':
                return <span className={`${base} bg-error/10 text-error border border-error/20`}><XCircle size={12} /> Cancelado</span>;
            case 'in_execution':
                return <span className={`${base} bg-blue-500/10 text-blue-500 border border-blue-500/20`}><Activity size={12} /> Em Execução</span>;
            case 'disputed':
                return <span className={`${base} bg-warning/10 text-warning border border-warning/20`}><AlertTriangle size={12} /> Em Disputa</span>;
            case 'paid_escrow_held':
                return <span className={`${base} bg-accent-primary/10 text-accent-primary border border-accent-primary/20`}><Shield size={12} /> Pago (Escrow)</span>;
            default:
                return <span className={`${base} bg-bg-tertiary text-text-tertiary border border-border-subtle`}>{status?.replace(/_/g, ' ') || 'Processando'}</span>;
        }
    };

    const filteredOrders = orders.filter(order => {
        const clientName = resolveUserName(order.client).toLowerCase();
        const providerName = resolveUserName(order.provider).toLowerCase();
        const serviceTitle = (order.service?.title || '').toLowerCase();
        const orderId = order.id.toLowerCase();

        const matchesSearch = clientName.includes(searchTerm.toLowerCase()) ||
            providerName.includes(searchTerm.toLowerCase()) ||
            serviceTitle.includes(searchTerm.toLowerCase()) ||
            orderId.includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in relative pb-12">
            {/* Order Details Panel */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="bg-bg-primary h-full w-full max-w-5xl shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">
                        {/* Detail Header */}
                        <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-secondary/30">
                            <div className="flex items-center gap-6">
                                <div className="p-4 rounded-2xl bg-accent-primary text-white shadow-glow-blue border border-white/20">
                                    <Package size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Análise de Pedido</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest bg-bg-secondary px-2 py-0.5 rounded">ID #{selectedOrder.id.slice(0, 12)}</span>
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-3 bg-bg-secondary hover:bg-bg-tertiary border border-border-subtle rounded-xl transition-all hover:rotate-90">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Main Content (Left) */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                {/* Roles & Value Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <OrderCard label="Valor Total" value={`R$ ${selectedOrder.total_amount?.toFixed(2)}`} icon={<DollarSign size={18} />} color="text-success" />
                                    <OrderCard label="Contratante" value={resolveUserName(selectedOrder.client)} icon={<User size={18} />} color="text-accent-primary" />
                                    <OrderCard label="Profissional" value={resolveUserName(selectedOrder.provider)} icon={<Shield size={18} />} color="text-purple-500" />
                                </div>

                                {/* Service Details */}
                                <div className="bg-bg-secondary/10 border border-border-subtle rounded-[40px] p-8 space-y-6">
                                    <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> Detalhamento Operacional
                                    </h4>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black text-text-primary mb-2 leading-tight">{selectedOrder.service?.title || 'Contratação Direta'}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <DetailBox label="PAGAMENTO" value={selectedOrder.payment?.[0]?.escrow_status || 'sem registro'} />
                                            <DetailBox label="AGENDADO PARA" value={new Date(selectedOrder.scheduled_at || selectedOrder.created_at).toLocaleDateString('pt-BR')} />
                                            <DetailBox label="LOCALIZAÇÃO" value={selectedOrder.location_text || 'Remoto'} />
                                            <DetailBox label="MODALIDADE" value={selectedOrder.service?.pricing_mode || 'Fixo'} />
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Interventions */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-error uppercase tracking-[0.2em] flex items-center gap-2">
                                        <AlertTriangle size={14} /> Intervenção da Operadora
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                                            className="p-5 border-2 border-dashed border-error/30 bg-error/5 rounded-3xl text-left group hover:border-error transition-all"
                                        >
                                            <p className="text-sm font-black text-error uppercase mb-1">Cancelar Pedido</p>
                                            <p className="text-[10px] text-text-tertiary">Forçar cancelamento e estornar valores ao cliente (se aplicável).</p>
                                        </button>
                                        <button
                                            onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                                            className="p-5 border-2 border-dashed border-success/30 bg-success/5 rounded-3xl text-left group hover:border-success transition-all"
                                        >
                                            <p className="text-sm font-black text-success uppercase mb-1">Forçar Conclusão</p>
                                            <p className="text-[10px] text-text-tertiary">Liberar valores retidos e marcar como concluído pela operadora.</p>
                                        </button>
                                    </div>

                                    <div className="bg-bg-secondary/40 p-6 rounded-3xl border border-border-subtle">
                                        <p className="text-[10px] font-black text-text-tertiary uppercase mb-4 tracking-widest">Alterar Estado (Debug/Ajuste)</p>
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedOrder.status}
                                                onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                                                className="flex-1 bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-xs font-bold outline-none"
                                            >
                                                <option value="sent">Resetar p/ Enviado</option>
                                                <option value="paid_escrow_held">Paid Escrow Held</option>
                                                <option value="in_execution">In Execution</option>
                                                <option value="disputed">Mover p/ Disputa</option>
                                            </select>
                                            <button className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent-primary transition-all">Sincronizar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Facts Timeline (Right Sidebar) */}
                            <div className="w-[380px] border-l border-border-subtle bg-bg-secondary/10 flex flex-col">
                                <div className="p-8 border-b border-border-subtle bg-bg-primary/50">
                                    <h3 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                                        <History size={16} className="text-accent-primary" />
                                        Linha do Tempo (Fatos)
                                    </h3>
                                    <p className="text-[9px] text-text-tertiary font-medium mt-1">Dados imutáveis de auditoria do sistema</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                                        <div key={i} className="relative pl-6 border-l border-border-subtle pb-2">
                                            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-accent-primary border-2 border-white shadow-sm"></div>
                                            <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">
                                                {new Date(log.timestamp).toLocaleString('pt-BR')}
                                            </p>
                                            <p className="text-xs font-black text-text-primary uppercase leading-tight mb-1">{log.action.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] text-text-tertiary italic leading-relaxed">{log.details}</p>
                                            {log.new_status && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-[8px] font-bold px-1.5 py-0.5 bg-bg-tertiary rounded text-text-tertiary">{log.old_status || '...'}</span>
                                                    <ArrowRightCircle size={10} className="text-text-tertiary" />
                                                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-accent-primary/10 rounded text-accent-primary uppercase">{log.new_status}</span>
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center opacity-40">
                                            <Activity size={32} className="mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Nenhum evento registrado</p>
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
                    <h1 className="heading-xl text-text-primary">Gestão de Pedidos</h1>
                    <p className="text-sm text-text-tertiary">Acompanhe todos os serviços e transações em tempo real</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, cliente, profissional ou serviço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary/50 border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-accent-primary transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-xs outline-none font-bold text-text-primary"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="sent">Enviados</option>
                        <option value="accepted">Aceitos</option>
                        <option value="paid_escrow_held">Pagos (Escrow)</option>
                        <option value="in_execution">Em Execução</option>
                        <option value="completed">Concluídos</option>
                        <option value="disputed">Em Disputa</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-bg-primary border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-secondary/50 border-b border-border-subtle">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Pedido #</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Envolvidos</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Serviço / Data</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-text-tertiary">
                                        <Clock className="animate-spin mx-auto mb-4" size={32} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando Pedidos...</span>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-text-tertiary">
                                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-bold">Nenhum pedido encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-bg-secondary/20 transition-all group cursor-pointer"
                                        onClick={() => handleSelectOrder(order)}
                                    >
                                        <td className="px-8 py-5">
                                            <p className="text-[10px] font-black text-accent-primary uppercase tracking-tighter">#{order.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded bg-bg-tertiary text-[9px] flex items-center justify-center font-black text-text-tertiary">C</span>
                                                    <p className="text-xs font-black text-text-primary uppercase tracking-tight">{resolveUserName(order.client)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded bg-accent-primary/10 text-accent-primary text-[9px] flex items-center justify-center font-black">P</span>
                                                    <p className="text-[10px] font-medium text-text-tertiary">{resolveUserName(order.provider)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-text-primary uppercase tracking-tight truncate max-w-[200px]">{order.service?.title || 'Contratação Direta'}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-text-tertiary font-mono">
                                                    <Calendar size={10} />
                                                    {new Date(order.scheduled_at || order.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectOrder(order);
                                                }}
                                                className="p-2.5 bg-bg-secondary hover:bg-accent-primary hover:text-white rounded-xl transition-all shadow-sm"
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

                {/* Pagination */}
                <div className="px-8 py-4 border-t border-border-subtle flex items-center justify-between bg-bg-secondary/10">
                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">Total: {filteredOrders.length} transações operacionais</p>
                </div>
            </div>
        </div>
    );
};

// Internal Components
const OrderCard = ({ label, value, icon, color }: any) => (
    <div className="bg-bg-primary border border-border-subtle p-5 rounded-[28px] shadow-sm">
        <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg bg-bg-secondary ${color}`}>
                {icon}
            </div>
            <span className="text-[9px] font-black uppercase text-text-tertiary tracking-widest">{label}</span>
        </div>
        <h4 className="text-lg font-black text-text-primary uppercase truncate">{value}</h4>
    </div>
);

const DetailBox = ({ label, value }: any) => (
    <div className="bg-bg-primary/40 border border-border-subtle/50 p-4 rounded-2xl">
        <p className="text-[8px] font-black text-text-tertiary uppercase mb-1 tracking-widest">{label}</p>
        <p className="text-[10px] font-black text-text-primary uppercase truncate">{value || 'N/A'}</p>
    </div>
);

export default AdminOrders;

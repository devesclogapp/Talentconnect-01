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
    X
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
                    client:client_id (id, email, user_metadata),
                    provider:provider_id (id, email, user_metadata),
                    service:service_id (id, title, pricing_mode, base_price)
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

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            setIsUpdating(true);
            const { error } = await (supabase as any)
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
            alert('Status do pedido atualizado!');
        } catch (error: any) {
            alert('Falha ao atualizar status: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const base = "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit";
        switch (status) {
            case 'completed':
                return <span className={`${base} bg-success/10 text-success`}><CheckCircle2 size={10} /> Concluído</span>;
            case 'cancelled':
            case 'rejected':
                return <span className={`${base} bg-error/10 text-error`}><XCircle size={10} /> Cancelado</span>;
            case 'in_execution':
                return <span className={`${base} bg-blue-500/10 text-blue-500`}><Clock size={10} /> Em Execução</span>;
            case 'disputed':
                return <span className={`${base} bg-warning/10 text-warning`}><AlertCircle size={10} /> Disputa</span>;
            case 'paid_escrow_held':
                return <span className={`${base} bg-accent-primary/10 text-accent-primary`}><DollarSign size={10} /> Pago (Escrow)</span>;
            default:
                return <span className={`${base} bg-bg-tertiary text-text-tertiary`}>{status.replace('_', ' ')}</span>;
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
        <div className="space-y-6 animate-fade-in relative">
            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-bg-primary border border-border-subtle rounded-[40px] w-full max-w-4xl overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.5)] animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-secondary/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-accent-primary text-white shadow-glow-blue">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Detalhes do Pedido</h2>
                                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest px-1">Protocolo: {selectedOrder.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-bg-tertiary rounded-full transition-all hover:rotate-90">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                {/* Service & Participants */}
                                <div className="lg:col-span-2 space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-text-tertiary uppercase tracking-[0.2em] border-l-2 border-accent-primary pl-3">Serviço Contratado</h3>
                                        <div className="bg-bg-secondary/30 rounded-3xl p-6 border border-border-subtle">
                                            <h4 className="text-2xl font-black text-text-primary mb-2 leading-tight">{selectedOrder.service?.title || 'Serviço Personalizado'}</h4>
                                            <div className="flex flex-wrap gap-4 mt-4">
                                                <div className="flex items-center gap-2 text-sm text-text-secondary bg-bg-primary px-4 py-2 rounded-xl">
                                                    <DollarSign size={16} className="text-success" />
                                                    <span className="font-bold">R$ {selectedOrder.amount_total?.toFixed(2) || '0,00'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-text-secondary bg-bg-primary px-4 py-2 rounded-xl">
                                                    <Calendar size={16} className="text-accent-primary" />
                                                    <span>{new Date(selectedOrder.scheduled_at || selectedOrder.created_at).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-text-secondary bg-bg-primary px-4 py-2 rounded-xl">
                                                    <MapPin size={16} className="text-error" />
                                                    <span>{selectedOrder.location_text || 'Remoto'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest pl-3 flex items-center gap-2">
                                                <User size={12} className="text-accent-primary" /> Cliente
                                            </h4>
                                            <div className="flex items-center gap-4 bg-bg-secondary/10 p-4 rounded-[24px] border border-border-subtle">
                                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black text-accent-primary shadow-sm">
                                                    {resolveUserName(selectedOrder.client).charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-text-primary">{resolveUserName(selectedOrder.client)}</p>
                                                    <p className="text-[10px] text-text-tertiary">{selectedOrder.client?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest pl-3 flex items-center gap-2">
                                                <Shield size={12} className="text-purple-500" /> Profissional
                                            </h4>
                                            <div className="flex items-center gap-4 bg-bg-secondary/10 p-4 rounded-[24px] border border-border-subtle">
                                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center font-black text-purple-500 shadow-sm">
                                                    {resolveUserName(selectedOrder.provider).charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-text-primary">{resolveUserName(selectedOrder.provider)}</p>
                                                    <p className="text-[10px] text-text-tertiary">{selectedOrder.provider?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status & Admin Control */}
                                <div className="space-y-8">
                                    <div className="bg-bg-primary border border-border-subtle rounded-[32px] p-6 space-y-6 shadow-sm">
                                        <div>
                                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">Estado Atual</p>
                                            {getStatusBadge(selectedOrder.status)}
                                        </div>

                                        <div className="pt-6 border-t border-border-subtle space-y-4">
                                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Intervenção Administrativa</p>
                                            <div className="space-y-2">
                                                <select
                                                    value={selectedOrder.status}
                                                    disabled={isUpdating}
                                                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                                                    className="w-full bg-bg-secondary border border-border-subtle rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-accent-primary transition-all"
                                                >
                                                    <option value="sent">Resetar para Enviado</option>
                                                    <option value="paid_escrow_held">Forçar Pago (Escrow)</option>
                                                    <option value="in_execution">Marcar em Execução</option>
                                                    <option value="completed">Concluir Manualmente</option>
                                                    <option value="cancelled">Cancelar Pedido</option>
                                                    <option value="disputed">Mover para Disputa</option>
                                                </select>
                                                <p className="text-[9px] text-text-tertiary italic px-2">Alterar o status afeta diretamente o fluxo financeiro e notificações.</p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-border-subtle">
                                            <button className="w-full py-4 bg-error/10 text-error rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all">
                                                Bloquear Transação
                                            </button>
                                        </div>
                                    </div>
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
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, cliente, profissional ou serviço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-accent-primary transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none font-medium"
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
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Pedido #</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Envolvidos</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Serviço / Data</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-tertiary text-sm">Carregando pedidos...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-tertiary text-sm">Nenhum pedido encontrado.</td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-bg-secondary/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-accent-primary uppercase tracking-tighter">#{order.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-bg-tertiary text-[8px] flex items-center justify-center font-bold">C</span>
                                                    <p className="text-xs font-bold text-text-primary">{resolveUserName(order.client)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-accent-primary/10 text-accent-primary text-[8px] flex items-center justify-center font-bold">P</span>
                                                    <p className="text-xs font-medium text-text-secondary">{resolveUserName(order.provider)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-text-primary">{order.service?.title || 'Serviço Personalizado'}</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                                                        <Calendar size={10} />
                                                        {new Date(order.scheduled_at || order.created_at).toLocaleDateString('pt-BR')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 hover:bg-bg-secondary rounded-lg text-accent-primary transition-all hover:scale-110"
                                                title="Ver Detalhes"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between bg-bg-secondary/10">
                    <p className="text-[10px] text-text-tertiary">Total: {filteredOrders.length} pedidos encontrados</p>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;


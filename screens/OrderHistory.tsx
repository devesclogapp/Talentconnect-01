import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { getClientOrders } from '../services/ordersService';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { supabase } from '../services/supabaseClient';
import OrderCard from '../components/OrderCard';

interface OrderHistoryProps {
    onBack: () => void;
    onSelectOrder: (order: any) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ onBack, onSelectOrder }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await getClientOrders();
                setOrders(data || []);
            } catch (error) {
                console.error("Erro ao buscar histórico de pedidos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();

        // Subscribe to real-time updates for client orders
        const subscription = supabase
            .channel('client-orders-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                },
                async (payload: any) => {
                    // Refetch all orders to ensure we have the latest data
                    // This is more reliable than trying to update the local state
                    try {
                        const data = await getClientOrders();
                        setOrders(data || []);
                    } catch (error) {
                        console.error("Erro ao atualizar pedidos:", error);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    label: 'Concluído',
                    variant: 'success' as const,
                    icon: CheckCircle,
                    color: 'text-feedback-success'
                };
            case 'sent':
                return {
                    label: 'Aguardando Resposta',
                    variant: 'secondary' as const,
                    icon: AlertCircle,
                    color: 'text-black'
                };
            case 'rejected':
            case 'cancelled':
                return {
                    label: 'Cancelado',
                    variant: 'error' as const,
                    icon: XCircle,
                    color: 'text-feedback-error'
                };
            default: // accepted, paid_escrow_held, awaiting_start_confirmation, in_execution, awaiting_finish_confirmation
                return {
                    label: 'Em Andamento',
                    variant: 'warning' as const,
                    icon: Clock,
                    color: 'text-feedback-warning'
                };
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.service_title_snapshot || order.service?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.provider?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = filterStatus === 'all';
        if (filterStatus === 'pending') matchesFilter = order.status === 'sent';
        if (filterStatus === 'completed') matchesFilter = order.status === 'completed';
        if (filterStatus === 'cancelled') matchesFilter = ['rejected', 'cancelled'].includes(order.status);
        if (filterStatus === 'in_progress') matchesFilter = !['sent', 'completed', 'rejected', 'cancelled'].includes(order.status);

        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Data pendente';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="screen-container pb-6">
            <div className="sticky top-0 bg-app-bg/95 backdrop-blur-md z-10 px-6 pt-8 pb-6 border-b border-border-subtle">
                <button
                    onClick={onBack}
                    className="interactive flex items-center gap-2 text-text-primary mb-6 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[13px] font-normal">Painel do Cliente</span>
                </button>

                <h1 className="text-[32px] font-bold text-text-primary mb-6">
                    Meus Pedidos
                </h1>

                <div className="relative mb-6">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary opacity-30">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por serviço ou profissional..."
                        className="w-full bg-bg-secondary border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all text-black"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div
                    className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {[
                        { id: 'all', label: 'Todos', icon: <Filter size={16} /> },
                        { id: 'in_progress', label: 'Em Andamento', icon: <Clock size={16} /> },
                        { id: 'completed', label: 'Concluídos', icon: <CheckCircle size={16} /> },
                        { id: 'cancelled', label: 'Cancelados', icon: <XCircle size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-all border ${filterStatus === tab.id
                                ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
                                : 'bg-white text-black border-border-subtle hover:border-black/20'
                                }`}
                        >
                            {tab.icon}
                            <span className="text-[10px] font-normal">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-6 pt-8 space-y-4">
                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
                        <p className="text-text-primary font-normal text-sm">Sincronizando carteira...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-20 px-8 bg-bg-secondary/30 rounded-[32px] border border-dashed border-border-subtle">
                        <div className="w-20 h-20 rounded-[28px] bg-bg-secondary flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <AlertCircle size={32} className="text-text-primary opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">
                            Nenhum registro encontrado
                        </h3>
                        <p className="text-sm text-text-primary opacity-60 max-w-[200px] mx-auto leading-relaxed">
                            {searchQuery ? 'Tente ajustar sua busca ou filtros para localizar o pedido.' : 'Sua lista está limpa. Que tal contratar um novo especialista?'}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onClick={onSelectOrder}
                            type="client"
                            resolveUserName={resolveUserName}
                            resolveUserAvatar={resolveUserAvatar}
                            formatDate={formatDate}
                        />
                    ))
                )}
            </div>
        </div>
    );
};


export default OrderHistory;

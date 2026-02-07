import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Calendar, MapPin, ChevronRight, DollarSign } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { getProviderOrders } from '../services/ordersService';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { supabase } from '../services/supabaseClient';

interface ReceivedOrdersProps {
    onBack: () => void;
    onSelectOrder: (order: any) => void;
    initialFilter?: string;
}

const ReceivedOrders: React.FC<ReceivedOrdersProps> = ({ onBack, onSelectOrder, initialFilter = 'all' }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string | 'all'>(initialFilter);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await getProviderOrders();
                setOrders(data || []);
            } catch (error) {
                console.error("Erro ao buscar pedidos recebidos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();

        const subscription = supabase
            .channel('received-orders-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                },
                async () => {
                    try {
                        const data = await getProviderOrders();
                        setOrders(data || []);
                    } catch (error) {
                        console.error("Erro ao atualizar pedidos recebidos:", error);
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
            case 'sent':
                return { label: 'Novo Pedido', className: 'bg-warning/10 text-warning border-warning/20', icon: AlertCircle };
            case 'awaiting_details':
                return { label: 'Negociando', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock };
            case 'accepted':
            case 'paid_escrow_held':
            case 'awaiting_start_confirmation':
                return { label: 'Agendado', className: 'bg-success/10 text-success border-success/20', icon: Calendar };
            case 'in_execution':
            case 'awaiting_finish_confirmation':
                return { label: 'Em Execução', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Zap };
            case 'completed':
                return { label: 'Concluído', className: 'bg-success text-white border-transparent', icon: CheckCircle };
            case 'rejected':
            case 'cancelled':
                return { label: 'Cancelado', className: 'bg-error/10 text-error border-error/20', icon: XCircle };
            default:
                return { label: status, className: 'bg-gray-100 text-gray-500', icon: AlertCircle };
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.service_title_snapshot || order.service?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = filterStatus === 'all';
        if (filterStatus === 'pending') matchesFilter = order.status === 'sent';
        if (filterStatus === 'accepted') matchesFilter = ['accepted', 'paid_escrow_held', 'awaiting_start_confirmation'].includes(order.status);
        if (filterStatus === 'in_progress') matchesFilter = ['in_execution', 'awaiting_finish_confirmation'].includes(order.status);
        if (filterStatus === 'completed') matchesFilter = order.status === 'completed';

        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString: string) => {
        if (!dateString) return 'A definir';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        return `${diffDays}d atrás`;
    };

    const pendingCount = orders.filter(o => o.status === 'sent').length;

    // Icon component for status (Zap was missing import in previous)
    const Zap = ({ size, className }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;


    return (
        <div className="min-h-screen bg-bg-primary font-sans animate-fade-in pb-24">
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 bg-bg-primary/95 backdrop-blur-md border-b border-border-subtle">
                <div className="px-5 pt-12 pb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-text-primary mb-6 hover:opacity-70 transition-opacity"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-semibold">Voltar</span>
                    </button>

                    <h1 className="heading-2xl tracking-tight text-text-primary mb-1">
                        Pedidos Recebidos
                    </h1>
                    <p className="text-xs text-text-tertiary font-normal">
                        {orders.length} pedidos no total
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="pl-5 pr-5 pb-4 space-y-4">
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou serviço..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 bg-bg-secondary rounded-[18px] pl-12 pr-4 text-sm font-medium text-text-primary placeholder:text-text-tertiary outline-none border border-transparent focus:border-border-subtle focus:bg-bg-tertiary transition-all"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'all', label: 'Todos', count: orders.length, icon: Filter },
                            { id: 'pending', label: 'Pendentes', count: pendingCount, icon: AlertCircle },
                            { id: 'accepted', label: 'Agendados', count: orders.filter(o => ['accepted', 'paid_escrow_held', 'awaiting_start_confirmation'].includes(o.status)).length, icon: Calendar },
                            { id: 'completed', label: 'Concluídos', count: orders.filter(o => o.status === 'completed').length, icon: CheckCircle }
                        ].map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setFilterStatus(filter.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap active:scale-95 ${filterStatus === filter.id
                                    ? filter.id === 'pending'
                                        ? 'bg-warning border-warning text-white shadow-lg shadow-warning/20'
                                        : 'bg-text-primary border-text-primary text-bg-primary shadow-lg'
                                    : 'bg-bg-primary border-border-subtle text-text-secondary hover:border-text-tertiary'
                                    }`}
                            >
                                <filter.icon size={14} />
                                <span className="text-[11px] font-normal tracking-normal">{filter.label}</span>
                                {filter.count > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-normal ${filterStatus === filter.id
                                        ? 'bg-bg-primary/20 text-bg-primary'
                                        : 'bg-bg-secondary text-text-primary'
                                        }`}>
                                        {filter.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="px-5 pt-4 space-y-4">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
                        <p className="text-[10px] text-text-tertiary tracking-normal animate-pulse">Atualizando pedidos...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-20 text-center space-y-4 opacity-50">
                        <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto text-text-tertiary">
                            <Search size={24} />
                        </div>
                        <p className="text-sm font-medium text-text-secondary">Nenhum pedido encontrado.</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const status = getStatusConfig(order.status);
                        const StatusIcon = status.icon;
                        const clientName = resolveUserName(order.client);
                        const clientAvatar = resolveUserAvatar(order.client);

                        return (
                            <button
                                key={order.id}
                                onClick={() => onSelectOrder(order)}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[32px] p-6 text-left shadow-sm hover:shadow-md transition-all group active:scale-[0.99] relative overflow-hidden"
                            >
                                {/* Status Badge Top Right */}
                                <div className={`absolute top-6 right-6 px-2 py-1 rounded-full flex items-center gap-1 border ${status.className}`}>
                                    <StatusIcon size={10} />
                                    <span className="text-[9px] font-normal tracking-normal">{status.label}</span>
                                </div>

                                {/* Client Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <img
                                        src={clientAvatar}
                                        alt={clientName}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-neutral-800 shadow-sm"
                                    />
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary leading-tight mb-1">{clientName}</h3>
                                        <p className="text-[10px] font-normal text-text-tertiary tracking-normal">
                                            {getTimeAgo(order.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Service Details Box */}
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-[24px] p-5 mb-6">
                                    <p className="text-[9px] font-normal text-text-tertiary tracking-normal mb-2">Serviço Solicitado</p>
                                    <h4 className="text-base font-bold text-text-primary mb-3 line-clamp-2">
                                        {order.service_title_snapshot || order.service?.title || 'Serviço Personalizado'}
                                    </h4>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2 text-text-secondary text-xs">
                                            <Calendar size={14} className="text-text-tertiary" />
                                            <span className="font-medium">{formatDate(order.scheduled_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-text-secondary text-xs">
                                            <Clock size={14} className="text-text-tertiary" />
                                            <span className="font-medium">{formatTime(order.scheduled_at) || 'horário a definir'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Pill if exists */}
                                {order.location_text && (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 rounded-2xl text-xs font-normal mb-6">
                                        <MapPin size={14} className="shrink-0" />
                                        <span className="line-clamp-1">{order.location_text}</span>
                                    </div>
                                )}

                                {/* Footer: Price & Action */}
                                <div className="flex items-end justify-between border-t border-border-subtle pt-5">
                                    <div>
                                        <p className="text-[9px] font-normal text-text-tertiary tracking-normal mb-1">Valor Total</p>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-sm font-bold text-text-secondary">R$</span>
                                            <span className="text-2xl font-black text-text-primary tracking-tight">
                                                {order.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-text-primary text-bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                        <ArrowLeft size={20} className="rotate-180" />
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ReceivedOrders;

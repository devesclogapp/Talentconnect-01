import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Calendar, MapPin } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { getProviderOrders } from '../services/ordersService';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { supabase } from '../services/supabaseClient';

interface ReceivedOrdersProps {
    onBack: () => void;
    onSelectOrder: (order: any) => void;
}

const ReceivedOrders: React.FC<ReceivedOrdersProps> = ({ onBack, onSelectOrder }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
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

        // Subscribe to real-time updates
        const subscription = supabase
            .channel('received-orders-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                },
                async (payload: any) => {
                    // Refetch all orders to ensure we have the latest data
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
                return {
                    label: 'Novo Pedido',
                    variant: 'warning' as const,
                    icon: AlertCircle,
                    color: 'text-feedback-warning',
                    bgColor: 'bg-feedback-warning/10'
                };
            case 'awaiting_details':
                return {
                    label: 'Negociando',
                    variant: 'info' as const,
                    icon: Clock,
                    color: 'text-primary-green',
                    bgColor: 'bg-primary-green/10'
                };
            case 'accepted':
            case 'paid_escrow_held':
            case 'awaiting_start_confirmation':
                return {
                    label: 'Aceito/Agendado',
                    variant: 'success' as const,
                    icon: CheckCircle,
                    color: 'text-feedback-success',
                    bgColor: 'bg-feedback-success/10'
                };
            case 'in_execution':
            case 'awaiting_finish_confirmation':
                return {
                    label: 'Em Execução',
                    variant: 'info' as const,
                    icon: Clock,
                    color: 'text-feedback-info',
                    bgColor: 'bg-feedback-info/10'
                };
            case 'completed':
                return {
                    label: 'Concluído',
                    variant: 'success' as const,
                    icon: CheckCircle,
                    color: 'text-feedback-success',
                    bgColor: 'bg-feedback-success/10'
                };
            case 'rejected':
            case 'cancelled':
                return {
                    label: 'Cancelado/Recusado',
                    variant: 'error' as const,
                    icon: XCircle,
                    color: 'text-feedback-error',
                    bgColor: 'bg-feedback-error/10'
                };
            default:
                return {
                    label: status,
                    variant: 'info' as const,
                    icon: AlertCircle,
                    color: 'text-text-primary',
                    bgColor: 'bg-bg-tertiary'
                };
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
        if (!dateString) return 'Data pendente';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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
    const acceptedCount = orders.filter(o => ['accepted', 'paid_escrow_held', 'awaiting_start_confirmation'].includes(o.status)).length;
    const inProgressCount = orders.filter(o => ['in_execution', 'awaiting_finish_confirmation'].includes(o.status)).length;
    const completedCount = orders.filter(o => o.status === 'completed').length;

    return (
        <div className="screen-container pb-6 bg-app-bg min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-app-bg/95 dark:bg-gray-900/95 backdrop-blur-md z-10 px-4 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <button
                    onClick={onBack}
                    className="interactive flex items-center gap-2 text-text-primary dark:text-gray-300 mb-4  transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="label-semibold">Voltar</span>
                </button>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-text-primary mb-1">
                            Pedidos Recebidos
                        </h1>
                        <p className="text-sm text-text-secondary">{orders.length} pedido{orders.length !== 1 ? 's' : ''} no total</p>
                    </div>
                    {pendingCount > 0 && (
                        <div className="w-14 h-14 rounded-2xl bg-warning/10 text-warning flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{pendingCount}</p>
                                <p className="text-[8px] uppercase tracking-widest font-bold">Novos</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        icon={Search}
                        placeholder="Buscar por cliente ou serviço..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="!rounded-[20px]"
                    />
                </div>

                {/* Enhanced Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-[16px] label-semibold uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'all'
                            ? 'bg-black text-white shadow-lg dark:bg-white dark:text-black'
                            : 'bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800'
                            }`}
                    >
                        <Filter size={16} />
                        <span className="text-xs">Todos</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === 'all' ? 'bg-white/20 dark:bg-black/20' : 'bg-neutral-100 dark:bg-neutral-800'
                            }`}>
                            {orders.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-[16px] label-semibold uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'pending'
                            ? 'bg-amber-500 text-black shadow-lg'
                            : 'bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800'
                            }`}
                    >
                        <AlertCircle size={16} />
                        <span className="text-xs">Pendentes</span>
                        {pendingCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === 'pending' ? 'bg-black/20' : 'bg-amber-500/10 text-amber-600'
                                }`}>
                                {pendingCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setFilterStatus('accepted')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-[16px] label-semibold uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'accepted'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800'
                            }`}
                    >
                        <CheckCircle size={16} />
                        <span className="text-xs">Confirmados</span>
                        {acceptedCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === 'accepted' ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-600'
                                }`}>
                                {acceptedCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setFilterStatus('in_progress')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-[16px] label-semibold uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'in_progress'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800'
                            }`}
                    >
                        <Clock size={16} />
                        <span className="text-xs">Em Execução</span>
                        {inProgressCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === 'in_progress' ? 'bg-white/20' : 'bg-blue-600/10 text-blue-600'
                                }`}>
                                {inProgressCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-[16px] label-semibold uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === 'completed'
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800'
                            }`}
                    >
                        <CheckCircle size={16} />
                        <span className="text-xs">Concluídos</span>
                        {completedCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === 'completed' ? 'bg-white/20' : 'bg-emerald-600/10 text-emerald-600'
                                }`}>
                                {completedCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Orders List */}
            <div className="px-4 pt-6 space-y-4">
                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary-green/20 border-t-primary-green rounded-full animate-spin"></div>
                        <p className="meta-bold text-text-primary uppercase tracking-widest">Buscando pedidos...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="w-20 h-20 rounded-[28px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6">
                            <Filter size={32} className="text-text-primary opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">
                            Nenhum pedido encontrado
                        </h3>
                        <p className="text-sm text-text-secondary mb-6">
                            {searchQuery ? 'Tente ajustar sua busca ou filtros' : 'Você ainda não recebeu pedidos'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterStatus('all');
                                }}
                                className="px-6 py-3 bg-primary-green text-black rounded-[16px] label-semibold uppercase tracking-widest"
                            >
                                Limpar Filtros
                            </button>
                        )}
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        const StatusIcon = statusConfig.icon;
                        const clientName = resolveUserName(order.client);
                        const clientAvatar = resolveUserAvatar(order.client);

                        return (
                            <button
                                key={order.id}
                                onClick={() => onSelectOrder(order)}
                                className={`w-full card interactive p-6 text-left  transition-all border rounded-[28px] bg-white dark:bg-neutral-900 ${order.status === 'sent'
                                    ? 'ring-2 ring-warning/30 border-warning/20 shadow-lg shadow-warning/10'
                                    : 'border-neutral-100 dark:border-neutral-800'
                                    }`}
                            >
                                {/* Header with Avatar and Status */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-primary-green/20 to-primary-green/5 overflow-hidden flex items-center justify-center shadow-inner border-2 border-white dark:border-neutral-800">
                                                <img
                                                    src={clientAvatar}
                                                    className="w-full h-full object-cover"
                                                    alt={clientName}
                                                />
                                            </div>
                                            {order.status === 'sent' && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full border-2 border-white dark:border-neutral-900 animate-pulse"></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-text-primary mb-1">
                                                {clientName}
                                            </h3>
                                            <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">
                                                {getTimeAgo(order.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={statusConfig.variant} className="shadow-sm">
                                        <StatusIcon size={12} className="mr-1" />
                                        {statusConfig.label}
                                    </Badge>
                                </div>

                                {/* Service Info */}
                                <div className="mb-5 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-[20px]">
                                    <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mb-2">Serviço Solicitado</p>
                                    <p className="font-bold text-lg text-text-primary mb-3">
                                        {order.service_title_snapshot || order.service?.title || 'Serviço'}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-black-green" />
                                            <span className="font-medium">{formatDate(order.scheduled_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-black-green" />
                                            <span className="font-medium">{new Date(order.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-2 mb-5 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-[16px]">
                                    <MapPin size={16} className="text-black mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-black font-medium line-clamp-2">
                                        {order.location_text || 'Local não informado'}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="flex items-center justify-between pt-5 border-t border-neutral-100 dark:border-neutral-800">
                                    <div>
                                        <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mb-1">
                                            {order.pricing_mode === 'hourly' ? 'Valor por hora' : 'Valor total'}
                                        </p>
                                        <span className="text-2xl font-black text-black-green">
                                            R$ {order.total_amount?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-primary-green/10 text-black-green flex items-center justify-center">
                                        <ArrowLeft size={20} className="rotate-180" />
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div >
    );
};

export default ReceivedOrders;

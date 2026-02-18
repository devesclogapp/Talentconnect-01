import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { Badge } from './ui/Badge';

interface OrderCardProps {
    order: any;
    onClick: (order: any) => void;
    type: 'client' | 'provider';
    resolveUserName: (user: any) => string;
    resolveUserAvatar: (user: any) => string;
    formatDate: (dateString: string) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
    order,
    onClick,
    type,
    resolveUserName,
    resolveUserAvatar,
    formatDate
}) => {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    label: 'Concluído',
                    variant: 'success' as const,
                    icon: CheckCircle,
                    colorClass: 'text-success bg-success/10 border-success/20',
                    dotColor: 'bg-success'
                };
            case 'sent':
                return {
                    label: 'Aguardando',
                    variant: 'secondary' as const,
                    icon: AlertCircle,
                    colorClass: 'text-text-primary bg-bg-tertiary border-border-medium',
                    dotColor: 'bg-text-tertiary'
                };
            case 'rejected':
            case 'cancelled':
                return {
                    label: 'Cancelado',
                    variant: 'error' as const,
                    icon: XCircle,
                    colorClass: 'text-error bg-error/10 border-error/20',
                    dotColor: 'bg-error'
                };
            case 'in_execution':
                return {
                    label: 'Em Execução',
                    variant: 'warning' as const,
                    icon: Clock,
                    colorClass: 'text-text-primary bg-bg-tertiary border-border-medium',
                    dotColor: 'bg-text-tertiary animate-pulse'
                };
            default:
                return {
                    label: 'Pendente',
                    variant: 'warning' as const,
                    icon: Clock,
                    colorClass: 'text-text-primary bg-bg-tertiary border-border-medium',
                    dotColor: 'bg-text-tertiary'
                };
        }
    };

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const otherUser = type === 'client' ? order.provider : order.client;
    const userName = resolveUserName(otherUser);
    const userAvatar = resolveUserAvatar(otherUser);

    // Formatting time safely
    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    return (
        <button
            onClick={() => onClick(order)}
            className="w-full group relative bg-white dark:bg-neutral-900 border border-border-subtle dark:border-neutral-800 rounded-[32px] p-5 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 active:scale-[0.98] overflow-hidden"
        >
            {/* Status Indicator Floating */}
            <div className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusConfig.colorClass}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                {statusConfig.label}
            </div>

            {/* Profile & Service Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                    <div className="w-16 h-16 rounded-[22px] bg-bg-secondary dark:bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-neutral-900 shadow-md">
                        {userAvatar ? (
                            <img src={userAvatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={userName} />
                        ) : (
                            <span className="text-xl font-bold text-text-primary">{userName?.[0] || '?'}</span>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0 pr-20"> {/* pr-20 to clear status badge */}
                    <h3 className="text-lg font-bold text-text-primary dark:text-white truncate mb-0.5 leading-tight">
                        {order.service_title_snapshot || order.service?.title || 'Serviço Personalizado'}
                    </h3>
                    <p className="text-sm font-medium text-text-secondary dark:text-neutral-400">
                        {userName}
                    </p>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-bg-secondary dark:bg-neutral-800/50 rounded-2xl p-3 flex items-center gap-3 border border-transparent group-hover:border-border-subtle transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center text-text-primary shadow-sm">
                        <Calendar size={16} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-tight">Data</p>
                        <p className="text-[11px] font-bold text-text-primary dark:text-white truncate">{formatDate(order.scheduled_at)}</p>
                    </div>
                </div>

                <div className="bg-bg-secondary dark:bg-neutral-800/50 rounded-2xl p-3 flex items-center gap-3 border border-transparent group-hover:border-border-subtle transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center text-text-primary shadow-sm">
                        <Clock size={16} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-tight">Horário</p>
                        <p className="text-[11px] font-bold text-text-primary dark:text-white truncate">{formatTime(order.scheduled_at) || '--:--'}</p>
                    </div>
                </div>
            </div>

            {/* Location Pill */}
            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100 dark:border-neutral-800 mb-6 group-hover:bg-bg-tertiary transition-colors">
                <MapPin size={14} className="text-text-primary shrink-0" />
                <span className="text-xs font-medium text-text-secondary dark:text-neutral-400 truncate">
                    {order.location_text || 'Local a ser definido'}
                </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle dark:border-neutral-800">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-0.5">Total à pagar</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-text-primary">R$</span>
                        <span className="text-2xl font-black text-text-primary dark:text-white tracking-tight leading-none">
                            {order.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2.5 bg-accent-secondary rounded-full hover:scale-105 transition-all shadow-lg shadow-accent-secondary/20">
                    <span className="text-[11px] font-bold text-white">Detalhes</span>
                    <ChevronRight size={14} className="text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>

            {/* Subtle Gradient Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-right from-transparent via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
};

export default OrderCard;

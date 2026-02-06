import React, { useState, useEffect } from 'react';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { ArrowLeft, Calendar, Clock, MapPin, User, FileText, CreditCard, MessageCircle, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { subscribeToOrderUpdates } from '../services/ordersService';

interface OrderDetailProps {
    order: any;
    onBack: () => void;
    onContact: () => void;
    onSupport: () => void;
    onRate?: () => void;
    onConfirmCompletion?: () => void;
    onPay?: (order: any) => void;
    onConfirmStart?: () => void; // New prop if passed from parent, or we handle internally
}

const OrderDetail: React.FC<OrderDetailProps> = ({
    order: initialOrder,
    onBack,
    onContact,
    onSupport,
    onRate,
    onConfirmCompletion,
    onPay
}) => {
    const [order, setOrder] = useState(initialOrder);

    useEffect(() => {
        setOrder(initialOrder);
        if (!initialOrder?.id) return;

        const subscription = subscribeToOrderUpdates(initialOrder.id, (updatedOrder) => {
            setOrder(updatedOrder);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [initialOrder]);

    if (!order) return null;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    label: 'Concluído',
                    variant: 'success' as const,
                    icon: CheckCircle,
                    color: 'text-feedback-success',
                    bgColor: 'bg-feedback-success/10'
                };
            case 'awaiting_start_confirmation':
                return {
                    label: 'Confirmar Início',
                    variant: 'warning' as const,
                    icon: AlertCircle,
                    color: 'text-feedback-warning',
                    bgColor: 'bg-feedback-warning/10'
                };
            case 'awaiting_finish_confirmation':
                return {
                    label: 'Confirmar Conclusão',
                    variant: 'warning' as const,
                    icon: CheckCircle,
                    color: 'text-feedback-warning',
                    bgColor: 'bg-feedback-warning/10'
                };
            case 'in_execution':
                return {
                    label: 'Em Execução',
                    variant: 'success' as const, // Green for active execution
                    icon: Clock,
                    color: 'text-feedback-info',
                    bgColor: 'bg-feedback-info/10'
                };
            case 'sent':
                return {
                    label: 'Aguardando Resposta',
                    variant: 'secondary' as const,
                    icon: AlertCircle,
                    color: 'text-black',
                    bgColor: 'bg-gray-100 dark:bg-gray-800'
                };
            case 'accepted':
                return {
                    label: 'Aguardando Pagamento',
                    variant: 'warning' as const,
                    icon: Clock,
                    color: 'text-feedback-warning',
                    bgColor: 'bg-feedback-warning/10'
                };
            case 'rejected':
            case 'cancelled':
                return {
                    label: 'Cancelado',
                    variant: 'error' as const,
                    icon: XCircle,
                    color: 'text-feedback-error',
                    bgColor: 'bg-feedback-error/10'
                };
            default: // paid_escrow_held, etc.
                return {
                    label: 'Em Andamento',
                    variant: 'warning' as const,
                    icon: Clock,
                    color: 'text-feedback-warning',
                    bgColor: 'bg-feedback-warning/10'
                };
        }
    };

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Data não definida';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '--:--';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Timeline logic
    // Timeline logic
    const getTimeline = () => {
        const isPaid = !['sent', 'accepted', 'rejected', 'cancelled'].includes(order.status);
        const isStartRequested = ['awaiting_start_confirmation', 'in_execution', 'awaiting_finish_confirmation', 'completed'].includes(order.status);
        const isStarted = ['in_execution', 'awaiting_finish_confirmation', 'completed'].includes(order.status);
        const isFinishedRequested = ['awaiting_finish_confirmation', 'completed'].includes(order.status);
        const isFinished = order.status === 'completed';

        const steps = [
            {
                label: 'Pedido Criado',
                completed: true,
                date: new Date(order.created_at).toLocaleString(),
                description: 'Aguardando confirmação do profissional'
            },
            {
                label: 'Confirmado pelo Prestador',
                completed: order.status !== 'sent' && order.status !== 'rejected',
                description: order.status === 'accepted' ? 'Aguardando pagamento' : 'Profissional aceitou o pedido'
            },
            {
                label: 'Pagamento Realizado',
                completed: isPaid,
                description: isPaid && !isStartRequested ? 'Aguardando prestador iniciar o serviço' : 'Pagamento retido com segurança'
            },
            {
                label: 'Confirmação de Início',
                completed: isStarted || isFinished, // Mark completed if started or finished
                description: order.status === 'awaiting_start_confirmation'
                    ? 'Profissional aguardando sua confirmação'
                    : (isStarted || isFinished) ? 'Início confirmado com sucesso' : 'Aguardando início do profissional'
            },
            {
                label: 'Em Execução',
                completed: (isStarted || isFinished) && order.status !== 'awaiting_start_confirmation',
                description: (isStarted && !isFinished) ? 'Serviço em andamento' : 'Execução finalizada'
            },
            {
                label: 'Confirmação de Conclusão',
                completed: isFinished || order.status === 'awaiting_finish_confirmation', // Mark complected if finished OR if we are currently at this step (to show progress)
                description: order.status === 'awaiting_finish_confirmation'
                    ? 'Profissional sinalizou conclusão. Confirme.'
                    : isFinished ? 'Conclusão confirmada' : 'Aguardando finalização'
            },
            {
                label: 'Serviço Concluído',
                completed: isFinished,
                description: isFinished ? 'Serviço finalizado com sucesso' : ''
            }
        ];
        return steps;
    };

    const timeline = getTimeline();
    const providerName = resolveUserName(order.provider);
    const clientName = resolveUserName(order.client);
    const counterpartAvatar = resolveUserAvatar(order.provider?.name ? order.provider : order.client);

    return (
        <div className="screen-container pb-6">
            {/* Header */}
            <div className="sticky top-0 bg-app-bg dark:bg-gray-900 z-10 px-4 pt-6 pb-4">
                <button
                    onClick={onBack}
                    className="interactive flex items-center gap-2 text-black mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-black dark:text-white">
                        Pedido #{order.id.slice(0, 8)}
                    </h1>
                    <Badge variant={statusConfig.variant}>
                        <StatusIcon size={14} className="mr-1" />
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            <div className="px-4 space-y-4">
                {/* Service Info */}
                <Card className="p-6">
                    <p className="meta-bold text-black-green-dark uppercase tracking-[0.2em] mb-2">{order.service_category_snapshot || order.service?.category || 'Serviço'}</p>
                    <h2 className="text-xl font-bold text-black dark:text-white mb-4">
                        {order.service_title_snapshot || order.service?.title || 'Detalhes do Serviço'}
                    </h2>
                    <div className="flex items-baseline gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-3xl font-bold text-black dark:text-white">
                            R$ {order.total_amount?.toFixed(2)}
                        </span>
                        <span className="meta text-black">Total do pedido</span>
                    </div>
                </Card>

                {/* Counterpart Info */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                        <User size={18} className="text-black-green" />
                        {order.provider?.name ? 'Profissional' : 'Cliente'}
                    </h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border">
                                <img src={counterpartAvatar} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="font-bold text-black dark:text-white">
                                    {order.provider?.name ? providerName : clientName}
                                </p>
                                <p className="text-sm text-black">
                                    ⭐ 5.0 • Talent Connect
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => window.open(`https://wa.me/55${(order.provider?.phone || order.client?.phone || '').replace(/\D/g, '')}?text=Olá,%20estou%20entrando%20em%20contato%20sobre%20o%20pedido%20${order.id.slice(0, 8)}`, '_blank')}
                                className="w-12 h-12 rounded-2xl bg-primary-green text-black flex items-center justify-center interactive shadow-lg"
                            >
                                <MessageCircle size={20} />
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Scheduling Details */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black dark:text-white mb-4">Agendamento</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Calendar size={18} className="text-black-green mt-0.5" />
                            <div>
                                <p className="text-xs text-black dark:text-black uppercase font-bold tracking-widest">Data</p>
                                <p className="font-semibold text-black dark:text-white capitalize">
                                    {formatDate(order.scheduled_at)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Clock size={18} className="text-black-green mt-0.5" />
                            <div>
                                <p className="text-xs text-black uppercase font-bold tracking-widest">Horário</p>
                                <p className="font-semibold text-black dark:text-white">
                                    {formatTime(order.scheduled_at)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-black-green mt-0.5" />
                            <div>
                                <p className="text-xs text-black uppercase font-bold tracking-widest">Local</p>
                                <p className="font-semibold text-black dark:text-white">
                                    {order.location_text || 'Endereço não informado'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Timeline */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black dark:text-white mb-6">Status do Pedido</h3>
                    <div className="space-y-6">
                        {timeline.map((step, index) => (
                            <div key={index} className="relative pb-8 last:pb-0">
                                <div className="flex gap-4 relative z-10">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${step.completed
                                            ? 'bg-primary-green border-primary-green text-black'
                                            : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-black'
                                            }`}>
                                            {step.completed ? <CheckCircle size={14} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex justify-between items-start">
                                            <p className={`font-bold ${step.completed
                                                ? 'text-black'
                                                : 'text-black'
                                                }`}>
                                                {step.label}
                                            </p>
                                            {step.date && (
                                                <p className="text-[10px] text-black mt-1 uppercase tracking-widest">
                                                    {step.date}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Connecting Line & Sub-status */}
                                {index < timeline.length - 1 && (
                                    <div className="absolute top-8 left-4 bottom-0 w-px -ml-px bg-neutral-200 dark:bg-neutral-800">
                                        {step.completed && (
                                            <div className="absolute top-0 bottom-0 left-0 right-0 bg-primary-green" />
                                        )}
                                        {step.description && (
                                            <div className="absolute top-1/2 -translate-y-1/2 left-0 flex items-center pl-6 w-[200px]">
                                                {/* Dot on the line */}
                                                <div className={`absolute left-[-4px] w-2 h-2 rounded-full border-2 ${step.completed ? 'bg-primary-green border-white dark:border-black' : 'bg-neutral-300 border-white dark:border-black'}`} />

                                                {/* Description Text */}
                                                <p className="text-xs text-black whitespace-nowrap">
                                                    {step.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Actions */}
                <div className="pt-4 space-y-3">
                    {order.status === 'accepted' && onPay && (
                        <Button variant="primary" onClick={() => onPay(order)} className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none">
                            Pagar Agora e Confirmar
                        </Button>
                    )}
                    {order.status === 'awaiting_start_confirmation' && (
                        <Button
                            variant="primary"
                            onClick={async () => {
                                const { confirmExecutionStart } = await import('../services/ordersService');
                                try {
                                    await confirmExecutionStart(order.id);
                                    if (onBack) onBack(); // Refresh or rely on subscription
                                    alert("Início confirmado!");
                                } catch (e) {
                                    alert("Erro ao confirmar: " + e);
                                }
                            }}
                            className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none"
                        >
                            Confirmar Que o Profissional Começou
                        </Button>
                    )}
                    {order.status === 'awaiting_finish_confirmation' && onConfirmCompletion && (
                        <div className="space-y-3">
                            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                                <p className="text-xs text-black uppercase tracking-widest font-bold mb-1">Registro de Finalização</p>
                                <p className="text-sm text-black dark:text-gray-300">
                                    O prestador marcou como concluído em: <br />
                                    <span className="font-mono font-bold text-black">{new Date(order.updated_at).toLocaleString('pt-BR')}</span>
                                </p>
                            </div>
                            <Button
                                variant="primary"
                                onClick={onConfirmCompletion}
                                className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none"
                            >
                                Confirmar Conclusão
                            </Button>
                        </div>
                    )}
                    <Button variant="secondary" onClick={onSupport} className="w-full !rounded-[20px] !py-5">
                        Preciso de Ajuda
                    </Button>

                    {['sent', 'accepted', 'awaiting_payment'].includes(order.status) && (
                        <button
                            onClick={async () => {
                                if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
                                    const { cancelOrder } = await import('../services/ordersService');
                                    try {
                                        await cancelOrder(order.id);
                                        if (onBack) onBack();
                                        alert('Pedido cancelado com sucesso.');
                                    } catch (e) {
                                        alert('Erro ao cancelar: ' + e);
                                    }
                                }
                            }}
                            className="w-full py-4 text-feedback-error label-semibold uppercase tracking-widest flex items-center justify-center gap-2  rounded-[20px] transition-colors"
                        >
                            <XCircle size={18} />
                            Cancelar Pedido
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;

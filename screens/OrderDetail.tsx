import React, { useState, useEffect } from 'react';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { ArrowLeft, Calendar, Clock, MapPin, User, CheckCircle2, CreditCard, MessageCircle, Phone, CheckCircle, XCircle, AlertCircle, ClipboardList, Sparkles, ShieldCheck, LifeBuoy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { subscribeToOrderUpdates } from '../services/ordersService';
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon';

// --- Shared Components (Copied from Tracking.tsx for consistency) ---
const ProgressStep = ({ title, desc, icon, active, completed, pulse, last, variant = 'success' }: any) => {
    let bgClass = active ? 'bg-accent-primary' : 'bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800';
    let iconColorClass = active ? 'text-white' : 'text-black';
    let titleColorClass = active ? 'text-black dark:text-white' : 'text-neutral-500 dark:text-neutral-500';

    if (active || completed) {
        if (variant === 'warning') {
            bgClass = 'bg-warning text-black';
            iconColorClass = 'text-black';
            titleColorClass = 'text-orange-700 dark:text-warning';
        }
        else if (variant === 'info') {
            bgClass = 'bg-info text-white';
            iconColorClass = 'text-white';
            titleColorClass = 'text-info';
        }
        else if (variant === 'success') {
            bgClass = 'bg-success text-white';
            iconColorClass = 'text-white';
            titleColorClass = 'text-success';
        }
    }

    return (
        <div className={`flex gap-8 ${last ? '' : 'min-h-[90px]'}`}>
            <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center z-10 transition-all duration-500 shadow-sm ${bgClass} ${iconColorClass} ${pulse ? 'animate-pulse scale-105 shadow-glow' : ''}`}>
                    {icon}
                </div>
                <div className={`w-0.5 h-full ${active && completed ? (variant === 'info' ? 'bg-info' : variant === 'warning' ? 'bg-warning' : 'bg-success') : 'bg-neutral-100 dark:bg-neutral-800'}`}></div>
            </div>
            <div className="pt-2 flex-1">
                <p className={`body-bold transition-colors ${titleColorClass}`}>{title}</p>
                {desc && <p className={`text-[10px] font-normal mt-1 leading-relaxed ${active ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-600'}`}>{desc}</p>}
            </div>
        </div>
    );
};

const IntermediateStep = ({ label, active, completed, variant = 'warning' }: any) => {
    let dotColor = active ? 'bg-accent-secondary' : 'bg-neutral-200 dark:bg-neutral-800';

    // Define text color logic
    let textColorClass = 'text-neutral-400 dark:text-neutral-600'; // Default inactive text (readable gray)

    if (completed) {
        if (variant === 'warning') dotColor = 'bg-[#FF9800]';
        else if (variant === 'info') dotColor = 'bg-info';
        else dotColor = 'bg-success';

        textColorClass = 'text-neutral-500 dark:text-neutral-400'; // Completed text (slightly darker gray)
    } else if (active) {
        if (variant === 'warning') {
            dotColor = 'bg-[#FF9800]';
            textColorClass = 'text-orange-600 dark:text-orange-400 font-medium'; // Readable orange
        } else if (variant === 'info') {
            dotColor = 'bg-info';
            textColorClass = 'text-info font-medium';
        }
    }

    return (
        <div className="flex gap-8 min-h-[40px] -mt-2 -mb-2 relative z-0">
            <div className="flex flex-col items-center w-12">
                {/* Line traverses through */}
                <div className={`w-0.5 h-full absolute top-0 bottom-0 ${completed ? (variant === 'info' ? 'bg-info' : variant === 'warning' ? 'bg-[#FF9800]' : 'bg-success') : 'bg-neutral-100 dark:bg-neutral-800'}`}></div>

                {/* Small Dot */}
                <div className={`w-3 h-3 rounded-full z-10 my-auto flex items-center justify-center transition-all ${dotColor} ${active ? 'animate-pulse ring-4 ring-opacity-20 ' + (variant === 'warning' ? 'ring-[#FF9800]' : 'ring-info') : 'border-2 border-app-bg'}`}>
                </div>
            </div>
            <div className="py-3 flex-1">
                <p
                    className={`text-[11px] font-light tracking-[0px] transition-colors ${textColorClass}`}
                >
                    {label}
                </p>
            </div>
        </div>
    );
};

interface OrderDetailProps {
    order: any;
    onBack: () => void;
    onContact: () => void;
    onSupport: () => void;
    onRate?: () => void;
    onConfirmCompletion?: () => void;
    onPay?: (order: any) => void;
    onConfirmStart?: () => void;
    viewingAs?: 'client' | 'provider'; // Added
    onViewProfile?: (user: any) => void; // Added
}

const OrderDetail: React.FC<OrderDetailProps> = ({
    order: initialOrder,
    onBack,
    onContact,
    onSupport,
    onRate,
    onConfirmCompletion,
    onPay,
    viewingAs = 'client', // Default to client view
    onViewProfile
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
            case 'completed': return { label: 'Concluído', variant: 'success' as const, icon: CheckCircle };
            case 'awaiting_start_confirmation': return { label: 'Confirmar Início', variant: 'warning' as const, icon: AlertCircle };
            case 'awaiting_finish_confirmation': return { label: 'Confirmar Conclusão', variant: 'warning' as const, icon: CheckCircle };
            case 'in_execution': return { label: 'Em Execução', variant: 'success' as const, icon: Clock };
            case 'sent': return { label: 'Aguardando Resposta', variant: 'secondary' as const, icon: AlertCircle };
            case 'accepted': return { label: 'Aguardando Pagamento', variant: 'warning' as const, icon: Clock };
            case 'rejected': case 'cancelled': return { label: 'Cancelado', variant: 'error' as const, icon: XCircle };
            default: return { label: 'Em Andamento', variant: 'warning' as const, icon: Clock };
        }
    };

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Data não definida';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '--:--';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'sent': return 1;
            case 'accepted': return 2;
            case 'paid_escrow_held': return 3;
            case 'awaiting_start_confirmation': return 4;
            case 'in_execution': case 'awaiting_finish_confirmation': return 5;
            case 'completed': return 6;
            default: return 1;
        }
    };

    const currentStep = getStatusStep(order.status);

    // Determine Counterpart based on viewingAs
    const isProviderView = viewingAs === 'provider';
    // If I am provider, counterpart is client. If I am client, counterpart is provider.
    // Note: order.provider might be the object, order.client user object.
    const counterpartUser = isProviderView ? order.client : order.provider;
    const counterpartName = resolveUserName(counterpartUser);
    const counterpartAvatar = resolveUserAvatar(counterpartUser);
    const counterpartLabel = isProviderView ? 'Cliente' : 'Profissional';
    const counterpartPhone = counterpartUser?.phone || (isProviderView ? order.client?.phone : order.provider?.phone);

    return (
        <div className="screen-container pb-6 bg-app-bg transition-colors">
            {/* Header */}
            <div className="sticky top-0 bg-app-bg dark:bg-gray-900 z-50 px-4 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800 backdrop-blur-md bg-opacity-90">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="interactive flex items-center gap-2 text-black dark:text-white">
                        <ArrowLeft size={20} />
                        <span>Voltar</span>
                    </button>
                    <button onClick={onSupport} className="interactive text-black dark:text-white">
                        <LifeBuoy size={20} />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-black dark:text-white">Pedido #{order.id.slice(0, 8)}</h1>
                        <p className="text-xs text-neutral-500 mt-1 font-normal">Detalhes e rastreio</p>
                    </div>
                    <Badge variant={statusConfig.variant}>
                        <StatusIcon size={14} className="mr-1" />
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            <div className="px-4 space-y-6 mt-6">

                {/* Agendamento Card */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black dark:text-white mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">Agendamento</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-black">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-400 font-normal">Data</p>
                                <p className="font-semibold text-black dark:text-white capitalize">{formatDate(order.scheduled_at)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-black">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-400 font-normal">Horário</p>
                                <p className="font-semibold text-black dark:text-white">{formatTime(order.scheduled_at)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-black">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-400 font-normal">Local</p>
                                <p className="font-semibold text-black dark:text-white">{order.location_text || 'Endereço não informado'}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Service Info */}
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] text-neutral-400 font-normal mb-1">{order.service_category_snapshot || order.service?.category || 'Serviço'}</p>
                            <h2 className="text-lg font-bold text-black dark:text-white leading-tight">
                                {order.service_title_snapshot || order.service?.title || 'Detalhes do Serviço'}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-neutral-400 font-normal mb-1">Total</p>
                            <div className="flex items-center justify-end gap-1">
                                <span className="text-xs font-bold text-accent-secondary">R$</span>
                                <span className="text-2xl font-black text-black dark:text-white leading-none">
                                    {order.total_amount?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>


                {/* Timeline / Status Tracking */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black dark:text-white mb-6">Status do Pedido</h3>

                    <div className="space-y-0 relative">
                        <ProgressStep
                            title="Pedido Enviado"
                            desc="Aguardando confirmação do Profissional"
                            icon={<ClipboardList size={18} />}
                            active={currentStep >= 1}
                            completed={currentStep > 1}
                            variant="success"
                        />

                        <IntermediateStep
                            label="Aguardando profissional aceitar no app"
                            active={currentStep === 1}
                            completed={currentStep > 1}
                            variant="warning"
                        />

                        <ProgressStep
                            title="Confirmado"
                            desc="Profissional aceitou seu pedido"
                            icon={<CheckCircle2 size={18} />}
                            active={currentStep >= 2}
                            completed={currentStep > 2}
                            variant="success"
                        />

                        <IntermediateStep
                            label="Pagamento necessário para prosseguir"
                            active={currentStep === 2}
                            completed={currentStep > 2}
                            variant="warning"
                        />

                        <ProgressStep
                            title="Pagamento Realizado"
                            desc="Valor retido com segurança"
                            icon={<CreditCard size={18} />}
                            active={currentStep >= 3}
                            completed={currentStep > 3}
                            variant="success"
                        />

                        <IntermediateStep
                            label="Profissional deve iniciar o serviço"
                            active={currentStep === 3}
                            completed={currentStep > 3}
                            variant="warning"
                        />

                        <ProgressStep
                            title="Confirmação de Início"
                            desc={order.status === 'awaiting_start_confirmation' ? 'Confirme o início para liberar' : 'Início validado'}
                            icon={<AlertCircle size={18} />}
                            active={currentStep >= 4}
                            completed={currentStep > 4}
                            pulse={order.status === 'awaiting_start_confirmation'}
                            variant="info"
                        />

                        <IntermediateStep
                            label="Serviço em andamento"
                            active={currentStep === 4}
                            completed={currentStep > 4}
                            variant="info"
                        />

                        <ProgressStep
                            title="Em Execução"
                            desc="Serviço sendo realizado agora"
                            icon={<Sparkles size={18} />}
                            active={currentStep >= 5}
                            completed={currentStep > 5}
                            pulse={order.status === 'in_execution'}
                            variant="info"
                        />

                        <IntermediateStep
                            label="Profissional deve marcar como concluído"
                            active={currentStep === 5}
                            completed={currentStep > 5 || order.status === 'awaiting_finish_confirmation'}
                            variant="warning"
                        />

                        <ProgressStep
                            title="Conclusão"
                            desc={order.status === 'awaiting_finish_confirmation' ? 'Confirme a finalização' : 'Serviço finalizado'}
                            icon={<ShieldCheck size={18} />}
                            active={currentStep >= 6 || order.status === 'awaiting_finish_confirmation'}
                            completed={currentStep >= 6}
                            variant="success"
                            last
                        />
                    </div>
                </Card>

                {/* Counterpart / Contact */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                        <User size={18} className="text-black" />
                        {counterpartLabel}
                    </h3>
                    <div className="flex items-center justify-between">
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => onViewProfile && onViewProfile(counterpartUser)}
                        >
                            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border">
                                <img src={counterpartAvatar} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="font-bold text-black dark:text-white text-sm">
                                    {counterpartName}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Ver perfil completo
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => window.open(`https://wa.me/55${(counterpartPhone || '').replace(/\D/g, '')}?text=Olá,%20estou%20entrando%20em%20contato%20sobre%20o%20pedido%20${order.id.slice(0, 8)}`, '_blank')}
                                className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center interactive"
                            >
                                <WhatsAppIcon size={18} />
                            </button>
                            <button
                                className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center interactive"
                            >
                                <Phone size={18} />
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="pt-2 space-y-3 pb-8">
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
                                    if (onBack) onBack();
                                    alert("Início confirmado!");
                                } catch (e) {
                                    alert("Erro ao confirmar: " + e);
                                }
                            }}
                            className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none"
                        >
                            Confirmar Início
                        </Button>
                    )}
                    {order.status === 'awaiting_finish_confirmation' && onConfirmCompletion && (
                        <Button
                            variant="primary"
                            onClick={onConfirmCompletion}
                            className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none"
                        >
                            Confirmar Conclusão
                        </Button>
                    )}

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
                            className="w-full py-4 text-feedback-error text-xs font-normal flex items-center justify-center gap-2 rounded-[20px] transition-colors hover:bg-feedback-error/5"
                        >
                            <XCircle size={16} />
                            Cancelar Pedido
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;

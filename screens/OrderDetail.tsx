import React, { useState, useEffect } from 'react';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { ArrowLeft, Calendar, Clock, MapPin, User, CheckCircle2, CreditCard, MessageCircle, Phone, CheckCircle, XCircle, AlertCircle, ClipboardList, Sparkles, ShieldCheck, LifeBuoy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatNumber } from '../utils/format';
import { subscribeToOrderUpdates, getOrderById } from '../services/ordersService';
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
    onViewProfile?: (user: any) => void;
    onNegotiate?: (order: any) => void;
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
    onViewProfile,
    onNegotiate
}) => {
    const [order, setOrder] = useState(initialOrder);
    const [dispute, setDispute] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAccept = async () => {
        if (!order?.id) return;
        setIsProcessing(true);
        try {
            const { acceptOrder } = await import('../services/ordersService');
            await acceptOrder(order.id);
            alert("Pedido aceito com sucesso!");
        } catch (e) {
            alert("Erro ao aceitar: " + e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNegotiate = () => {
        if (onNegotiate && order) {
            onNegotiate(order);
        }
    };

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const scheduledDate = order?.scheduled_at ? new Date(order.scheduled_at) : null;
    const isScheduledValid = !!(scheduledDate && !isNaN(scheduledDate.getTime()));
    const canStart = !isScheduledValid || (now.getTime() >= scheduledDate!.getTime() - 10 * 60000);

    const getCountdown = () => {
        if (!scheduledDate || canStart) return null;
        const target = scheduledDate.getTime() - 10 * 60000;
        const diff = target - now.getTime();

        if (diff <= 0) return null;

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0 || d > 0) parts.push(`${h.toString().padStart(2, '0')}h`);
        parts.push(`${m.toString().padStart(2, '0')}m`);
        parts.push(`${s.toString().padStart(2, '0')}s`);

        return parts.join(' ');
    };

    const getStartLimitMessage = () => {
        if (!scheduledDate) return "";
        const h = scheduledDate.getHours();
        const m = scheduledDate.getMinutes();
        const period = h < 12 ? 'manhã' : h < 18 ? 'tarde' : 'noite';
        const hoursStr = h.toString().padStart(2, '0');
        const minsStr = m.toString().padStart(2, '0');
        const day = scheduledDate.getDate().toString().padStart(2, '0');
        const month = (scheduledDate.getMonth() + 1).toString().padStart(2, '0');
        return `O início será liberado em ${day}/${month} às ${hoursStr}:${minsStr} (${period}). Regra de segurança: liberação permitida apenas 10 min antes do agendamento.`;
    };

    const handleReject = async () => {
        if (!order?.id) return;
        if (!window.confirm('Tem certeza que deseja recusar este pedido?')) return;

        setIsProcessing(true);
        try {
            const { rejectOrder } = await import('../services/ordersService');
            await rejectOrder(order.id);
            alert("Pedido recusado.");
            onBack();
        } catch (e) {
            alert("Erro ao recusar: " + e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMarkStart = async () => {
        if (!order?.id) return;
        setIsProcessing(true);
        try {
            const { markExecutionStart } = await import('../services/ordersService');
            await markExecutionStart(order.id);
            alert("Início sinalizado! Aguardando confirmação do cliente.");
        } catch (e) {
            alert("Erro ao marcar início: " + e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMarkFinish = async () => {
        if (!order?.id) return;
        setIsProcessing(true);
        try {
            const { markExecutionFinish } = await import('../services/ordersService');
            await markExecutionFinish(order.id);
            alert("Conclusão sinalizada! Aguardando confirmação do cliente.");
        } catch (e) {
            alert("Erro ao marcar conclusão: " + e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!order?.id) return;
        if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
            setIsProcessing(true);
            try {
                const { cancelOrder } = await import('../services/ordersService');
                await cancelOrder(order.id);
                alert('Pedido cancelado com sucesso.');
                onBack();
            } catch (e) {
                alert('Erro ao cancelar: ' + e);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    useEffect(() => {
        setOrder(initialOrder);
        if (!initialOrder?.id) return;

        let disputeSub: any = null;

        const setupDisputeSubscription = async (disputeId: string) => {
            const { subscribeToDisputeUpdates } = await import('../services/disputesService');
            disputeSub = subscribeToDisputeUpdates(disputeId, (updatedDispute) => {
                setDispute(updatedDispute);
            });
        };

        // Buscar disputa se estiver em status de disputa
        if (initialOrder.status === 'disputed') {
            const fetchDisputeData = async () => {
                try {
                    const { getDisputeByOrderId } = await import('../services/disputesService');
                    const data = await getDisputeByOrderId(initialOrder.id);
                    setDispute(data);
                    if (data?.id) setupDisputeSubscription(data.id);
                } catch (err) {
                    console.error("Erro ao buscar detalhes da disputa:", err);
                }
            };
            fetchDisputeData();
        }

        const subscription = subscribeToOrderUpdates(initialOrder.id, async (updatedRaw) => {
            try {
                // Re-fetch full order to get joined data (provider, service, execution, etc)
                const updatedOrder = await getOrderById(initialOrder.id);
                setOrder(updatedOrder);

                // Se o status mudou para disputed durante a visualização
                if (updatedOrder.status === 'disputed' && !dispute) {
                    const { getDisputeByOrderId } = await import('../services/disputesService');
                    const data = await getDisputeByOrderId(updatedOrder.id);
                    setDispute(data);
                    if (data?.id) setupDisputeSubscription(data.id);
                }
            } catch (error) {
                console.error("Erro ao atualizar detalhes do pedido:", error);
            }
        });

        return () => {
            subscription.unsubscribe();
            if (disputeSub) disputeSub.unsubscribe();
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
            case 'awaiting_details': return { label: 'Nova Proposta', variant: 'warning' as const, icon: Clock };
            case 'accepted': case 'awaiting_payment': return { label: 'Aguardando Pagamento', variant: 'warning' as const, icon: Clock };
            case 'paid_escrow_held': return { label: 'Pagamento Confirmado', variant: 'success' as const, icon: CheckCircle2 };
            case 'disputed': return { label: 'Em Disputa', variant: 'error' as const, icon: ShieldCheck };
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
            case 'sent': case 'awaiting_details': return 1;
            case 'accepted': return 2;
            case 'paid_escrow_held': return 3;
            case 'awaiting_start_confirmation': return 4;
            case 'in_execution': case 'awaiting_finish_confirmation': return 5;
            case 'completed': return 6;
            case 'disputed': return -1; // Special value for dispute
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
                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.12em] mb-1 opacity-60">
                                {isProviderView ? 'Ganhos previstos' : 'Total à pagar'}
                            </p>
                            <div className="flex items-baseline justify-end gap-1.5">
                                <span className="text-[14px] font-bold text-text-secondary opacity-40">R$</span>
                                <span className="text-2xl font-bold text-black dark:text-white leading-none">
                                    {formatNumber(order.total_amount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>


                {/* Timeline / Status Tracking */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black dark:text-white mb-6">Status do Pedido</h3>

                    {order.status === 'disputed' && (
                        <div className={`mb-8 p-4 border rounded-2xl flex gap-3 animate-in fade-in slide-in-from-top-2 ${dispute?.status === 'in_review'
                            ? 'bg-feedback-info/5 border-feedback-info/20'
                            : 'bg-feedback-error/5 border-feedback-error/20'
                            }`}>
                            {dispute?.status === 'in_review' ? (
                                <Clock className="text-feedback-info shrink-0" size={20} />
                            ) : (
                                <ShieldCheck className="text-feedback-error shrink-0" size={20} />
                            )}
                            <div>
                                <p className={`text-xs font-bold mb-1 ${dispute?.status === 'in_review' ? 'text-feedback-info' : 'text-feedback-error'
                                    }`}>
                                    {dispute?.status === 'in_review' ? 'Mediação em Andamento' : 'Negociação Suspensa por Disputa'}
                                </p>
                                <p className="text-[10px] text-neutral-500 font-normal leading-relaxed">
                                    {dispute?.status === 'in_review'
                                        ? 'Um de nossos mediadores já está analisando o seu caso e tomará uma decisão em breve. Fique atento às notificações.'
                                        : 'Uma disputa foi aberta para este pedido. Nossa equipe de mediação analisará os detalhes para resolver o caso da forma mais justa.'}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className={`space-y-0 relative ${order.status === 'disputed' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                        <ProgressStep
                            title="Pedido Enviado"
                            desc={isProviderView ? "Você recebeu uma nova solicitação" : "Aguardando confirmação do Profissional"}
                            icon={<ClipboardList size={18} />}
                            active={currentStep >= 1}
                            completed={currentStep > 1}
                            variant="success"
                        />

                        <IntermediateStep
                            label={isProviderView ? "Responda o quanto antes para garantir o serviço" : "Aguardando profissional aceitar no app"}
                            active={currentStep === 1}
                            completed={currentStep > 1}
                            variant="warning"
                        />

                        <ProgressStep
                            title="Confirmado"
                            desc={isProviderView ? "Você aceitou este pedido" : "Profissional aceitou seu pedido"}
                            icon={<CheckCircle2 size={18} />}
                            active={currentStep >= 2}
                            completed={currentStep > 2}
                            variant="success"
                        />

                        <IntermediateStep
                            label={isProviderView ? "Aguardando pagamento do cliente" : "Pagamento necessário para prosseguir"}
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
                            label={isProviderView
                                ? (currentStep > 3 ? "Serviço iniciado" : (canStart ? "Você já pode iniciar o serviço" : getStartLimitMessage()))
                                : (currentStep > 3 ? "Profissional sinalizou início" : "Profissional deve iniciar o serviço")}
                            active={currentStep === 3}
                            completed={currentStep > 3}
                            variant="warning"
                        />

                        <ProgressStep
                            title="Confirmação de Início"
                            desc={order.status === 'awaiting_start_confirmation' ? (isProviderView ? 'Aguardando confirmação do cliente' : 'Confirme o início para liberar') : 'Início validado'}
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
                            label={isProviderView ? "Marque como concluído ao terminar" : "Profissional deve marcar como concluído"}
                            active={currentStep === 5}
                            completed={currentStep > 5 || order.status === 'awaiting_finish_confirmation'}
                            variant="warning"
                        />

                        <ProgressStep
                            title="Conclusão"
                            desc={order.status === 'awaiting_finish_confirmation' ? (isProviderView ? 'Aguardando confirmação do cliente' : 'Confirme a finalização') : 'Serviço finalizado'}
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
                    {/* CLIENT ACTIONS */}
                    {!isProviderView && (
                        <>
                            {order.status === 'awaiting_details' && (
                                <Button
                                    variant="primary"
                                    onClick={async () => {
                                        if (window.confirm(`Você aceita a nova proposta de R$ ${order.total_amount}?`)) {
                                            setIsProcessing(true);
                                            try {
                                                const { updateOrderDetails } = await import('../services/ordersService');
                                                // If they accept, we transition to awaiting_payment
                                                // We can reuse current details or prompt for more
                                                await updateOrderDetails(order.id, {
                                                    scheduled_at: order.scheduled_at,
                                                    location_text: order.location_text
                                                });
                                                alert("Proposta aceita! Prossiga para o pagamento.");
                                            } catch (e) {
                                                alert("Erro ao confirmar: " + e);
                                            } finally {
                                                setIsProcessing(false);
                                            }
                                        }
                                    }}
                                    disabled={isProcessing}
                                    className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none"
                                >
                                    {isProcessing ? 'Processando...' : 'Aceitar Nova Proposta'}
                                </Button>
                            )}
                            {['accepted', 'awaiting_payment'].includes(order.status) && onPay && (
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
                                            alert("Início confirmado!");
                                        } catch (e) {
                                            alert("Erro ao confirmar: " + e);
                                        }
                                    }}
                                    className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none"
                                >
                                    Confirmar Presença / Início
                                </Button>
                            )}
                            {order.status === 'awaiting_finish_confirmation' && (
                                <Button
                                    variant="primary"
                                    onClick={async () => {
                                        setIsProcessing(true);
                                        try {
                                            const { confirmExecutionFinish } = await import('../services/ordersService');
                                            await confirmExecutionFinish(order.id);
                                            alert("Conclusão confirmada! O pagamento será liberado para o profissional.");
                                            if (onRate) onRate();
                                        } catch (e) {
                                            alert("Erro ao confirmar conclusão: " + e);
                                        } finally {
                                            setIsProcessing(false);
                                        }
                                    }}
                                    disabled={isProcessing}
                                    className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none"
                                >
                                    {isProcessing ? 'Processando...' : 'Confirmar Conclusão do Serviço'}
                                </Button>
                            )}
                        </>
                    )}

                    {/* PROVIDER ACTIONS */}
                    {isProviderView && (
                        <>
                            {order.status === 'sent' && (
                                <div className="space-y-3">
                                    <Button
                                        variant="primary"
                                        onClick={handleAccept}
                                        disabled={isProcessing}
                                        className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none mb-2"
                                    >
                                        {isProcessing ? 'Processando...' : 'Aceitar Pedido'}
                                    </Button>

                                    <button
                                        onClick={handleNegotiate}
                                        className="w-full py-4 border-2 border-neutral-100 dark:border-neutral-800 rounded-[20px] label-semibold uppercase tracking-widest text-black dark:text-white transition-all active:bg-neutral-50"
                                    >
                                        Negociar Valor
                                    </button>

                                    <button
                                        onClick={handleReject}
                                        disabled={isProcessing}
                                        className="w-full py-4 text-feedback-error text-xs font-normal flex items-center justify-center gap-2 rounded-[20px] transition-colors hover:bg-feedback-error/5"
                                    >
                                        <XCircle size={16} />
                                        Recusar Pedido
                                    </button>
                                </div>
                            )}

                            {order.status === 'paid_escrow_held' && (
                                <div className="space-y-4">
                                    {!canStart && (
                                        <div className="flex flex-col items-center justify-center p-2">
                                            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-2">Liberação em</p>

                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-neutral-400" />
                                                <div className="flex gap-1 items-center">
                                                    {(() => {
                                                        const target = scheduledDate!.getTime() - 10 * 60000;
                                                        const diff = target - now.getTime();
                                                        if (diff <= 0) return null;

                                                        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                        const s = Math.floor((diff % (1000 * 60)) / 1000);

                                                        const parts = [];
                                                        if (d > 0) parts.push(`${d}d`);
                                                        if (h > 0 || d > 0) parts.push(`${h.toString().padStart(2, '0')}h`);
                                                        parts.push(`${m.toString().padStart(2, '0')}m`);
                                                        parts.push(`${s.toString().padStart(2, '0')}s`);

                                                        return (
                                                            <span className="text-xl font-bold text-text-primary tabular-nums tracking-tight">
                                                                {parts.join(' ')}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        variant="primary"
                                        onClick={handleMarkStart}
                                        disabled={isProcessing || !canStart}
                                        className={`w-full !rounded-[20px] !py-5 shadow-xl ${!canStart ? 'opacity-50 grayscale cursor-not-allowed border-none' : 'shadow-primary-green/20 !bg-primary-green !text-black border-none'}`}
                                    >
                                        {isProcessing ? 'Processando...' : 'Iniciar Serviço'}
                                    </Button>
                                </div>
                            )}

                            {order.status === 'in_execution' && (
                                <Button
                                    variant="primary"
                                    onClick={handleMarkFinish}
                                    disabled={isProcessing}
                                    className="w-full !rounded-[20px] !py-5 shadow-xl shadow-primary-green/20 !bg-primary-green !text-black border-none"
                                >
                                    {isProcessing ? 'Processando...' : 'Finalizar Serviço'}
                                </Button>
                            )}
                        </>
                    )}

                    {/* SHARED ACTIONS */}
                    {order.status === 'disputed' && (
                        <div className="w-full py-6 px-4 bg-neutral-50 dark:bg-neutral-900 rounded-[20px] border border-neutral-100 dark:border-neutral-800 text-center">
                            {dispute?.status === 'in_review' ? (
                                <Clock className="mx-auto text-feedback-info mb-2" size={24} />
                            ) : (
                                <ShieldCheck className="mx-auto text-feedback-error mb-2" size={24} />
                            )}
                            <p className="text-sm font-bold text-black dark:text-white">
                                {dispute?.status === 'in_review' ? 'Mediação em Andamento' : 'Aguardando Mediação'}
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-1 px-4">
                                {dispute?.status === 'in_review'
                                    ? 'A equipe de suporte está revisando os detalhes e logs para uma decisão justa.'
                                    : 'Você será notificado assim que houver uma atualização sobre a resolução deste caso.'}
                            </p>
                        </div>
                    )}

                    {['accepted', 'awaiting_details', 'awaiting_payment', 'paid_escrow_held', 'awaiting_start_confirmation', 'in_execution', 'awaiting_finish_confirmation', 'completed'].includes(order.status) && (
                        <button
                            onClick={() => onSupport()}
                            className="w-full py-4 text-app-muted text-xs font-normal flex items-center justify-center gap-2 rounded-[20px] transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            <AlertCircle size={16} />
                            Relatar Problema / Abrir Disputa
                        </button>
                    )}

                    {/* Cancel button - refined logic */}
                    {!isProviderView && ['sent', 'accepted', 'awaiting_payment'].includes(order.status) && (
                        <button
                            onClick={handleCancelOrder}
                            disabled={isProcessing}
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

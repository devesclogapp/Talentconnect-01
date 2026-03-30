import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Square, CheckCircle, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { markExecutionStart, markExecutionFinish, subscribeToOrderUpdates } from '../services/ordersService';
import { resolveUserName } from '../utils/userUtils';

import { Order } from '../types';

interface ServiceExecutionProps {
    order: Order;
    onBack: () => void;
    onComplete: () => void;
}

type ExecutionStatus = 'waiting_for_payment' | 'ready_to_start' | 'waiting_for_confirmation' | 'in_progress' | 'ready_to_finish' | 'completed';

const ServiceExecution: React.FC<ServiceExecutionProps> = ({ order, onBack, onComplete }) => {
    const [status, setStatus] = useState<ExecutionStatus>(
        order?.status === 'accepted' ? 'waiting_for_payment' :
            order?.status === 'paid_escrow_held' ? 'ready_to_start' :
                order?.status === 'in_execution' ? 'in_progress' :
                    order?.status === 'awaiting_start_confirmation' ? 'waiting_for_confirmation' :
                        order?.status === 'awaiting_finish_confirmation' ? 'ready_to_finish' :
                            'ready_to_start'
    );
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
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

    // Helper to extract execution data safely
    const getExecutionData = (ord: Order | null) => {
        if (!ord?.execution) return null;
        return Array.isArray(ord.execution) ? ord.execution[0] : ord.execution;
    };

    // Initialize start time from database if order is already in execution
    useEffect(() => {
        const executionData = getExecutionData(order);
        if (order?.status === 'in_execution' && executionData) {
            if (executionData?.started_at) {
                setStartTime(new Date(executionData.started_at));
            }
        }
    }, [order]);

    // Timer logic - starts when status is 'in_progress' and we have a start time
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (status === 'in_progress' && startTime) {
            // Calculate initial elapsed time
            const now = new Date();
            const initialDiff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            setElapsedTime(initialDiff);

            // Update every second
            interval = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                setElapsedTime(diff);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status, startTime]);

    // Subscription for real-time updates
    useEffect(() => {
        if (!order) return;
        const sub = subscribeToOrderUpdates(order.id, async (updatedOrder: Order) => {
            // Handle Payment -> Ready to Start
            if (updatedOrder.status === 'paid_escrow_held' && status === 'waiting_for_payment') {
                setStatus('ready_to_start');
            }

            // Handle Client Start Confirmation
            if (updatedOrder.status === 'in_execution' && status === 'waiting_for_confirmation') {
                setStatus('in_progress');
                // Fetch the execution data to get the start time
                const { getOrderById } = await import('../services/ordersService');
                const fullOrder = await getOrderById(order.id);
                const executionData = getExecutionData(fullOrder);
                if (executionData?.started_at) {
                    setStartTime(new Date(executionData.started_at));
                }
            }
        });
        return () => { sub.unsubscribe(); };
    }, [order, status]);

    const formatElapsedTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartService = async () => {
        if (!order) return;
        if (!canStart) {
            alert(getStartLimitMessage());
            return;
        }
        setIsProcessing(true);
        try {
            await markExecutionStart(order.id);
            setStartTime(new Date());
            setStatus('waiting_for_confirmation'); // Wait for client
        } catch (e) {
            alert("Erro ao iniciar serviço: " + e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRequestFinish = () => {
        // Stop the timer by transitioning to ready_to_finish
        setStatus('ready_to_finish');
    };

    const handleFinishService = async () => {
        if (!order) return;
        setIsProcessing(true);
        try {
            await markExecutionFinish(order.id);
            setStatus('completed');
            setTimeout(() => {
                onComplete();
            }, 2500);
        } catch (e) {
            alert("Erro ao finalizar serviço: " + e);
        } finally {
            setIsProcessing(false);
        }
    };

    const isHourlyService = order?.pricing_mode === 'hourly';
    const clientName = resolveUserName(order?.client);

    if (status === 'completed') {
        return (
            <div className="screen-container bg-app-bg min-h-screen flex items-center justify-center">
                <div className="max-w-md mx-auto px-8 py-12 text-center bg-white dark:bg-neutral-900 rounded-[40px] shadow-xl border border-neutral-100 dark:border-neutral-800 animate-fade-in">
                    <div className="w-24 h-24 rounded-[32px] bg-primary-green/20 flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <CheckCircle size={48} className="text-black-green-dark" />
                    </div>

                    <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
                        Trabalho Enviado!
                    </h1>

                    <p className="text-black mb-8 leading-relaxed">
                        Solicitação de finalização enviada para <b>{clientName}</b>. O pagamento será liberado assim que o cliente confirmar.
                    </p>

                    <div className="flex items-center justify-center gap-3 text-black meta-bold tracking-widest text-[10px]">
                        <div className="w-2 h-2 rounded-full bg-primary-green animate-pulse"></div>
                        Redirecionando para o Dashboard
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="screen-container pb-6 bg-app-bg min-h-screen">
            <header className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10 px-4 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-900">
                <button
                    onClick={onBack}
                    className="interactive flex items-center gap-2 text-black mb-4"
                >
                    <ArrowLeft size={20} />
                    <span className="meta-bold tracking-widest text-[10px]">Painel de Controle</span>
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white">
                            Status do Serviço
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="meta-bold text-black tracking-widest !text-[9px]">ID: #{order?.id.slice(0, 8)}</p>
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>
                    <Badge variant={status === 'in_progress' ? 'success' : 'secondary'}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'in_progress' ? 'bg-white animate-pulse' : 'bg-neutral-400'}`}></div>
                        {status === 'in_progress' ? 'AO VIVO' : status === 'waiting_for_confirmation' ? 'AGUARDANDO' : 'DETALHES'}
                    </Badge>
                </div>
            </header>

            <div className="px-4 py-8 space-y-6">
                {/* Visual Timeline for Provider */}
                <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                    <h3 className="meta-bold text-black dark:text-white tracking-widest mb-6">Linha do Tempo</h3>
                    <div className="space-y-0 relative pl-2">
                        {(() => {
                            // Determine current step index based on strict order status
                            const getStepIndex = (s: string) => {
                                switch (s) {
                                    case 'draft': return 0;
                                    case 'sent': return 1;
                                    case 'awaiting_details': return 1;
                                    case 'rejected': return 1; // Special case
                                    case 'accepted': return 2; // Provider accepted, waiting payment
                                    case 'waiting_for_payment': return 2;
                                    case 'paid_escrow_held': return 3; // Paid, ready to start
                                    case 'awaiting_start_confirmation': return 4;
                                    case 'in_execution': return 4;
                                    case 'awaiting_finish_confirmation': return 5;
                                    case 'completed': return 6;
                                    default: return 0;
                                }
                            };

                            const currentStep = getStepIndex(order?.status || 'sent');
                            const isCancelled = order?.status === 'cancelled' || order?.status === 'rejected';

                            return (
                                <>
                                    {/* 1. Pedido Recebido */}
                                    <ProgressStep
                                        title="Pedido Recebido"
                                        desc="Cliente enviou a solicitação"
                                        icon={<User size={18} />}
                                        active={currentStep >= 1}
                                        completed={currentStep > 1}
                                        variant="success"
                                    />

                                    {/* Link: Aceite */}
                                    <IntermediateStep
                                        label={currentStep > 1 ? "Você revisou e aceitou" : "Aguardando seu aceite"}
                                        active={currentStep === 1}
                                        completed={currentStep > 1}
                                        variant={currentStep === 1 ? 'warning' : 'success'}
                                    />

                                    {/* 2. Aceite Confirmado */}
                                    <ProgressStep
                                        title={currentStep > 1 ? "Aceite Confirmado" : "Aguardando Aceite"}
                                        desc={currentStep > 1 ? "Você aceitou o pedido" : "Pendente de sua ação"}
                                        icon={currentStep > 1 ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                        active={currentStep >= 2}
                                        completed={currentStep > 2}
                                        variant={currentStep === 1 ? 'warning' : 'success'}
                                    />

                                    {/* Link: Pagamento */}
                                    <IntermediateStep
                                        label={currentStep > 2 ? "Pagamento realizado pelo cliente" : "Aguardando pagamento do cliente"}
                                        active={currentStep === 2}
                                        completed={currentStep > 2}
                                        variant={currentStep === 2 ? 'warning' : 'success'}
                                    />

                                    {/* 3. Pagamento Seguro */}
                                    <ProgressStep
                                        title="Pagamento Seguro"
                                        desc={currentStep > 2 ? "Valor retido no sistema" : "Aguardando depósito"}
                                        icon={<CheckCircle size={18} />}
                                        active={currentStep >= 3}
                                        completed={currentStep > 3}
                                        variant={currentStep === 2 ? 'warning' : 'success'}
                                    />

                                    {/* Link: Início */}
                                    <IntermediateStep
                                        label={currentStep >= 4
                                            ? "Execução iniciada"
                                            : canStart
                                                ? "O início já está liberado! Aguardando você."
                                                : getStartLimitMessage()
                                        }
                                        active={currentStep === 3}
                                        completed={currentStep >= 4}
                                        variant={currentStep === 3 ? 'warning' : 'success'}
                                    />

                                    {/* 4. Execução */}
                                    <ProgressStep
                                        title="Execução"
                                        desc="Realização do serviço"
                                        icon={<Play size={18} />}
                                        active={currentStep >= 3}
                                        completed={currentStep >= 5}
                                        pulse={currentStep === 4}
                                        variant={currentStep === 3 ? 'warning' : (currentStep === 4 ? 'info' : 'success')}
                                    />

                                    {/* Link: Fim */}
                                    <IntermediateStep
                                        label={currentStep >= 5 ? "Aguardando conclusão" : (currentStep === 4 ? "Serviço em andamento..." : "Aguardando início")}
                                        active={currentStep === 4}
                                        completed={currentStep >= 6}
                                        variant={currentStep === 4 ? 'info' : 'warning'}
                                    />

                                    {/* 5. Conclusão */}
                                    <ProgressStep
                                        title="Conclusão"
                                        desc="Finalização e repasse"
                                        icon={<CheckCircle size={18} />}
                                        active={currentStep >= 5}
                                        completed={currentStep >= 6}
                                        variant="success"
                                        last
                                    />
                                </>
                            );
                        })()}
                    </div>
                </Card>
                {/* Timer Card */}
                {isHourlyService ? (
                    <Card className={`p-10 text-center rounded-[32px] border-none shadow-xl transition-all ${status === 'in_progress'
                        ? 'bg-primary-black text-white'
                        : 'bg-white dark:bg-neutral-900'
                        }`}>
                        <h3 className={`meta-bold tracking-widest opacity-60 mb-4 ${status === 'in_progress' ? 'text-white' : 'text-black'}`}>
                            Tempo de Trabalho
                        </h3>
                        <div className="text-6xl font-black mb-6 font-mono tracking-tighter">
                            {formatElapsedTime(elapsedTime)}
                        </div>
                        {status === 'in_progress' && (
                            <div className="flex items-center justify-center gap-2 text-xs meta-bold text-black-green tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-primary-green animate-ping" />
                                <span>Gravando tempo real</span>
                            </div>
                        )}
                    </Card>
                ) : (
                    <Card className="p-8 bg-primary-black text-white rounded-[32px] border-none shadow-xl flex items-center justify-between">
                        <div>
                            <p className="meta-bold text-white/50 tracking-widest mb-1">Preço Fixo</p>
                            <h3 className="text-2xl font-bold">R$ {order?.total_amount?.toFixed(2) || '0.00'}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary-green/20 flex items-center justify-center text-black-green">
                            <CheckCircle size={24} />
                        </div>
                    </Card>
                )}

                {/* Client & Service Info */}
                <Card className="p-8 rounded-[32px] border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <h3 className="meta-bold text-black tracking-widest mb-6">Informações do Cliente</h3>

                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                            {order?.client?.avatar_url ? (
                                <img src={order.client.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl meta-bold text-black">{clientName[0]}</span>
                            )}
                        </div>
                        <div>
                            <h4 className="body-bold text-xl">{clientName}</h4>
                            <p className="meta text-black">📍 {order?.location_text || 'Entereço não informado'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Clock size={16} className="text-black-green mt-0.5" />
                            <div>
                                <p className="meta-bold text-black tracking-widest !text-[9px]">Agendado</p>
                                <p className="font-semibold text-black dark:text-white">
                                    {new Date(order?.scheduled_at).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Instructions / Countdown */}
                {status === 'ready_to_start' && (
                    <div className="space-y-4">
                        {!canStart && (
                            <Card className="p-8 bg-black dark:bg-white text-white dark:text-black rounded-[32px] border-none shadow-2xl overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                    <Clock size={80} />
                                </div>
                                <p className="meta-bold opacity-60 tracking-[0.2em] mb-4 text-[9px]">LIBERAÇÃO EM</p>
                                <div className="flex items-baseline gap-1 mb-4 animate-in fade-in slide-in-from-bottom duration-500">
                                    <span className="text-4xl font-black font-mono tracking-tighter">{getCountdown()}</span>
                                </div>
                                <p className="text-[10px] font-bold opacity-80 leading-relaxed uppercase tracking-widest">
                                    {getStartLimitMessage()}
                                </p>

                                <div className="mt-6 flex items-center gap-2">
                                    <div className="h-1 flex-1 bg-white/20 dark:bg-black/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-green transition-all duration-1000"
                                            style={{
                                                width: `${Math.min(100, (1 - ((scheduledDate!.getTime() - 10 * 60000 - now.getTime()) / (24 * 60 * 60 * 1000))) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        )}

                        <div className="p-6 bg-primary-green/10 rounded-[24px] border border-primary-green/20 flex gap-4">
                            <AlertCircle size={24} className="text-black-green-dark shrink-0" />
                            <p className="body-small text-black-green-dark">
                                {canStart
                                    ? 'Ao clicar em iniciar, o cliente será notificado que você começou o trabalho.'
                                    : 'Aguarde o cronômetro para iniciar o serviço. Regra de segurança Talent Connect.'
                                }
                            </p>
                        </div>
                    </div>
                )}

                {status === 'in_progress' && (
                    <div className="p-6 bg-primary-green/10 rounded-[24px] border border-primary-green/20 flex gap-4">
                        <AlertCircle size={24} className="text-black-green-dark shrink-0" />
                        <p className="body-small text-black-green-dark">
                            Lembre-se de finalizar o serviço assim que terminar para liberar o pagamento.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 space-y-4">
                    {status === 'waiting_for_payment' && (
                        <div className="p-8 bg-neutral-100 dark:bg-neutral-800 rounded-[28px] border border-neutral-200 dark:border-neutral-700 text-center animate-pulse">
                            <Clock size={32} className="mx-auto mb-4 text-black opacity-30" />
                            <h3 className="text-xl font-bold mb-2">Aguardando Pagamento</h3>
                            <p className="text-sm text-black">
                                O pedido foi aceito. Você poderá iniciar o trabalho assim que <b>{clientName}</b> realizar o pagamento.
                            </p>
                        </div>
                    )}

                    {status === 'ready_to_start' && (
                        <button
                            onClick={handleStartService}
                            disabled={isProcessing || !canStart}
                            className={`w-full py-6 rounded-[24px] label-semibold tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all ${canStart
                                ? 'bg-primary-green text-black shadow-primary-green/20 active:scale-[0.98]'
                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 grayscale opacity-60 cursor-not-allowed shadow-none'
                                }`}
                        >
                            <Play size={20} fill="currentColor" />
                            {isProcessing ? 'Iniciando...' : canStart ? 'Iniciar Trabalho Agora' : 'Botão Bloqueado'}
                        </button>
                    )}

                    {status === 'waiting_for_confirmation' && (
                        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 rounded-[24px] border border-yellow-100 dark:border-yellow-800 text-center animate-pulse">
                            <h3 className="text-yellow-700 dark:text-yellow-400 font-bold mb-2">Aguardando Cliente</h3>
                            <p className="text-sm text-yellow-600 dark:text-yellow-500">
                                Solicitamos a confirmação do início para {clientName}. O cronômetro iniciará assim que ele aceitar.
                            </p>
                        </div>
                    )}

                    {status === 'in_progress' && (
                        <button
                            onClick={handleRequestFinish}
                            disabled={isProcessing}
                            className="w-full py-6 bg-feedback-error text-white rounded-[24px] label-semibold tracking-widest shadow-xl shadow-feedback-error/30 flex items-center justify-center gap-3 transition-all  active:scale-[0.98]"
                        >
                            <Square size={20} fill="currentColor" />
                            {isProcessing ? 'Processando...' : 'Finalizar Trabalho'}
                        </button>
                    )}

                    {status === 'ready_to_finish' && (
                        <div className="space-y-4 animate-slide-up">
                            <button
                                onClick={handleFinishService}
                                disabled={isProcessing}
                                className="w-full py-6 bg-primary-green text-black rounded-[24px] label-semibold tracking-widest shadow-xl flex items-center justify-center gap-3"
                            >
                                <CheckCircle size={20} />
                                {isProcessing ? 'Enviando...' : 'Confirmar Envio Final'}
                            </button>

                            <button
                                onClick={() => setStatus('in_progress')}
                                disabled={isProcessing}
                                className="w-full py-6 bg-neutral-100 dark:bg-neutral-800 text-black rounded-[24px] label-semibold tracking-widest"
                            >
                                Voltar ao Trabalho
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

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
                {desc && <p className={`text-[10px] font-bold tracking-wide mt-1 leading-relaxed ${active ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-600'}`}>{desc}</p>}
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

export default ServiceExecution;

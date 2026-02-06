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

                    <div className="flex items-center justify-center gap-3 text-black meta-bold uppercase tracking-widest text-[10px]">
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
                    <span className="meta-bold uppercase tracking-widest text-[10px]">Painel de Controle</span>
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white">
                            Em Execução
                        </h1>
                        <p className="meta-bold text-black uppercase tracking-widest !text-[9px] mt-1">ID: #{order?.id.slice(0, 8)}</p>
                    </div>
                    <Badge variant={status === 'in_progress' ? 'success' : 'secondary'}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'in_progress' ? 'bg-white animate-pulse' : 'bg-neutral-400'}`}></div>
                        {status === 'in_progress' ? 'AO VIVO' : status === 'waiting_for_confirmation' ? 'AGUARDANDO' : 'STANDBY'}
                    </Badge>
                </div>
            </header>

            <div className="px-4 py-8 space-y-6">
                {/* Timer Card */}
                {isHourlyService ? (
                    <Card className={`p-10 text-center rounded-[32px] border-none shadow-xl transition-all ${status === 'in_progress'
                        ? 'bg-primary-black text-white'
                        : 'bg-white dark:bg-neutral-900'
                        }`}>
                        <h3 className={`meta-bold uppercase tracking-widest opacity-60 mb-4 ${status === 'in_progress' ? 'text-white' : 'text-black'}`}>
                            Tempo de Trabalho
                        </h3>
                        <div className="text-6xl font-black mb-6 font-mono tracking-tighter">
                            {formatElapsedTime(elapsedTime)}
                        </div>
                        {status === 'in_progress' && (
                            <div className="flex items-center justify-center gap-2 text-xs meta-bold text-black-green uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-primary-green animate-ping" />
                                <span>Gravando tempo real</span>
                            </div>
                        )}
                    </Card>
                ) : (
                    <Card className="p-8 bg-primary-black text-white rounded-[32px] border-none shadow-xl flex items-center justify-between">
                        <div>
                            <p className="meta-bold text-white/50 uppercase tracking-widest mb-1">Preço Fixo</p>
                            <h3 className="text-2xl font-bold">R$ {order?.total_amount?.toFixed(2) || '0.00'}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary-green/20 flex items-center justify-center text-black-green">
                            <CheckCircle size={24} />
                        </div>
                    </Card>
                )}

                {/* Client & Service Info */}
                <Card className="p-8 rounded-[32px] border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <h3 className="meta-bold text-black uppercase tracking-widest mb-6">Informações do Cliente</h3>

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
                                <p className="meta-bold text-black uppercase tracking-widest !text-[9px]">Agendado</p>
                                <p className="font-semibold text-black dark:text-white">
                                    {new Date(order?.scheduled_at).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Instructions */}
                {(status === 'ready_to_start' || status === 'in_progress') && (
                    <div className="p-6 bg-primary-green/10 rounded-[24px] border border-primary-green/20 flex gap-4">
                        <AlertCircle size={24} className="text-black-green-dark shrink-0" />
                        <p className="body-small text-black-green-dark">
                            {status === 'ready_to_start'
                                ? 'Ao clicar em iniciar, o cliente será notificado que você começou o trabalho.'
                                : 'Lembre-se de finalizar o serviço assim que terminar para liberar o pagamento.'
                            }
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
                            disabled={isProcessing}
                            className="w-full py-6 bg-primary-green text-black rounded-[24px] label-semibold uppercase tracking-widest shadow-xl shadow-primary-green/20 flex items-center justify-center gap-3 transition-all  active:scale-[0.98]"
                        >
                            <Play size={20} fill="currentColor" />
                            {isProcessing ? 'Iniciando...' : 'Iniciar Trabalho Agora'}
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
                            className="w-full py-6 bg-feedback-error text-white rounded-[24px] label-semibold uppercase tracking-widest shadow-xl shadow-feedback-error/30 flex items-center justify-center gap-3 transition-all  active:scale-[0.98]"
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
                                className="w-full py-6 bg-primary-green text-black rounded-[24px] label-semibold uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
                            >
                                <CheckCircle size={20} />
                                {isProcessing ? 'Enviando...' : 'Confirmar Envio Final'}
                            </button>

                            <button
                                onClick={() => setStatus('in_progress')}
                                disabled={isProcessing}
                                className="w-full py-6 bg-neutral-100 dark:bg-neutral-800 text-black rounded-[24px] label-semibold uppercase tracking-widest"
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

export default ServiceExecution;

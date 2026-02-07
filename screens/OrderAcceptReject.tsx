import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, User, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { acceptOrder, rejectOrder } from '../services/ordersService';

interface OrderAcceptRejectProps {
    order: any;
    onBack: () => void;
    onAccept: () => void;
    onReject: (reason: string) => void;
    onNegotiate: (order: any) => void;
}

const OrderAcceptReject: React.FC<OrderAcceptRejectProps> = ({ order, onBack, onAccept, onReject, onNegotiate }) => {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRejectReason, setSelectedRejectReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const rejectReasons = [
        'Agenda lotada',
        'Fora da minha área de atuação',
        'Serviço muito distante',
        'Valor não compatível',
        'Não trabalho neste tipo de serviço',
        'Outro motivo'
    ];

    const handleAccept = async () => {
        if (!order) return;
        setIsProcessing(true);
        try {
            await acceptOrder(order.id);
            onAccept();
        } catch (e) {
            alert("Erro ao aceitar pedido: " + e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!order) return;
        const reason = selectedRejectReason === 'Outro motivo' ? rejectReason : selectedRejectReason;

        if (!reason.trim()) {
            alert('Por favor, selecione ou escreva um motivo');
            return;
        }

        setIsProcessing(true);
        try {
            await rejectOrder(order.id);
            onReject(reason);
        } catch (e) {
            alert("Erro ao recusar pedido: " + e);
        } finally {
            setIsProcessing(false);
        }
    };

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

    const clientData = Array.isArray(order?.client) ? order.client[0] : order?.client;
    const clientName = clientData?.name || 'Cliente';
    const clientAvatar = clientData?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=0E0E10&color=fff`;

    if (showRejectModal) {
        return (
            <div className="screen-container bg-app-bg min-h-screen pb-6">
                <div className="px-4 pt-6">
                    <button
                        onClick={() => setShowRejectModal(false)}
                        className="interactive flex items-center gap-2 text-black mb-6"
                    >
                        <ArrowLeft size={20} />
                        <span className="meta-bold uppercase tracking-widest text-[10px]">Voltar para o Pedido</span>
                    </button>

                    <div className="text-center mb-10">
                        <div className="w-20 h-20 rounded-[24px] bg-error/10 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-error" />
                        </div>
                        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
                            Recusar Pedido
                        </h1>
                        <p className="text-black">
                            Por favor, informe-nos o motivo da recusa.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Card className="p-6 rounded-[28px] border-neutral-100 dark:border-neutral-800">
                            <h3 className="meta-bold text-black uppercase tracking-widest mb-4">
                                Selecione um motivo
                            </h3>
                            <div className="space-y-3">
                                {rejectReasons.map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => setSelectedRejectReason(reason)}
                                        className={`w-full p-4 rounded-xl border-2 transition-all text-left label-semibold ${selectedRejectReason === reason
                                            ? 'border-primary-green bg-primary-green/5 text-black-green-dark'
                                            : 'border-neutral-50 dark:border-neutral-900 bg-white dark:bg-black text-black'
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </Card>

                        {selectedRejectReason === 'Outro motivo' && (
                            <Card className="p-6 rounded-[28px] border-neutral-100 dark:border-neutral-800 animate-fade-in">
                                <h3 className="meta-bold text-black uppercase tracking-widest mb-4">
                                    Descreva o motivo
                                </h3>
                                <textarea
                                    placeholder="Escreva aqui..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-black dark:text-white focus:border-error focus:ring-0 outline-none resize-none"
                                />
                            </Card>
                        )}

                        <div className="space-y-3 pt-6">
                            <Button
                                variant="primary"
                                onClick={handleReject}
                                disabled={isProcessing || !selectedRejectReason}
                                className="w-full !bg-error !text-white !rounded-[20px] !py-5 shadow-xl shadow-error/20"
                            >
                                {isProcessing ? 'Processando...' : 'Confirmar Recusa'}
                            </Button>

                            <button
                                onClick={() => setShowRejectModal(false)}
                                disabled={isProcessing}
                                className="w-full py-4 text-black label-semibold uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="screen-container bg-app-bg min-h-screen pb-6">
            {/* Header */}
            <header className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10 px-4 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-900">
                <button
                    onClick={onBack}
                    className="interactive flex items-center gap-2 text-black mb-4"
                >
                    <ArrowLeft size={20} />
                    <span className="meta-bold uppercase tracking-widest text-[10px]">Lista de Pedidos</span>
                </button>

                <h1 className="text-2xl font-bold text-black dark:text-white">
                    Detalhes do Pedido
                </h1>
            </header>

            <div className="px-4 py-6 space-y-6">
                {/* Status Alert */}
                <Card className="p-6 bg-primary-black text-white rounded-[28px] border-none shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-green/20 flex items-center justify-center text-black-green">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="heading-md text-white mb-1">Ação Requerida</h3>
                            <p className="meta text-white/50">Responda a este cliente o quanto antes para garantir o agendamento.</p>
                        </div>
                    </div>
                </Card>

                {/* Info Cards */}
                <div className="grid grid-cols-1 gap-4">
                    <Card className="p-8 rounded-[32px] border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <h3 className="meta-bold text-black uppercase tracking-widest mb-6">Cliente</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-[28px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shadow-inner border border-neutral-100 dark:border-neutral-800">
                                <img
                                    src={clientAvatar}
                                    className="w-full h-full object-cover"
                                    alt={clientName}
                                />
                            </div>
                            <div>
                                <p className="body-bold text-2xl text-black dark:text-white leading-tight">{clientName}</p>
                                <p className="meta-bold text-black-green uppercase tracking-widest !text-[10px] mt-1">Cliente Verificado</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[32px] border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <h3 className="meta-bold text-black uppercase tracking-widest mb-6">Serviço & Local</h3>
                        <p className="heading-md !text-xl mb-6">{order?.service_title_snapshot || order?.service?.title || 'Serviço'}</p>

                        <div className="space-y-5">
                            <div className="flex items-start gap-3">
                                <Calendar size={18} className="text-black-green mt-0.5" />
                                <div>
                                    <p className="meta-bold text-black uppercase tracking-widest !text-[9px]">Data Agendada</p>
                                    <p className="font-semibold">{formatDate(order?.scheduled_at)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Clock size={18} className="text-black-green mt-0.5" />
                                <div>
                                    <p className="meta-bold text-black uppercase tracking-widest !text-[9px]">Horário</p>
                                    <p className="font-semibold">{new Date(order?.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-black-green mt-0.5" />
                                <div>
                                    <p className="meta-bold text-black uppercase tracking-widest !text-[9px]">Endereço</p>
                                    <p className="font-semibold">{order?.location_text || 'Endereço do serviço'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Financial Summary */}
                    <Card className="p-8 rounded-[32px] border-none bg-primary-green/10 shadow-sm">
                        <h3 className="meta-bold text-black-green-dark uppercase tracking-widest mb-4">Ganhos Previstos</h3>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-black text-black dark:text-white">R$ {order?.total_amount?.toFixed(2) || '0.00'}</span>
                            <span className="meta text-black">{order?.pricing_mode === 'hourly' ? '/estimado' : '/fixo'}</span>
                        </div>
                        <p className="meta-bold text-black-green-dark uppercase tracking-widest !text-[9px]">O pagamento já está seguro em nossa plataforma.</p>
                    </Card>
                </div>

                {/* Final Actions */}
                <div className="pt-6 space-y-4">
                    <button
                        onClick={() => onNegotiate(order)}
                        disabled={isProcessing}
                        className="w-full py-5 border-2 border-neutral-100 dark:border-neutral-800 rounded-[24px] label-semibold uppercase tracking-widest text-black  transition-all active:bg-neutral-50"
                    >
                        Negociar Valor
                    </button>

                    <button
                        onClick={handleAccept}
                        disabled={isProcessing}
                        className="w-full py-6 bg-primary-green text-black rounded-[24px] label-semibold uppercase tracking-widest shadow-xl shadow-primary-green/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <CheckCircle size={20} />
                        {isProcessing ? 'Processando...' : 'Aceitar Pedido Agora'}
                    </button>

                    <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={isProcessing}
                        className="w-full py-5 rounded-[24px] border-2 border-transparent  text-feedback-error label-semibold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:bg-feedback-error/5"
                    >
                        <XCircle size={18} />
                        Recusar este pedido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderAcceptReject;

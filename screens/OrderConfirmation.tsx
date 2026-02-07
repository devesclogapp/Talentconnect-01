import React, { useState } from 'react';
import { CheckCircle, Calendar, Clock, MapPin, User, FileText, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { createOrder } from '../services/ordersService';

interface OrderConfirmationProps {
    orderData: any;
    onConfirm: (order: any) => void;
    onEdit: () => void;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ orderData, onConfirm, onEdit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Data não definida';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            console.log("Iniciando criação do pedido com dados:", orderData);

            // Validate essential data
            if (!orderData.date || !orderData.time) {
                throw new Error("Data e hora são obrigatórios");
            }

            // Unify date and time into a single ISO string
            // Ensure format YYYY-MM-DD and HH:MM
            const dateTimeString = `${orderData.date}T${orderData.time}:00`;
            const scheduledDate = new Date(dateTimeString);

            if (isNaN(scheduledDate.getTime())) {
                throw new Error(`Data inválida gerada: ${dateTimeString}`);
            }

            const scheduledAt = scheduledDate.toISOString();

            const providerId = orderData.provider?.id || orderData.service?.provider_id;

            if (!providerId) {
                throw new Error("ID do prestador não encontrado");
            }

            const payload = {
                provider_id: providerId,
                service_id: orderData.service.id,
                pricing_mode: orderData.pricingMode,
                scheduled_at: scheduledAt,
                location_text: orderData.location,
                notes: orderData.notes,
                total_amount: Number(orderData.totalEstimated), // Ensure number
                status: 'sent',
                // Snapshots para garantir integridade histórica
                service_title_snapshot: orderData.service.title,
                service_description_snapshot: orderData.service.description,
                service_category_snapshot: orderData.service.category,
                service_base_price_snapshot: orderData.service.base_price
            };

            console.log("Enviando payload:", payload);

            const order = await createOrder(payload as any);

            console.log("Pedido criado com sucesso:", order);
            onConfirm(order);
        } catch (error: any) {
            console.error("Erro ao criar pedido:", error);
            alert(`Não foi possível confirmar o pedido: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="screen-container bg-app-bg min-h-screen pb-6">
            {/* Success Header */}
            <div className="px-4 pt-12 pb-8 text-center bg-white dark:bg-black rounded-b-[48px] shadow-sm border-b border-neutral-100 dark:border-neutral-900">
                <div className="w-24 h-24 rounded-full bg-primary-green/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} className="text-black-green" />
                </div>

                <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                    Resumo do pedido
                </h1>
                <p className="text-black font-normal text-xs">
                    Revise as informações abaixo
                </p>
            </div>

            <div className="px-4 mt-8 space-y-6 pb-32">
                {/* Service & Provider */}
                <div className="grid grid-cols-1 gap-4">
                    <Card className="p-8 rounded-[32px] border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <h3 className="text-black font-normal text-sm mb-6">Serviço & profissional</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-[24px] bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                {orderData?.provider?.avatar_url ? (
                                    <img src={orderData.provider.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-black text-2xl font-bold">{orderData?.provider?.name?.[0] || 'P'}</div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{orderData?.service?.title || 'Serviço'}</h3>
                                <p className="text-black-green font-normal text-[9px]">{orderData?.provider?.name || 'Profissional'}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Schedule */}
                    <Card className="p-8 rounded-[32px] border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <h3 className="text-black font-normal text-sm mb-6">Agendamento</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-green/10 flex items-center justify-center text-black-green">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-black font-normal text-[9px]">Data</p>
                                    <p className="capitalize font-normal text-sm">{formatDate(orderData?.date)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-green/10 flex items-center justify-center text-black-green">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-black font-normal text-[9px]">Horário</p>
                                    <p className="font-normal text-sm">{orderData?.time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-green/10 flex items-center justify-center text-black-green">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-black font-normal text-[9px]">Endereço</p>
                                    <p className="font-normal text-sm">{orderData?.location}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Financial */}
                    <Card className="p-8 rounded-[32px] border-none bg-black dark:bg-neutral-800 text-white shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white/50 font-normal text-xs">Total estimado</h3>
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <CreditCard size={20} className="text-black-green" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-xl font-bold text-accent-secondary">R$</span>
                            <p className="text-5xl font-black text-white tracking-tighter">{orderData?.totalEstimated?.toFixed(2)}</p>
                        </div>
                        <p className="meta text-white/40">O pagamento só será liberado após a sua confirmação de conclusão do serviço.</p>
                    </Card>
                </div>

                {/* Terms */}
                <p className="text-[10px] text-center text-black dark:text-gray-400 px-6 leading-relaxed font-normal">
                    Ao confirmar, você concorda que o valor ficará retido pela Talent Connect até a conclusão.
                </p>
            </div>

            {/* Float Footer */}
            <footer className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-900 flex gap-4 z-50">
                <button
                    onClick={onEdit}
                    disabled={isSubmitting}
                    className="flex-1 py-5 border-2 border-neutral-100 dark:border-neutral-800 rounded-[20px] text-black dark:text-white font-normal text-sm"
                >
                    Editar
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex-[2] py-5 bg-primary-green text-black rounded-[20px] shadow-xl shadow-primary-green/20 flex items-center justify-center gap-2 active:scale-95 transition-all whitespace-nowrap font-normal text-sm"
                >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                    {isSubmitting ? 'Enviando...' : 'Confirmar pedido'}
                </button>
            </footer>
        </div>
    );
};

export default OrderConfirmation;

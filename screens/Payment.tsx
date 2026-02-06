import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { supabase } from '../services/supabaseClient';

interface PaymentProps {
    order: any;
    onBack: () => void;
    onPaymentSuccess: () => void;
}

const Payment: React.FC<PaymentProps> = ({ order, onBack, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix'>('credit');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);

    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
        const chunks = cleaned.match(/.{1,4}/g) || [];
        return chunks.join(' ').substr(0, 19);
    };

    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2);
        }
        return cleaned;
    };

    const validateCardForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (paymentMethod !== 'pix') {
            if (!cardData.number.replace(/\s/g, '').match(/^\d{16}$/)) {
                newErrors.number = 'Número do cartão inválido';
            }
            if (!cardData.name.trim()) {
                newErrors.name = 'Nome impresso é obrigatório';
            }
            if (!cardData.expiry.match(/^\d{2}\/\d{2}$/)) {
                newErrors.expiry = 'Data inválida (MM/AA)';
            }
            if (!cardData.cvv.match(/^\d{3,4}$/)) {
                newErrors.cvv = 'CVV inválido';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePayment = async () => {
        if (paymentMethod !== 'pix' && !validateCardForm()) {
            return;
        }

        setIsProcessing(true);

        try {
            // Gateway simulation
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Update order status to 'paid_escrow_held'
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'paid_escrow_held',
                    updated_at: new Date().toISOString()
                } as any)
                .eq('id', order.id);

            if (error) throw error;

            // Create payment record
            await (supabase as any)
                .from('payments')
                .insert({
                    order_id: order.id,
                    amount_total: order.total_amount,
                    operator_fee: order.total_amount * 0.15,
                    provider_amount: order.total_amount * 0.85,
                    escrow_status: 'held',
                    payment_method: paymentMethod
                });

            setPaymentComplete(true);
            setTimeout(() => {
                onPaymentSuccess();
            }, 2000);
        } catch (error: any) {
            console.error('Payment error:', error);
            setErrors({ general: 'Falha ao processar pagamento: ' + error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    if (paymentComplete) {
        return (
            <div className="screen-container bg-app-bg min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-sm text-center animate-scale-in">
                    <div className="w-24 h-24 rounded-[32px] bg-primary-green flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-green/30">
                        <CheckCircle size={48} className="text-black" />
                    </div>
                    <h1 className="text-3xl font-black text-black dark:text-white mb-4">Pagamento Seguro!</h1>
                    <p className="body text-black mb-8">Seu valor está retido com segurança e será liberado apenas após a conclusão do serviço.</p>
                    <div className="flex items-center justify-center gap-3 text-black-green meta-bold uppercase tracking-widest">
                        <Loader2 size={16} className="animate-spin" />
                        Redirecionando...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="screen-container bg-app-bg min-h-screen pb-6">
            <header className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10 px-4 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-900">
                <button
                    onClick={onBack}
                    className="interactive flex items-center gap-2 text-black mb-4"
                >
                    <ArrowLeft size={20} />
                    <span className="meta-bold uppercase tracking-widest text-[10px]">Resumo do Pedido</span>
                </button>
                <h1 className="text-2xl font-bold text-black dark:text-white">Pagamento</h1>
            </header>

            <div className="px-4 py-8 space-y-6">
                {/* Security Alert */}
                <Card className="p-6 bg-primary-green/10 border-none rounded-[28px] flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-green/20 flex items-center justify-center text-black-green">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h3 className="heading-md !text-base mb-1">Garantia Talent Connect</h3>
                        <p className="meta text-black">Seu dinheiro está seguro conosco. O prestador só recebe após sua autorização final.</p>
                    </div>
                </Card>

                {/* Total */}
                <div className="text-center py-4">
                    <p className="meta-bold text-black uppercase tracking-widest mb-1">Total a Reter</p>
                    <h2 className="text-5xl font-black text-black dark:text-white">R$ {order?.total_amount?.toFixed(2)}</h2>
                </div>

                {/* Methods */}
                <div className="space-y-3">
                    <h3 className="meta-bold text-black uppercase tracking-widest px-1">Escolha o método</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentMethod('credit')}
                            className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-start gap-3 ${paymentMethod === 'credit'
                                ? 'border-primary-green bg-primary-green/5 text-black-green-dark'
                                : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-black'
                                }`}
                        >
                            <CreditCard size={24} />
                            <span className="label-semibold uppercase tracking-widest text-[11px]">Cartão</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('pix')}
                            className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-start gap-3 ${paymentMethod === 'pix'
                                ? 'border-primary-green bg-primary-green/5 text-black-green-dark'
                                : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-black'
                                }`}
                        >
                            <div className="text-2xl">🔷</div>
                            <span className="label-semibold uppercase tracking-widest text-[11px]">PIX Instantâneo</span>
                        </button>
                    </div>
                </div>

                {/* Card Fields */}
                {paymentMethod !== 'pix' && (
                    <Card className="p-8 rounded-[32px] border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4 animate-fade-in">
                        {errors.general && <p className="text-xs text-error meta-bold uppercase text-center bg-error/10 p-2 rounded-lg">{errors.general}</p>}

                        <div className="space-y-1">
                            <label className="meta-bold text-black uppercase tracking-widest !text-[9px] px-1">Número do Cartão</label>
                            <Input
                                placeholder="0000 0000 0000 0000"
                                value={cardData.number}
                                onChange={(e) => setCardData(prev => ({ ...prev, number: formatCardNumber(e.target.value) }))}
                                error={errors.number}
                                maxLength={19}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="meta-bold text-black uppercase tracking-widest !text-[9px] px-1">Nome no Cartão</label>
                            <Input
                                placeholder="JOSÉ SILVA"
                                value={cardData.name}
                                onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                                error={errors.name}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="meta-bold text-black uppercase tracking-widest !text-[9px] px-1">Validade</label>
                                <Input
                                    placeholder="MM/AA"
                                    value={cardData.expiry}
                                    onChange={(e) => setCardData(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                                    error={errors.expiry}
                                    maxLength={5}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="meta-bold text-black uppercase tracking-widest !text-[9px] px-1">CVV</label>
                                <Input
                                    type="password"
                                    placeholder="000"
                                    value={cardData.cvv}
                                    onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                                    error={errors.cvv}
                                    maxLength={4}
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {/* Submit */}
                <div className="pt-6">
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-6 bg-primary-black text-white rounded-[24px] label-semibold uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
                        {isProcessing ? 'Processando...' : `Confirmar R$ ${order?.total_amount?.toFixed(2)}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;

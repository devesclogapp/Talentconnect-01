import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { supabase } from '../services/supabaseClient';
import { useAppStore } from '../store';
import { processPayment } from '../services/ordersService';
import { formatNumber } from '../utils/format';

const Payment: React.FC = () => {
    const navigate = useNavigate();
    const { selectedOrder, setSelectedOrder } = useAppStore();

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

    // If no order is selected, go back to orders
    useEffect(() => {
        if (!selectedOrder) {
            navigate('/client/orders');
        }
    }, [selectedOrder, navigate]);

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
        const chunks = cleaned.match(/.{1,4}/g) || [];
        return chunks.join(' ').substring(0, 19);
    };

    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
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
        if (!selectedOrder) return;

        if (paymentMethod !== 'pix' && !validateCardForm()) {
            return;
        }

        setIsProcessing(true);

        try {
            // Call our service (which is currently a simulation/invoke)
            await processPayment(
                selectedOrder.id,
                paymentMethod,
                selectedOrder.total_amount || 0
            );

            // Simulation of local delay for UX
            await new Promise(resolve => setTimeout(resolve, 1500));

            setPaymentComplete(true);

            // Auto-redirect after success
            setTimeout(() => {
                navigate(`/client/tracking`);
            }, 2500);
        } catch (error: any) {
            console.error('Payment error:', error);
            setErrors({ general: 'Falha ao processar pagamento: ' + error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!selectedOrder) return null;

    if (paymentComplete) {
        return (
            <div className="screen-container bg-app-bg min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-sm text-center relative">
                    {/* Confetti shards simplified with CSS animation */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 overflow-visible pointer-events-none select-none">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 rounded-full animate-confetti-pop"
                                style={{
                                    backgroundColor: ['#22C55E', '#3B82F6', '#EAB308', '#F43F5E'][i % 4],
                                    left: '50%',
                                    top: '50%',
                                    '--angle': `${i * 30}deg`,
                                    '--delay': `${i * 0.1}s`
                                } as any}
                            />
                        ))}
                    </div>

                    <div className="w-24 h-24 rounded-[32px] bg-primary-green flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-green/30 animate-scale-in relative z-10">
                        <CheckCircle size={48} className="text-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-black dark:text-white mb-4">Pagamento seguro!</h1>
                    <p className="body text-black mb-8">Seu valor está retido com segurança e será liberado apenas após a conclusão do serviço.</p>
                    <div className="flex items-center justify-center gap-3 text-black-green font-normal text-[10px]">
                        <Loader2 size={16} className="animate-spin" />
                        Redirecionando para acompanhamento...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="screen-container bg-app-bg min-h-screen pb-6">
            <header className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10 px-4 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-900">
                <button
                    onClick={() => navigate(-1)}
                    className="interactive flex items-center gap-2 text-black mb-4"
                >
                    <ArrowLeft size={20} />
                    <span className="font-normal text-[10px]">Voltar</span>
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
                        <p className="meta text-black">Seu dinheiro está seguro conosco. O profissional só recebe após sua autorização final.</p>
                    </div>
                </Card>

                {/* Total */}
                <div className="text-center py-4">
                    <p className="text-black font-medium text-sm mb-1">Total a reter</p>
                    <h2 className="text-5xl font-bold text-black dark:text-white tracking-tighter">R$ {formatNumber(selectedOrder.total_amount)}</h2>
                </div>

                {/* Methods */}
                <div className="space-y-3">
                    <h3 className="text-black font-medium text-xs px-1">Escolha o método</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentMethod('credit')}
                            className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-start gap-3 ${paymentMethod === 'credit'
                                ? 'border-primary-green bg-primary-green/5 text-black-green-dark'
                                : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-black'
                                }`}
                        >
                            <CreditCard size={24} />
                            <span className="text-[11px] font-medium">Cartão</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('pix')}
                            className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-start gap-3 ${paymentMethod === 'pix'
                                ? 'border-primary-green bg-primary-green/5 text-black-green-dark'
                                : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-black'
                                }`}
                        >
                            <div className="text-2xl">🔷</div>
                            <span className="text-[11px] font-medium">Pix instantâneo</span>
                        </button>
                    </div>
                </div>

                {/* Card Fields */}
                {paymentMethod !== 'pix' && (
                    <Card className="p-8 rounded-[32px] border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4 animate-fade-in">
                        <div className="space-y-1">
                            <label className="text-black font-medium !text-[9px] px-1">Número do cartão</label>
                            <Input
                                placeholder="0000 0000 0000 0000"
                                value={cardData.number}
                                onChange={(e) => setCardData(prev => ({ ...prev, number: formatCardNumber(e.target.value) }))}
                                error={errors.number}
                                maxLength={19}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-black font-medium !text-[9px] px-1">Nome no cartão</label>
                            <Input
                                placeholder="JOSÉ SILVA"
                                value={cardData.name}
                                onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                                error={errors.name}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-black font-medium !text-[9px] px-1">Validade</label>
                                <Input
                                    placeholder="MM/AA"
                                    value={cardData.expiry}
                                    onChange={(e) => setCardData(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                                    error={errors.expiry}
                                    maxLength={5}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-black font-medium !text-[9px] px-1">CVV</label>
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
                <div className="pt-6 space-y-4">
                    {errors.general && (
                        <div className="animate-fade-in bg-error/10 border border-error/20 p-4 rounded-2xl flex items-center gap-3 text-error">
                            <AlertCircle size={18} />
                            <p className="text-xs font-semibold">{errors.general}</p>
                        </div>
                    )}

                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-6 bg-primary-black text-white rounded-[24px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all font-medium"
                    >
                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
                        {isProcessing ? 'Processando...' : `Confirmar R$ ${formatNumber(selectedOrder.total_amount)}`}
                    </button>
                    <p className="text-[9px] text-center text-neutral-400">
                        Ambiente de testes: Nenhum valor real será cobrado.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Payment;

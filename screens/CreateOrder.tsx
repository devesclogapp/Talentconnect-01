import React, { useState } from 'react';
import { ArrowLeft, Clock, MapPin, FileText, AlertCircle, Loader2, Thermometer } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Calendar } from '../components/ui/Calendar';
import { TimePicker } from '../components/ui/TimePicker';

interface CreateOrderProps {
    service: any;
    provider: any;
    onBack: () => void;
    onConfirm: (orderData: any) => void;
}

const CreateOrder: React.FC<CreateOrderProps> = ({ service, provider, onBack, onConfirm }) => {
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        location: '',
        notes: '',
        estimatedHours: (service?.pricing_mode === 'hourly') ? 2 : 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.date) {
            newErrors.date = 'Data é obrigatória';
        } else {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                newErrors.date = 'Data não pode ser no passado';
            }
        }

        if (!formData.time) {
            newErrors.time = 'Horário é obrigatório';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Endereço é obrigatório';
        }

        if (service?.pricing_mode === 'hourly' && formData.estimatedHours < 1) {
            newErrors.estimatedHours = 'Mínimo de 1 hora';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const basePrice = service?.base_price || 0;
        const pricingMode = service?.pricing_mode || 'fixed';

        const orderData = {
            service,
            provider: provider || service.provider,
            ...formData,
            pricingMode,
            basePrice,
            totalEstimated: pricingMode === 'hourly'
                ? basePrice * formData.estimatedHours
                : basePrice
        };

        onConfirm(orderData);
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const basePrice = service?.base_price || 0;
    const pricingMode = service?.pricing_mode || 'fixed';
    const totalEstimated = pricingMode === 'hourly'
        ? basePrice * formData.estimatedHours
        : basePrice;

    return (
        <div className="screen-container bg-app-bg min-h-screen pb-32">
            {/* Header */}
            <header className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-40 px-6 pt-12 pb-6 border-b border-neutral-100 dark:border-neutral-900">
                <button
                    onClick={onBack}
                    className="interactive flex items-center gap-2 text-black mb-4"
                >
                    <ArrowLeft size={18} />
                    <span className="meta-bold uppercase tracking-widest text-[10px]">Detalhes do Serviço</span>
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-black dark:text-white leading-tight">Configurar<br />Agendamento</h1>
                    </div>
                    <div className="text-right">
                        <p className="meta-bold text-black uppercase tracking-widest !text-[9px]">Valor Base</p>
                        <p className="heading-md text-black-green-dark">R$ {basePrice}</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Date & Time Grid */}
                {/* Date & Time Selection */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="meta-bold text-black uppercase tracking-widest px-1">Escolha a Data</h3>
                        <Calendar
                            value={formData.date ? new Date(formData.date + 'T12:00:00') : null}
                            onChange={(date) => {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                handleInputChange('date', `${year}-${month}-${day}`);
                            }}
                            minDate={new Date()}
                        />
                        {errors.date && <p className="text-[10px] text-error font-bold mt-1 px-1">{errors.date}</p>}
                    </div>

                    <div className="space-y-4 animate-fade-in" style={{ opacity: formData.date ? 1 : 0.5, pointerEvents: formData.date ? 'auto' : 'none' }}>
                        <TimePicker
                            value={formData.time}
                            onChange={(time) => handleInputChange('time', time)}
                            minTime={(() => {
                                if (!formData.date) return undefined;
                                const today = new Date();
                                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                if (formData.date === todayStr) {
                                    return `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
                                }
                                return undefined;
                            })()}
                        />
                        {errors.time && <p className="text-[10px] text-error font-bold mt-1 px-1">{errors.time}</p>}
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                    <h3 className="meta-bold text-black uppercase tracking-widest px-1">Onde?</h3>
                    <div className="relative">
                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                        <input
                            type="text"
                            placeholder="Endereço completo do serviço"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-[20px] p-4 pl-12 body-bold text-black dark:text-white focus:border-primary-green outline-none transition-all"
                        />
                        {errors.location && <p className="text-[10px] text-error font-bold mt-1 px-1">{errors.location}</p>}
                    </div>
                </div>

                {/* Hourly Estimation */}
                {pricingMode === 'hourly' && (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="meta-bold text-black uppercase tracking-widest px-1">Tempo Estimado</h3>
                        <div className="flex items-center gap-6 bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-[24px] p-2">
                            <button
                                type="button"
                                onClick={() => handleInputChange('estimatedHours', Math.max(1, formData.estimatedHours - 1))}
                                className="w-14 h-14 rounded-[20px] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-black dark:text-white interactive "
                            >
                                -
                            </button>
                            <div className="flex-1 text-center">
                                <span className="text-3xl font-black text-black dark:text-white">{formData.estimatedHours}</span>
                                <span className="meta-bold text-black uppercase ml-2 tracking-widest">horas</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleInputChange('estimatedHours', formData.estimatedHours + 1)}
                                className="w-14 h-14 rounded-[20px] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-black dark:text-white interactive "
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div className="space-y-4">
                    <h3 className="meta-bold text-black uppercase tracking-widest px-1">Instruções Extras</h3>
                    <textarea
                        placeholder="Ex: Trazer escada, tocar o interfone 402, etc..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={4}
                        className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-[24px] p-6 body text-black dark:text-white focus:border-primary-green outline-none transition-all resize-none"
                    />
                </div>

                {/* Estimation Card */}
                <div className="p-8 rounded-[32px] bg-black dark:bg-neutral-800 text-white space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <p className="meta-bold text-white/50 uppercase tracking-widest">Total Estimado</p>
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <AlertCircle size={16} className="text-black-green" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-5xl font-black">R$ {totalEstimated.toFixed(2)}</h2>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">
                            {pricingMode === 'hourly' ? `${formData.estimatedHours}h x R$ ${basePrice}/h` : 'Preço fixo acordado'}
                        </p>
                    </div>
                </div>
            </form>

            <footer className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-900 z-50">
                <button
                    onClick={handleSubmit}
                    className="w-full py-6 bg-primary-green text-black rounded-[24px] label-semibold uppercase tracking-widest shadow-xl shadow-primary-green/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    Avançar para Revisão
                </button>
            </footer>
        </div>
    );
};

export default CreateOrder;

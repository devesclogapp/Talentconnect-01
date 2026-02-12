import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, ShieldCheck, Send, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DisputeReason } from '../types';
import { openDispute } from '../services/disputesService';

interface OpenDisputeProps {
    order: any;
    user: any;
    onBack: () => void;
    onSuccess: (dispute: any) => void;
}

const REASONS: { value: DisputeReason; label: string; desc: string }[] = [
    { value: 'provider_no_show', label: 'Profissional não compareceu', desc: 'O prestador não apareceu no horário agendado.' },
    { value: 'service_not_completed', label: 'Serviço incompleto', desc: 'O serviço foi iniciado mas não foi finalizado como acordado.' },
    { value: 'service_not_as_agreed', label: 'Serviço diferente do contratado', desc: 'O que foi executado não condiz com a descrição do serviço.' },
    { value: 'timing_issue', label: 'Problema com horário/data', desc: 'Divergência significativa no cronograma agendado.' },
    { value: 'other', label: 'Outro motivo', desc: 'Dificuldades de comunicação ou outros problemas não listados.' },
];

const OpenDispute: React.FC<OpenDisputeProps> = ({ order, user, onBack, onSuccess }) => {
    const [reason, setReason] = useState<DisputeReason | ''>('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async () => {
        console.log("🚀 [DEBUG] handleSubmit disparado");
        if (!reason || !description) {
            console.warn("🚀 [DEBUG] Campos incompletos");
            return;
        }

        setLoading(true);
        try {
            const role = (user?.role || 'client').toLowerCase() as 'client' | 'provider';
            console.log("🚀 [DEBUG] Chamando Supabase...");

            // Timeout de 15s para não travar a tela
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Servidor demorou a responder.')), 15000)
            );

            const resultPromise = openDispute({
                order_id: order.id,
                opened_by_role: role,
                opened_by_user_id: user.id,
                reason_code: reason as DisputeReason,
                description
            });

            const result = await Promise.race([resultPromise, timeoutPromise]);

            console.log("🚀 [DEBUG] Resultado recebido!", result);
            setShowSuccess(true);

            console.log("🚀 [DEBUG] Agendando onSuccess para 1.5s");
            setTimeout(() => {
                console.log("🚀 [DEBUG] Chamando callback onSuccess agora...");
                onSuccess(result);
            }, 1500);

        } catch (error: any) {
            console.error('🚀 [DEBUG] Erro capturado:', error);
            alert('Erro ao processar: ' + (error.message || 'Erro desconhecido'));
        } finally {
            console.log("🚀 [DEBUG] setLoading(false)");
            setLoading(false);
        }
    };

    return (
        <div className="screen-container bg-app-bg min-h-screen flex flex-col">
            {/* Header */}
            <div className="px-4 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800 sticky top-0 bg-app-bg z-10">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={onBack}
                        disabled={loading || showSuccess}
                        className="interactive text-black dark:text-white disabled:opacity-20"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="heading-md">Relatar Problema</h1>
                </div>
            </div>

            <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                <div className="bg-feedback-error/10 p-4 rounded-xl border border-feedback-error/20 flex gap-3">
                    <AlertTriangle size={20} className="text-feedback-error shrink-0" />
                    <p className="text-[11px] font-medium text-feedback-error leading-tight">
                        O pagamento ficará retido até que a operadora analise este caso e tome uma decisão de mediação.
                    </p>
                </div>

                {/* Reasons */}
                <section>
                    <h3 className="section-title mb-4">O que aconteceu?</h3>
                    <div className="space-y-3">
                        {REASONS.map((item) => (
                            <button
                                key={item.value}
                                onClick={() => setReason(item.value)}
                                disabled={loading || showSuccess}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${reason === item.value
                                        ? 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-800'
                                        : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-black'
                                    } ${showSuccess ? 'opacity-40' : ''}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold text-sm ${reason === item.value ? 'text-black dark:text-white' : 'text-neutral-500'}`}>
                                        {item.label}
                                    </span>
                                    {reason === item.value && <ShieldCheck size={18} className="text-black dark:text-white" />}
                                </div>
                                <p className="text-[10px] text-neutral-400">{item.desc}</p>
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="section-title mb-3">Mais detalhes</h3>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading || showSuccess}
                        placeholder="Explique o ocorrido..."
                        className="w-full h-32 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-black text-sm focus:outline-none focus:border-black/20 resize-none disabled:opacity-50"
                    />
                </section>
            </div>

            {/* Bottom Button */}
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-app-bg pb-10">
                {showSuccess ? (
                    <div className="w-full flex flex-col gap-3">
                        <div className="w-full py-5 bg-feedback-success text-white rounded-[20px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-feedback-success/20">
                            <CheckCircle2 size={20} />
                            Enviado com Sucesso!
                        </div>
                        <p className="text-[10px] text-neutral-400 text-center animate-pulse">Redirecionando automaticamente...</p>
                        <button
                            onClick={() => onSuccess({})}
                            className="text-[11px] font-bold text-black dark:text-white underline py-2"
                        >
                            Clique aqui se não redirecionar
                        </button>
                    </div>
                ) : (
                    <Button
                        variant="primary"
                        disabled={!reason || !description || loading}
                        onClick={handleSubmit}
                        className="w-full !rounded-[20px] !py-6 font-bold shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processando...' : (
                            <>
                                <Send size={18} />
                                Enviar para Mediação
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default OpenDispute;

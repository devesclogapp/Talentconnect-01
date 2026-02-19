import React, { useState } from 'react';
import { ArrowLeft, Star, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface ProviderRatingProps {
    provider: any;
    order: any;
    onBack: () => void;
    onSubmit: (rating: number, comment: string) => void;
}

const ProviderRating: React.FC<ProviderRatingProps> = ({ provider, order, onBack, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const ratingLabels = [
        '',
        'Muito Ruim',
        'Ruim',
        'Regular',
        'Bom',
        'Excelente'
    ];

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Por favor, selecione uma avaliação');
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSubmitted(true);

            // Call parent callback
            onSubmit(rating, comment);

            // Redirect after success
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (error) {
            alert('Erro ao enviar avaliação. Tente novamente.');
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="screen-container">
                <div className="max-w-md mx-auto px-4 py-12 text-center">
                    <div className="w-24 h-24 rounded-full bg-feedback-success/20 flex items-center justify-center mx-auto mb-6 animate-scale-in">
                        <CheckCircle size={48} className="text-feedback-success" />
                    </div>

                    <h1 className="text-3xl font-bold text-black dark:text-white mb-3">
                        Avaliação Enviada!
                    </h1>

                    <p className="text-black dark:text-black mb-2">
                        Obrigado pelo seu feedback
                    </p>

                    <p className="text-sm text-black dark:text-black mb-8">
                        Sua avaliação ajuda outros clientes a escolherem os melhores profissionais
                    </p>

                    <div className="animate-pulse">
                        <p className="text-sm text-black">
                            Redirecionando...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="screen-container pb-6">
            {/* Header */}
            <div className="sticky top-0 bg-app-bg dark:bg-gray-900 z-10 px-4 pt-6 pb-4">
                <button
                    onClick={onBack}
                    className="interactive flex items-center gap-2 text-black dark:text-gray-300 mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>

                <h1 className="text-2xl font-bold text-black dark:text-white">
                    Avaliar Profissional
                </h1>
            </div>

            <div className="px-4 space-y-6">
                {/* Provider Info */}
                <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-yellow to-accent-orange flex items-center justify-center text-3xl">
                            {provider?.photo || order?.providerPhoto || '👨‍🔧'}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-black dark:text-white">
                                {provider?.name || order?.providerName || 'Nome do Profissional'}
                            </h2>
                            <p className="text-sm text-black dark:text-black">
                                {order?.serviceTitle || 'Serviço'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-black dark:text-black">
                            Pedido #{order?.id} • {new Date(order?.date).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </Card>

                {/* Rating Stars */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black dark:text-white mb-4 text-center">
                        Como foi sua experiência?
                    </h3>

                    <div className="flex justify-center gap-3 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="interactive transition-transform "
                            >
                                <Star
                                    size={48}
                                    className={`transition-colors ${star <= (hoveredRating || rating)
                                        ? 'text-accent-yellow fill-accent-yellow'
                                        : 'text-gray-300 dark:text-black'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    {rating > 0 && (
                        <p className="text-center text-lg font-medium text-accent-orange animate-fade-in">
                            {ratingLabels[rating]}
                        </p>
                    )}
                </Card>

                {/* Comment */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black dark:text-white mb-3">
                        Conte mais sobre sua experiência (opcional)
                    </h3>

                    <textarea
                        placeholder="O que você achou do serviço? Como foi o atendimento?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={6}
                        maxLength={500}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white text-sm focus:ring-2 focus:ring-accent-orange focus:border-transparent resize-none"
                    />

                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-black dark:text-black">
                            Máximo 500 caracteres
                        </p>
                        <p className="text-xs text-black dark:text-black">
                            {comment.length}/500
                        </p>
                    </div>
                </Card>

                {/* Quick Tags (Optional Enhancement) */}
                {rating >= 3 && (
                    <Card className="p-6 animate-fade-in shadow-sm border border-neutral-100 dark:border-neutral-800">
                        <h3 className="font-semibold text-black dark:text-white mb-4">
                            O que você mais gostou?
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {[
                                'Pontualidade',
                                'Qualidade',
                                'Profissionalismo',
                                'Preço Justo',
                                'Simpatia',
                                'Limpeza'
                            ].map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagToggle(tag)}
                                        className={`px-4 py-2 rounded-full text-sm font-normal transition-all border-2 ${isSelected
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 scale-105 shadow-sm'
                                            : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-emerald-200 dark:hover:border-emerald-800'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {rating > 0 && rating < 3 && (
                    <Card className="p-6 animate-fade-in bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                        <h3 className="font-semibold text-red-700 dark:text-red-400 mb-4">
                            O que poderia melhorar?
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {[
                                'Atraso',
                                'Qualidade',
                                'Comunicação',
                                'Preço',
                                'Atendimento',
                                'Limpeza'
                            ].map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagToggle(tag)}
                                        className={`px-4 py-2 rounded-full text-sm font-normal transition-all border-2 ${isSelected
                                            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400 scale-105 shadow-sm'
                                            : 'bg-white dark:bg-neutral-900 border-red-200 dark:border-red-800/50 text-neutral-600 dark:text-neutral-300 hover:border-red-300'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* Submit Button */}
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={rating === 0 || isSubmitting}
                    className="w-full"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Enviando...
                        </span>
                    ) : (
                        'Enviar Avaliação'
                    )}
                </Button>

                <p className="text-xs text-center text-black dark:text-black">
                    Sua avaliação é pública e ajuda outros usuários
                </p>
            </div>
        </div>
    );
};

export default ProviderRating;

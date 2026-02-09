import React, { useState } from 'react';
import {
    ArrowLeft,
    Star,
    MapPin,
    Briefcase,
    Clock,
    Shield,
    MessageCircle,
    Calendar,
    ChevronRight,
    Zap,
    Verified,
    Activity,
    Award,
    CheckCircle
} from 'lucide-react';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon';

interface ProviderProfileProps {
    provider: any;
    onBack: () => void;
    onBookService: (service: any) => void;
    onMessage: () => void;
}

const ProviderProfile: React.FC<ProviderProfileProps> = ({ provider, onBack, onBookService, onMessage }) => {
    const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'about'>('services');

    const userName = resolveUserName(provider);
    const userAvatar = resolveUserAvatar(provider);

    // Enhanced Mock data for demonstration
    const providerData = {
        rating: 4.9,
        reviewCount: 127,
        location: 'São Paulo, SP',
        verified: true,
        completedJobs: 143,
        memberSince: '2023',
        responseTime: '2h',
        bio: 'Profissional com mais de 10 anos de experiência especializada em infraestrutura de alta performance e soluções logísticas complexas. Entrega de excelência garantida.',
        services: [
            {
                id: '1',
                title: 'Manutenção Estrutural Premium',
                description: 'Auditoria completa e reparo de alta performance em sistemas prediais.',
                price: 185,
                priceType: 'hourly' as const,
                duration: '2-4h'
            },
            {
                id: '2',
                title: 'Resposta de Emergência Crítica',
                description: 'Identificação rápida e correção em tempo real de falhas de infraestrutura.',
                price: 350,
                priceType: 'fixed' as const,
                duration: '1-2h'
            }
        ],
        reviews: [
            {
                id: '1',
                clientName: 'Agente de Mercado Alpha',
                rating: 5,
                date: '2024-01-15',
                comment: 'Execução excelente. O sistema foi restaurado para performance máxima dentro da janela prevista.'
            },
            {
                id: '2',
                clientName: 'Contratante Gamma',
                rating: 5,
                date: '2024-01-10',
                comment: 'Alto fator de confiança. Pontual e tecnicamente preciso.'
            }
        ],
        certifications: ['Padrão Global de Segurança', 'Protocolo Indústria 4.0', 'Auditor de Infraestrutura Avançado']
    };

    return (
        <div className="min-h-screen bg-bg-primary pb-20 animate-fade-in relative overflow-x-hidden">
            {/* Visual Header (Immersive) */}
            <div className="h-[280px] relative overflow-hidden">
                <img
                    src={`https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80`}
                    className="w-full h-full object-cover"
                    alt="cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent"></div>

                <div className="absolute top-12 left-6 right-6 flex items-center justify-between z-20">
                    <button onClick={onBack} className="btn-icon !bg-bg-primary/40 backdrop-blur-md border-white/10">
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <button className="btn-icon !bg-bg-primary/40 backdrop-blur-md border-white/10">
                        <Activity size={20} className="text-white" />
                    </button>
                </div>

                <div className="absolute bottom-[-40px] left-8 z-30 flex items-end gap-6">
                    <div className="relative">
                        <div className="w-36 h-36 rounded-[40px] border-[6px] border-bg-primary overflow-hidden shadow-2xl">
                            <img src={userAvatar} className="w-full h-full object-cover" alt={userName} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent-primary rounded-2xl flex items-center justify-center text-bg-primary shadow-glow border-[3px] border-bg-primary">
                            <Verified size={18} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-16 px-8">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="heading-3xl">{userName}</h1>
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="meta !text-text-tertiary flex items-center gap-1.5">
                                <MapPin size={12} className="text-accent-primary" /> {providerData.location}
                            </p>
                            <p className="meta !text-text-tertiary flex items-center gap-1.5 font-normal">
                                <Star size={12} className="text-warning" fill="currentColor" /> {providerData.rating} ({providerData.reviewCount} avaliações)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onMessage}
                        className="w-14 h-14 rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center text-text-secondary   transition-all shadow-lg"
                    >
                        <WhatsAppIcon size={24} />
                    </button>
                </div>

                {/* Performance Analytics Bar */}
                <div className="grid grid-cols-3 gap-3 mb-12">
                    <div className="bg-bg-secondary p-4 rounded-2xl border border-border-subtle text-center group interactive">
                        <p className="meta !text-[8px] mb-1 opacity-60 font-normal">Trabalhos Verificados</p>
                        <p className="text-xl font-black text-text-primary dark:text-white">{providerData.completedJobs}</p>
                        <p className="meta !text-[7px] text-accent-primary font-normal">+4.2% rendimento</p>
                    </div>
                    <div className="bg-bg-secondary p-4 rounded-2xl border border-border-subtle text-center group interactive">
                        <p className="meta !text-[8px] mb-1 opacity-60 font-normal">Tempo de Resposta</p>
                        <p className="text-xl font-black text-text-primary dark:text-white">{providerData.responseTime}</p>
                        <p className="meta !text-[7px] text-text-tertiary font-normal">líder de mercado</p>
                    </div>
                    <div className="bg-bg-secondary p-4 rounded-2xl border border-border-subtle text-center group interactive">
                        <p className="meta !text-[8px] mb-1 opacity-60 font-normal">Índice de Confiança</p>
                        <p className="text-xl font-black text-accent-primary">AA+</p>
                        <p className="meta !text-[7px] text-text-tertiary font-normal">autorizado</p>
                    </div>
                </div>

                {/* Service Terminal Tabs */}
                <div className="flex gap-2 mb-8 bg-bg-secondary p-1.5 rounded-2xl border border-border-subtle">
                    {[
                        { id: 'services', label: 'Ofertas' },
                        { id: 'about', label: 'Credenciais' },
                        { id: 'reviews', label: 'Histórico' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 rounded-xl heading-md text-[10px] font-normal transition-all ${activeTab === tab.id
                                ? 'bg-bg-tertiary text-accent-primary border border-border-medium shadow-md'
                                : 'text-text-tertiary'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content Area */}
                <div className="space-y-6">
                    {activeTab === 'services' && (
                        <div className="space-y-4">
                            {providerData.services.map((service) => (
                                <div key={service.id} className="bg-bg-secondary rounded-3xl border border-border-subtle p-6 transition-all  group interactive">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 pr-6">
                                            <h3 className="heading-xl mb-1 group">
                                                {service.title}
                                            </h3>
                                            <p className="meta !text-[9px] px-2 py-0.5 rounded-md bg-accent-primary/10 text-accent-primary inline-block mb-3 font-normal">
                                                protocolo de {service.duration}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-tertiary group">
                                            <Zap size={18} />
                                        </div>
                                    </div>

                                    <p className="body !text-xs text-text-secondary line-clamp-2 mb-6 opacity-70 font-normal">
                                        {service.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-5 border-t border-border-subtle">
                                        <div>
                                            <span className="text-2xl font-black text-text-primary dark:text-white">
                                                R$ {service.price}
                                            </span>
                                            <span className="meta !text-[8px] text-text-tertiary ml-2 font-normal">
                                                {service.priceType === 'hourly' ? '/ hora base' : ' contrato fixo'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => onBookService(service)}
                                            className="btn-primary !h-[48px] !px-6 !text-[11px] !rounded-xl font-normal"
                                        >
                                            Confirmar Contratação
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="space-y-4 pb-10">
                            <div className="bg-bg-secondary rounded-3xl border border-border-subtle p-8">
                                <p className="meta !text-accent-primary text-[9px] mb-4 font-normal">Narrativa de Experiência</p>
                                <p className="body !leading-relaxed">
                                    {providerData.bio}
                                </p>
                            </div>

                            <div className="bg-bg-secondary rounded-3xl border border-border-subtle p-8">
                                <h3 className="heading-md text-text-tertiary mb-6 flex items-center gap-2">
                                    <Award size={16} /> Autorizações de Mercado
                                </h3>
                                <div className="space-y-4">
                                    {providerData.certifications.map((cert, idx) => (
                                        <div key={idx} className="flex items-center gap-4 group">
                                            <div className="w-2 h-2 rounded-full bg-accent-primary shadow-glow group transition-transform"></div>
                                            <span className="text-xs font-normal text-text-secondary group transition-colors">
                                                {cert}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-4 pb-10">
                            {providerData.reviews.map((review) => (
                                <div key={review.id} className="bg-bg-secondary rounded-3xl border border-border-subtle p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-tertiary border border-border-medium">
                                                <Activity size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-normal text-text-primary">
                                                    {review.clientName}
                                                </p>
                                                <p className="meta !text-[8px] text-text-tertiary font-normal">
                                                    {new Date(review.date).toLocaleDateString()} • Contrato Verificado
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-warning">
                                            <Star size={10} fill="currentColor" />
                                            <span className="text-[10px] font-normal">{review.rating}</span>
                                        </div>
                                    </div>
                                    <p className="body !text-xs !leading-snug text-text-secondary italic font-normal">
                                        "{review.comment}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Safe Area for Mobile */}
            <div className="h-20"></div>
        </div>
    );
};

export default ProviderProfile;

import React, { useState } from 'react';
import { ArrowLeft, Search, Star, MapPin, Briefcase, Filter } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

interface Provider {
    id: string;
    name: string;
    photo: string;
    rating: number;
    reviewCount: number;
    location: string;
    services: string[];
    hourlyRate?: number;
    verified: boolean;
    completedJobs: number;
}

interface ProviderListingProps {
    onBack: () => void;
    onSelectProvider: (provider: Provider) => void;
    category?: string;
}

const ProviderListing: React.FC<ProviderListingProps> = ({ onBack, onSelectProvider, category }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'topRated' | 'verified'>('all');

    // Mock data
    const providers: Provider[] = [
        {
            id: '1',
            name: 'João Silva',
            photo: '👨‍🔧',
            rating: 4.9,
            reviewCount: 127,
            location: 'São Paulo, SP',
            services: ['Encanamento', 'Instalação Hidráulica'],
            hourlyRate: 85,
            verified: true,
            completedJobs: 143
        },
        {
            id: '2',
            name: 'Maria Santos',
            photo: '👩‍💼',
            rating: 4.8,
            reviewCount: 89,
            location: 'Rio de Janeiro, RJ',
            services: ['Eletricista', 'Manutenção Elétrica'],
            hourlyRate: 95,
            verified: true,
            completedJobs: 98
        },
        {
            id: '3',
            name: 'Carlos Oliveira',
            photo: '👨‍🎨',
            rating: 4.7,
            reviewCount: 64,
            location: 'Belo Horizonte, MG',
            services: ['Pintura', 'Decoração'],
            hourlyRate: 70,
            verified: false,
            completedJobs: 72
        },
        {
            id: '4',
            name: 'Ana Costa',
            photo: '👩‍🍳',
            rating: 5.0,
            reviewCount: 156,
            location: 'Curitiba, PR',
            services: ['Chef Particular', 'Catering'],
            hourlyRate: 120,
            verified: true,
            completedJobs: 201
        },
        {
            id: '5',
            name: 'Pedro Almeida',
            photo: '👨‍💻',
            rating: 4.6,
            reviewCount: 43,
            location: 'Porto Alegre, RS',
            services: ['Suporte Técnico', 'Instalação de Rede'],
            hourlyRate: 80,
            verified: false,
            completedJobs: 51
        }
    ];

    const filteredProviders = providers.filter(provider => {
        const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

        if (selectedFilter === 'topRated') {
            return matchesSearch && provider.rating >= 4.8;
        }
        if (selectedFilter === 'verified') {
            return matchesSearch && provider.verified;
        }
        return matchesSearch;
    });

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

                <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
                    {category || 'Prestadores'}
                </h1>

                {/* Search */}
                <Input
                    icon={Search}
                    placeholder="Buscar prestador ou serviço..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Filters */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 hide-scrollbar">
                    <button
                        onClick={() => setSelectedFilter('all')}
                        className={`pill ${selectedFilter === 'all' ? 'pill--active' : ''}`}
                    >
                        <Filter size={16} />
                        <span>Todos</span>
                    </button>
                    <button
                        onClick={() => setSelectedFilter('topRated')}
                        className={`pill ${selectedFilter === 'topRated' ? 'pill--active' : ''}`}
                    >
                        <Star size={16} />
                        <span>Mais Avaliados</span>
                    </button>
                    <button
                        onClick={() => setSelectedFilter('verified')}
                        className={`pill ${selectedFilter === 'verified' ? 'pill--active' : ''}`}
                    >
                        <span>✓ Verificados</span>
                    </button>
                </div>
            </div>

            {/* Provider List */}
            <div className="px-4 space-y-3">
                {filteredProviders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-black dark:text-black">
                            Nenhum prestador encontrado
                        </p>
                    </div>
                ) : (
                    filteredProviders.map((provider) => (
                        <button
                            key={provider.id}
                            onClick={() => onSelectProvider(provider)}
                            className="w-full card interactive p-4 text-left  transition-all"
                        >
                            <div className="flex gap-4">
                                {/* Photo */}
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-yellow to-accent-orange flex items-center justify-center text-3xl flex-shrink-0">
                                    {provider.photo}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-semibold text-black dark:text-white truncate">
                                            {provider.name}
                                        </h3>
                                        {provider.verified && (
                                            <Badge variant="success" size="sm">
                                                ✓ Verificado
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Star size={14} className="text-accent-yellow fill-accent-yellow" />
                                            <span className="text-sm font-normal text-black dark:text-white">
                                                {provider.rating.toFixed(1)}
                                            </span>
                                        </div>
                                        <span className="text-xs text-black dark:text-black">
                                            ({provider.reviewCount} avaliações)
                                        </span>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-center gap-1 text-xs text-black dark:text-black mb-2">
                                        <MapPin size={12} />
                                        <span>{provider.location}</span>
                                    </div>

                                    {/* Services */}
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {provider.services.slice(0, 2).map((service, idx) => (
                                            <Badge key={idx} variant="secondary" size="sm">
                                                {service}
                                            </Badge>
                                        ))}
                                        {provider.services.length > 2 && (
                                            <Badge variant="secondary" size="sm">
                                                +{provider.services.length - 2}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-xs text-black dark:text-black">
                                        <div className="flex items-center gap-1">
                                            <Briefcase size={12} />
                                            <span>{provider.completedJobs} trabalhos</span>
                                        </div>
                                        {provider.hourlyRate && (
                                            <span className="font-normal text-accent-orange">
                                                R$ {provider.hourlyRate}/h
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProviderListing;

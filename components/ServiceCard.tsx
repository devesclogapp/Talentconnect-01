import React from 'react';
import { Heart, Star, MapPin } from 'lucide-react';
import { getCategoryImage } from '../constants';
import { formatNumber } from '../utils/format';

interface ServiceCardProps {
    service: any;
    onClick: (service: any) => void;
    resolveUserName?: (user: any) => string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick, resolveUserName }) => {
    const providerName = service.provider?.name || (resolveUserName ? resolveUserName(service.provider) : 'Profissional Verificado');

    return (
        <button
            onClick={() => onClick(service)}
            className="w-full flex gap-4 py-6 px-1 hover:bg-neutral-50/50 transition-colors text-left group"
        >
            {/* Left side: Image */}
            <div className="relative w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                <img
                    src={service.image_url || getCategoryImage(service.category)}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getCategoryImage(service.category);
                    }}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    alt={service.title}
                />
                {/* Rating badge on image - Now with 5 stars as requested */}
                <div className="absolute bottom-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-white/90 backdrop-blur rounded shadow-sm">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className="text-warning" fill="currentColor" />
                    ))}
                </div>
            </div>

            {/* Right side: Content */}
            <div className="flex-1 flex flex-col min-w-0 pr-2">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-[15px] font-normal text-black leading-snug line-clamp-2">
                        {service.title}
                    </h3>
                    <Heart size={18} className="text-neutral-400 shrink-0 cursor-pointer hover:fill-neutral-400 transition-all" />
                </div>

                {/* Price */}
                <div className="flex flex-col mb-2">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-normal text-black">
                            R$ {formatNumber(service.base_price)}
                        </span>
                        {service.pricing_mode === 'hourly' && (
                            <span className="text-[10px] text-neutral-600 font-normal">/hora</span>
                        )}
                    </div>
                    {/* Fake installments to mirror the style */}
                    <p className="text-[12px] text-neutral-500 font-normal">
                        Até 12x de R$ {formatNumber(service.base_price / 12)}
                    </p>
                </div>

                {/* Tags/Badges */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-black font-semibold text-[13px]">
                        <span>Atendimento imediato</span>
                    </div>

                    <p className="text-[13px] text-neutral-600 font-normal mt-1">
                        Vendido por <span className="text-black font-medium">{providerName}</span>
                    </p>
                </div>

                {/* Location at bottom */}
                <div className="mt-auto flex items-center gap-1 text-[11px] text-neutral-400 italic">
                    <MapPin size={10} />
                    <span>São Paulo, SP</span>
                </div>
            </div>
        </button>
    );
};

export default ServiceCard;

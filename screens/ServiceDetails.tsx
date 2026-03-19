import React from 'react';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { CATEGORY_MAP, getCategoryImage } from '../constants';
import { formatNumber } from '../utils/format';

interface Props {
  service: any;
  onBack: () => void;
  onBook: (s: any) => void;
}

const ServiceDetails: React.FC<Props> = ({ service, onBack, onBook }) => {
  if (!service) return null;

  const providerName = service.provider?.name || 'Profissional';
  const providerAvatar = service.provider?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName)}&background=34A853&color=fff`;
  const serviceImage = service.image_url || getCategoryImage(service.category);
  const reviews = service.provider?.provider_profile?.total_ratings || 0;

  return (
    <div className="bg-white min-h-screen">
      {/* Header Cover - Immersive Image Style */}
      <div className="relative h-[380px] w-full overflow-hidden bg-neutral-100">
        <img
          src={serviceImage}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getCategoryImage(service.category);
          }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000"
          alt={service.title}
        />

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-black/30"></div>
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Back Button (Floating White Circle) */}
        <button
          onClick={onBack}
          className="absolute top-12 left-6 w-11 h-11 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-black shadow-lg z-20 active:scale-90 transition-all border border-white/20"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Content Overlay at the base of the image */}
        <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
          <div className="space-y-1 drop-shadow-sm">
            <span className="text-[10px] font-black text-black/60 uppercase tracking-[0.2em]">{service.category || 'Serviço'}</span>
            <h1 className="text-2xl font-black text-black leading-tight max-w-[220px]">{service.title}</h1>
          </div>
          <div className="text-right drop-shadow-sm">
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] font-black text-accent-primary">R$</span>
              <span className="text-4xl font-black text-black leading-none">{formatNumber(service.base_price)}</span>
            </div>
            <p className="text-[9px] text-black/40 uppercase tracking-widest font-black mt-1">
              {service.pricing_mode === 'hourly' ? 'por hora base' : 'valor fechado'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 space-y-10 pt-8 pb-40">
        {/* Rating Section - Verified Professional Look */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="text-warning" fill="currentColor" />
            ))}
          </div>
          <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
            {reviews > 0 ? `${reviews} avaliações` : 'Especialista Verificado'}
          </span>
        </div>

        {/* Provider Profile Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">Sobre o Profissional</h3>
          <div className="flex items-center gap-4 bg-neutral-50/50 p-5 rounded-[32px] border border-neutral-100/50 group interactive">
            <div className="relative">
              <img src={providerAvatar} alt={providerName} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-base font-black text-black mb-0.5">{providerName}</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                {service.provider?.provider_profile?.professional_title || 'Expert Talent Connect'}
              </p>
            </div>
            <button className="w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center text-text-secondary hover:text-accent-primary transition-colors shadow-sm">
              <MessageSquare size={18} />
            </button>
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">Descrição Técnica</h3>
          <p className="text-sm text-neutral-600 leading-relaxed font-medium tracking-tight">
            {service.description || "Este especialista ainda não adicionou um protocolo detalhado para este serviço."}
          </p>
        </div>

        {/* Trust & Speed Badges */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-50/50 p-6 rounded-[28px] border border-neutral-100/50 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black shadow-sm">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-black leading-tight">Garantia <br />Connect</p>
          </div>
          <div className="bg-neutral-50/50 p-6 rounded-[28px] border border-neutral-100/50 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black shadow-sm">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-black leading-tight">Reserva <br />Expressa</p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-6 bg-white/80 backdrop-blur-xl border-t border-neutral-100/60 z-50">
        <button
          onClick={() => onBook(service)}
          className="w-full py-5 bg-black text-white text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl active:scale-[0.98] transition-all hover:bg-neutral-900"
        >
          Iniciar Agendamento
        </button>
      </div>
    </div>
  );
};

export default ServiceDetails;

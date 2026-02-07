import React from 'react';

interface Props {
  service: any;
  onBack: () => void;
  onBook: (s: any) => void;
}

const ServiceDetails: React.FC<Props> = ({ service, onBack, onBook }) => {
  if (!service) return null;

  const providerName = service.provider?.name || 'Profissional';
  const providerAvatar = service.provider?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName)}&background=34A853&color=fff`;
  const serviceImage = service.image_url || `https://picsum.photos/seed/${service.id}/600/400`;
  const rating = service.provider?.provider_profile?.rating_average || 0;
  const reviews = service.provider?.provider_profile?.total_ratings || 0;

  return (
    <div className="bg-app-bg min-h-screen transition-colors">
      <div className="relative h-[300px] w-full">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${serviceImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-black/30"></div>
        </div>
        <button onClick={onBack} className="absolute top-12 left-6 w-10 h-10 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center text-app-text shadow-xl z-20">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="relative -mt-10 bg-app-bg rounded-t-[40px] p-8 space-y-6 pb-40">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="bg-primary-green/10 text-black-green-dark meta-bold px-3 py-1 rounded-full tracking-widest !text-[10px]">{service.category}</span>
            <h1 className="heading-xl text-text-primary">{service.title}</h1>
            <p className="meta-bold text-text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-warning fill-1">star</span>
              {rating > 0 ? rating : 'Novo'} {reviews > 0 ? `• ${reviews} avaliações` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="heading-xl text-black-green-dark">R${service.base_price}<span className="meta-bold text-text-secondary !text-xs">{service.pricing_mode === 'hourly' ? '/h' : ''}</span></p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="meta-bold text-text-primary tracking-[0.2em] !text-[10px]">Sobre o Profissional</h3>
          <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800">
            <img src={providerAvatar} alt={providerName} className="w-12 h-12 rounded-full object-cover" />
            <div className="flex-1">
              <p className="body-bold text-text-primary">{providerName}</p>
              <p className="meta text-text-secondary !text-[10px]">Verificado Talent Connect • {service.provider?.provider_profile?.professional_title || 'Profissional'}</p>
            </div>
            <button className="text-black-green"><span className="material-symbols-outlined">chat</span></button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="meta-bold text-text-primary tracking-[0.2em] !text-[10px]">Descrição</h3>
          <p className="body text-text-primary leading-relaxed">
            {service.description || "Este profissional ainda não adicionou uma descrição detalhada para este serviço."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="bg-info/5 dark:bg-info/10 p-4 rounded-3xl border border-info/10 dark:border-info/20">
            <span className="material-symbols-outlined text-info">verified_user</span>
            <p className="meta-bold text-info mt-2 !text-[10px]">Garantia Talent Connect</p>
          </div>
          <div className="bg-success/5 dark:bg-success/10 p-4 rounded-3xl border border-success/10 dark:border-success/20">
            <span className="material-symbols-outlined text-success">bolt</span>
            <p className="meta-bold text-success mt-2 !text-[10px]">Express Booking</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-6 bg-white dark:bg-black border-t border-neutral-100 dark:border-neutral-800 z-50 animate-slide-up">
        <button onClick={() => onBook(service)} className="w-full py-5 bg-black text-white label-semibold rounded-[6px] shadow-xl shadow-black/20 active:scale-[0.98] transition-all">
          Agendar Agora
        </button>
      </div>
    </div>
  );
};

export default ServiceDetails;

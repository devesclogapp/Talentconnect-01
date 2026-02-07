import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowLeft,
  Filter,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  LayoutGrid,
  ListFilter,
  ChevronDown,
  Zap
} from 'lucide-react';
import { getActiveServices } from '../services/servicesService';
import { CATEGORIES_LIST, CATEGORY_MAP } from '../constants';

const CATEGORIES = ['Todos', ...CATEGORIES_LIST.map(c => c.id)];

interface Props {
  onBack: () => void;
  onSelectService: (s: any) => void;
  initialCategory?: string;
}



const ServiceListing: React.FC<Props> = ({ onBack, onSelectService, initialCategory }) => {
  const [filter, setFilter] = useState(initialCategory || 'Todos');
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await getActiveServices();
        setServices(data || []);
      } catch (error) {
        console.error("Market discovery error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = services.filter(s => {
    const matchesFilter = filter === 'Todos' || s.category === filter;
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-bg-primary min-h-screen pb-20 animate-fade-in relative overflow-x-hidden">
      {/* Neo-Financial Discovery Header */}
      <header className="header-glass sticky top-0 px-6 pt-12 pb-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="btn-icon">
              <ArrowLeft size={20} className="text-text-secondary" />
            </button>
            <div>
              <p className="meta !text-[8px] text-text-tertiary leading-none font-normal">Matriz de descoberta</p>
              <h1 className="heading-lg tracking-tight">Serviços do mercado</h1>
            </div>
          </div>
          <button className="btn-icon">
            <ListFilter size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Technical Search Field */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar por serviços..."
            className="input !pl-12 !h-12 !bg-bg-secondary/60 border-border-subtle focus:border-accent-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Chips - High Contrast */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-full font-normal text-[11px] transition-all whitespace-nowrap border ${filter === cat
                ? 'bg-accent-primary text-bg-primary border-accent-primary shadow-glow'
                : 'bg-bg-tertiary text-text-tertiary border-border-medium'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
            <p className="meta !text-accent-primary text-[10px] animate-pulse font-normal">Sincronizando catálogo...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-32 bg-bg-secondary/40 rounded-[40px] border border-dashed border-border-medium px-10">
            <Search size={40} className="text-text-tertiary mx-auto mb-4 opacity-20" />
            <p className="heading-md text-text-tertiary">Nenhum serviço encontrado</p>
            <p className="meta !text-[9px] text-text-tertiary mt-2 font-normal">Ajuste seus filtros para descobrir mais.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredServices.map(service => (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className="group bg-bg-secondary rounded-[32px] border border-border-subtle overflow-hidden shadow-lg active:scale-[0.98] transition-all cursor-pointer "
              >
                <div className="relative h-60 overflow-hidden">
                  <img src={service.image_url || CATEGORY_MAP[service.category]?.image || `https://picsum.photos/seed/${service.id}/600/400`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={service.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-transparent to-transparent"></div>

                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-full bg-bg-primary/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-accent-primary tracking-widest">
                      {service.category}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
                        <img src={service.provider?.avatar_url || `https://i.pravatar.cc/100?u=${service.id}`} alt="provider" className="w-full h-full object-cover" />
                      </div>
                      <span className="meta !text-text-primary dark:!text-white !text-[9px] font-normal">{service.provider?.name || 'Prestador Autorizado'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-bg-primary/80 dark:bg-black/80 backdrop-blur px-3 py-1.5 rounded-2xl border border-white/10 shadow-xl">
                      <Star size={12} className="text-accent-primary" fill="currentColor" />
                      <span className="text-[10px] font-bold text-text-primary dark:text-white">4.9</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <h3 className="heading-xl tracking-tight leading-tight mb-2 group transition-colors">{service.title}</h3>
                      <div className="flex items-center gap-4 text-text-tertiary">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} />
                          <span className="text-[10px] font-bold tracking-wider">Metropolis, BR</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span className="text-[10px] font-bold">Início em 2h</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 mb-1">
                        <span className="text-[12px] font-bold text-accent-secondary">R$</span>
                        <span className="text-[22px] font-black text-text-primary leading-none">{service.base_price}</span>
                      </div>
                      <p className="text-[8px] text-text-tertiary uppercase tracking-widest font-bold">
                        {service.pricing_mode === 'hourly' ? 'por hora base' : 'valor fechado'}
                      </p>
                    </div>
                  </div>

                  <button className="w-full h-14 rounded-2xl bg-bg-tertiary border border-border-medium flex items-center justify-center gap-3 group group transition-all shadow-md">
                    <span className="heading-md text-[11px] font-normal">Ver portfólio</span>
                    <ArrowRight size={18} className="-rotate-45 group transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ServiceListing;

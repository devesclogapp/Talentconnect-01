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
import ServiceCard from '../components/ServiceCard';

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
        ) : (
          <div className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden px-4">
            <div className="py-3 border-b border-neutral-100 flex justify-between items-center px-1">
              <span className="text-[13px] text-neutral-400 font-normal">{filteredServices.length} resultados</span>
              <div className="flex items-center gap-1 text-black text-[13px] font-medium cursor-pointer">
                <span>Filtrar</span>
                <ChevronDown size={14} />
              </div>
            </div>
            {filteredServices.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={onSelectService}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ServiceListing;

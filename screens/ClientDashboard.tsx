import React, { useState, useEffect } from 'react';
import {
    Search,
    Bell,
    Star,
    Plus,
    TrendingUp,
    Clock,
    ChevronRight,
    Filter,
    ArrowUpRight,
    Zap,
    ShieldCheck,
    Briefcase,
    ArrowRight
} from 'lucide-react';
import { getActiveServices } from '../services/servicesService';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { CATEGORY_MAP, CATEGORIES_LIST } from '../constants';

interface Props {
    onSelectCategory: (category?: string) => void;
    onSelectService: (service: any) => void;
    onNavigate: (v: string) => void;
    user?: any;
}



const ClientDashboard: React.FC<Props> = ({ onSelectCategory, onSelectService, onNavigate, user }) => {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const fetchTopServices = async () => {
            try {
                const data = await getActiveServices();
                setServices(data?.slice(0, 6) || []);
            } catch (error) {
                console.error("Error fetching marketplace services:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchMarketStats = async () => {
            try {
                // We'll import getClientOrders dynamically to avoid circular dependencies if any, 
                // but since it's a service it should be fine.
                const { getClientOrders } = await import('../services/ordersService');
                const orders = await getClientOrders();
                const active = orders?.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status)) || [];
                setActiveOrdersCount(active.length);
            } catch (error) {
                console.error("Error fetching market stats:", error);
            }
        };

        fetchTopServices();
        fetchMarketStats();
    }, []);

    // Auto-play carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % 3);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const userName = resolveUserName(user);
    const userAvatar = resolveUserAvatar(user);
    const [activeOrdersCount, setActiveOrdersCount] = useState(0);

    return (
        <div className="min-h-screen bg-bg-primary pb-32 animate-fade-in overflow-x-hidden">
            {/* Marketplace Navigation Bar */}
            <nav className="header-glass px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-border-medium overflow-hidden">
                        <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="meta !text-[8px] !lowercase text-text-tertiary leading-none font-normal">Acesso autorizado</p>
                        <h2 className="heading-md font-bold">Início</h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="btn-icon relative">
                        <Bell size={18} className="text-text-secondary" />
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-accent-primary rounded-full shadow-glow"></span>
                    </button>
                    <button onClick={() => onNavigate('MY_ORDERS')} className="btn-icon">
                        <Briefcase size={18} className="text-text-secondary" />
                    </button>
                </div>
            </nav>

            {/* Search Bar - Moved to Top */}
            <section className="px-6 pt-6 pb-4">
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-black transition-colors">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="input !pl-10 !pr-10 !h-12 !text-sm !bg-bg-secondary/30 border-transparent  focus:bg-bg-primary focus:border-border-subtle focus:shadow-sm transition-all rounded-xl font-normal"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Filter size={14} className="text-text-tertiary opacity-50 cursor-pointer transition-opacity" />
                    </div>
                </div>
            </section>

            {/* Loyalty Vector Card */}
            <section className="px-6 pb-4">
                <div className="relative overflow-hidden rounded-[20px]">
                    {/* Carousel Container */}
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${(activeSlide) * 100}%)` }}
                    >
                        {/* Slide 1 - VIP Platinum */}
                        <div className="min-w-full">
                            <div className="card-credit !rounded-[20px] shadow-glow cursor-pointer relative group">
                                <div className="absolute inset-0 z-0">
                                    <img src="/banner1.png" className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                </div>
                                <div className="relative z-10">
                                    <div className="absolute top-0 right-0 p-8">
                                        <Zap className="text-accent-primary opacity-60" size={32} />
                                    </div>
                                    <div className="flex flex-col justify-end h-56 pb-2">
                                        <div>
                                            <p className="meta !text-white/80 font-normal mb-1 pb-1 uppercase tracking-widest !text-[8px]">Exclusivo do mercado</p>
                                            <h3 className="heading-xl text-white font-black leading-tight mb-3">Eleve suas contratações <br />ao nível expert.</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse"></div>
                                            <p className="text-[8px] font-bold text-white uppercase tracking-wider opacity-80">Acesso Platinum ativo</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slide 2 - Expert Network */}
                        <div className="min-w-full">
                            <div className="card-credit !rounded-[20px] shadow-glow cursor-pointer relative group">
                                <div className="absolute inset-0 z-0">
                                    <img src="/banner2.png" className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                </div>
                                <div className="relative z-10">
                                    <div className="absolute top-0 right-0 p-8">
                                        <ShieldCheck className="text-accent-primary opacity-60" size={32} />
                                    </div>
                                    <div className="flex flex-col justify-end h-56 pb-2">
                                        <div>
                                            <p className="meta !text-white/80 font-normal mb-1 pb-1 uppercase tracking-widest !text-[8px]">Profissionais verificados</p>
                                            <h3 className="heading-xl text-white font-black leading-tight mb-3">Conecte-se com <br />especialistas elite.</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                                            <p className="text-[8px] font-bold text-white uppercase tracking-wider opacity-80">Rede 100% verificada</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slide 3 - Premium Services */}
                        <div className="min-w-full">
                            <div className="card-credit !rounded-[20px] shadow-glow cursor-pointer relative group">
                                <div className="absolute inset-0 z-0">
                                    <img src="/banner3.png" className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                </div>
                                <div className="relative z-10">
                                    <div className="absolute top-0 right-0 p-8">
                                        <TrendingUp className="text-accent-primary opacity-60" size={32} />
                                    </div>
                                    <div className="flex flex-col justify-end h-56 pb-2">
                                        <div>
                                            <p className="meta !text-white/80 font-normal mb-1 pb-1 uppercase tracking-widest !text-[8px]">Performance garantida</p>
                                            <h3 className="heading-xl text-white font-black leading-tight mb-3">Serviços de qualidade <br />sob demanda.</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-info animate-pulse"></div>
                                            <p className="text-[8px] font-bold text-white uppercase tracking-wider opacity-80">Suporte 24/7 disponível</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slide Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {[0, 1, 2].map((index) => (
                            <button
                                key={index}
                                onClick={() => setActiveSlide(index)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === index
                                    ? 'w-8 bg-accent-primary'
                                    : 'w-1.5 bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <header className="px-6 pt-6 pb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] -z-10"></div>

                <h2 className="text-[14px] font-normal text-text-primary mb-6">Categorias</h2>

                {/* Market Vectors (Categories) */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
                    {CATEGORIES_LIST.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => onSelectCategory(cat.id)}
                                className="flex flex-col items-center gap-3 min-w-[80px] group interactive"
                            >
                                <div className="w-16 h-16 rounded-[24px] bg-bg-secondary border border-border-subtle flex items-center justify-center text-text-tertiary group-hover:bg-accent-primary group-hover:text-bg-primary group-hover:border-accent-primary group-hover:shadow-glow transition-all duration-300">
                                    <Icon size={24} />
                                </div>
                                <span className="text-[10px] font-normal text-text-secondary group-hover:text-text-primary transition-colors">{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            </header>

            <main className="px-6 mt-12 space-y-14">
                {/* Featured Service Grid - Showcase Style */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="heading-lg mb-1">Operações em Destaque</h4>
                            <p className="meta !text-[8px] !lowercase text-text-tertiary font-normal">Serviços de alta performance em tempo real</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="h-64 col-span-2 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
                                    <span className="meta text-text-primary !text-[10px] font-normal">Lendo Mercado...</span>
                                </div>
                            </div>
                        ) : services.length === 0 ? (
                            <div className="p-12 text-center bg-bg-secondary/20 rounded-[32px] border border-dashed border-border-subtle">
                                <Zap size={40} className="mx-auto text-text-tertiary mb-4 opacity-20" />
                                <p className="meta text-text-tertiary !text-[10px] font-normal">Mercado limpo. Aguardando novos especialistas.</p>
                            </div>
                        ) : services.map(service => (
                            <div
                                key={service.id}
                                onClick={() => onSelectService(service)}
                                className="group relative rounded-[32px] overflow-hidden bg-bg-secondary border border-border-subtle transition-all active:scale-[0.98] cursor-pointer shadow-lg flex items-center pr-5"
                            >
                                <div className="relative w-32 h-32 shrink-0 overflow-hidden bg-bg-tertiary flex items-center justify-center">
                                    <img
                                        src={service.image_url || CATEGORY_MAP[service.category]?.image || `https://picsum.photos/seed/${service.id}/600/400`}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt={service.title}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).classList.add('opacity-0');
                                            (e.target as HTMLImageElement).parentElement?.classList.add('bg-bg-tertiary');
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent"></div>
                                    <div className="absolute top-2 left-2">
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-bg-primary/60 backdrop-blur-md border border-white/20">
                                            <Star size={8} className="text-accent-secondary" fill="currentColor" />
                                            <span className="text-[8px] font-bold text-text-primary">4.9</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 pl-4 py-1">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1">
                                            <span className="meta px-1.5 py-0.5 rounded-md bg-accent-primary/10 text-text-primary border border-accent-primary/20 mb-1 inline-block text-[9px] font-normal">
                                                {service.category}
                                            </span>
                                            <h3 className="heading-lg leading-tight line-clamp-1 text-[15px] font-bold">{service.title}</h3>
                                        </div>
                                    </div>

                                    <p className="body !text-[10px] line-clamp-2 text-text-secondary mb-2 leading-snug font-normal">
                                        {service.description || "Execução de serviço de nível expert com garantia de qualidade premium."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full border border-border-medium overflow-hidden">
                                                <img src={`https://i.pravatar.cc/150?u=${service.provider_id}`} alt="provider" className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-[9px] font-normal text-text-primary">Prestador Verificado</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-[10px] font-bold text-accent-secondary">R$</span>
                                                <span className="text-lg font-black text-text-primary leading-none">{service.base_price}</span>
                                            </div>
                                            <p className="text-[7px] text-text-tertiary uppercase tracking-tighter font-bold mt-0.5">
                                                {service.pricing_mode === 'hourly' ? 'por hora' : 'valor fixo'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Market Intelligence (Analytics Row) */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-secondary p-6 rounded-3xl border border-border-subtle relative overflow-hidden group interactive">
                        <div className="absolute right-[-10px] top-[-10px] opacity-5">
                            <TrendingUp size={60} />
                        </div>
                        <p className="meta !text-[8px] text-text-tertiary mb-3 font-normal">Operações atuais</p>
                        <h5 className="text-3xl font-bold text-text-primary mb-1">
                            {activeOrdersCount.toString().padStart(2, '0')}
                        </h5>
                        <p className="text-[9px] font-normal text-text-primary">Contratos ativos</p>
                    </div>
                    <div className="bg-bg-secondary p-6 rounded-3xl border border-border-subtle relative overflow-hidden group interactive">
                        <p className="meta !text-[8px] text-text-tertiary mb-3 font-normal">Posição no mercado</p>
                        <h5 className="text-3xl font-bold text-text-primary mb-1">
                            {activeOrdersCount > 5 ? 'Elite' : (activeOrdersCount > 0 ? 'Pro' : 'User')}
                        </h5>
                        <p className="text-[9px] font-normal text-text-primary">Nível de conta</p>
                    </div>
                </section>


            </main>
        </div>
    );
};

export default ClientDashboard;

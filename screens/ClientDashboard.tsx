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
    Hammer,
    Brush,
    Dog,
    Monitor,
    ShieldCheck,
    Briefcase,
    ArrowRight
} from 'lucide-react';
import { getActiveServices, getServiceCategories } from '../services/servicesService';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';

interface Props {
    onSelectCategory: (category?: string) => void;
    onSelectService: (service: any) => void;
    onNavigate: (v: string) => void;
    user?: any;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    "Maintenance": <Hammer size={18} />,
    "Manutenção": <Hammer size={18} />,
    "Creative": <Brush size={18} />,
    "Criativo": <Brush size={18} />,
    "Digital": <Monitor size={18} />,
    "Elite": <ShieldCheck size={18} />,
    "Animais": <Dog size={18} />,
    "Consultoria": <Briefcase size={18} />,
};

const ClientDashboard: React.FC<Props> = ({ onSelectCategory, onSelectService, onNavigate, user }) => {
    const [services, setServices] = useState<any[]>([]);
    const [categories, setCategories] = useState<{ name: string, icon: React.ReactNode }[]>([]);
    const [loading, setLoading] = useState(true);
    const [catsLoading, setCatsLoading] = useState(true);
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

        const fetchCategories = async () => {
            try {
                const catNames = await getServiceCategories();
                const fetchedCategories = catNames.map(name => ({
                    name,
                    icon: CATEGORY_ICONS[name] || <Zap size={18} />
                }));
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setCatsLoading(false);
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
        fetchCategories();
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
                        <p className="meta !text-[8px] !lowercase text-text-tertiary leading-none">acesso autorizado</p>
                        <h2 className="heading-md tracking-tight">{userName.split(' ')[0]}</h2>
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
                        className="input !pl-10 !pr-10 !h-12 !text-sm !bg-bg-secondary/30 border-transparent  focus:bg-bg-primary focus:border-border-subtle focus:shadow-sm transition-all rounded-xl"
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
                            <div className="card-credit !rounded-[20px] shadow-glow cursor-pointer">
                                <div className="absolute top-0 right-0 p-8">
                                    <Zap className="text-accent-primary opacity-30" size={32} />
                                </div>
                                <div className="flex flex-col justify-between h-48 pb-6">
                                    <div>
                                        <p className="meta !text-text-tertiary font-black mb-2">Exclusivo do Mercado</p>
                                        <h3 className="heading-2xl text-accent-primary font-black leading-tight">Eleve suas contratações <br />ao Nível Expert.</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-white uppercase tracking-[0.2em] opacity-90">Acesso Platinum Ativo</p>
                                        <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slide 2 - Expert Network */}
                        <div className="min-w-full">
                            <div className="card-credit !rounded-[20px] shadow-glow cursor-pointer">
                                <div className="absolute top-0 right-0 p-8">
                                    <ShieldCheck className="text-accent-primary opacity-30" size={32} />
                                </div>
                                <div className="flex flex-col justify-between h-48 pb-6">
                                    <div>
                                        <p className="meta !text-text-tertiary font-black mb-2">Profissionais Verificados</p>
                                        <h3 className="heading-2xl text-accent-primary font-black leading-tight">Conecte-se com <br />Especialistas Elite.</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-white uppercase tracking-[0.2em]">Rede 100% Verificada</p>
                                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slide 3 - Premium Services */}
                        <div className="min-w-full">
                            <div className="card-credit !rounded-[20px] shadow-glow cursor-pointer">
                                <div className="absolute top-0 right-0 p-8">
                                    <TrendingUp className="text-accent-primary opacity-30" size={32} />
                                </div>
                                <div className="flex flex-col justify-between h-48 pb-6">
                                    <div>
                                        <p className="meta !text-text-tertiary font-black mb-2">Performance Garantida</p>
                                        <h3 className="heading-2xl text-accent-primary font-black leading-tight">Serviços de Qualidade <br />Sob Demanda.</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-white uppercase tracking-[0.2em]">Suporte 24/7 Disponível</p>
                                        <div className="w-2 h-2 rounded-full bg-info animate-pulse"></div>
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

                <h2 className="text-[14px] font-bold text-text-primary mb-6 uppercase tracking-wider">Categoria</h2>

                {/* Market Vectors (Categories) */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
                    {catsLoading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2 min-w-[72px] animate-pulse">
                                <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border-subtle shadow-sm"></div>
                                <div className="h-2 w-10 bg-bg-secondary rounded"></div>
                            </div>
                        ))
                    ) : (
                        categories.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => onSelectCategory(cat.name)}
                                className="flex flex-col items-center gap-2 min-w-[72px] group active:scale-95 transition-transform"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center text-text-tertiary transition-all shadow-sm">
                                    {React.isValidElement(cat.icon) ? React.cloneElement(cat.icon as React.ReactElement, { size: 28 }) : cat.icon}
                                </div>
                                <span className="text-[10px] font-bold text-text-primary uppercase tracking-wide text-center leading-tight max-w-[80px]">{cat.name}</span>
                            </button>
                        ))
                    )}
                </div>
            </header>

            <main className="px-6 mt-12 space-y-14">
                {/* Featured Service Grid - Showcase Style */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="heading-lg tracking-tight mb-1">Operações em Destaque</h4>
                            <p className="meta !text-[8px] !lowercase text-text-tertiary">Serviços de alta performance em tempo real</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="h-64 col-span-2 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
                                    <span className="meta text-text-primary uppercase tracking-[0.2em] !text-[10px]">Lendo Mercado...</span>
                                </div>
                            </div>
                        ) : services.length === 0 ? (
                            <div className="p-12 text-center bg-bg-secondary/20 rounded-[32px] border border-dashed border-border-subtle">
                                <Zap size={40} className="mx-auto text-text-tertiary mb-4 opacity-20" />
                                <p className="meta text-text-tertiary uppercase tracking-widest !text-[10px]">Mercado limpo. Aguardando novos especialistas.</p>
                            </div>
                        ) : services.map(service => (
                            <div
                                key={service.id}
                                onClick={() => onSelectService(service)}
                                className="group relative rounded-3xl overflow-hidden bg-bg-secondary border border-border-subtle p-2 transition-all  active:scale-[0.98] cursor-pointer shadow-lg flex items-center pr-4"
                            >
                                <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden">
                                    <img
                                        src={service.image_url || `https://picsum.photos/seed/${service.id}/600/400`}
                                        alt={service.title}
                                        className="w-full h-full object-cover transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent"></div>
                                    <div className="absolute top-2 left-2">
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-bg-primary/40 backdrop-blur-md border border-white/10">
                                            <Star size={8} className="text-accent-primary" fill="currentColor" />
                                            <span className="text-[8px] font-bold text-white">4.9</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 pl-4 py-1">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1">
                                            <span className="meta px-1.5 py-0.5 rounded-md bg-accent-primary/10 text-text-primary border border-accent-primary/20 mb-1 inline-block text-[9px]">
                                                {service.category}
                                            </span>
                                            <h3 className="heading-lg tracking-tight leading-tight line-clamp-1 text-[15px]">{service.title}</h3>
                                        </div>
                                    </div>

                                    <p className="body !text-[10px] line-clamp-2 opacity-60 mb-2 leading-snug">
                                        {service.description || "Execução de serviço de nível expert com garantia de qualidade premium."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full border border-border-medium overflow-hidden">
                                                <img src={`https://i.pravatar.cc/150?u=${service.provider_id}`} alt="provider" className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-[9px] font-bold text-text-primary uppercase">Prestador Verificado</p>
                                        </div>
                                        <div className="px-2.5 py-1 rounded-full bg-accent-primary text-bg-primary text-[10px] font-black uppercase tracking-widest">
                                            R$ {service.base_price}
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
                        <p className="meta !text-[8px] !lowercase text-text-tertiary mb-3">operações atuais</p>
                        <h5 className="text-3xl font-black text-text-primary tracking-tighter mb-1">
                            {activeOrdersCount.toString().padStart(2, '0')}
                        </h5>
                        <p className="text-[9px] font-bold text-text-primary uppercase">Contratos Ativos</p>
                    </div>
                    <div className="bg-bg-secondary p-6 rounded-3xl border border-border-subtle relative overflow-hidden group interactive">
                        <p className="meta !text-[8px] !lowercase text-text-tertiary mb-3">posição no mercado</p>
                        <h5 className="text-3xl font-black text-text-primary tracking-tighter mb-1">
                            {activeOrdersCount > 5 ? 'ELITE' : (activeOrdersCount > 0 ? 'PRO' : 'USER')}
                        </h5>
                        <p className="text-[9px] font-bold text-text-primary uppercase">Nível de Conta</p>
                    </div>
                </section>


            </main>
        </div>
    );
};

export default ClientDashboard;

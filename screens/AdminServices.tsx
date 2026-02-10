import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Tag,
    User,
    DollarSign,
    Box,
    ExternalLink,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';

const AdminServices: React.FC = () => {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('services')
                .select(`
                    *,
                    provider:provider_id (id, email, user_metadata)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching admin services:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
        try {
            const { error } = await (supabase as any)
                .from('services')
                .update({ active: !currentStatus })
                .eq('id', serviceId);

            if (error) throw error;

            setServices(services.map(s =>
                s.id === serviceId ? { ...s, active: !currentStatus } : s
            ));
        } catch (error) {
            console.error('Error toggling service status:', error);
        }
    };

    const filteredServices = services.filter(service => {
        const title = (service.title || '').toLowerCase();
        const providerName = resolveUserName(service.provider).toLowerCase();
        const category = (service.category || '').toLowerCase();

        const matchesSearch = title.includes(searchTerm.toLowerCase()) ||
            providerName.includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory === 'all' || service.category === filterCategory;

        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(services.map(s => s.category))).filter(Boolean);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="heading-xl text-text-primary">Catálogo Global de Serviços</h1>
                <p className="text-sm text-text-tertiary">Gerencie todos os serviços oferecidos na plataforma</p>
            </div>

            {/* Toolbar */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por título ou profissional..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-accent-primary transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none font-medium"
                    >
                        <option value="all">Todas as Categorias</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-text-tertiary">Carregando serviços...</div>
                ) : filteredServices.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-bg-primary border border-border-subtle rounded-3xl opacity-50">
                        <Box size={48} className="mx-auto mb-4" />
                        <p>Nenhum serviço encontrado.</p>
                    </div>
                ) : (
                    filteredServices.map((service) => (
                        <div key={service.id} className="bg-bg-primary border border-border-subtle rounded-[32px] p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-bg-secondary border border-border-subtle text-accent-primary">
                                    <Tag size={20} />
                                </div>
                                <button
                                    onClick={() => toggleServiceStatus(service.id, service.active)}
                                    className={`transition-colors ${service.active ? 'text-success' : 'text-text-tertiary'}`}
                                >
                                    {service.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-black text-text-primary leading-tight mb-1 group-hover:text-accent-primary transition-colors">
                                        {service.title}
                                    </h3>
                                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{service.category || 'Geral'}</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <User size={14} className="text-text-tertiary" />
                                        <span className="font-medium">{resolveUserName(service.provider)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <DollarSign size={14} className="text-text-tertiary" />
                                        <span className="font-bold">R$ {service.base_price?.toFixed(2)}</span>
                                        <span className="text-[10px] opacity-60">/ {service.pricing_mode === 'hourly' ? 'hora' : 'unid'}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${service.active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                        {service.active ? 'Ativo' : 'Pausado'}
                                    </span>
                                    <button className="p-2 hover:bg-bg-secondary rounded-xl text-text-tertiary transition-colors">
                                        <ExternalLink size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Decorative background number */}
                            <span className="absolute -right-4 -bottom-4 text-7xl font-black text-text-primary opacity-[0.02] pointer-events-none">
                                {service.id.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminServices;

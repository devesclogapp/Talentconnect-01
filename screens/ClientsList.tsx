import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Calendar, MapPin, Search } from 'lucide-react';
import { getProviderOrders } from '../services/ordersService';
import { useAppStore } from '../store';
import { resolveUserAvatar } from '../utils/userUtils';

interface ClientData {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
    phone?: string;
    city?: string; // If available in metadata, currently not fetched deep
    lastServiceDate: string;
    totalServices: number;
}

interface Props {
    onBack: () => void;
}

const ClientsList: React.FC<Props> = ({ onBack }) => {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            try {
                setLoading(true);
                const orders = await getProviderOrders();

                const clientMap = new Map<string, ClientData>();

                orders.forEach(order => {
                    // Consider only completed orders for "Served Clients" list? 
                    // Or all clients ever interacted with? Usually "Atendidos" implies completed services.
                    if (order.status === 'completed' && order.client) {
                        const existing = clientMap.get(order.client.id);
                        const orderDate = order.created_at; // simplified, ideally execution_end

                        if (existing) {
                            existing.totalServices += 1;
                            if (new Date(orderDate) > new Date(existing.lastServiceDate)) {
                                existing.lastServiceDate = orderDate;
                            }
                        } else {
                            clientMap.set(order.client.id, {
                                id: order.client.id,
                                name: order.client.name || 'Cliente',
                                avatar_url: order.client.avatar_url,
                                email: order.client.email,
                                phone: order.client.phone,
                                lastServiceDate: orderDate,
                                totalServices: 1
                            });
                        }
                    }
                });

                setClients(Array.from(clientMap.values()));
            } catch (error) {
                console.error("Error fetching clients", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-bg-primary animate-fade-in font-sans">
            <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle px-4 py-4 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors text-text-primary"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-text-primary leading-tight">Clientes Atendidos</h1>
                    <p className="text-[11px] text-text-tertiary font-normal">
                        Sua base de fidelidade
                    </p>
                </div>
            </header>

            <main className="p-4 space-y-6">
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary border border-border-subtle rounded-2xl pl-12 pr-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-8 h-8 border-2 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
                        <p className="text-xs text-text-tertiary animate-pulse font-normal">Carregando carteira...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-60">
                        <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center text-text-tertiary mb-2">
                            <User size={32} />
                        </div>
                        <h3 className="heading-md">Nenhum cliente encontrado</h3>
                        <p className="text-sm text-text-tertiary max-w-[200px]">
                            {searchTerm ? 'Tente outro termo de busca.' : 'Complete serviços para construir sua lista de clientes!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredClients.map(client => (
                            <div key={client.id} className="bg-bg-secondary border border-border-subtle rounded-2xl p-4 flex items-center gap-4 hover:border-accent-primary/30 transition-colors group">
                                <img
                                    src={resolveUserAvatar(client)}
                                    alt={client.name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-bg-primary shadow-sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-text-primary truncate pr-2">{client.name}</h3>
                                        <span className="text-[10px] font-normal bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                                            {client.totalServices} {client.totalServices === 1 ? 'Serviço' : 'Serviços'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-text-tertiary">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(client.lastServiceDate).toLocaleDateString()}
                                        </span>
                                        {client.city && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={12} />
                                                {client.city}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientsList;

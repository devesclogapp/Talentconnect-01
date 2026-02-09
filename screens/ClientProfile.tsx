import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    MapPin,
    Shield,
    MessageCircle,
    Calendar,
    Verified,
    Award,
    CheckCircle,
    User,
    Clock,
    ShoppingBag
} from 'lucide-react';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import { supabase } from '../services/supabaseClient';
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon';

interface ClientProfileProps {
    client: any; // User object
    onBack: () => void;
    onMessage?: () => void;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ client, onBack, onMessage }) => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        memberSince: '',
        trustScore: '100%' // Mock for now
    });
    const [loading, setLoading] = useState(true);

    const userName = resolveUserName(client);
    const userAvatar = resolveUserAvatar(client);

    useEffect(() => {
        const fetchClientStats = async () => {
            if (!client?.id) return;
            setLoading(true);
            try {
                // Fetch completed orders count
                const { count, error } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('client_id', client.id)
                    .eq('status', 'completed');

                // Get membership date
                // Note: created_at might be in client object or we might need to fetch if it's a minimal object
                let createdAt = client?.created_at;
                if (!createdAt) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('created_at')
                        .eq('id', client.id)
                        .single();
                    if (userData) createdAt = (userData as any).created_at;
                }

                const memberYear = createdAt ? new Date(createdAt).getFullYear().toString() : new Date().getFullYear().toString();

                setStats({
                    totalOrders: count || 0,
                    memberSince: memberYear,
                    trustScore: 'Nível 1' // Simplified trust score
                });

            } catch (err) {
                console.error("Error fetching client stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchClientStats();
    }, [client]);

    return (
        <div className="min-h-screen bg-bg-primary pb-20 animate-fade-in relative overflow-x-hidden">
            {/* Visual Header (Immersive) */}
            <div className="h-[280px] relative overflow-hidden">
                {/* Abstract Background for Client */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-900/40 dark:to-purple-900/40"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="absolute top-12 left-6 right-6 flex items-center justify-between z-20">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md flex items-center justify-center text-black dark:text-white shadow-sm border border-black/5 dark:border-white/10 transition-transform active:scale-95">
                        <ArrowLeft size={20} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md flex items-center justify-center text-black dark:text-white shadow-sm border border-black/5 dark:border-white/10 transition-transform active:scale-95">
                        <Shield size={20} />
                    </button>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-end gap-6">
                    <div className="relative">
                        <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl bg-bg-tertiary">
                            <img src={userAvatar} className="w-full h-full object-cover" alt={userName} />
                        </div>
                        <Verified size={48} className="absolute -bottom-2 -right-2 text-white fill-blue-500" />
                    </div>
                </div>
            </div>

            <div className="pt-6 px-8">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="heading-3xl font-medium">{userName}</h1>
                            {client?.email && (
                                <div className="p-1 rounded-full bg-success/10" title="Email verificado">
                                    <CheckCircle size={12} className="text-success" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="meta !text-text-tertiary flex items-center gap-1.5 font-normal">
                                <MapPin size={12} className="text-accent-primary" /> {client?.user_metadata?.city || 'Brasil'}
                            </p>
                            <p className="meta !text-text-tertiary flex items-center gap-1.5 font-normal">
                                <Calendar size={12} /> Membro desde {stats.memberSince}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onMessage}
                        className="w-14 h-14 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center text-text-secondary transition-all shadow-lg active:scale-95"
                    >
                        <WhatsAppIcon size={24} />
                    </button>
                </div>

                {/* Performance Analytics Bar */}
                <div className="grid grid-cols-2 gap-3 mb-12">
                    <div className="bg-bg-secondary p-5 rounded-3xl border border-border-subtle text-center group interactive">
                        <div className="w-10 h-10 mx-auto bg-bg-tertiary rounded-full flex items-center justify-center mb-3 text-accent-primary">
                            <ShoppingBag size={20} />
                        </div>
                        <p className="meta !text-[10px] mb-1 opacity-60 font-normal">Pedidos Concluídos</p>
                        <p className="text-2xl font-black text-text-primary dark:text-white">
                            {loading ? '...' : stats.totalOrders}
                        </p>
                    </div>
                    <div className="bg-bg-secondary p-5 rounded-3xl border border-border-subtle text-center group interactive">
                        <div className="w-10 h-10 mx-auto bg-bg-tertiary rounded-full flex items-center justify-center mb-3 text-green-500">
                            <Shield size={20} />
                        </div>
                        <p className="meta !text-[10px] mb-1 opacity-60 font-normal">Nível de Confiança</p>
                        <p className="text-2xl font-black text-text-primary dark:text-white">{stats.trustScore}</p>
                    </div>
                </div>

                <div className="bg-bg-secondary rounded-3xl border border-border-subtle p-8 mb-8">
                    <h3 className="heading-md text-text-tertiary mb-6 flex items-center gap-2">
                        <Award size={16} /> Selos & Conquistas
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Verified size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary">Identidade Verificada</p>
                                <p className="text-xs text-text-tertiary">Documentação aprovada</p>
                            </div>
                        </div>

                        {stats.totalOrders > 0 && (
                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">Cliente Ativo</p>
                                    <p className="text-xs text-text-tertiary">Realizou pedidos na plataforma</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-accent-primary/5 rounded-3xl border border-accent-primary/10 p-6 text-center">
                    <p className="text-xs text-text-secondary leading-relaxed">
                        Este perfil é verificado pela nossa equipe de segurança e confiança.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default ClientProfile;

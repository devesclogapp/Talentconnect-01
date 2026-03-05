import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Clock, ShoppingBag, CreditCard, Shield, Settings, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAppStore } from '../store';

interface Props {
    onBack: () => void;
}

const PlatformActivity: React.FC<Props> = ({ onBack }) => {
    const { user } = useAppStore();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivity();
    }, []);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            // In a real app, we would fetch from an 'activity_logs' or 'audit_logs' table
            // For now, we'll simulate based on orders and some mock login events
            const { data: orders } = await supabase
                .from('orders')
                .select('*, services(title)')
                .or(`client_id.eq.${user?.id},provider_id.eq.${user?.id}`)
                .order('created_at', { ascending: false })
                .limit(10);

            const mockActivities = ((orders || []) as any[]).map(o => ({
                id: o.id,
                type: 'order',
                title: o.status === 'completed' ? 'Serviço Concluído' : 'Novo Pedido',
                desc: o.services?.title || 'Serviço Profissional',
                time: new Date(o.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                icon: <ShoppingBag size={18} />,
                color: o.status === 'completed' ? 'text-success' : 'text-accent-primary'
            }));

            // Add some mock system events
            const systemEvents = [
                {
                    id: 'sys-1',
                    type: 'security',
                    title: 'Login Realizado',
                    desc: 'Acesso via dispositivo móvel',
                    time: 'Hoje, 09:45',
                    icon: <Shield size={18} />,
                    color: 'text-text-tertiary'
                },
                {
                    id: 'sys-2',
                    type: 'profile',
                    title: 'Perfil Atualizado',
                    desc: 'Alteração de foto e bio',
                    time: 'Ontem, 18:20',
                    icon: <Settings size={18} />,
                    color: 'text-text-tertiary'
                }
            ];

            setActivities([...mockActivities, ...systemEvents]);
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary animate-fade-in pb-20">
            <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle px-4 py-4 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors text-text-primary"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-text-primary leading-tight">Atividade na Plataforma</h1>
                    <p className="text-[11px] text-text-tertiary font-normal">
                        Histórico recente de suas operações
                    </p>
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto">
                <div className="bg-bg-secondary/20 rounded-[32px] border border-border-subtle overflow-hidden">
                    <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity size={20} className="text-accent-primary" />
                            <h3 className="text-sm font-bold text-text-primary">Logs de Eventos</h3>
                        </div>
                        <button className="text-[10px] font-black uppercase text-text-tertiary hover:text-text-primary flex items-center gap-1">
                            <Calendar size={12} /> Filtrar Data
                        </button>
                    </div>

                    <div className="divide-y divide-border-subtle/50">
                        {loading ? (
                            <div className="py-20 text-center">
                                <Clock className="animate-spin mx-auto text-text-tertiary mb-2" />
                                <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Carregando Histórico...</p>
                            </div>
                        ) : activities.length > 0 ? (
                            activities.map((act) => (
                                <div key={act.id} className="p-5 flex gap-4 hover:bg-bg-secondary/40 transition-colors cursor-pointer group">
                                    <div className={`w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center transition-transform group-hover:scale-110 ${act.color}`}>
                                        {act.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h4 className="text-sm font-bold text-text-primary leading-tight">{act.title}</h4>
                                            <span className="text-[9px] font-medium text-text-tertiary whitespace-nowrap ml-2">{act.time}</span>
                                        </div>
                                        <p className="text-[11px] text-text-tertiary font-normal leading-relaxed">{act.desc}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <ChevronRight size={14} className="text-text-tertiary group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center opacity-30">
                                <AlertCircle size={40} className="mx-auto mb-3" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma atividade registrada</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 p-6 bg-accent-primary/5 rounded-3xl border border-accent-primary/10">
                    <p className="text-[11px] text-text-tertiary font-normal leading-relaxed text-center">
                        Para ver o histórico completo de anos anteriores ou solicitar um dociê de dados, entre em contato com nosso <span className="text-accent-primary font-bold">Suporte</span>.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default PlatformActivity;

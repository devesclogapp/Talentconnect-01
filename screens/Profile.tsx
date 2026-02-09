import React, { useState } from 'react';
import {
    User,
    MapPin,
    Mail,
    ChevronRight,
    LogOut,
    Camera,
    Shield,
    CreditCard,
    Settings,
    Bell,
    Star,
    Activity,
    ArrowUpRight,
    LifeBuoy,
    Verified
} from 'lucide-react';
import { signOut } from '../services/authService';
import { resolveUserName, resolveUserAvatar } from '../utils/userUtils';
import AvatarUpload from '../components/AvatarUpload';
import { useAppStore } from '../store';

interface Props {
    user: any;
    onLogout: () => void;
    onNavigate: (v: string) => void;
}

const Profile: React.FC<Props> = ({ user, onLogout, onNavigate }) => {
    const userName = resolveUserName(user);
    const userAvatar = resolveUserAvatar(user);
    const setUser = useAppStore((state) => state.setUser);

    const handleLogout = async () => {
        await signOut();
        onLogout();
    };

    const [stats, setStats] = useState({
        rating: '0.0',
        orders: '0',
        trust: '100%'
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            // Normalize role
            const role = (user.role || '').toUpperCase();
            const supabase = (await import('../services/supabaseClient')).supabase;

            try {
                let rating = '5.0';
                let ordersCount = 0;

                if (role === 'PROVIDER') {
                    // Fetch Provider Profile for Rating
                    const { data: profile } = await supabase
                        .from('provider_profiles')
                        .select('rating_average')
                        .eq('user_id', user.id)
                        .single();

                    if (profile) {
                        rating = ((profile as any).rating_average || 0).toFixed(1);
                    } else {
                        rating = '0.0';
                    }

                    // Count Completed Orders (Provider)
                    const { count } = await supabase
                        .from('orders')
                        .select('*', { count: 'exact', head: true })
                        .eq('provider_id', user.id)
                        .eq('status', 'completed');

                    ordersCount = count || 0;
                } else {
                    // Client Stats
                    const { count } = await supabase
                        .from('orders')
                        .select('*', { count: 'exact', head: true })
                        .eq('client_id', user.id)
                        .eq('status', 'completed');

                    ordersCount = count || 0;
                }

                setStats({
                    rating,
                    orders: ordersCount.toString(),
                    trust: '100%'
                });

            } catch (error) {
                console.error("Error updating profile stats:", error);
            }
        };

        fetchStats();
    }, [user]);

    return (
        <div className="min-h-screen bg-bg-primary pb-32 animate-fade-in">
            {/* Luxury Profile Header */}
            <div className="h-[220px] bg-bg-secondary relative border-b border-border-subtle overflow-hidden">
                <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-accent-primary/5 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[-30px] right-[-30px] w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]"></div>

                <div className="absolute bottom-[-50px] left-8 transform translate-y-[-50%] flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-[6px] border-bg-primary overflow-hidden shadow-2xl relative group bg-bg-tertiary">
                            <AvatarUpload
                                user={user}
                                onUploadComplete={(newUrl) => {
                                    // Update global store without reload
                                    setUser({
                                        ...user,
                                        avatar_url: newUrl,
                                        user_metadata: {
                                            ...user.user_metadata,
                                            avatar_url: newUrl
                                        }
                                    });
                                }}
                            >
                                <div className="w-full h-full flex items-center justify-center relative">
                                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera size={24} className="text-white" />
                                    </div>
                                </div>
                            </AvatarUpload>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent-primary rounded-[14px] flex items-center justify-center text-bg-primary shadow-glow pointer-events-none">
                            <Camera size={18} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-12 px-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex-1">
                        <h1 className="heading-3xl text-text-primary mb-1">{userName}</h1>

                        {/* Status Stars */}
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={12}
                                        className={star <= Math.round(parseFloat(stats.rating)) ? "text-warning fill-warning" : "text-border-subtle"}
                                    />
                                ))}
                            </div>
                            <span className="text-[11px] font-normal text-text-secondary">{stats.rating} avaliação</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="meta px-3 py-1 rounded-full bg-accent-primary/10 text-text-primary border border-accent-primary/20 leading-none font-normal text-[10px]">
                                {(user?.role || '').toLowerCase() === 'provider' ? 'Prestador Verificado' : 'Membro Ativo'}
                            </span>
                            <p className="meta !text-text-tertiary flex items-center gap-1 font-normal text-[10px]">
                                <MapPin size={10} className="text-accent-primary" /> {user?.user_metadata?.city || 'Brasil'}
                            </p>
                        </div>
                    </div>
                    <button className="btn-icon !w-12 !h-12 bg-bg-secondary border border-border-subtle shadow-sm">
                        <Settings size={22} className="text-text-secondary" />
                    </button>
                </div>

                {/* Portfolio Stats */}
                <div className="grid grid-cols-3 gap-3 mb-12">
                    {[
                        { label: 'Rating', value: stats.rating, sub: 'Estrelas', color: 'text-text-primary' },
                        { label: 'Pedidos', value: stats.orders, sub: 'Total', color: 'text-text-primary' },
                        { label: 'Confiança', value: stats.trust, sub: 'Score', color: 'text-text-primary' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-bg-secondary p-4 rounded-2xl border border-border-subtle text-center">
                            <p className="meta !text-[8px] mb-1 font-normal">{stat.label}</p>
                            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="meta !text-[7px] !lowercase text-text-tertiary font-normal">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Verification Status Banner */}
                <div className="mb-8">
                    {(() => {
                        const status = user?.user_metadata?.documents_status || 'pending';
                        const isVerified = status === 'approved';
                        const isSubmitted = status === 'submitted';

                        let bgColor = 'bg-warning/5 border-warning/20';
                        let iconColor = 'bg-warning/10 text-warning';
                        let textColor = 'text-warning';
                        let title = 'Verificação Necessária';
                        let description = 'Envie seus documentos para desbloquear recursos.';
                        let Icon = Shield;

                        if (isVerified) {
                            bgColor = 'bg-success/5 border-success/20';
                            iconColor = 'bg-success/10 text-success';
                            textColor = 'text-success';
                            title = 'Identidade Verificada';
                            description = 'Sua conta apresenta alta credibilidade.';
                            Icon = Verified;
                        } else if (isSubmitted) {
                            bgColor = 'bg-blue-500/5 border-blue-500/20';
                            iconColor = 'bg-blue-500/10 text-blue-500';
                            textColor = 'text-blue-500';
                            title = 'Em Análise';
                            description = 'Seus documentos estão sendo verificados pela equipe.';
                            Icon = Shield;
                        }

                        return (
                            <div className={`p-4 rounded-2xl border ${bgColor} flex items-center justify-between group interactive`}
                                onClick={() => {
                                    if (isVerified) return;
                                    if (isSubmitted) {
                                        alert('Seus documentos já foram enviados e estão em análise.');
                                        return;
                                    }
                                    onNavigate('DOCUMENT_SUBMISSION');
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-sm ${textColor}`}>
                                            {title}
                                        </h3>
                                        <p className="text-[10px] text-text-tertiary max-w-[200px] leading-tight mt-0.5">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                                {!isVerified && !isSubmitted && <ChevronRight size={18} className="text-warning/50" />}
                            </div>
                        );
                    })()}
                </div>

                {/* Action Menu (Security & Preferences) */}
                <div className="space-y-4">
                    <h4 className="heading-md text-text-tertiary mb-6">Segurança & Preferências</h4>

                    {[
                        {
                            icon: <User size={20} />,
                            label: 'Informações Pessoais',
                            sub: 'Gerencie seus dados de perfil',
                            action: () => onNavigate('EDIT_PROFILE')
                        },
                        {
                            icon: <Shield size={20} />,
                            label: 'Segurança & Privacidade',
                            sub: '2FA e Chaves de Acesso',
                            action: () => alert('Funcionalidade em desenvolvimento: Segurança')
                        },
                        {
                            icon: <CreditCard size={20} />,
                            label: 'Métodos de Pagamento',
                            sub: 'Carteira e Repasses',
                            action: () => {
                                if (user?.role === 'provider') onNavigate('EARNINGS');
                                else alert('Gerenciamento de cartões em desenvolvimento');
                            }
                        },
                        {
                            icon: <Bell size={20} />,
                            label: 'Notificações',
                            sub: 'Alertas e Webhooks',
                            action: () => onNavigate('NOTIFICATIONS')
                        },
                        {
                            icon: <Activity size={20} />,
                            label: 'Atividade na Plataforma',
                            sub: 'Histórico de operações',
                            action: () => onNavigate(user?.role === 'provider' ? 'RECEIVED_ORDERS' : 'ORDER_HISTORY')
                        },
                        {
                            icon: <LifeBuoy size={20} />,
                            label: 'Suporte & Ajuda',
                            sub: 'Fale Conosco e Denúncias',
                            action: () => onNavigate('SUPPORT')
                        },
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={item.action}
                            className="card-transaction w-full group !bg-bg-primary interactive"
                        >
                            <div className="w-10 h-10 rounded-[14px] bg-bg-secondary flex items-center justify-center text-text-secondary group-hover:bg-accent-primary/10 group-hover:text-accent-primary transition-all">
                                {item.icon}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-normal text-text-primary">{item.label}</p>
                                <p className="meta !text-[9px] !lowercase text-text-tertiary font-normal">{item.sub}</p>
                            </div>
                            <ChevronRight size={18} className="text-text-tertiary group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="card-transaction w-full mt-10 !bg-error/5 border-error/10 text-error group hover:bg-error/10"
                    >
                        <div className="w-10 h-10 rounded-[14px] bg-error/10 flex items-center justify-center">
                            <LogOut size={20} />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold">Encerrar Sessão</p>
                            <p className="meta !text-[9px] !lowercase text-error/60">Finalizar todos os acessos ativos</p>
                        </div>
                        <ArrowUpRight size={18} className="text-error/40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;

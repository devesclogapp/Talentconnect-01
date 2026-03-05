import React from 'react';
import { ArrowLeft, Shield, Lock, Smartphone, Fingerprint, Eye, ChevronRight, AlertTriangle } from 'lucide-react';

interface Props {
    onBack: () => void;
}

const Security: React.FC<Props> = ({ onBack }) => {
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
                    <h1 className="text-xl font-bold text-text-primary leading-tight">Segurança & Privacidade</h1>
                    <p className="text-[11px] text-text-tertiary font-normal">
                        Proteção e controle da sua conta
                    </p>
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-8">
                {/* Security Status Card */}
                <div className="bg-bg-secondary/40 border border-border-subtle rounded-[32px] p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-text-primary">Sua conta está protegida</h3>
                        <p className="text-[11px] text-text-tertiary font-normal">Nenhuma atividade suspeita detectada</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Acesso & Autenticação</h4>

                    {[
                        {
                            icon: <Smartphone size={20} />,
                            title: 'Autenticação em Duas Etapas (2FA)',
                            desc: 'Envio de código via SMS ou Authenticator',
                            status: 'Desativado',
                            statusColor: 'text-text-tertiary'
                        },
                        {
                            icon: <Fingerprint size={20} />,
                            title: 'Acesso Biométrico',
                            desc: 'Use FaceID ou Digital para entrar',
                            status: 'Ativado',
                            statusColor: 'text-success'
                        },
                        {
                            icon: <Lock size={20} />,
                            title: 'Alterar Senha',
                            desc: 'Recomendado a cada 90 dias',
                            status: '',
                            statusColor: ''
                        }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 bg-bg-primary border border-border-subtle rounded-2xl group active:scale-[0.98] transition-all opacity-60">
                            <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-secondary">
                                {item.icon}
                            </div>
                            <div className="flex-1">
                                <h5 className="text-sm font-bold text-text-primary">{item.title}</h5>
                                <p className="text-[10px] text-text-tertiary font-normal">{item.desc}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${item.statusColor}`}>{item.status}</span>
                                <ChevronRight size={16} className="text-text-tertiary" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest pl-1">Privacidade de Dados</h4>

                    <div className="p-6 bg-bg-secondary/20 border border-border-subtle rounded-3xl space-y-4">
                        <div className="flex items-start gap-3">
                            <Eye size={18} className="text-accent-primary mt-0.5" />
                            <div>
                                <h5 className="text-sm font-bold text-text-primary">Visualização de Perfil</h5>
                                <p className="text-[10px] text-text-tertiary leading-relaxed">
                                    Escolha quem pode ver seu histórico de avaliações e métricas de desempenho.
                                </p>
                            </div>
                        </div>
                        <button className="w-full py-3 bg-bg-primary border border-border-subtle rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-bg-secondary transition-all">
                            Configurar Visibilidade
                        </button>
                    </div>
                </div>

                <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 flex items-start gap-3 mt-10">
                    <AlertTriangle size={18} className="text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-text-tertiary font-medium leading-relaxed italic">
                        Nota: Algumas funcionalidades de segurança avançada estão sendo liberadas gradualmente para sua região.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Security;

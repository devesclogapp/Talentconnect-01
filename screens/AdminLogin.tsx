import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, User, AlertCircle } from 'lucide-react';
import { signIn } from '../services/authService';

interface Props {
    onLoginSuccess: (user: any) => void;
    onNavigate: (v: string) => void;
}

const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await signIn({ email, password });

            // Verificação extra: apenas Operadores podem entrar por aqui
            const role = result.user?.user_metadata?.role;
            if (role !== 'operator') {
                throw new Error('Acesso restrito ao Painel Administrativo.');
            }

            if (result.user) onLoginSuccess(result.user);
        } catch (err: any) {
            console.error("Erro no login admin:", err);
            setError(err.message || 'Falha na autenticação administrativa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in overflow-hidden bg-bg-primary">
            {/* Desktop Hero Section */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-black">
                <img
                    src="/login_hero_talent_connect.png"
                    alt="Admin Connect"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

                <div className="relative z-10 p-20 flex flex-col justify-between h-full w-full">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Admin Connect</h2>
                    </div>

                    <div className="space-y-6 text-left">
                        <h3 className="text-6xl font-black text-white leading-tight tracking-tighter uppercase italic">
                            Gestão & <br />
                            <span className="text-accent-primary">Inteligência Operacional</span>
                        </h3>
                        <p className="text-lg text-white/60 font-medium max-w-md leading-relaxed">
                            Console central para auditoria financeira, mediação de disputas e controle estratégico da rede Talent Connect.
                        </p>
                    </div>

                    <div className="flex items-center gap-10">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center overflow-hidden bg-bg-secondary shadow-lg">
                                    <div className={`w-full h-full bg-gradient-to-br ${i % 2 === 0 ? 'from-accent-primary/40 to-blue-500/40' : 'from-indigo-500/40 to-purple-500/40'} flex items-center justify-center`}>
                                        <User size={20} className="text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1 text-left">
                            <p className="text-xs font-black text-white uppercase tracking-widest">+5.240 Ativos</p>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Monitoramento em Tempo Real</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Form Section */}
            <div className="flex-1 flex flex-col px-8 lg:px-20 pt-16 lg:pt-0 justify-center relative overflow-hidden">
                <div className="max-w-md w-full mx-auto relative z-10">
                    <div className="mb-12 text-left">
                        <div className="lg:hidden w-16 h-16 rounded-[22px] bg-bg-secondary border border-border-medium flex items-center justify-center mb-8 shadow-glow-accent">
                            <ShieldCheck size={32} className="text-accent-primary" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-text-primary uppercase tracking-tighter mb-4 italic">Sistema ERP</h1>
                        <p className="body text-text-tertiary">Autenticação obrigatória para acesso às ferramentas administrativas.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-5">
                            <div className="group space-y-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">E-mail Administrativo</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="admin@talentconnect.com"
                                        className="w-full bg-bg-secondary/50 border border-border-subtle rounded-3xl pl-14 pr-6 py-5 text-sm outline-none focus:border-accent-primary focus:bg-white transition-all font-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group space-y-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary ml-1">Chave de Segurança</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full bg-bg-secondary/50 border border-border-subtle rounded-3xl pl-14 pr-14 py-5 text-sm outline-none focus:border-accent-primary focus:bg-white transition-all font-medium"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-5 bg-error/5 border border-error/10 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 text-left">
                                <AlertCircle size={20} className="text-error" />
                                <p className="text-xs font-bold text-error uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <div className="pt-4 space-y-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-black text-white rounded-3xl flex items-center justify-between px-8 group hover:scale-[1.02] transition-all shadow-2xl disabled:opacity-50"
                            >
                                <span className="text-xs font-black uppercase tracking-widest">{loading ? 'Validando Acesso...' : 'Entrar no Admin'}</span>
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
                                    <ArrowRight size={20} />
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onNavigate('LOGIN')}
                                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-text-primary transition-colors border border-dashed border-border-subtle rounded-2xl"
                            >
                                Voltar ao Acesso Comum
                            </button>
                        </div>
                    </form>

                    <p className="mt-20 text-[9px] font-bold text-text-tertiary text-center uppercase tracking-widest">
                        Talent Connect Operacional © 2026 <br />
                        <span className="opacity-50 text-accent-primary">Acesso Restrito à Operadora</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, User, AlertCircle } from 'lucide-react';
import { signIn } from '../services/authService';

interface Props {
    onLoginSuccess: (user: any) => void;
    onNavigate: (v: string) => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess, onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<'client' | 'provider'>('client');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await signIn({ email, password });
            if (result.user) onLoginSuccess(result.user);
        } catch (err: any) {
            console.error("Erro no login:", err);
            const msg = err.message || 'Falha na autenticação';
            setError(msg);
            alert(`Erro ao entrar: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary flex flex-col px-8 pt-20 pb-12 animate-fade-in relative overflow-hidden">
            {/* Background Decors */}
            <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-accent-primary/5 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-20%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]"></div>

            <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
                <div className="mb-14 relative z-10">
                    <div className="w-16 h-16 rounded-[22px] bg-bg-secondary border border-border-medium flex items-center justify-center mb-8 shadow-glow-accent">
                        <ShieldCheck size={32} className="text-accent-primary" />
                    </div>
                    <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter mb-3">Bem-vindo</h1>
                    <p className="body text-text-tertiary">Acesse sua conta para gerenciar seus pedidos e serviços.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                    {/* Profile Selector */}
                    <div className="bg-bg-secondary p-1 rounded-2xl border border-border-subtle flex relative">
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-bg-tertiary rounded-xl border border-border-medium transition-all duration-300 ${role === 'provider' ? 'left-[calc(50%+1px)]' : 'left-1'}`}
                        ></div>
                        <button
                            type="button"
                            onClick={() => setRole('client')}
                            className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${role === 'client' ? 'text-text-primary' : 'text-text-tertiary'}`}
                        >
                            Cliente
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('provider')}
                            className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${role === 'provider' ? 'text-text-primary' : 'text-text-tertiary'}`}
                        >
                            Profissional
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                placeholder="E-mail"
                                className="input pl-12"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Senha"
                                className="input pl-12 pr-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 animate-fade-in">
                            <AlertCircle size={18} className="text-error" />
                            <p className="text-[10px] font-black text-error uppercase">{error}</p>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-between group shadow-glow"
                        >
                            <span className="font-black uppercase tracking-widest">{loading ? 'Entrando...' : 'Entrar'}</span>
                            <div className="w-8 h-8 rounded-full bg-bg-primary/20 flex items-center justify-center transition-transform group-hover:translate-x-1">
                                <ArrowRight size={18} />
                            </div>
                        </button>
                    </div>
                </form>

                <div className="mt-auto pt-10 text-center relative z-10">
                    <button
                        onClick={() => onNavigate('onboarding')}
                        className="text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-text-primary transition-colors"
                    >
                        Esqueceu a senha?
                    </button>
                    <div className="mt-6 flex flex-col gap-4">
                        <button
                            onClick={() => onNavigate('register')}
                            className="text-sm font-black text-text-primary border-b-2 border-accent-primary uppercase tracking-tighter self-center"
                        >
                            Criar Nova Conta
                        </button>
                        <button
                            onClick={() => onNavigate('ADMIN_LOGIN')}
                            className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity mt-4 flex items-center justify-center gap-2"
                        >
                            <ShieldCheck size={10} /> Acesso Administrativo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

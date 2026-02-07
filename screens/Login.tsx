import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, User } from 'lucide-react';
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
            const { user, error: signInError } = await signIn({ email, password });
            if (signInError) throw signInError;
            if (user) onLoginSuccess(user);
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

            <div className="mb-14 relative z-10">
                <div className="w-16 h-16 rounded-[22px] bg-bg-secondary border border-border-medium flex items-center justify-center mb-8 shadow-glow-accent">
                    <ShieldCheck size={32} className="text-accent-primary" />
                </div>
                <h1 className="heading-4xl tracking-tighter mb-3">Acesso Seguro</h1>
                <p className="body max-w-[260px]">Insira suas credenciais para gerenciar seu perfil.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                {/* Profile Selector (Financial Toggle) */}
                <div className="bg-bg-secondary p-1 rounded-2xl border border-border-subtle flex relative">
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-bg-tertiary rounded-xl border border-border-medium transition-all duration-300 ${role === 'provider' ? 'left-[calc(50%+1px)]' : 'left-1'}`}
                    ></div>
                    <button
                        type="button"
                        onClick={() => setRole('client')}
                        className={`relative z-10 flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${role === 'client' ? 'text-text-black' : 'text-text-tertiary'}`}
                    >
                        Cliente
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('provider')}
                        className={`relative z-10 flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${role === 'provider' ? 'text-text-black' : 'text-text-tertiary'}`}
                    >
                        Profissional
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary groupfocus-within:text-accent-primary transition-colors">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input pl-12"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary groupfocus-within:text-accent-primary transition-colors">
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
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary  transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 animate-fade-in">
                        <div className="w-2 h-2 rounded-full bg-error"></div>
                        <p className="text-[10px] font-bold text-error uppercase tracking-wider">{error}</p>
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full justify-between group shadow-glow"
                    >
                        <span className="uppercase tracking-[0.2em]">{loading ? 'Verificando...' : 'Entrar'}</span>
                        <div className="w-8 h-8 rounded-full bg-bg-primary/20 flex items-center justify-center transition-transform group">
                            <ArrowRight size={18} />
                        </div>
                    </button>
                </div>
            </form>

            <div className="mt-auto pt-10 text-center relative z-10">
                <button
                    onClick={() => onNavigate('onboarding')}
                    className="meta !text-[10px]  transition-colors"
                >
                    Esqueceu a senha?
                </button>
                <div className="mt-6">
                    <button
                        onClick={() => onNavigate('register')}
                        className="heading-md text-text-black border-b border-accent-primary pb-1"
                    >
                        Criar Nova Conta
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;

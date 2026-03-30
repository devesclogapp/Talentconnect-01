import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, User, AlertCircle, LayoutDashboard, Globe, Shield } from 'lucide-react';
import { signIn } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

interface Props {
    onLoginSuccess: (user: any) => void;
    onNavigate?: (v: string) => void;
}

const AdminLogin: React.FC<Props> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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

            if (result.user) {
                onLoginSuccess(result.user);
                navigate('/admin', { replace: true });
            }
        } catch (err: any) {
            console.error("Erro no login admin:", err);
            let msg = err.message || 'Falha na autenticação administrativa';
            if (msg.includes('Invalid login credentials')) {
                msg = 'Credenciais inválidas. Verifique e-mail e senha.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background font-sans overflow-hidden">
            {/* ── Visual Section (Hero) ── */}
            <div className="hidden lg:flex lg:w-[450px] xl:w-[500px] relative overflow-hidden bg-[#0F1115] border-r border-border/10">
                {/* Abstract Background Patterns */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`, backgroundSize: '32px 32px' }}></div>
                    <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent blur-[120px]"></div>
                </div>

                <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full">
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <Shield className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight italic">Talent Connect</span>
                        </div>

                        <div className="space-y-6">
                            <Badge variant="outline" className="border-white/10 text-white/50 bg-white/5 px-3 py-1 text-[10px] tracking-widest uppercase">
                                ERP Administrativo
                            </Badge>
                            <h1 className="text-4xl xl:text-5xl font-semibold text-white leading-[1.15] tracking-tight">
                                Gestão central para <br />
                                <span className="text-primary font-bold italic underline decoration-primary/30 decoration-4 underline-offset-8">Operadores.</span>
                            </h1>
                            <p className="text-sm text-white/40 max-w-[320px] leading-relaxed font-medium">
                                Monitore transações em tempo real, gerencie disputas e audite toda a rede operacional a partir de uma única interface inteligente.
                            </p>
                        </div>
                    </div>

                    {/* Stats/Glass Cards */}
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-4 group hover:bg-white/10 transition-all cursor-default">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
                                <Globe size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Status da Rede</p>
                                <p className="text-xs font-semibold text-white">Interface Operacional Global</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-4 group hover:bg-white/10 transition-all cursor-default text-left">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                <LayoutDashboard size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Painel de Controle</p>
                                <p className="text-xs font-semibold text-white">Auditoria Financeira Ativa</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Form Section ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-20 relative bg-background">
                {/* Subtle light pattern for background */}
                <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none lg:block hidden">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="max-w-sm w-full mx-auto relative z-10">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                                <Shield className="text-white" size={24} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">Acesso Restrito</h2>
                        <p className="text-sm text-muted-foreground font-medium">Entre com suas credenciais de nível operador para gerenciar o ecossistema.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4 text-left">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground inline-block px-1">E-mail Corporativo</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="nome@talentconnect.com"
                                        className="w-full h-12 bg-folio-surface border border-folio-border rounded-xl pl-10 pr-4 text-[13px] font-bold outline-none focus:border-folio-accent focus:ring-4 focus:ring-folio-accent/5 transition-all text-folio-text placeholder:text-folio-text-dim/30"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-folio-text-dim inline-block px-1">Chave de Acesso</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-folio-text-dim group-focus-within:text-folio-accent transition-colors pointer-events-none">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full h-12 bg-folio-surface border border-folio-border rounded-xl pl-10 pr-12 text-[13px] font-bold outline-none focus:border-folio-accent focus:ring-4 focus:ring-folio-accent/5 transition-all text-folio-text placeholder:text-folio-text-dim/30"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 text-left">
                                <AlertCircle size={16} className="text-destructive shrink-0" />
                                <p className="text-[11px] font-semibold text-destructive uppercase tracking-tight leading-tight">{error}</p>
                            </div>
                        )}

                        <div className="pt-2 space-y-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-between px-6 px-8 group shadow-lg shadow-primary/10 border-none"
                            >
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    {loading ? (
                                        <span className="relative inline-block">
                                            Autenticando
                                            <span className="absolute left-full ml-1 top-0">...</span>
                                        </span>
                                    ) : 'Acessar ERP'}
                                </span>
                                <ArrowRight size={16} className={`${loading ? 'opacity-0' : 'opacity-100'} transition-transform group-hover:translate-x-1`} />
                            </Button>

                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            >
                                Voltar ao Acesso do Usuário
                            </Button>
                        </div>
                    </form>

                    <div className="mt-16 flex flex-col items-center gap-4">
                        <div className="h-px w-8 bg-border/50"></div>
                        <p className="text-[9px] font-bold text-muted-foreground/60 text-center uppercase tracking-[0.2em] leading-relaxed">
                            Talent Connect Operational Console <br />
                            <span className="text-[8px] opacity-40">Encryption AES-256 Standard</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

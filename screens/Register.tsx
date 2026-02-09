import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Lock, Phone, MapPin, ArrowRight, Zap, Globe, ChevronRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { signUp } from '../services/authService';
import { UserRole } from '../types';

interface RegisterProps {
    onBack: () => void;
    onRegisterSuccess: (role: UserRole) => void;
}

const Register: React.FC<RegisterProps> = ({ onBack, onRegisterSuccess }) => {
    const [step, setStep] = useState<'role' | 'form'>('role');
    const [selectedRole, setSelectedRole] = useState<UserRole>('CLIENT');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        providerCategory: 'pf', // 'pf' | 'mei'
        document: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleRoleSelection = (role: UserRole) => {
        setSelectedRole(role);
        setStep('form');
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.password) {
            newErrors.password = 'Senha é obrigatória';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mínimo de 6 caracteres';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'As senhas não coincidem';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Telefone é obrigatório';
        }

        if (selectedRole === 'PROVIDER') {
            if (!formData.document.trim()) {
                newErrors.document = 'Documento é obrigatório';
            }
            // Basic length check (CPF 11, CNPJ 14 - usually more with formatting, but simple check for now)
            if (formData.providerCategory === 'pf' && formData.document.replace(/\D/g, '').length < 11) {
                newErrors.document = 'CPF inválido';
            }
            if (formData.providerCategory === 'mei' && formData.document.replace(/\D/g, '').length < 14) {
                newErrors.document = 'CNPJ inválido';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);

        try {
            await signUp({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                role: selectedRole.toLowerCase() as 'client' | 'provider',
                phone: formData.phone || undefined,
                category: selectedRole === 'PROVIDER' ? (formData.providerCategory as 'mei' | 'pf') : undefined,
                document: selectedRole === 'PROVIDER' ? formData.document : undefined
            });
            onRegisterSuccess(selectedRole);
        } catch (error: any) {
            console.error('Registration error:', error);
            if (error.message?.includes('already registered')) {
                setErrors({ email: 'Email já registrado' });
            } else {
                setErrors({ general: error.message || 'Falha no registro' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    if (step === 'role') {
        return (
            <div className="min-h-screen bg-bg-primary p-8 flex flex-col animate-fade-in relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-accent-primary/5 rounded-full blur-[100px]"></div>

                <button onClick={onBack} className="btn-icon mb-12 relative z-10">
                    <ArrowLeft size={20} className="text-text-secondary" />
                </button>

                <div className="mb-14 relative z-10 text-center">
                    <div className="w-16 h-16 rounded-[22px] bg-bg-secondary border border-border-medium flex items-center justify-center mx-auto mb-8 shadow-glow">
                        <Globe size={32} className="text-accent-primary" />
                    </div>
                    <h1 className="heading-4xl mb-3">Junte-se à Elite</h1>
                    <p className="body max-w-[280px] mx-auto">Selecione seu perfil de acesso.</p>
                </div>

                <div className="space-y-4 relative z-10">
                    <button
                        onClick={() => handleRoleSelection('CLIENT')}
                        className="w-full card interactive group !p-8 text-left border-border-medium  transition-all bg-gradient-to-br from-bg-secondary to-bg-tertiary"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border-medium group transition-colors">
                                    <User className="text-text-secondary group" size={24} />
                                </div>
                                <div>
                                    <h3 className="heading-lg mb-0.5 group">Contratante</h3>
                                    <p className="meta !text-[9px] text-text-tertiary font-normal">Contrate especialistas de alto nível</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-text-tertiary group transition-transform group" />
                        </div>
                    </button>

                    <button
                        onClick={() => handleRoleSelection('PROVIDER')}
                        className="w-full card interactive group !p-8 text-left border-border-medium  transition-all bg-gradient-to-br from-bg-secondary to-bg-tertiary"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border-medium group transition-colors">
                                    <Zap className="text-text-secondary group" size={24} />
                                </div>
                                <div>
                                    <h3 className="heading-lg mb-0.5 group">Profissional</h3>
                                    <p className="meta !text-[9px] text-text-tertiary font-normal">Ofereça seu talento especializado</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-text-tertiary group transition-transform group" />
                        </div>
                    </button>
                </div>

                <div className="mt-auto pt-10 text-center relative z-10 opacity-40">
                    <p className="meta !text-[8px] font-normal">Segurança garantida pelo protocolo de identidade</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary p-8 flex flex-col animate-fade-in relative overflow-hidden pb-12">
            <div className="absolute top-[-5%] left-[-10%] w-[300px] h-[300px] bg-accent-primary/5 rounded-full blur-[100px]"></div>

            <button onClick={() => setStep('role')} className="btn-icon mb-12 relative z-10">
                <ArrowLeft size={20} className="text-text-secondary" />
            </button>

            <div className="mb-10 relative z-10">
                <h1 className="heading-3xl mb-2">Criar Conta</h1>
                <p className="body max-w-[260px]">
                    Registrar como <span className="text-accent-primary font-bold">{selectedRole === 'CLIENT' ? 'Contratante' : 'Profissional'}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {errors.general && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 animate-fade-in">
                        <div className="w-2 h-2 rounded-full bg-error"></div>
                        <p className="text-[10px] font-normal text-error">{errors.general}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary groupfocus-within:text-accent-primary transition-colors">
                            <User size={18} />
                        </div>
                        <Input
                            placeholder="Nome Completo"
                            className="input pl-12 font-normal"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            error={!!errors.name}
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary groupfocus-within:text-accent-primary transition-colors">
                            <Mail size={18} />
                        </div>
                        <Input
                            type="email"
                            placeholder="Email"
                            className="input pl-12 font-normal"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            error={!!errors.email}
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary groupfocus-within:text-accent-primary transition-colors">
                            <Phone size={18} />
                        </div>
                        <Input
                            type="tel"
                            placeholder="Telefone"
                            className="input pl-12 font-normal"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            error={!!errors.phone}
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary groupfocus-within:text-accent-primary transition-colors">
                            <Lock size={18} />
                        </div>
                        <Input
                            type="password"
                            placeholder="Senha"
                            className="input pl-12 font-normal"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            error={!!errors.password}
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary groupfocus-within:text-accent-primary transition-colors">
                            <Lock size={18} />
                        </div>
                        <Input
                            type="password"
                            placeholder="Confirmar Senha"
                            className="input pl-12 font-normal"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            error={!!errors.confirmPassword}
                        />
                    </div>

                    {selectedRole === 'PROVIDER' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-text-secondary ml-1">Tipo de Cadastro</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('providerCategory', 'pf')}
                                        className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                                            // @ts-ignore
                                            formData.providerCategory === 'pf'
                                                ? 'bg-accent-primary text-white border-accent-primary'
                                                : 'bg-bg-tertiary text-text-secondary border-border-medium hover:bg-bg-secondary'
                                            }`}
                                    >
                                        Pessoa Física (CPF)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('providerCategory', 'mei')}
                                        className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                                            // @ts-ignore
                                            formData.providerCategory === 'mei'
                                                ? 'bg-accent-primary text-white border-accent-primary'
                                                : 'bg-bg-tertiary text-text-secondary border-border-medium hover:bg-bg-secondary'
                                            }`}
                                    >
                                        MEI (CNPJ)
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors">
                                    <User size={18} />
                                </div>
                                <Input
                                    // @ts-ignore
                                    placeholder={formData.providerCategory === 'mei' ? "CNPJ" : "CPF"}
                                    className="input pl-12 font-normal"
                                    // @ts-ignore
                                    value={formData.document || ''}
                                    // @ts-ignore
                                    onChange={(e) => handleInputChange('document', e.target.value)}
                                    // @ts-ignore
                                    error={!!errors.document}
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors">
                                    <MapPin size={18} />
                                </div>
                                <Input
                                    placeholder="Endereço Base"
                                    className="input pl-12 font-normal"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full justify-between group shadow-glow"
                    >
                        <span className="font-normal">{isLoading ? 'Iniciando...' : 'Confirmar Registro'}</span>
                        <div className="w-8 h-8 rounded-full bg-bg-primary/20 flex items-center justify-center transition-transform group">
                            <ArrowRight size={18} />
                        </div>
                    </button>
                    <p className="text-center meta !text-[8px] mt-6 opacity-40 font-normal">
                        Ao continuar, você concorda com os Termos de Uso.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default Register;

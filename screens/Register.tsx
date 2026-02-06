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
        address: ''
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
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Min 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
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
            });
            onRegisterSuccess(selectedRole);
        } catch (error: any) {
            console.error('Registration error:', error);
            if (error.message?.includes('already registered')) {
                setErrors({ email: 'Email already registered' });
            } else {
                setErrors({ general: error.message || 'Registration failed' });
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
                    <h1 className="heading-4xl tracking-tighter mb-3">Join Elite</h1>
                    <p className="body max-w-[280px] mx-auto">Select your specialized entry point to the network.</p>
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
                                    <h3 className="heading-lg tracking-tight mb-0.5 group">Contractor</h3>
                                    <p className="meta !text-[9px] !lowercase text-text-tertiary">Hire top-tier experts</p>
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
                                    <h3 className="heading-lg tracking-tight mb-0.5 group">Professional</h3>
                                    <p className="meta !text-[9px] !lowercase text-text-tertiary">Offer your specialized talent</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-text-tertiary group transition-transform group" />
                        </div>
                    </button>
                </div>

                <div className="mt-auto pt-10 text-center relative z-10 opacity-40">
                    <p className="meta !text-[8px]">Secured by Blockchain Identity Protocol</p>
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
                <h1 className="heading-3xl tracking-tighter mb-2">Create Portfolio</h1>
                <p className="body max-w-[260px]">
                    Register as <span className="text-accent-primary font-bold">{selectedRole === 'CLIENT' ? 'Contractor' : 'Professional'}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {errors.general && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 animate-fade-in">
                        <div className="w-2 h-2 rounded-full bg-error"></div>
                        <p className="text-[10px] font-bold text-error uppercase tracking-wider">{errors.general}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary groupfocus-within:text-accent-primary transition-colors">
                            <User size={18} />
                        </div>
                        <Input
                            placeholder="Full Name"
                            className="input pl-12"
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
                            placeholder="Email Portfolio"
                            className="input pl-12"
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
                            placeholder="Phone Frequency"
                            className="input pl-12"
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
                            placeholder="Access Key"
                            className="input pl-12"
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
                            placeholder="Confirm Key"
                            className="input pl-12"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            error={!!errors.confirmPassword}
                        />
                    </div>

                    {selectedRole === 'PROVIDER' && (
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary groupfocus-within:text-accent-primary transition-colors">
                                <MapPin size={18} />
                            </div>
                            <Input
                                placeholder="Base Location"
                                className="input pl-12"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full justify-between group shadow-glow"
                    >
                        <span className="uppercase tracking-[0.2em]">{isLoading ? 'Initializing...' : 'Confirm Registration'}</span>
                        <div className="w-8 h-8 rounded-full bg-bg-primary/20 flex items-center justify-center transition-transform group">
                            <ArrowRight size={18} />
                        </div>
                    </button>
                    <p className="text-center meta !text-[8px] mt-6 opacity-40">
                        By continuing, you agree to the Talent Smart Contracts.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default Register;

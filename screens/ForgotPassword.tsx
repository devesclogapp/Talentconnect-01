import React, { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface ForgotPasswordProps {
    onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email é obrigatório');
            return;
        }

        if (!validateEmail(email)) {
            setError('Email inválido');
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setEmailSent(true);
        } catch (err) {
            setError('Erro ao enviar email. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="screen-container">
                <div className="max-w-md mx-auto px-4 py-8">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-feedback-success/20 flex items-center justify-center mx-auto mb-6">
                            <Mail className="text-feedback-success" size={40} />
                        </div>

                        <h1 className="text-3xl font-bold text-black dark:text-white mb-3">
                            Email Enviado!
                        </h1>

                        <p className="text-black dark:text-black mb-8">
                            Enviamos instruções para recuperação de senha para <strong>{email}</strong>
                        </p>

                        <p className="text-sm text-black dark:text-black mb-8">
                            Verifique sua caixa de entrada e spam. O link expira em 24 horas.
                        </p>

                        <Button
                            variant="primary"
                            onClick={onBack}
                            className="w-full"
                        >
                            Voltar para Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="screen-container">
            <div className="max-w-md mx-auto px-4 py-8">
                <button
                    onClick={onBack}
                    className="interactive flex items-center gap-2 text-black dark:text-gray-300 mb-8"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-black dark:text-white mb-3">
                        Recuperar Senha
                    </h1>
                    <p className="text-black dark:text-black">
                        Digite seu email para receber instruções de recuperação
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Input
                            icon={Mail}
                            type="email"
                            placeholder="Seu email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            error={error}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enviando...' : 'Enviar Instruções'}
                    </Button>

                    <p className="text-center text-sm text-black dark:text-black">
                        Lembrou sua senha?{' '}
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-accent-orange  font-medium"
                        >
                            Fazer login
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;

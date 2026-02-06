import React, { useState } from 'react';
import { Settings, X, User, Briefcase, Home, LogOut, Zap } from 'lucide-react';
import { UserRole } from '../types';

interface DevToolsProps {
    currentView: string;
    currentUser: any;
    onNavigate: (view: string) => void;
    onQuickLogin: (role: UserRole) => void;
    onLogout: () => void;
}

const DevTools: React.FC<DevToolsProps> = ({
    currentView,
    currentUser,
    onNavigate,
    onQuickLogin,
    onLogout
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'quick' | 'navigation'>('quick');

    // Only show in development
    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    const clientScreens = [
        { name: 'CLIENT_DASHBOARD', label: 'Dashboard Cliente' },
        { name: 'SERVICE_LISTING', label: 'Listagem de Serviços' },
        { name: 'PROVIDER_LISTING', label: 'Listagem de Prestadores' },
        { name: 'ORDER_HISTORY', label: 'Histórico de Pedidos' },
        { name: 'TRACKING', label: 'Acompanhamento' },
        { name: 'PROFILE', label: 'Perfil' },
        { name: 'SUPPORT', label: 'Suporte' }
    ];

    const providerScreens = [
        { name: 'PROVIDER_DASHBOARD', label: 'Dashboard Prestador' },
        { name: 'RECEIVED_ORDERS', label: 'Pedidos Recebidos' },
        { name: 'SERVICE_REGISTRATION', label: 'Cadastrar Serviço' },
        { name: 'MY_SERVICES', label: 'Meus Serviços' },
        { name: 'AGENDA', label: 'Agenda' },
        { name: 'EARNINGS', label: 'Ganhos' },
        { name: 'PROFILE', label: 'Perfil' }
    ];

    const authScreens = [
        { name: 'LOGIN', label: 'Login' },
        { name: 'REGISTER', label: 'Cadastro' },
        { name: 'ONBOARDING', label: 'Onboarding' },
        { name: 'SPLASH', label: 'Splash Screen' }
    ];

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-32 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg flex items-center justify-center  transition-transform"
                title="Developer Tools"
            >
                {isOpen ? <X size={24} /> : <Settings size={24} className="animate-spin-slow" />}
            </button>

            {/* Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-20 z-50 w-80 max-h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-purple-500 overflow-hidden animate-scale-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Zap size={20} />
                                Dev Tools
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className=" rounded-full p-1 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs opacity-90">
                            Tela atual: <span className="font-mono font-bold">{currentView}</span>
                        </p>
                        {currentUser && (
                            <p className="text-xs opacity-90">
                                Usuário: <span className="font-bold">{currentUser.role}</span>
                            </p>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('quick')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'quick'
                                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                                : 'text-black dark:text-black'
                                }`}
                        >
                            Quick Actions
                        </button>
                        <button
                            onClick={() => setActiveTab('navigation')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'navigation'
                                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                                : 'text-black dark:text-black'
                                }`}
                        >
                            Navegação
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[450px]">
                        {activeTab === 'quick' && (
                            <div className="space-y-4">
                                {/* Quick Login */}
                                <div>
                                    <h4 className="text-sm font-semibold text-black dark:text-gray-300 mb-2">
                                        Login Rápido
                                    </h4>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => onQuickLogin('CLIENT')}
                                            className="w-full flex flex-col p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white   transition-all shadow-md group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <User size={18} />
                                                <span className="font-bold uppercase tracking-widest text-[10px]">Cliente</span>
                                            </div>
                                            <span className="text-[10px] opacity-70 ml-7 font-mono">cliente01@email.com</span>
                                        </button>
                                        <button
                                            onClick={() => onQuickLogin('PROVIDER')}
                                            className="w-full flex flex-col p-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white   transition-all shadow-md group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Briefcase size={18} />
                                                <span className="font-bold uppercase tracking-widest text-[10px]">Prestador</span>
                                            </div>
                                            <span className="text-[10px] opacity-70 ml-7 font-mono">prestador01@email.com</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Navigation */}
                                {currentUser && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-black dark:text-gray-300 mb-2">
                                            Ir para Dashboard
                                        </h4>
                                        <button
                                            onClick={() => onNavigate(currentUser.role === 'CLIENT' ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD')}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white   transition-all"
                                        >
                                            <Home size={18} />
                                            <span className="font-medium">Dashboard Principal</span>
                                        </button>
                                    </div>
                                )}

                                {/* Logout */}
                                {currentUser && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-black dark:text-gray-300 mb-2">
                                            Sessão
                                        </h4>
                                        <button
                                            onClick={onLogout}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white   transition-all"
                                        >
                                            <LogOut size={18} />
                                            <span className="font-medium">Fazer Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'navigation' && (
                            <div className="space-y-4">
                                {/* Auth Screens */}
                                <div>
                                    <h4 className="text-sm font-semibold text-black dark:text-gray-300 mb-2">
                                        Autenticação
                                    </h4>
                                    <div className="space-y-1">
                                        {authScreens.map((screen) => (
                                            <button
                                                key={screen.name}
                                                onClick={() => onNavigate(screen.name)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${currentView === screen.name
                                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium'
                                                    : ' dark: text-black dark:text-gray-300'
                                                    }`}
                                            >
                                                {screen.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Client Screens */}
                                <div>
                                    <h4 className="text-sm font-semibold text-black dark:text-gray-300 mb-2">
                                        Telas do Cliente
                                    </h4>
                                    <div className="space-y-1">
                                        {clientScreens.map((screen) => (
                                            <button
                                                key={screen.name}
                                                onClick={() => onNavigate(screen.name)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${currentView === screen.name
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                                                    : ' dark: text-black dark:text-gray-300'
                                                    }`}
                                            >
                                                {screen.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Provider Screens */}
                                <div>
                                    <h4 className="text-sm font-semibold text-black dark:text-gray-300 mb-2">
                                        Telas do Prestador
                                    </h4>
                                    <div className="space-y-1">
                                        {providerScreens.map((screen) => (
                                            <button
                                                key={screen.name}
                                                onClick={() => onNavigate(screen.name)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${currentView === screen.name
                                                    ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-medium'
                                                    : ' dark: text-black dark:text-gray-300'
                                                    }`}
                                            >
                                                {screen.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
        </>
    );
};

export default DevTools;

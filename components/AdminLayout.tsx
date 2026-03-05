import React from 'react';
import {
    LayoutDashboard, Users, Briefcase, ReceiptText,
    ShieldCheck, AlertCircle, History, LogOut,
    Menu, Bell, Moon, Sun, Search, ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

const ADMIN_ROUTE_MAP: Record<string, string> = {
    'ADMIN_DASHBOARD': '/admin',
    'ADMIN_USERS': '/admin/users',
    'ADMIN_SERVICES': '/admin/services',
    'ADMIN_ORDERS': '/admin/orders',
    'ADMIN_FINANCE': '/admin/finance',
    'ADMIN_DISPUTES': '/admin/disputes',
    'ADMIN_AUDIT': '/admin/audit',
    'USER_MANAGEMENT': '/admin/users',
    'AUDIT_LOGS': '/admin/audit',
};

interface Props {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
}

const AdminLayout: React.FC<Props> = ({ children, activeView, onNavigate }) => {
    const { user, isDarkMode, toggleDarkMode, logout } = useAppStore();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = React.useState(true);

    const menuItems = [
        { id: 'ADMIN_DASHBOARD', label: 'Painel Geral', icon: <LayoutDashboard size={16} /> },
        { id: 'ADMIN_USERS', label: 'Gestão de Usuários', icon: <Users size={16} /> },
        { id: 'ADMIN_SERVICES', label: 'Catálogo de Serviços', icon: <Briefcase size={16} /> },
        { id: 'ADMIN_ORDERS', label: 'Fluxo de Pedidos', icon: <ReceiptText size={16} /> },
        { id: 'ADMIN_FINANCE', label: 'Gestão Financeira', icon: <History size={16} /> },
        { id: 'ADMIN_DISPUTES', label: 'Fila de Disputas', icon: <AlertCircle size={16} /> },
        { id: 'ADMIN_AUDIT', label: 'Logs de Auditoria', icon: <ShieldCheck size={16} /> },
    ];

    const handleLogout = async () => {
        try { await supabase.auth.signOut(); } catch (e) { console.warn(e); }
        finally { logout(); navigate('/login', { replace: true }); }
    };

    const userName = (user as any)?.user_metadata?.name || (user as any)?.name || 'Operador';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <div className={`min-h-screen flex font-sans ${isDarkMode ? 'dark' : ''}`}
            style={{ background: isDarkMode ? '#0F1115' : '#F7F8FA' }}>

            {/* ── Sidebar ── */}
            <aside
                className="flex flex-col shrink-0 border-r transition-all duration-300 ease-out"
                style={{
                    width: isSidebarOpen ? '240px' : '64px',
                    background: isDarkMode ? '#111318' : '#F3F4F6',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-4 border-b overflow-hidden"
                    style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: isDarkMode ? '#E6E8EC' : '#111111' }}>
                        <span className="font-semibold text-xs"
                            style={{ color: isDarkMode ? '#111111' : '#FFFFFF' }}>TC</span>
                    </div>
                    {isSidebarOpen && (
                        <span className="ml-3 font-semibold text-sm whitespace-nowrap tracking-tight"
                            style={{ color: isDarkMode ? '#E6E8EC' : '#111111' }}>
                            Admin Connect
                        </span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-hidden">
                    {menuItems.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    const route = ADMIN_ROUTE_MAP[item.id] || `/admin/${item.id.replace('ADMIN_', '').toLowerCase()}`;
                                    onNavigate(route);
                                }}
                                title={!isSidebarOpen ? item.label : undefined}
                                className="w-full flex items-center h-9 px-2.5 rounded-lg transition-all duration-[120ms] ease-out group relative"
                                style={{
                                    background: isActive
                                        ? isDarkMode ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.08)'
                                        : 'transparent',
                                    color: isActive
                                        ? isDarkMode ? '#818CF8' : '#6366F1'
                                        : isDarkMode ? '#9AA0A6' : '#6B7280',
                                }}
                            >
                                <span className="shrink-0 transition-transform duration-[120ms] group-hover:scale-105">
                                    {item.icon}
                                </span>
                                {isSidebarOpen && (
                                    <span className="ml-3 text-[13px] font-medium whitespace-nowrap">
                                        {item.label}
                                    </span>
                                )}
                                {isActive && isSidebarOpen && (
                                    <ChevronRight size={12} className="ml-auto opacity-60" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-2 border-t"
                    style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center h-9 px-2.5 rounded-lg transition-all duration-[120ms] ease-out group"
                        style={{ color: isDarkMode ? '#9AA0A6' : '#6B7280' }}
                    >
                        <LogOut size={16} className="shrink-0 transition-transform duration-[120ms] group-hover:scale-105" />
                        {isSidebarOpen && (
                            <span className="ml-3 text-[13px] font-medium whitespace-nowrap">
                                Sair do Admin
                            </span>
                        )}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Topbar */}
                <header className="h-16 flex items-center justify-between px-6 border-b shrink-0 transition-colors"
                    style={{
                        background: isDarkMode ? 'rgba(15,17,21,0.95)' : 'rgba(247,248,250,0.95)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        backdropFilter: 'blur(12px)',
                    }}>

                    <div className="flex items-center gap-3">
                        {/* Toggle sidebar */}
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-[120ms] ease-out hover:scale-105"
                            style={{
                                background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                color: isDarkMode ? '#9AA0A6' : '#6B7280',
                            }}
                        >
                            <Menu size={16} />
                        </button>

                        {/* Search */}
                        <div className="relative hidden md:block">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: isDarkMode ? '#9AA0A6' : '#6B7280' }} />
                            <input
                                type="text"
                                placeholder="Buscar usuários ou pedidos..."
                                className="h-9 w-64 rounded-lg pl-9 pr-4 text-[13px] font-medium outline-none transition-all duration-[120ms]"
                                style={{
                                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                    color: isDarkMode ? '#E6E8EC' : '#111111',
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Dark mode */}
                        <button
                            onClick={toggleDarkMode}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-[120ms] ease-out hover:scale-105"
                            style={{
                                background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                color: isDarkMode ? '#9AA0A6' : '#6B7280',
                            }}
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {/* Notifications */}
                        <button
                            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-[120ms] ease-out hover:scale-105"
                            style={{
                                background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                color: isDarkMode ? '#9AA0A6' : '#6B7280',
                            }}
                        >
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                                style={{ background: '#EF4444' }} />
                        </button>

                        {/* Divider */}
                        <div className="w-px h-5 mx-1" style={{
                            background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                        }} />

                        {/* User */}
                        <div className="flex items-center gap-2">
                            {isSidebarOpen && (
                                <div className="text-right hidden sm:block">
                                    <p className="text-[12px] font-semibold leading-tight"
                                        style={{ color: isDarkMode ? '#E6E8EC' : '#111111' }}>
                                        {userName}
                                    </p>
                                    <p className="text-[10px] font-medium" style={{ color: '#22C55E' }}>
                                        Operador Master
                                    </p>
                                </div>
                            )}
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-semibold"
                                style={{ background: '#6366F1' }}>
                                {userInitial}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col"
                    style={{ background: isDarkMode ? 'rgba(17,19,24,0.3)' : 'rgba(243,244,246,0.5)' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

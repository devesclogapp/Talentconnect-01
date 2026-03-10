import React from 'react';
import {
    LayoutDashboard, Users, Briefcase, ReceiptText,
    ShieldCheck, AlertCircle, History, LogOut,
    Menu, Bell, Moon, Sun, Search, ChevronLeft,
    Activity, Settings, ChevronsLeft
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

const MENU_GROUPS = [
    {
        label: 'Visão Geral',
        items: [
            { id: 'ADMIN_DASHBOARD', label: 'Painel Geral', icon: <LayoutDashboard size={16} />, badge: null },
        ]
    },
    {
        label: 'Operações',
        items: [
            { id: 'ADMIN_USERS', label: 'Usuários', icon: <Users size={16} />, badge: null },
            { id: 'ADMIN_SERVICES', label: 'Serviços', icon: <Briefcase size={16} />, badge: null },
            { id: 'ADMIN_ORDERS', label: 'Pedidos & SLA', icon: <ReceiptText size={16} />, badge: null },
        ]
    },
    {
        label: 'Financeiro & Compliance',
        items: [
            { id: 'ADMIN_FINANCE', label: 'Financeiro', icon: <History size={16} />, badge: null },
            { id: 'ADMIN_DISPUTES', label: 'Disputas', icon: <AlertCircle size={16} />, badge: null },
            { id: 'ADMIN_AUDIT', label: 'Logs de Auditoria', icon: <ShieldCheck size={16} />, badge: null },
        ]
    },
];

interface Props {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
}

const AdminLayout: React.FC<Props> = ({ children, activeView, onNavigate }) => {
    const { user, isDarkMode, toggleDarkMode, logout } = useAppStore();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = React.useState(true);

    const handleLogout = async () => {
        try { await supabase.auth.signOut(); } catch (e) { console.warn(e); }
        finally { logout(); navigate('/login', { replace: true }); }
    };

    const userName = (user as any)?.user_metadata?.name || (user as any)?.name || 'Operador';
    const userInitial = userName.charAt(0).toUpperCase();

    const activeLabel = MENU_GROUPS.flatMap(g => g.items).find(i => i.id === activeView)?.label || 'Painel';

    return (
        <div className={`min-h-screen flex font-sans ${isDarkMode ? 'dark' : ''} bg-background`}>

            {/* ── Sidebar ── */}
            <aside
                className="flex flex-col shrink-0 border-r border-border bg-card transition-all duration-300 ease-out"
                style={{ width: isSidebarOpen ? '240px' : '64px' }}
            >
                {/* Logo */}
                <div className="h-14 flex items-center px-4 border-b border-border overflow-hidden shrink-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary">
                        <span className="font-semibold text-[10px] text-primary-foreground">TC</span>
                    </div>
                    {isSidebarOpen && (
                        <div className="ml-3 overflow-hidden">
                            <p className="font-semibold text-[13px] text-foreground whitespace-nowrap tracking-tight leading-none">Talent Connect</p>
                            <p className="text-[9px] font-semibold text-primary uppercase tracking-widest mt-0.5">ERP Admin</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-3 overflow-hidden overflow-y-auto">
                    {MENU_GROUPS.map((group) => (
                        <div key={group.label} className="mb-4">
                            {isSidebarOpen && (
                                <p className="px-4 mb-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">{group.label}</p>
                            )}
                            <div className="px-2 space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = activeView === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                const route = ADMIN_ROUTE_MAP[item.id] || `/admin/${item.id.replace('ADMIN_', '').toLowerCase()}`;
                                                onNavigate(route);
                                            }}
                                            title={!isSidebarOpen ? item.label : undefined}
                                            className={`w-full flex items-center h-9 px-2.5 rounded-lg transition-all duration-150 ease-out group relative ${isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                                            )}
                                            <span className={`shrink-0 transition-transform duration-150 ${isActive ? '' : 'group-hover:scale-105'}`}>
                                                {item.icon}
                                            </span>
                                            {isSidebarOpen && (
                                                <span className="ml-3 text-[13px] font-medium whitespace-nowrap">
                                                    {item.label}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-2 border-t border-border space-y-0.5 shrink-0">
                    <button
                        onClick={handleLogout}
                        title={!isSidebarOpen ? 'Sair' : undefined}
                        className="w-full flex items-center h-9 px-2.5 rounded-lg transition-all duration-150 ease-out group text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOut size={16} className="shrink-0 transition-transform duration-150 group-hover:scale-105" />
                        {isSidebarOpen && (
                            <span className="ml-3 text-[13px] font-medium whitespace-nowrap">Sair do Admin</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Topbar */}
                <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">

                    <div className="flex items-center gap-3">
                        {/* Toggle sidebar */}
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ease-out hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                            {isSidebarOpen ? <ChevronsLeft size={16} /> : <Menu size={16} />}
                        </button>

                        {/* Breadcrumb */}
                        <div className="hidden md:flex items-center gap-1.5 text-sm">
                            <span className="text-muted-foreground">Admin</span>
                            <span className="text-muted-foreground/50">/</span>
                            <span className="font-semibold text-foreground">{activeLabel}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Live indicator */}
                        <div className="hidden md:flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">Online</span>
                        </div>

                        {/* Dark mode */}
                        <button
                            onClick={toggleDarkMode}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ease-out hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Alternar tema"
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {/* Notifications */}
                        <button
                            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ease-out hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Notificações"
                        >
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                        </button>

                        {/* Divider */}
                        <div className="w-px h-5 mx-1 bg-border" />

                        {/* User */}
                        <div className="flex items-center gap-2.5">
                            <div className="text-right hidden sm:block">
                                <p className="text-[12px] font-semibold text-foreground leading-tight">{userName}</p>
                                <p className="text-[10px] font-medium text-green-500">Operador Master</p>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-semibold bg-primary shrink-0">
                                {userInitial}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 flex flex-col bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

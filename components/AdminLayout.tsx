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
        <div className={`min-h-screen flex font-sans ${isDarkMode ? 'dark' : ''} bg-folio-bg text-folio-text`}>
            {/* ── Sidebar ── */}
            <aside
                className="flex flex-col shrink-0 border-r border-folio-border bg-folio-surface2 transition-all duration-300 ease-out"
                style={{ width: isSidebarOpen ? '250px' : '72px' }}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-folio-border/50 overflow-hidden shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-folio-accent shadow-glow">
                        <span className="font-bold text-[11px] text-white">TC</span>
                    </div>
                    {isSidebarOpen && (
                        <div className="ml-3 overflow-hidden">
                            <p className="font-bold text-[14px] text-folio-text whitespace-nowrap tracking-tight leading-none">Talent Connect</p>
                            <p className="text-[10px] font-bold text-folio-accent uppercase tracking-widest mt-1">ERP ADMIN</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-6 overflow-hidden overflow-y-auto px-3">
                    {MENU_GROUPS.map((group) => (
                        <div key={group.label} className="mb-6">
                            {isSidebarOpen && (
                                <p className="px-3 mb-2 text-[10px] font-bold text-folio-text-dim/40 uppercase tracking-[1.5px]">{group.label}</p>
                            )}
                            <div className="space-y-1">
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
                                            className={`w-full flex items-center h-10 px-3 rounded-xl transition-all duration-200 group relative ${isActive
                                                ? 'bg-folio-surface text-folio-text shadow-sm'
                                                : 'text-folio-text-dim hover:text-folio-text hover:bg-folio-surface/50'
                                                }`}
                                        >
                                            <span className={`shrink-0 transition-all duration-200 ${isActive ? 'text-folio-accent scale-110' : 'group-hover:scale-105'}`}>
                                                {item.icon}
                                            </span>
                                            {isSidebarOpen && (
                                                <span className={`ml-3 text-[13px] whitespace-nowrap transition-all ${isActive ? 'font-bold' : 'font-medium opacity-80'}`}>
                                                    {item.label}
                                                </span>
                                            )}
                                            {isActive && !isSidebarOpen && (
                                                <div className="absolute left-0 w-1 h-4 bg-folio-accent rounded-r-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-folio-border space-y-1 shrink-0">
                    <button
                        onClick={handleLogout}
                        title={!isSidebarOpen ? 'Sair' : undefined}
                        className="w-full flex items-center h-10 px-3 rounded-xl transition-all duration-200 group text-folio-text-dim hover:bg-red-500/10 hover:text-red-500"
                    >
                        <LogOut size={18} className="shrink-0 transition-transform duration-200 group-hover:rotate-12" />
                        {isSidebarOpen && (
                            <span className="ml-3 text-[13px] font-bold whitespace-nowrap">Sair do Sistema</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Topbar */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-folio-border/40 bg-folio-bg/80 backdrop-blur-xl shrink-0 z-50">

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-folio-surface border border-folio-border shadow-sm hover:border-folio-accent/30 transition-all active:scale-90"
                        >
                            {isSidebarOpen ? <ChevronsLeft size={16} /> : <Menu size={16} />}
                        </button>

                        <div className="hidden md:flex items-center gap-2 text-xs font-bold tracking-tight uppercase">
                            <span className="text-folio-text-dim/40">ADMIN</span>
                            <span className="text-folio-text-dim/20">/</span>
                            <span className="text-folio-text">{activeLabel}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Live indicator */}
                        <div className="hidden lg:flex items-center gap-2 bg-[#1DB97A]/10 text-[#1DB97A] px-3 py-1.5 rounded-full border border-[#1DB97A]/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1DB97A] animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">SISTEMA ATIVO</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 bg-folio-surface2/50 p-1 rounded-xl border border-folio-border">
                            <button
                                onClick={toggleDarkMode}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-folio-surface text-folio-text-dim hover:text-folio-text transition-all"
                            >
                                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                            </button>
                            <button
                                className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-folio-surface text-folio-text-dim hover:text-folio-text transition-all"
                            >
                                <Bell size={15} />
                                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#E24B4A] shadow-glow" />
                            </button>
                        </div>

                        <div className="w-px h-6 mx-1 bg-folio-border/60" />

                        {/* User */}
                        <div className="flex items-center gap-3 pl-1">
                            <div className="text-right hidden sm:block">
                                <p className="text-[12px] font-bold text-folio-text leading-tight">{userName}</p>
                                <p className="text-[10px] font-bold text-[#1DB97A] uppercase tracking-wider">OPERADOR MASTER</p>
                            </div>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-bold bg-folio-accent shadow-glow shrink-0 border-2 border-white/10">
                                {userInitial}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-folio-bg">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

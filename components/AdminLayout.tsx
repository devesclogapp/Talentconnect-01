import React from 'react';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    ReceiptText,
    ShieldCheck,
    AlertCircle,
    History,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Moon,
    Sun,
    Search
} from 'lucide-react';
import { useAppStore } from '../store';

interface Props {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
}

const AdminLayout: React.FC<Props> = ({ children, activeView, onNavigate }) => {
    const { user, isDarkMode, toggleDarkMode, logout } = useAppStore();
    const [isSidebarOpen, setSidebarOpen] = React.useState(true);

    const menuItems = [
        { id: 'ADMIN_DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'ADMIN_USERS', label: 'Usuários', icon: <Users size={20} /> },
        { id: 'ADMIN_SERVICES', label: 'Serviços', icon: <Briefcase size={20} /> },
        { id: 'ADMIN_ORDERS', label: 'Pedidos', icon: <ReceiptText size={20} /> },
        { id: 'ADMIN_FINANCE', label: 'Financeiro', icon: <History size={20} /> },
        { id: 'ADMIN_DISPUTES', label: 'Disputas', icon: <AlertCircle size={20} /> },
        { id: 'ADMIN_AUDIT', label: 'Auditoria', icon: <ShieldCheck size={20} /> },
    ];

    return (
        <div className={`min-h-screen flex bg-bg-primary font-sans ${isDarkMode ? 'dark' : ''}`}>
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-bg-secondary border-r border-border-subtle transition-all duration-300 flex flex-col z-50`}>
                {/* Logo Section */}
                <div className="h-16 flex items-center px-6 border-b border-border-subtle overflow-hidden">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white dark:text-black font-black text-xs">TC</span>
                    </div>
                    {isSidebarOpen && <span className="ml-3 font-black text-text-primary tracking-tighter whitespace-nowrap">Admin Connect</span>}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center h-11 px-3 rounded-xl transition-all group ${activeView === item.id
                                ? 'bg-black text-white shadow-lg shadow-black/10 dark:bg-white dark:text-black'
                                : 'text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary'
                                }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            {isSidebarOpen && <span className="ml-3 text-sm font-medium">{item.label}</span>}
                            {!isSidebarOpen && (
                                <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-[10px] invisible group-hover:visible whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-3 border-t border-border-subtle">
                    <button
                        onClick={logout}
                        className="w-full flex items-center h-11 px-3 rounded-xl text-error hover:bg-error/5 transition-all"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="ml-3 text-sm font-medium">Sair do Admin</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Nav */}
                <header className="h-16 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-8 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors text-text-tertiary"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Global Search Bar */}
                        <div className="relative hidden md:block w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar usuários ou pedidos..."
                                className="w-full bg-bg-secondary border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-accent-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors text-text-tertiary"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button className="p-2 hover:bg-bg-secondary rounded-lg transition-colors text-text-tertiary relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-bg-primary"></span>
                        </button>

                        <div className="h-8 w-px bg-border-subtle mx-2"></div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-text-primary leading-tight">{(user as any)?.user_metadata?.name || 'Operador'}</p>
                                <p className="text-[10px] text-success font-medium">Operador Master</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-accent-primary flex items-center justify-center text-white font-black text-xs">
                                {(user as any)?.user_metadata?.name?.charAt(0) || 'O'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Render Area */}
                <main className="flex-1 overflow-y-auto bg-bg-secondary/30 p-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

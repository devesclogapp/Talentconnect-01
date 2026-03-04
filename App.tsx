import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { onAuthStateChange, getCurrentUser, syncUserSession } from './services/authService';
import AppRoutes from './AppRoutes';
import { useAppStore } from './store';
import {
  Home,
  Calendar,
  User as UserIcon,
  ReceiptText,
  Bell,
  Plus
} from 'lucide-react';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    setSelectedCategory,
    setSelectedServiceId
  } = useAppStore();

  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname;
  const showBottomNav = [
    '/client',
    '/provider',
    '/client/profile',
    '/provider/profile',
    '/provider/agenda',
    '/client/tracking',
    '/client/orders',
    '/provider/received-orders',
    '/notifications'
  ].includes(pathname) || pathname.startsWith('/provider/received-orders');

  const isAdminView = pathname.startsWith('/admin');
  const userRole = (user?.role || 'client').toLowerCase();

  return (
    <div className="min-h-screen relative overflow-hidden bg-app-bg font-sans">
      <div className={`animate-fade-in ${(showBottomNav && !isAdminView) ? 'pb-24' : ''}`}>
        {children}
      </div>

      {(showBottomNav && !isAdminView) && (
        <nav className="bottom-nav">
          <button
            onClick={() => navigate(userRole === 'client' ? '/client' : '/provider')}
            className={`bottom-nav__item interactive ${['/client', '/provider'].includes(pathname) ? 'bottom-nav__item--active' : ''}`}
          >
            <Home size={24} />
            <span className="sr-only">Início</span>
          </button>

          {userRole === 'client' ? (
            <button
              onClick={() => navigate('/client/orders')}
              className={`bottom-nav__item interactive ${['/client/orders', '/client/tracking'].includes(pathname) ? 'bottom-nav__item--active' : ''}`}
            >
              <ReceiptText size={24} />
              <span className="sr-only">Pedidos</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/provider/received-orders')}
              className={`bottom-nav__item interactive ${pathname.startsWith('/provider/received-orders') ? 'bottom-nav__item--active' : ''}`}
            >
              <ReceiptText size={24} />
              <span className="sr-only">Pedidos</span>
            </button>
          )}

          {userRole === 'client' ? (
            <button
              onClick={() => {
                setSelectedCategory(undefined);
                navigate('/client/services');
              }}
              className={`bottom-nav__item interactive ${pathname === '/client/services' ? 'bottom-nav__item--active' : ''}`}
            >
              <Bell size={24} />
              <span className="sr-only">Descobrir</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setSelectedServiceId(undefined);
                  navigate('/provider/service-registration');
                }}
                className="w-14 h-14 flex items-center justify-center -mt-6 interactive rounded-full"
              >
                <div className="w-14 h-14 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg shadow-primary-black/20">
                  <Plus size={32} />
                </div>
                <span className="sr-only">Novo Serviço</span>
              </button>

              <button
                onClick={() => navigate('/provider/agenda')}
                className={`bottom-nav__item interactive ${pathname === '/provider/agenda' ? 'bottom-nav__item--active' : ''}`}
              >
                <Calendar size={24} />
                <span className="sr-only">Agenda</span>
              </button>
            </>
          )}

          <button
            onClick={() => navigate(userRole === 'client' ? '/client/profile' : '/provider/profile')}
            className={`bottom-nav__item interactive ${['/client/profile', '/provider/profile'].includes(pathname) ? 'bottom-nav__item--active' : ''}`}
          >
            <UserIcon size={24} />
            <span className="sr-only">Perfil</span>
          </button>
        </nav>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const {
    setUser,
    setLoading,
    isDarkMode,
    logout,
    resetHistory
  } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Supabase Auth Listener & Initial Check
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const role = currentUser.user_metadata?.role || 'client';
          const name = currentUser.user_metadata?.name || 'Usuário';

          setUser({
            ...currentUser,
            role: role.toUpperCase() as any,
            name: name
          } as any);
        }
      } catch (error) {
        console.error("❌ App: Erro fatal no check de auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const role = session.user.user_metadata?.role || 'client';
        const name = session.user.user_metadata?.name || 'Usuário';

        setUser({
          ...session.user,
          role: role.toUpperCase() as any,
          name: name
        } as any);

        syncUserSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        logout();
        resetHistory();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;

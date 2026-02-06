import React, { useState, useEffect } from 'react';
import { UserRole, User as UserType } from './types';
import { supabase } from './services/supabaseClient';
import { onAuthStateChange, getCurrentUser, signOut as supabaseSignOut, syncUserSession } from './services/authService';
import SplashScreen from './screens/SplashScreen';
import Onboarding from './screens/Onboarding';
import Login from './screens/Login';
import Register from './screens/Register';
import ForgotPassword from './screens/ForgotPassword';
import ClientDashboard from './screens/ClientDashboard';
import ProviderDashboard from './screens/ProviderDashboard';
import ServiceListing from './screens/ServiceListing';
import ServiceDetails from './screens/ServiceDetails';
import ProviderListing from './screens/ProviderListing';
import ProviderProfile from './screens/ProviderProfile';
import CreateOrder from './screens/CreateOrder';
import OrderConfirmation from './screens/OrderConfirmation';
import Payment from './screens/Payment';
import OrderHistory from './screens/OrderHistory';
import OrderDetail from './screens/OrderDetail';
import ProviderRating from './screens/ProviderRating';
import Tracking from './screens/Tracking';
import Support from './screens/Support';
import Profile from './screens/Profile';
import Earnings from './screens/Earnings';
import Agenda from './screens/Agenda';
import NegotiationFlow from './screens/NegotiationFlow';
import NotificationCenter from './screens/NotificationCenter';
import ServiceRegistration from './screens/ServiceRegistration';
import MyServices from './screens/MyServices';
import ReceivedOrders from './screens/ReceivedOrders';
import OrderAcceptReject from './screens/OrderAcceptReject';
import ServiceExecution from './screens/ServiceExecution';
import DevTools from './components/DevTools';
import { useAppStore } from './store';
import {
  Home,
  Wallet,
  Calendar,
  User as UserIcon,
  ReceiptText,
  MessageSquare,
  Bell
} from 'lucide-react';

const App: React.FC = () => {
  const {
    view,
    setView,
    user,
    setUser,
    loading,
    setLoading,
    isDarkMode,
    toggleDarkMode,
    selectedService,
    setSelectedService,
    selectedProvider,
    setSelectedProvider,
    selectedOrder,
    setSelectedOrder,
    orderData,
    setOrderData,
    selectedServiceId,
    setSelectedServiceId,
    selectedCategory,
    setSelectedCategory,
    logout
  } = useAppStore();

  const [refreshKey, setRefreshKey] = useState(0); // For forcing OrderHistory refresh

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

          if (view === 'SPLASH') {
            setView(role.toLowerCase() === 'client' ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD');
          }
        } else if (view === 'SPLASH') {
          setTimeout(() => setView('ONBOARDING'), 2500);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (view === 'SPLASH') setView('ONBOARDING');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listener para mudanças de estado (Login/Logout/SignUp)
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

        if (['LOGIN', 'REGISTER', 'ONBOARDING', 'SPLASH'].includes(view)) {
          setView(role.toLowerCase() === 'client' ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD');
        }
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigate = (newView: string) => setView(newView);

  const handleLogout = async () => {
    await supabaseSignOut();
    logout();
  };

  const handleQuickLogin = async (role: UserRole) => {
    try {
      setLoading(true);
      const email = role === 'CLIENT' ? 'cliente01@email.com' : 'prestador01@email.com';
      const password = 'password123';

      await supabaseSignOut();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.warn("Login real falhou, ativando MOCK USER.", error.message);
        const mockUser = {
          id: role === 'CLIENT' ? 'mock-client-123' : 'mock-provider-456',
          email: email,
          role: role.toUpperCase(),
          user_metadata: {
            role: role.toLowerCase(),
            name: role === 'CLIENT' ? 'Cliente Dev' : 'Prestador Dev',
            avatar_url: `https://i.pravatar.cc/150?u=${role}`
          }
        };
        setUser(mockUser as any);
        setView(role === 'CLIENT' ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD');
        setLoading(false);
        return;
      }

      if (data.user) {
        const userRole = data.user.user_metadata?.role || role.toLowerCase();
        setUser({
          ...data.user,
          role: userRole.toUpperCase() as any,
          name: data.user.user_metadata?.name || 'Usuário Teste'
        } as any);
        setView(userRole.toLowerCase() === 'client' ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD');
      }
    } catch (error: any) {
      console.error("Erro no Login Rápido:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    if (loading && view === 'SPLASH') return <SplashScreen />;

    switch (view) {
      case 'SPLASH':
        return <SplashScreen />;
      case 'ONBOARDING':
        return <Onboarding onStart={() => setView('LOGIN')} />;
      case 'LOGIN':
        return <Login
          onLoginSuccess={(role) => setView(role.toUpperCase() === 'CLIENT' ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD')}
          onRegister={() => setView('REGISTER')}
          onForgotPassword={() => setView('FORGOT_PASSWORD')}
        />;
      case 'REGISTER':
        return <Register
          onBack={() => setView('LOGIN')}
          onRegisterSuccess={(role) => setView(role.toUpperCase() === 'CLIENT' ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD')}
        />;
      case 'FORGOT_PASSWORD':
        return <ForgotPassword onBack={() => setView('LOGIN')} />;

      // --- CLIENT VIEWS ---
      case 'CLIENT_DASHBOARD':
        return <ClientDashboard
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            setView('SERVICE_LISTING');
          }}
          onSelectService={(service) => {
            setSelectedService(service);
            setView('SERVICE_DETAILS');
          }}
          onNavigate={navigate}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          user={user}
        />;
      case 'SERVICE_LISTING':
        return <ServiceListing
          initialCategory={selectedCategory}
          onBack={() => {
            setSelectedCategory(undefined);
            setView('CLIENT_DASHBOARD');
          }}
          onSelectService={(service) => {
            setSelectedService(service);
            setView('SERVICE_DETAILS');
          }}
        />;
      case 'SERVICE_DETAILS':
        return <ServiceDetails
          service={selectedService}
          onBack={() => setView('SERVICE_LISTING')}
          onBook={(service) => {
            setSelectedService(service);
            setSelectedProvider(service.provider);
            setView('CREATE_ORDER');
          }}
        />;

      // New Client Flows
      case 'PROVIDER_LISTING':
        return <ProviderListing
          onBack={() => setView('CLIENT_DASHBOARD')}
          onSelectProvider={(provider) => {
            setSelectedProvider(provider);
            setView('PROVIDER_PROFILE');
          }}
        />;
      case 'PROVIDER_PROFILE':
        return <ProviderProfile
          provider={selectedProvider}
          onBack={() => setView('PROVIDER_LISTING')}
          onBookService={(service) => {
            setSelectedService(service);
            setView('CREATE_ORDER');
          }}
          onMessage={() => alert('Mensagem em desenvolvimento')}
        />;
      case 'CREATE_ORDER':
        return <CreateOrder
          service={selectedService}
          provider={selectedProvider}
          onBack={() => setView('PROVIDER_PROFILE')}
          onConfirm={(data) => {
            setOrderData(data);
            setView('ORDER_CONFIRMATION');
          }}
        />;
      case 'ORDER_CONFIRMATION':
        return <OrderConfirmation
          orderData={orderData}
          onConfirm={(createdOrder) => {
            setSelectedOrder(createdOrder);
            // Redirect to Order Detail instead of Payment to wait for provider acceptance
            setView('ORDER_DETAIL');
          }}
          onEdit={() => setView('CREATE_ORDER')}
        />;
      case 'PAYMENT':
        return <Payment
          order={selectedOrder}
          onBack={() => setView('ORDER_CONFIRMATION')}
          onPaymentSuccess={() => setView('TRACKING')}
        />;
      case 'ORDER_HISTORY':
        return <OrderHistory
          key={refreshKey} // Force remount when key changes
          onBack={() => setView('CLIENT_DASHBOARD')}
          onSelectOrder={(order) => {
            setSelectedOrder(order);
            setView('ORDER_DETAIL');
          }}
        />;
      case 'ORDER_DETAIL':
        return <OrderDetail
          order={selectedOrder}
          onBack={() => setView('ORDER_HISTORY')}
          onContact={() => alert('Chat em desenvolvimento')}
          onSupport={() => alert('Suporte em desenvolvimento')}
          onPay={(order) => {
            setSelectedOrder(order);
            setView('PAYMENT');
          }}
          onRate={() => setView('PROVIDER_RATING')}
          onConfirmCompletion={async () => {
            try {
              const { confirmExecutionFinish } = await import('./services/ordersService');
              await confirmExecutionFinish(selectedOrder.id);
              // Update local state
              setSelectedOrder({ ...selectedOrder, status: 'completed' });
              // Navigate to rating
              setView('PROVIDER_RATING');
            } catch (e) {
              alert('Erro ao confirmar conclusão: ' + e);
            }
          }}
        />;
      case 'PROVIDER_RATING':
        return <ProviderRating
          provider={selectedProvider}
          order={selectedOrder}
          onBack={() => setView('ORDER_DETAIL')}
          onSubmit={async (rating, comment) => {
            console.log('Rating submitted:', rating, comment);
            // Force local update of status to 'completed' so OrderDetail reflects it
            if (selectedOrder) {
              setSelectedOrder({ ...selectedOrder, status: 'completed' });
            }
            // Increment refreshKey to force OrderHistory to remount and fetch fresh data
            setRefreshKey(prev => prev + 1);
            // Navigate back to ORDER_HISTORY to show the updated list
            setView('ORDER_HISTORY');
          }}
        />;

      case 'TRACKING':
        return <Tracking
          onBack={() => setView('CLIENT_DASHBOARD')}
          onSupport={() => setView('SERVICE_LISTING')} // Placeholder
          onPay={(order) => {
            setSelectedOrder(order);
            setView('PAYMENT');
          }}
        />;
      // --- SHARED VIEWS (Profile, Support) ---
      case 'SUPPORT':
        return <Support onBack={() => setView((user?.role === 'client') ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD')} />;
      case 'PROFILE':
        return <Profile
          role={(user?.role || 'client').toUpperCase()}
          onSwitchRole={() => alert("Troca de perfil não permitida no MVP sem logout.")}
          onNavigate={navigate}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          user={user}
        />;

      // --- PROVIDER VIEWS ---
      case 'PROVIDER_DASHBOARD':
        return <ProviderDashboard
          onNavigate={navigate}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenNegotiation={(neg) => {
            // No MVP, negociações são integradas aos pedidos
            setView('NEGOTIATION_FLOW');
          }}
          onAddService={() => setView('SERVICE_REGISTRATION')}
          user={user}
        />;

      case 'MY_SERVICES':
        return <MyServices
          onBack={() => setView('PROFILE')}
          onNavigate={(view, serviceId) => {
            if (serviceId) {
              setSelectedServiceId(serviceId);
            } else {
              setSelectedServiceId(undefined);
            }
            setView(view);
          }}
        />;
      case 'SERVICE_REGISTRATION':
        return <ServiceRegistration
          serviceId={selectedServiceId}
          onBack={() => {
            setSelectedServiceId(undefined);
            setView('MY_SERVICES');
          }}
          onComplete={() => {
            setSelectedServiceId(undefined);
            setView('MY_SERVICES');
          }}
        />;

      case 'NEGOTIATION_FLOW':
        return <NegotiationFlow
          negotiation={null}
          onBack={() => setView('PROVIDER_DASHBOARD')}
          onComplete={() => setView('AGENDA')}
        />;

      // Provider Order Management
      case 'RECEIVED_ORDERS':
        return <ReceivedOrders
          onBack={() => setView('PROVIDER_DASHBOARD')}
          onSelectOrder={(order) => {
            setSelectedOrder(order);
            if (order.status === 'sent') {
              setView('ORDER_ACCEPT_REJECT');
            } else if (['accepted', 'paid_escrow_held', 'in_execution'].includes(order.status)) {
              setView('SERVICE_EXECUTION');
            } else {
              setView('ORDER_DETAIL');
            }
          }}
        />;
      case 'ORDER_ACCEPT_REJECT':
        return <OrderAcceptReject
          order={selectedOrder}
          onBack={() => setView('RECEIVED_ORDERS')}
          onAccept={() => {
            setView('SERVICE_EXECUTION');
          }}
          onReject={(reason) => {
            console.log('Order rejected:', reason);
            setView('RECEIVED_ORDERS');
          }}
        />;
      case 'SERVICE_EXECUTION':
        return <ServiceExecution
          order={selectedOrder}
          onBack={() => setView('RECEIVED_ORDERS')}
          onComplete={() => setView('PROVIDER_DASHBOARD')}
        />;

      case 'EARNINGS':
        return <Earnings onBack={() => setView('PROVIDER_DASHBOARD')} onNavigate={navigate} />;
      case 'AGENDA':
        return <Agenda onBack={() => setView('PROVIDER_DASHBOARD')} onNavigate={navigate} />;
      case 'NOTIFICATIONS':
        return <NotificationCenter onBack={() => setView((user?.role === 'client') ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD')} />;

      default:
        return <Login
          onLoginSuccess={(role) => setView(role.toUpperCase() === 'CLIENT' ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD')}
          onRegister={() => setView('REGISTER')}
          onForgotPassword={() => setView('FORGOT_PASSWORD')}
        />;
    }
  };

  const showBottomNav = [
    'CLIENT_DASHBOARD',
    'PROVIDER_DASHBOARD',
    'PROFILE',
    'AGENDA',
    'EARNINGS',
    'TRACKING',
    'ORDER_HISTORY',
    'RECEIVED_ORDERS',
    'NOTIFICATIONS'
  ].includes(view);

  const userRole = (user?.role || 'client').toLowerCase();

  return (
    <div className="min-h-screen relative overflow-hidden bg-app-bg font-sans">
      <div className={`animate-fade-in ${showBottomNav ? 'pb-24' : ''}`}>
        {renderView()}
      </div>

      {showBottomNav && (
        <nav className="bottom-nav">
          <button
            onClick={() => setView(userRole === 'client' ? 'CLIENT_DASHBOARD' : 'PROVIDER_DASHBOARD')}
            className={`bottom-nav__item interactive ${(view === 'CLIENT_DASHBOARD' || view === 'PROVIDER_DASHBOARD') ? 'bottom-nav__item--active' : ''}`}
          >
            <Home size={24} />
            <span className="sr-only">Início</span>
          </button>

          {userRole === 'client' ? (
            <button
              onClick={() => setView('ORDER_HISTORY')}
              className={`bottom-nav__item interactive ${(view === 'ORDER_HISTORY' || view === 'TRACKING') ? 'bottom-nav__item--active' : ''}`}
            >
              <ReceiptText size={24} />
              <span className="sr-only">Pedidos</span>
            </button>
          ) : (
            <button
              onClick={() => setView('RECEIVED_ORDERS')}
              className={`bottom-nav__item interactive ${view === 'RECEIVED_ORDERS' ? 'bottom-nav__item--active' : ''}`}
            >
              <ReceiptText size={24} />
              <span className="sr-only">Pedidos</span>
            </button>
          )}

          <button
            onClick={() => {
              if (userRole === 'client') setSelectedCategory(undefined);
              setView(userRole === 'client' ? 'SERVICE_LISTING' : 'AGENDA');
            }}
            className={`bottom-nav__item interactive ${(view === 'SERVICE_LISTING' || view === 'AGENDA') ? 'bottom-nav__item--active' : ''}`}
          >
            {userRole === 'client' ? <Bell size={24} /> : <Calendar size={24} />}
            <span className="sr-only">{userRole === 'client' ? 'Descobrir' : 'Agenda'}</span>
          </button>

          <button
            onClick={() => setView('PROFILE')}
            className={`bottom-nav__item interactive ${view === 'PROFILE' ? 'bottom-nav__item--active' : ''}`}
          >
            <UserIcon size={24} />
            <span className="sr-only">Perfil</span>
          </button>
        </nav>
      )}

      {/* Developer Tools */}
      <DevTools
        currentView={view}
        currentUser={user}
        onNavigate={navigate}
        onQuickLogin={handleQuickLogin}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;

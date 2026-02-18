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
import ClientProfile from './screens/ClientProfile';
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
import EditProfile from './screens/EditProfile';
import ClientsList from './screens/ClientsList';
import DocumentSubmission from './screens/DocumentSubmission';
import OpenDispute from './screens/OpenDispute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './screens/AdminDashboard';
import UserManagement from './screens/UserManagement';
import AuditLogs from './screens/AuditLogs';
import AdminOrders from './screens/AdminOrders';
import AdminFinance from './screens/AdminFinance';
import AdminDisputes from './screens/AdminDisputes';
import AdminServices from './screens/AdminServices';
import AdminLogin from './screens/AdminLogin';

import { useAppStore } from './store';
import {
  Home,
  Wallet,
  Calendar,
  User as UserIcon,
  ReceiptText,
  MessageSquare,
  Bell,
  Plus,
  Shield
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
    selectedClient,
    setSelectedClient,
    selectedOrder,
    setSelectedOrder,
    orderData,
    setOrderData,
    selectedServiceId,
    setSelectedServiceId,
    selectedCategory,
    setSelectedCategory,
    logout,
    goBack,
    resetHistory
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
    console.log("🚀 App: Iniciando verificação de autenticação...");

    // Failsafe: Se em 6 segundos nada acontecer, força a saída da Splash
    const failsafeTimer = setTimeout(() => {
      if (view === 'SPLASH' && loading) {
        console.warn("⚠️ App: Failsafe acionado - O check de auth demorou demais. Forçando Onboarding.");
        setLoading(false);
        setView('ONBOARDING');
      }
    }, 6000);

    const checkUser = async () => {
      try {
        console.log("🔍 App: Buscando usuário atual no Supabase...");
        const currentUser = await getCurrentUser();

        if (currentUser) {
          console.log("✅ App: Usuário encontrado:", currentUser.email);
          const role = currentUser.user_metadata?.role || 'client';
          const name = currentUser.user_metadata?.name || 'Usuário';

          setUser({
            ...currentUser,
            role: role.toUpperCase() as any,
            name: name
          } as any);

          if (view === 'SPLASH') {
            const targetView = role.toLowerCase() === 'client'
              ? 'CLIENT_DASHBOARD'
              : role.toLowerCase() === 'operator'
                ? (localStorage.getItem('lastAdminView') || 'ADMIN_DASHBOARD')
                : 'PROVIDER_DASHBOARD';
            console.log("👉 App: Redirecionando para:", targetView);
            setView(targetView);
            resetHistory();
          }
        } else {
          console.log("ℹ️ App: Nenhum usuário logado.");
          if (view === 'SPLASH') {
            setTimeout(() => {
              console.log("👉 App: Indo para ONBOARDING via timeout normal.");
              setView('ONBOARDING');
            }, 2500);
          }
        }
      } catch (error) {
        console.error("❌ App: Erro fatal no check de auth:", error);
        if (view === 'SPLASH') setView('ONBOARDING');
      } finally {
        clearTimeout(failsafeTimer);
        setLoading(false);
      }
    };

    checkUser();

    // Listener para mudanças de estado (Login/Logout/SignUp)
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log("🔔 App: Evento de Auth detectado:", event);
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
          const lowerRole = role.toLowerCase();
          const targetView = lowerRole === 'client'
            ? 'CLIENT_DASHBOARD'
            : lowerRole === 'operator'
              ? (localStorage.getItem('lastAdminView') || 'ADMIN_DASHBOARD')
              : 'PROVIDER_DASHBOARD';
          setView(targetView);
          resetHistory();
        }
      } else if (event === 'SIGNED_OUT') {
        logout();
        resetHistory();
      }
    });

    return () => {
      clearTimeout(failsafeTimer);
      subscription.unsubscribe();
    };
  }, []);

  const navigate = (newView: string) => setView(newView);

  const handleLogout = async () => {
    await supabaseSignOut();
    logout();
    resetHistory();
  };



  const renderView = () => {
    if (loading && view === 'SPLASH') return <SplashScreen />;

    switch (view) {
      case 'SPLASH':
        return <SplashScreen />;
      case 'ONBOARDING':
        return <Onboarding onNavigate={navigate} />;
      case 'LOGIN':
        return <Login
          onLoginSuccess={(user) => {
            console.log("Login efetuado com sucesso:", user);
            const role = user.user_metadata?.role || 'client';
            const name = user.user_metadata?.name || 'Usuário';

            // Forçar atualização do estado global imediatamente
            setUser({
              ...user,
              role: role.toUpperCase() as any,
              name: name
            } as any);

            setView(
              role.toUpperCase() === 'CLIENT'
                ? 'CLIENT_DASHBOARD'
                : role.toUpperCase() === 'OPERATOR'
                  ? (localStorage.getItem('lastAdminView') || 'ADMIN_DASHBOARD')
                  : 'PROVIDER_DASHBOARD'
            );
            resetHistory();
          }}
          onRegister={() => setView('REGISTER')}
          onForgotPassword={() => setView('FORGOT_PASSWORD')}
        />;
      case 'REGISTER':
        return <Register
          onBack={() => setView('LOGIN')}
          onRegisterSuccess={(role) => {
            const targetView = role.toUpperCase() === 'CLIENT'
              ? 'CLIENT_DASHBOARD'
              : role.toUpperCase() === 'OPERATOR'
                ? (localStorage.getItem('lastAdminView') || 'ADMIN_DASHBOARD')
                : 'PROVIDER_DASHBOARD';
            setView(targetView);
            resetHistory();
          }}
        />;
      case 'ADMIN_LOGIN':
        return <AdminLogin
          onLoginSuccess={(user) => {
            setUser({
              ...user,
              role: 'OPERATOR',
              name: user.user_metadata?.name || 'Operador'
            } as any);
            setView(localStorage.getItem('lastAdminView') || 'ADMIN_DASHBOARD');
            resetHistory();
          }}
          onNavigate={navigate}
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
            goBack();
          }}
          onSelectService={(service) => {
            setSelectedService(service);
            setView('SERVICE_DETAILS');
          }}
        />;
      case 'SERVICE_DETAILS':
        return <ServiceDetails
          service={selectedService}
          onBack={goBack}
          onBook={(service) => {
            setSelectedService(service);
            setSelectedProvider(service.provider);
            setView('CREATE_ORDER');
          }}
        />;

      // New Client Flows
      case 'PROVIDER_LISTING':
        return <ProviderListing
          onBack={goBack}
          onSelectProvider={(provider) => {
            setSelectedProvider(provider);
            setView('PROVIDER_PROFILE');
          }}
        />;
      case 'PROVIDER_PROFILE':
        return <ProviderProfile
          provider={selectedProvider}
          onBack={goBack}
          onBookService={(service) => {
            setSelectedService(service);
            setView('CREATE_ORDER');
          }}
          onMessage={() => alert('Mensagem em desenvolvimento')}
        />;
      case 'CLIENT_PROFILE':
        return <ClientProfile
          client={selectedClient}
          onBack={goBack}
          onMessage={() => alert('Mensagem em desenvolvimento')}
        />;
      case 'CREATE_ORDER':
        return <CreateOrder
          service={selectedService}
          provider={selectedProvider}
          onBack={goBack}
          onConfirm={(data) => {
            setOrderData(data);
            setView('ORDER_CONFIRMATION');
          }}
        />;
      case 'ORDER_CONFIRMATION':
        return <OrderConfirmation
          orderData={orderData}
          onConfirm={(createdOrder) => {
            console.log("Navigating to TRACKING with order:", createdOrder);
            if (createdOrder) {
              setSelectedOrder(createdOrder);
            }
            // Redireciona para a tela de Acompanhamento (Tracking) após confirmar
            setView('TRACKING');
          }}
          onEdit={goBack}
        />;
      case 'PAYMENT':
        return <Payment
          order={selectedOrder}
          onBack={goBack}
          onPaymentSuccess={() => setView('TRACKING')}
        />;
      case 'ORDER_HISTORY':
        return <OrderHistory
          key={refreshKey} // Force remount when key changes
          onBack={goBack}
          onSelectOrder={(order) => {
            setSelectedOrder(order);
            setView('ORDER_DETAIL');
          }}
        />;
      case 'ORDER_DETAIL':
        return <OrderDetail
          order={selectedOrder}
          onBack={goBack}
          onContact={() => alert('Chat em desenvolvimento')}
          onSupport={() => setView('OPEN_DISPUTE')}
          viewingAs={(user?.role || 'client').toLowerCase() as 'client' | 'provider'}
          onViewProfile={(profileUser) => {
            const role = (user?.role || 'client').toLowerCase();
            if (role === 'client') {
              setSelectedProvider(profileUser);
              setView('PROVIDER_PROFILE');
            } else {
              setSelectedClient(profileUser);
              setView('CLIENT_PROFILE');
            }
          }}
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
      case 'OPEN_DISPUTE':
        return <OpenDispute
          order={selectedOrder}
          user={user}
          onBack={goBack}
          onSuccess={(dispute) => {
            console.log("🚀 App: Recebido sinal de sucesso da disputa!", dispute);
            // Update order status locally
            if (selectedOrder) {
              console.log("🚀 App: Atualizando status local do pedido para 'disputed'");
              setSelectedOrder({ ...selectedOrder, status: 'disputed' });
            }
            console.log("🚀 App: Navegando para ORDER_DETAIL...");
            setView('ORDER_DETAIL');
          }}
        />;
      case 'PROVIDER_RATING':
        return <ProviderRating
          provider={selectedProvider}
          order={selectedOrder}
          onBack={goBack}
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
          onBack={goBack}
          onSupport={() => setView('SERVICE_LISTING')} // Placeholder
          onPay={(order) => {
            setSelectedOrder(order);
            setView('PAYMENT');
          }}
        />;
      // --- SHARED VIEWS (Profile, Support) ---
      case 'SUPPORT':
        return <Support onBack={goBack} />;
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
      case 'EDIT_PROFILE':
        return <EditProfile
          user={user}
          onBack={goBack}
          onUpdate={(updatedUser: any) => {
            setUser(updatedUser);
            // Optionally update Supabase session
            // syncUserSession(updatedUser);
          }}
        />;
      case 'PROVIDER_DASHBOARD':
        return <ProviderDashboard
          user={user}
          onNavigate={setView}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenNegotiation={(negotiation) => {
            setSelectedOrder(negotiation);
            setView('NEGOTIATION_FLOW');
          }}
          onAddService={() => setView('SERVICE_REGISTRATION')}
        />;

      case 'MY_SERVICES':
        return <MyServices
          onBack={goBack}
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
            goBack();
          }}
          onComplete={() => {
            setSelectedServiceId(undefined);
            setView('MY_SERVICES');
          }}
        />;

      case 'NEGOTIATION_FLOW':
        return <NegotiationFlow
          negotiation={selectedOrder}
          onBack={goBack}
          onComplete={() => setView('RECEIVED_ORDERS')}
        />;

      // Provider Order Management
      case 'RECEIVED_ORDERS':
      case 'RECEIVED_ORDERS:pending': {
        const filter = view.includes(':') ? view.split(':')[1] : 'all';
        return <ReceivedOrders
          initialFilter={filter}
          onBack={goBack}
          onSelectOrder={(order) => {
            setSelectedOrder(order);
            if (order.status === 'sent' || order.status === 'awaiting_details') {
              setView('ORDER_ACCEPT_REJECT');
            } else if (['accepted', 'paid_escrow_held', 'in_execution'].includes(order.status)) {
              setView('SERVICE_EXECUTION');
            } else {
              setView('ORDER_DETAIL');
            }
          }}
        />;
      }
      case 'ORDER_ACCEPT_REJECT':
        return <OrderAcceptReject
          order={selectedOrder}
          onBack={goBack}
          onAccept={() => {
            setView('SERVICE_EXECUTION');
          }}
          onReject={(reason) => {
            console.log('Order rejected:', reason);
            setView('RECEIVED_ORDERS');
          }}
          onNegotiate={(order) => {
            setSelectedOrder(order);
            setView('NEGOTIATION_FLOW');
          }}
        />;
      case 'SERVICE_EXECUTION':
        return <ServiceExecution
          order={selectedOrder}
          onBack={goBack}
          onComplete={() => setView('PROVIDER_DASHBOARD')}
        />;

      case 'EARNINGS':
        return <Earnings onBack={goBack} onNavigate={navigate} />;
      case 'AGENDA':
        return <Agenda onBack={goBack} onNavigate={navigate} />;
      case 'NOTIFICATIONS':
        return <NotificationCenter onBack={goBack} />;
      case 'DOCUMENT_SUBMISSION':
        return <DocumentSubmission
          onBack={() => setView('PROFILE')}
          onSubmissionSuccess={() => setView('PROFILE')}
        />;
      case 'CLIENTS_LIST':
        return <ClientsList
          onBack={goBack}
          onClientSelect={(client) => {
            setSelectedClient(client);
            setView('CLIENT_PROFILE');
          }}
        />;

      case 'ADMIN_DASHBOARD':
      case 'ADMIN_USERS':
      case 'ADMIN_SERVICES':
      case 'ADMIN_ORDERS':
      case 'ADMIN_FINANCE':
      case 'ADMIN_DISPUTES':
      case 'ADMIN_AUDIT':
        return (
          <AdminLayout activeView={view} onNavigate={setView}>
            {view === 'ADMIN_DASHBOARD' && <AdminDashboard />}
            {view === 'ADMIN_USERS' && <UserManagement />}
            {view === 'ADMIN_AUDIT' && <AuditLogs />}
            {view === 'ADMIN_ORDERS' && <AdminOrders />}
            {view === 'ADMIN_FINANCE' && <AdminFinance />}
            {view === 'ADMIN_DISPUTES' && <AdminDisputes />}
            {view === 'ADMIN_SERVICES' && <AdminServices />}
            {!['ADMIN_DASHBOARD', 'ADMIN_USERS', 'ADMIN_AUDIT', 'ADMIN_ORDERS', 'ADMIN_FINANCE', 'ADMIN_DISPUTES', 'ADMIN_SERVICES'].includes(view) && (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Shield size={64} strokeWidth={1} />
                <h2 className="heading-md mt-4">Módulo em Desenvolvimento</h2>
                <p className="text-sm">Esta funcionalidade está sendo preparada para o sistema operacional.</p>
              </div>
            )}
          </AdminLayout>
        );

      default:
        return <Login
          onLoginSuccess={(user) => {
            const role = user.user_metadata?.role || 'client';
            setView(role.toUpperCase() === 'CLIENT' ? 'CLIENT_DASHBOARD' : role.toUpperCase() === 'OPERATOR' ? (localStorage.getItem('lastAdminView') || 'ADMIN_DASHBOARD') : 'PROVIDER_DASHBOARD');
          }}
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
    'TRACKING',
    'ORDER_HISTORY',
    'NOTIFICATIONS'
  ].includes(view) || view.startsWith('RECEIVED_ORDERS');

  const isAdminView = view.startsWith('ADMIN_');

  const userRole = (user?.role || 'client').toLowerCase();

  return (
    <div className="min-h-screen relative overflow-hidden bg-app-bg font-sans">
      {(loading || view === 'SPLASH') ? (
        <SplashScreen />
      ) : (
        <>
          <div className={`animate-fade-in ${(showBottomNav && !isAdminView) ? 'pb-24' : ''}`}>
            {renderView()}
          </div>

          {(showBottomNav && !isAdminView) && (
            <nav className="bottom-nav">
              <button
                onClick={() => setView(
                  userRole === 'client'
                    ? 'CLIENT_DASHBOARD'
                    : userRole === 'operator'
                      ? (localStorage.getItem('lastAdminView') || 'ADMIN_DASHBOARD')
                      : 'PROVIDER_DASHBOARD'
                )}
                className={`bottom-nav__item interactive ${(view === 'CLIENT_DASHBOARD' || view === 'PROVIDER_DASHBOARD' || view.startsWith('ADMIN_')) ? 'bottom-nav__item--active' : ''}`}
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
                  className={`bottom-nav__item interactive ${view.startsWith('RECEIVED_ORDERS') ? 'bottom-nav__item--active' : ''}`}
                >
                  <ReceiptText size={24} />
                  <span className="sr-only">Pedidos</span>
                </button>
              )}

              {userRole === 'client' ? (
                <button
                  onClick={() => {
                    if (userRole === 'client') setSelectedCategory(undefined);
                    setView('SERVICE_LISTING');
                  }}
                  className={`bottom-nav__item interactive ${view === 'SERVICE_LISTING' ? 'bottom-nav__item--active' : ''}`}
                >
                  <Bell size={24} />
                  <span className="sr-only">Descobrir</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setSelectedServiceId(undefined);
                      setView('SERVICE_REGISTRATION');
                    }}
                    className="w-14 h-14 flex items-center justify-center -mt-6 interactive rounded-full"
                  >
                    <div className="w-14 h-14 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg shadow-primary-black/20">
                      <Plus size={32} />
                    </div>
                    <span className="sr-only">Novo Serviço</span>
                  </button>

                  <button
                    onClick={() => setView('AGENDA')}
                    className={`bottom-nav__item interactive ${view === 'AGENDA' ? 'bottom-nav__item--active' : ''}`}
                  >
                    <Calendar size={24} />
                    <span className="sr-only">Agenda</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setView('PROFILE')}
                className={`bottom-nav__item interactive ${view === 'PROFILE' ? 'bottom-nav__item--active' : ''}`}
              >
                <UserIcon size={24} />
                <span className="sr-only">Perfil</span>
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default App;

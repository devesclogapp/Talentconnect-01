import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from './store';

// Import Screens (Mobile)
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

// Import Admin Screens
import AdminDashboard from './screens/AdminDashboard';
import UserManagement from './screens/UserManagement';
import AuditLogs from './screens/AuditLogs';
import AdminOrders from './screens/AdminOrders';
import AdminFinance from './screens/AdminFinance';
import AdminDisputes from './screens/AdminDisputes';
import AdminServices from './screens/AdminServices';
import AdminLogin from './screens/AdminLogin';
import AdminLayout from './components/AdminLayout';

const AppRoutes: React.FC = () => {
    const {
        user,
        loading,
        isDarkMode,
        toggleDarkMode,
        selectedCategory,
        setSelectedCategory,
        selectedService,
        setSelectedService,
        selectedProvider,
        setSelectedProvider,
        orderData,
        setOrderData,
        selectedOrder,
        setSelectedOrder,
        selectedClient,
        setSelectedClient,
        selectedServiceId,
        setSelectedServiceId
    } = useAppStore();

    const navigate = useNavigate();

    if (loading) return <SplashScreen />;

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/onboarding" element={<Onboarding onNavigate={(path) => navigate(path)} />} />
            <Route path="/login" element={
                <Login
                    onLoginSuccess={() => { }}
                    onRegister={() => navigate('/register')}
                    onForgotPassword={() => navigate('/forgot-password')}
                />
            } />
            <Route path="/register" element={<Register onBack={() => navigate(-1)} onRegisterSuccess={() => { }} />} />
            <Route path="/forgot-password" element={<ForgotPassword onBack={() => navigate(-1)} />} />
            <Route path="/admin-login" element={<AdminLogin onLoginSuccess={() => { }} onNavigate={(path) => navigate(path)} />} />

            {/* Client Routes */}
            <Route path="/client" element={user && (user.role as any).toUpperCase() === 'CLIENT' ? <ClientDashboard onSelectCategory={(cat) => { setSelectedCategory(cat); navigate('/client/services'); }} onSelectService={(s) => { setSelectedService(s); navigate('/client/service-details'); }} onNavigate={(path) => navigate(path)} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} user={user} /> : <Navigate to="/login" />} />
            <Route path="/client/services" element={<ServiceListing initialCategory={selectedCategory} onBack={() => navigate(-1)} onSelectService={(s) => { setSelectedService(s); navigate('/client/service-details'); }} />} />
            <Route path="/client/service-details" element={<ServiceDetails service={selectedService} onBack={() => navigate(-1)} onBook={(s) => { setSelectedService(s); setSelectedProvider(s.provider); navigate('/client/create-order'); }} />} />
            <Route path="/client/providers" element={<ProviderListing onBack={() => navigate(-1)} onSelectProvider={(p) => { setSelectedProvider(p); navigate('/client/provider-profile'); }} />} />
            <Route path="/client/provider-profile" element={<ProviderProfile provider={selectedProvider} onBack={() => navigate(-1)} onBookService={(s) => { setSelectedService(s); navigate('/client/create-order'); }} onMessage={() => { }} />} />
            <Route path="/client/create-order" element={<CreateOrder service={selectedService} provider={selectedProvider} onBack={() => navigate(-1)} onConfirm={(data) => { setOrderData(data); navigate('/client/order-confirmation'); }} />} />
            <Route path="/client/order-confirmation" element={<OrderConfirmation orderData={orderData} onConfirm={(o) => { if (o) setSelectedOrder(o); navigate('/client/tracking'); }} onEdit={() => navigate(-1)} />} />
            <Route path="/client/tracking" element={<Tracking onBack={() => navigate(-1)} onSupport={() => navigate('/client/services')} onPay={(o) => { setSelectedOrder(o); navigate('/client/payment'); }} />} />
            <Route path="/client/payment" element={<Payment order={selectedOrder} onBack={() => navigate(-1)} onPaymentSuccess={() => navigate('/client/tracking')} />} />
            <Route path="/client/orders" element={<OrderHistory onBack={() => navigate(-1)} onSelectOrder={(o) => { setSelectedOrder(o); navigate('/client/order-detail'); }} />} />
            <Route path="/client/order-detail" element={<OrderDetail order={selectedOrder} onBack={() => navigate(-1)} onViewProfile={(p) => { setSelectedProvider(p); navigate('/client/provider-profile'); }} onPay={(o) => { setSelectedOrder(o); navigate('/client/payment'); }} onSupport={() => navigate('/client/open-dispute')} onRate={() => navigate('/client/rate-provider')} viewingAs="client" onConfirmCompletion={() => { }} onContact={() => { }} />} />
            <Route path="/client/rate-provider" element={<ProviderRating provider={selectedProvider} order={selectedOrder} onBack={() => navigate(-1)} onSubmit={async () => navigate('/client/orders')} />} />
            <Route path="/client/open-dispute" element={<OpenDispute order={selectedOrder} user={user} onBack={() => navigate(-1)} onSuccess={() => navigate(-1)} />} />
            <Route path="/client/profile" element={<Profile role="CLIENT" onSwitchRole={() => { }} onNavigate={(path) => navigate(path)} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} user={user} />} />

            {/* Provider Routes */}
            <Route path="/provider" element={user && (user.role as any).toUpperCase() === 'PROVIDER' ? <ProviderDashboard user={user} onNavigate={(path) => navigate(path)} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} onOpenNegotiation={(n) => { setSelectedOrder(n); navigate('/provider/negotiation'); }} onAddService={() => navigate('/provider/service-registration')} /> : <Navigate to="/login" />} />
            <Route path="/provider/my-services" element={<MyServices onBack={() => navigate(-1)} onNavigate={(path, id) => { if (id) setSelectedServiceId(id); navigate(path); }} />} />
            <Route path="/provider/service-registration" element={<ServiceRegistration serviceId={selectedServiceId} onBack={() => { setSelectedServiceId(undefined); navigate(-1); }} onComplete={() => { setSelectedServiceId(undefined); navigate('/provider/my-services'); }} />} />
            <Route path="/provider/received-orders" element={<ReceivedOrders onBack={() => navigate(-1)} onSelectOrder={(o) => { setSelectedOrder(o); navigate('/provider/order-detail'); }} />} />
            <Route path="/provider/order-detail" element={<OrderDetail order={selectedOrder} onBack={() => navigate(-1)} onViewProfile={(p) => { setSelectedClient(p); navigate('/provider/client-profile'); }} onPay={() => { }} onSupport={() => { }} onRate={() => { }} viewingAs="provider" onConfirmCompletion={() => { }} onContact={() => { }} />} />
            <Route path="/provider/client-profile" element={<ClientProfile client={selectedClient} onBack={() => navigate(-1)} onMessage={() => { }} />} />
            <Route path="/provider/negotiation" element={<NegotiationFlow negotiation={selectedOrder} onBack={() => navigate(-1)} onComplete={() => navigate('/provider/received-orders')} />} />
            <Route path="/provider/order-accept-reject" element={<OrderAcceptReject order={selectedOrder} onBack={() => navigate(-1)} onAccept={() => navigate('/provider/service-execution')} onReject={() => navigate('/provider/received-orders')} onNegotiate={() => navigate('/provider/negotiation')} />} />
            <Route path="/provider/service-execution" element={<ServiceExecution order={selectedOrder} onBack={() => navigate(-1)} onComplete={() => navigate('/provider')} />} />
            <Route path="/provider/earnings" element={<Earnings onBack={() => navigate(-1)} onNavigate={(path) => navigate(path)} />} />
            <Route path="/provider/agenda" element={<Agenda onBack={() => navigate(-1)} onNavigate={(path) => navigate(path)} />} />
            <Route path="/provider/clients" element={<ClientsList onBack={() => navigate(-1)} onClientSelect={(c) => { setSelectedClient(c); navigate('/provider/client-profile'); }} />} />
            <Route path="/provider/profile" element={<Profile role="PROVIDER" onSwitchRole={() => { }} onNavigate={(path) => navigate(path)} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} user={user} />} />
            <Route path="/provider/edit-profile" element={<EditProfile user={user} onBack={() => navigate(-1)} onUpdate={() => { }} />} />
            <Route path="/provider/documents" element={<DocumentSubmission onBack={() => navigate(-1)} onSubmissionSuccess={() => navigate('/provider/profile')} />} />

            {/* Shared Routes */}
            <Route path="/support" element={<Support onBack={() => navigate(-1)} />} />
            <Route path="/notifications" element={<NotificationCenter onBack={() => navigate(-1)} />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout activeView="ADMIN_DASHBOARD" onNavigate={(path) => navigate(path)}><AdminDashboard /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout activeView="ADMIN_USERS" onNavigate={(path) => navigate(path)}><UserManagement /></AdminLayout>} />
            <Route path="/admin/audit" element={<AdminLayout activeView="ADMIN_AUDIT" onNavigate={(path) => navigate(path)}><AuditLogs /></AdminLayout>} />
            <Route path="/admin/orders" element={<AdminLayout activeView="ADMIN_ORDERS" onNavigate={(path) => navigate(path)}><AdminOrders /></AdminLayout>} />
            <Route path="/admin/finance" element={<AdminLayout activeView="ADMIN_FINANCE" onNavigate={(path) => navigate(path)}><AdminFinance /></AdminLayout>} />
            <Route path="/admin/disputes" element={<AdminLayout activeView="ADMIN_DISPUTES" onNavigate={(path) => navigate(path)}><AdminDisputes /></AdminLayout>} />
            <Route path="/admin/services" element={<AdminLayout activeView="ADMIN_SERVICES" onNavigate={(path) => navigate(path)}><AdminServices /></AdminLayout>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;

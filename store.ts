import { create } from 'zustand';
import { User, Service, Order } from './types';

interface AppState {
    // Navigation (Legacy removed, moved to react-router-dom)
    // view: string;
    // previousView: string | null;
    // history: string[];

    // Auth
    user: User | null;
    loading: boolean;

    // Theme
    isDarkMode: boolean;

    // Selection State
    selectedService: Service | null;
    selectedProvider: any | null;
    selectedClient: any | null;
    selectedOrder: Order | null;
    selectedNegotiation: any | null;
    orderData: any | null;
    selectedServiceId: string | undefined;
    selectedCategory: string | undefined;
    viewFilters: any | null;

    // Actions
    // setView: (view: string) => void;
    // goBack: () => void;
    resetHistory: () => void; // Keeping for compatibility or specific reset needs

    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    toggleDarkMode: () => void;
    setSelectedService: (service: Service | null) => void;
    setSelectedProvider: (provider: any | null) => void;
    setSelectedClient: (client: any | null) => void;
    setSelectedOrder: (order: Order | null) => void;
    setOrderData: (data: any | null) => void;
    setSelectedServiceId: (id: string | undefined) => void;
    setSelectedCategory: (category: string | undefined) => void;
    setViewFilters: (filters: any | null) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Initial State
    user: null,
    loading: true,
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    selectedService: null,
    selectedProvider: null,
    selectedClient: null,
    selectedOrder: null,
    selectedNegotiation: null,
    orderData: null,
    selectedServiceId: undefined,
    selectedCategory: undefined,
    viewFilters: null,

    // Actions
    resetHistory: () => { }, // History managed by router now

    setUser: (user) => set({ user }),

    setLoading: (loading) => set({ loading }),

    toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        localStorage.setItem('darkMode', String(newMode));
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newMode };
    }),

    setSelectedService: (selectedService) => set({ selectedService }),
    setSelectedProvider: (selectedProvider) => set({ selectedProvider }),
    setSelectedClient: (selectedClient) => set({ selectedClient }),
    setSelectedOrder: (selectedOrder) => set({ selectedOrder }),
    setOrderData: (orderData) => set({ orderData }),
    setSelectedServiceId: (selectedServiceId) => set({ selectedServiceId }),
    setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
    setViewFilters: (viewFilters) => set({ viewFilters }),

    logout: () => set({
        user: null,
        selectedService: null,
        selectedProvider: null,
        selectedClient: null,
        selectedOrder: null,
        orderData: null
    }),
}));

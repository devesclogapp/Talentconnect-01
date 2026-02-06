import { create } from 'zustand';
import { User, Service, Order } from './types';

interface AppState {
    // Navigation
    view: string;
    previousView: string | null;

    // Auth
    user: User | null;
    loading: boolean;

    // Theme
    isDarkMode: boolean;

    // Selection State
    selectedService: Service | null;
    selectedProvider: any | null; // Tipar melhor depois
    selectedOrder: Order | null;
    selectedNegotiation: any | null;
    orderData: any | null;
    selectedServiceId: string | undefined;
    selectedCategory: string | undefined;

    // Actions
    setView: (view: string) => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    toggleDarkMode: () => void;
    setSelectedService: (service: Service | null) => void;
    setSelectedProvider: (provider: any | null) => void;
    setSelectedOrder: (order: Order | null) => void;
    setOrderData: (data: any | null) => void;
    setSelectedServiceId: (id: string | undefined) => void;
    setSelectedCategory: (category: string | undefined) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Initial State
    view: 'SPLASH',
    previousView: null,
    user: null,
    loading: true,
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    selectedService: null,
    selectedProvider: null,
    selectedOrder: null,
    selectedNegotiation: null,
    orderData: null,
    selectedServiceId: undefined,
    selectedCategory: undefined,

    // Actions
    setView: (newView) => set((state) => ({
        previousView: state.view,
        view: newView
    })),

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
    setSelectedOrder: (selectedOrder) => set({ selectedOrder }),
    setOrderData: (orderData) => set({ orderData }),
    setSelectedServiceId: (selectedServiceId) => set({ selectedServiceId }),
    setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

    logout: () => set({
        user: null,
        view: 'LOGIN',
        selectedService: null,
        selectedProvider: null,
        selectedOrder: null,
        orderData: null
    }),
}));

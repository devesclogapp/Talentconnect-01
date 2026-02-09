import { create } from 'zustand';
import { User, Service, Order } from './types';

interface AppState {
    // Navigation
    view: string;
    previousView: string | null;
    history: string[];

    // Auth
    user: User | null;
    loading: boolean;

    // Theme
    isDarkMode: boolean;

    // Selection State
    selectedService: Service | null;
    selectedProvider: any | null; // Tipar melhor depois
    selectedClient: any | null;
    selectedOrder: Order | null;
    selectedNegotiation: any | null;
    orderData: any | null;
    selectedServiceId: string | undefined;
    selectedCategory: string | undefined;

    // Actions
    setView: (view: string) => void;
    goBack: () => void;
    resetHistory: () => void;

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
    logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Initial State
    view: 'SPLASH',
    previousView: null,
    history: [],
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

    // Actions
    setView: (newView) => set((state) => {
        // Prevent pushing duplicate consecutive views
        if (state.view === newView) return state;
        return {
            history: [...state.history, state.view],
            previousView: state.view,
            view: newView
        };
    }),

    goBack: () => set((state) => {
        if (state.history.length === 0) {
            // Fallback if history is empty (e.g. reload on sub-page)
            const fallback = (state.user?.role as string)?.toUpperCase() === 'PROVIDER' ? 'PROVIDER_DASHBOARD' : 'CLIENT_DASHBOARD';
            return { view: fallback };
        }

        const previous = state.history[state.history.length - 1];
        const newHistory = state.history.slice(0, -1);

        return {
            view: previous,
            history: newHistory,
            previousView: newHistory.length > 0 ? newHistory[newHistory.length - 1] : null
        };
    }),

    resetHistory: () => set({ history: [] }),

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

    logout: () => set({
        user: null,
        view: 'LOGIN',
        history: [], // Clear history on logout
        selectedService: null,
        selectedProvider: null,
        selectedClient: null,
        selectedOrder: null,
        orderData: null
    }),
}));

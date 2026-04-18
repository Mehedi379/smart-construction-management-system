import { create } from 'zustand';
import { authService } from '../services';

const useAuthStore = create((set) => ({
    user: authService.getCurrentUser(),
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    
    login: async (email, password) => {
        set({ loading: true });
        try {
            const response = await authService.login(email, password);
            set({ 
                user: response.data.user, 
                isAuthenticated: true,
                loading: false 
            });
            return response;
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout failed in authStore:', error);
        } finally {
            // Always clear state even if logout fails
            set({ user: null, isAuthenticated: false });
        }
    },

    setUser: (user) => set({ user })
}));

export default useAuthStore;


import { create } from "zustand";

import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from "../api/authService.js";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  // Register and automatically log in through the cookie.
  register: async (userData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await registerUser(userData);

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
        isLoading: false,
      });

      throw error;
    }
  },

  // Log in and save the returned user in frontend state.
  login: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      const response = await loginUser(credentials);

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Login failed. Please check your details.",
        isLoading: false,
      });

      throw error;
    }
  },

  // Restore the session when the app opens or refreshes.
  initializeAuth: async () => {
    set({ isInitializing: true });

    try {
      const response = await getCurrentUser();

      set({
        user: response.data.user,
        isAuthenticated: true,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isInitializing: false });
    }
  },

  // Log out and clear the local authentication state.
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await logoutUser();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Clear displayed errors.
  clearError: () => set({ error: null }),
}));

export default useAuthStore;

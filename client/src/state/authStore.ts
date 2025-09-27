import { create } from 'zustand';

export type UserRole = 'teacher' | 'student' | 'admin';
export interface User { id: string; name: string; role: UserRole; email?: string; }

interface AuthState {
  user: User | null;
  token: string | null;
  adminSession: { user: User; token: string } | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
  impersonate: (user: User, token: string) => void;
  returnToAdmin: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  adminSession: null,
  login: (user, token) => {
    console.log('Auth store login called with:', user);
    localStorage.setItem('lumio_user', JSON.stringify(user));
    localStorage.setItem('lumio_token', token);
    set({ user, token, adminSession: null });
    console.log('Auth state set in store');
  },
  logout: () => {
    localStorage.clear();
    set({ user: null, token: null, adminSession: null });
  },
  hydrate: () => {
    try {
      const u = localStorage.getItem('lumio_user');
      const t = localStorage.getItem('lumio_token');
      console.log('Hydrating - user data:', u, 'token:', t);
      if (u && t) {
        const parsedUser = JSON.parse(u);
        set({ user: parsedUser, token: t });
        console.log('Hydrated user:', parsedUser);
      } else {
        console.log('No auth data to hydrate');
      }
    } catch (err) {
      console.error('Hydration error:', err);
      // Clear invalid data
      localStorage.removeItem('lumio_user');
      localStorage.removeItem('lumio_token');
    }
  },
  impersonate: (user, token) => {
    const state = get();
    if (!state.adminSession && state.user?.role === 'admin') {
      const adminSession = { user: state.user, token: state.token! };
      localStorage.setItem('lumio_admin_session', JSON.stringify(adminSession));
      set({ adminSession });
    }
    localStorage.setItem('lumio_user', JSON.stringify(user));
    localStorage.setItem('lumio_token', token);
    set({ user, token });
  },
  returnToAdmin: () => {
    const { adminSession } = get();
    if (!adminSession) return;
    localStorage.setItem('lumio_user', JSON.stringify(adminSession.user));
    localStorage.setItem('lumio_token', adminSession.token);
    localStorage.removeItem('lumio_admin_session');
    set({ user: adminSession.user, token: adminSession.token, adminSession: null });
  }
}));

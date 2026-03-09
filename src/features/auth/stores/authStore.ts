import { create } from 'zustand';
import { User, UserRole } from '../../../types';
import { userStorage, mmkvStorage, STORAGE_KEYS } from '../../../core/storage/mmkv';

// Test mode - bypass authentication for E2E testing
const TEST_MODE = process.env.NODE_ENV === 'test' || __DEV__;

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;

  // Actions
  initialize: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  // Test mode actions
  testLogin: () => void;
}

// Mock user data for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      role: 'admin' as UserRole,
      deptId: 'dept1',
      enterpriseId: 'ent1',
      enterpriseName: '测试企业',
      deptName: '管理部',
    },
  },
  inspector: {
    password: 'inspector123',
    user: {
      id: '2',
      username: 'inspector',
      role: 'inspector' as UserRole,
      deptId: 'dept2',
      enterpriseId: 'ent1',
      enterpriseName: '测试企业',
      deptName: '巡检部',
    },
  },
  user: {
    password: 'user123',
    user: {
      id: '3',
      username: 'user',
      role: 'user' as UserRole,
      deptId: 'dept3',
      enterpriseId: 'ent1',
      enterpriseName: '测试企业',
      deptName: '生产部',
    },
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isLoggedIn: false,

  initialize: () => {
    // Load user from storage
    const user = userStorage.getUser();
    const token = userStorage.getToken();

    if (user && token) {
      set({ user, token, isLoggedIn: true, isLoading: false });
    } else if (TEST_MODE) {
      // Auto-login as admin in test mode
      const adminUser = mockUsers['admin'];
      const token = `mock_token_${Date.now()}`;
      userStorage.saveUser(adminUser.user);
      userStorage.saveToken(token);
      set({ user: adminUser.user, token, isLoggedIn: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  // Test mode login - can be called from outside
  testLogin: () => {
    if (!TEST_MODE) return;
    const adminUser = mockUsers['admin'];
    const token = `mock_token_${Date.now()}`;
    userStorage.saveUser(adminUser.user);
    userStorage.saveToken(token);
    set({ user: adminUser.user, token, isLoggedIn: true, isLoading: false });
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser = mockUsers[username];

    if (mockUser && mockUser.password === password) {
      const token = `mock_token_${Date.now()}`;
      userStorage.saveUser(mockUser.user);
      userStorage.saveToken(token);

      set({
        user: mockUser.user,
        token,
        isLoggedIn: true,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
      throw new Error('用户名或密码错误');
    }
  },

  logout: () => {
    userStorage.clearUser();
    set({
      user: null,
      token: null,
      isLoggedIn: false,
    });
  },

  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      userStorage.saveUser(updatedUser);
      set({ user: updatedUser });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export type UserRole = 'business' | 'driver' | 'admin';

export interface User {
  user_id: string;
  email?: string;
  phone?: string;
  name: string;
  picture?: string;
  role: UserRole;
  is_validated: boolean;
  business_name?: string;
  business_address?: string;
  business_lat?: number;
  business_lng?: number;
  vehicle_type?: string;
  vehicle_plate?: string;
  vehicle_brand?: string;
  accepted_item_types?: string[];
  refused_item_types?: string[];
  documents?: any[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionToken: string | null;
  loginWithGoogle: (role: 'business' | 'admin') => Promise<void>;
  loginAsDriver: (phone: string, password: string) => Promise<void>;
  registerDriver: (phone: string, password: string, name: string) => Promise<void>;
  loginAsBusiness: (email: string, password: string) => Promise<void>;
  registerBusiness: (data: { email: string; password: string; name: string; business_name: string; business_address: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('session_token');
      if (storedToken) {
        setSessionToken(storedToken);
        await fetchUserData(storedToken);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, clear storage
        await AsyncStorage.removeItem('session_token');
        setSessionToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const loginWithGoogle = async (role: 'business' | 'admin') => {
    setIsLoading(true);
    try {
      const redirectUrl = Platform.OS === 'web'
        ? `${window.location.origin}/auth-callback`
        : Linking.createURL('/auth-callback');

      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        await handleAuthCallback(result.url, role);
      }
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthCallback = async (url: string, role: 'business' | 'admin') => {
    try {
      // Extract session_id from URL (hash or query)
      let sessionId: string | null = null;
      
      if (url.includes('#session_id=')) {
        sessionId = url.split('#session_id=')[1]?.split('&')[0];
      } else if (url.includes('?session_id=')) {
        sessionId = url.split('?session_id=')[1]?.split('&')[0];
      }

      if (!sessionId) {
        throw new Error('No session_id found');
      }

      // Exchange session_id for user data
      const response = await fetch(`${BACKEND_URL}/api/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }

      const data = await response.json();
      
      await AsyncStorage.setItem('session_token', data.session_token);
      setSessionToken(data.session_token);
      setUser(data.user);
    } catch (error) {
      console.error('Auth callback error:', error);
      throw error;
    }
  };

  const loginAsDriver = async (phone: string, name?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/driver/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, name }),
      });

      if (!response.ok) {
        throw new Error('Failed to login');
      }

      const data = await response.json();
      
      await AsyncStorage.setItem('session_token', data.session_token);
      setSessionToken(data.session_token);
      setUser(data.user);
    } catch (error) {
      console.error('Driver login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsBusiness = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/business/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Échec de la connexion');
      }

      const data = await response.json();
      
      await AsyncStorage.setItem('session_token', data.session_token);
      setSessionToken(data.session_token);
      setUser(data.user);
    } catch (error) {
      console.error('Business login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerBusiness = async (data: { email: string; password: string; name: string; business_name: string; business_address: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/business/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Échec de l\'inscription');
      }

      const result = await response.json();
      
      await AsyncStorage.setItem('session_token', result.session_token);
      setSessionToken(result.session_token);
      setUser(result.user);
    } catch (error) {
      console.error('Business register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('session_token');
      setSessionToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (sessionToken) {
      await fetchUserData(sessionToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionToken,
        loginWithGoogle,
        loginAsDriver,
        loginAsBusiness,
        registerBusiness,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

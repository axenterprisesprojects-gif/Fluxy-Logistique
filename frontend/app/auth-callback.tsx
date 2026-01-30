import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import LoadingScreen from '../src/components/LoadingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      let sessionId: string | null = null;

      // Get session_id from URL
      if (Platform.OS === 'web') {
        // Check hash first, then query
        const hash = window.location.hash;
        const search = window.location.search;
        
        if (hash.includes('session_id=')) {
          sessionId = hash.split('session_id=')[1]?.split('&')[0];
        } else if (search.includes('session_id=')) {
          sessionId = new URLSearchParams(search).get('session_id');
        }
      } else {
        // For mobile, get from Linking
        const url = await Linking.getInitialURL();
        if (url) {
          if (url.includes('#session_id=')) {
            sessionId = url.split('#session_id=')[1]?.split('&')[0];
          } else if (url.includes('?session_id=')) {
            sessionId = url.split('?session_id=')[1]?.split('&')[0];
          }
        }
      }

      if (!sessionId) {
        console.error('No session_id found');
        router.replace('/');
        return;
      }

      // Get role from storage (set before redirect)
      const role = await AsyncStorage.getItem('pending_auth_role') || 'business';

      // Exchange session_id for user data
      const response = await fetch(`${BACKEND_URL}/api/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId, role }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      // Store session token
      await AsyncStorage.setItem('session_token', data.session_token);
      await AsyncStorage.removeItem('pending_auth_role');

      // Clean URL and redirect
      if (Platform.OS === 'web') {
        window.history.replaceState({}, '', '/');
      }

      // Redirect based on role
      if (data.user.role === 'business') {
        router.replace('/(business)');
      } else if (data.user.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/');
    }
  };

  return <LoadingScreen message="Connexion en cours..." />;
}

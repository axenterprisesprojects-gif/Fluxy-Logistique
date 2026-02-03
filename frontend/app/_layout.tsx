import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

// Component that uses push notifications (must be inside AuthProvider)
function NotificationHandler() {
  const { sessionToken, user } = useAuth();
  const { expoPushToken, notification, error } = usePushNotifications(sessionToken);
  
  useEffect(() => {
    if (expoPushToken) {
      console.log('📲 Push token ready:', expoPushToken.substring(0, 30) + '...');
    }
    if (error) {
      console.log('⚠️ Push notification setup error:', error);
    }
  }, [expoPushToken, error]);
  
  useEffect(() => {
    if (notification) {
      console.log('🔔 Notification received:', notification.request.content.title);
    }
  }, [notification]);
  
  return null;
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Small delay to allow fonts to load, but don't block indefinitely
        if (Platform.OS === 'web') {
          // On web, skip font loading wait to avoid timeout
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (e) {
        console.warn('Font loading error:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationHandler />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth-callback" />
            <Stack.Screen name="(business)" />
            <Stack.Screen name="(driver)" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

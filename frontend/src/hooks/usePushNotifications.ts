import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Use Constants.expoConfig.extra for production builds
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://api.fluxy-logistique.com';

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
}

export function usePushNotifications(sessionToken: string | null) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Register for push notifications
    console.log('🔔 Starting push notification registration...');
    console.log('🔔 sessionToken:', sessionToken ? 'present' : 'null');
    
    registerForPushNotificationsAsync()
      .then(token => {
        console.log('🔔 Token result:', token);
        if (token) {
          setExpoPushToken(token);
          // Send token to backend if user is logged in
          if (sessionToken) {
            console.log('🔔 Sending token to backend...');
            sendTokenToBackend(token, sessionToken);
          } else {
            console.log('🔔 No sessionToken yet, will send when available');
          }
        } else {
          console.log('🔔 No token obtained');
        }
      })
      .catch(err => {
        setError(err.message);
        console.error('🔔 Push notification error:', err);
      });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('Notification received:', notification);
    });

    // Listen for user interaction with notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.type === 'new_delivery' || data?.type === 'delivery_accepted' || data?.type === 'delivery_completed') {
        // Navigation can be handled here or in the component using this hook
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [sessionToken]);

  // Re-send token when sessionToken changes (user logs in)
  useEffect(() => {
    console.log('🔔 sessionToken changed:', sessionToken ? 'present' : 'null');
    console.log('🔔 expoPushToken:', expoPushToken ? expoPushToken.substring(0, 30) + '...' : 'null');
    
    if (expoPushToken && sessionToken) {
      console.log('🔔 Both present, sending to backend...');
      sendTokenToBackend(expoPushToken, sessionToken);
    }
  }, [sessionToken, expoPushToken]);

  return { expoPushToken, notification, error };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Check if running on physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    // Return null but don't throw - allow app to work in simulator
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    // Use the EAS projectId from expo.dev
    const projectId = 'f3261443-ae67-494f-a854-cd498bee282b';
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = tokenData.data;
    console.log('✅ Expo push token obtained:', token);
  } catch (err) {
    console.error('❌ Error getting push token:', err);
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Livraisons',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      sound: 'default',
    });
    
    // Channel for urgent notifications
    await Notifications.setNotificationChannelAsync('urgent', {
      name: 'Nouvelles livraisons',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#FF0000',
      sound: 'default',
    });
  }

  return token;
}

async function sendTokenToBackend(token: string, sessionToken: string): Promise<void> {
  console.log('🚀 sendTokenToBackend called');
  console.log('🔗 BACKEND_URL:', BACKEND_URL);
  console.log('🎫 Token:', token);
  console.log('🔐 SessionToken:', sessionToken ? 'present' : 'missing');
  
  try {
    const url = `${BACKEND_URL}/api/user/push-token`;
    console.log('📤 Sending to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ push_token: token }),
    });
    
    console.log('📥 Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Push token registered with backend');
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to register push token:', errorText);
    }
  } catch (err) {
    console.error('💥 Error sending push token to backend:', err);
  }
}

// Utility function to schedule a local notification (for testing)
export async function scheduleLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Immediate
  });
}

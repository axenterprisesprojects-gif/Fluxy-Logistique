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
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';

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
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
          // Send token to backend if user is logged in
          if (sessionToken) {
            sendTokenToBackend(token, sessionToken);
          }
        }
      })
      .catch(err => {
        setError(err.message);
        console.error('Push notification error:', err);
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
    if (expoPushToken && sessionToken) {
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
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ push_token: token }),
    });
    
    if (response.ok) {
      console.log('Push token registered with backend');
    } else {
      console.error('Failed to register push token:', await response.text());
    }
  } catch (err) {
    console.error('Error sending push token to backend:', err);
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

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './use-auth';

async function registerPushToken() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.log('[FCM] Push notification permission denied');
      return;
    }

    // Remove any previously registered listeners to avoid duplicates on re-registration
    await PushNotifications.removeAllListeners();

    // Register all listeners BEFORE calling register() to avoid missing the initial token event
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[FCM] Received registration token');
      try {
        const platform = Capacitor.getPlatform() as 'android' | 'ios';
        const apiBase = import.meta.env.VITE_API_URL ?? '';
        const response = await fetch(`${apiBase}/api/fcm-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: token.value, platform }),
        });
        if (!response.ok) {
          const body = await response.text();
          console.error('[FCM] Failed to register token:', body);
        } else {
          console.log('[FCM] Token registered successfully');
        }
      } catch (err) {
        console.error('[FCM] Error sending token to backend:', err);
      }
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[FCM] Registration error:', err.error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[FCM] Notification received in foreground:', notification.title);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[FCM] Notification action:', action.actionId);
    });

    // Call register() only after listeners are in place
    await PushNotifications.register();
  } catch (err) {
    console.error('[FCM] Error initializing push notifications:', err);
  }
}

async function cleanupPushListeners() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();
  } catch (err) {
    console.error('[FCM] Error cleaning up push listeners:', err);
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const activeUserId = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!Capacitor.isNativePlatform()) return;

    // Re-register when the authenticated user changes (multi-account support)
    if (activeUserId.current === user.id) return;

    activeUserId.current = user.id;
    registerPushToken();

    return () => {
      cleanupPushListeners();
    };
  }, [user?.id]);
}

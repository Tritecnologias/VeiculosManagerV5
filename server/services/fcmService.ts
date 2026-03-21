import * as admin from 'firebase-admin';
import { db } from '@db';
import { deviceTokens, users, userRoles } from '@shared/schema';
import { eq } from 'drizzle-orm';

let initialized = false;

function initializeFirebase() {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return true;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
    return false;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('[FCM] Firebase Admin SDK initialized');
    return true;
  } catch (error) {
    console.error('[FCM] Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
}

export function isFirebaseReady(): boolean {
  return initializeFirebase();
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!initializeFirebase() || tokens.length === 0) return;

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Sent: ${response.successCount} success, ${response.failureCount} failures`);

    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx]);
        }
        console.error(`[FCM] Token ${idx} failed:`, resp.error?.message);
      }
    });

    if (invalidTokens.length > 0) {
      await removeInvalidTokens(invalidTokens);
    }
  } catch (error) {
    console.error('[FCM] Error sending push notification:', error);
  }
}

async function removeInvalidTokens(tokens: string[]): Promise<void> {
  for (const token of tokens) {
    try {
      await db.delete(deviceTokens).where(eq(deviceTokens.token, token));
      console.log(`[FCM] Removed invalid token: ${token.substring(0, 20)}...`);
    } catch (error) {
      console.error('[FCM] Error removing invalid token:', error);
    }
  }
}

export async function getAdminTokens(): Promise<string[]> {
  try {
    const admins = await db.query.users.findMany({
      where: eq(users.isActive, true),
      with: { role: true },
    });

    const adminUserIds = admins
      .filter((u) => u.role?.name === 'Administrador')
      .map((u) => u.id);

    if (adminUserIds.length === 0) return [];

    const tokenRows = await db.query.deviceTokens.findMany({
      where: (dt, { inArray }) => inArray(dt.userId, adminUserIds),
    });

    return tokenRows.map((r) => r.token);
  } catch (error) {
    console.error('[FCM] Error fetching admin tokens:', error);
    return [];
  }
}

export async function getUserTokens(userId: number): Promise<string[]> {
  try {
    const tokenRows = await db.query.deviceTokens.findMany({
      where: eq(deviceTokens.userId, userId),
    });
    return tokenRows.map((r) => r.token);
  } catch (error) {
    console.error('[FCM] Error fetching user tokens:', error);
    return [];
  }
}

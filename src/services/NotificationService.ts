/**
 * Jantar Mantar — Notification Service
 * Author: Aman Sharma
 *
 * Manages local notifications for offline events, like when a message is received,
 * a file transfer is complete, a new gateway is discovered, or emergency SOS signals arrive.
 */

import { Platform } from 'react-native';
import DatabaseService from '../database/DatabaseService';
import type { AppNotification, NotificationType } from '../types';

export class NotificationService {
  /**
   * Request permissions (native implementation or web/local notifications stub)
   */
  async requestPermissions(): Promise<boolean> {
    // In a real Android app, we check POST_NOTIFICATIONS permission for Android 13+
    console.log('[NotificationService] Requesting local notification permissions');
    return true;
  }

  /**
   * Display a local notification and save it to the database history.
   */
  showNotification(
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const notification: AppNotification = {
      id,
      type,
      title,
      body,
      data,
      timestamp: Date.now(),
      isRead: false,
    };

    // Save to local database for the Notification screen/logs
    try {
      DatabaseService.setSetting(`notif_${id}`, JSON.stringify(notification));
    } catch (e) {
      console.warn('[NotificationService] Failed to save notification to database:', e);
    }

    // Trigger platform-level notification
    if (Platform.OS === 'android') {
      this._triggerNativeAndroidNotification(title, body, type);
    } else {
      console.log(`[NotificationService Log] [${type.toUpperCase()}] ${title}: ${body}`);
    }
  }

  /**
   * Get all past notification logs from database.
   */
  getNotificationLogs(): AppNotification[] {
    const logs: AppNotification[] = [];
    // Stub retrieval logic
    return logs;
  }

  private _triggerNativeAndroidNotification(title: string, body: string, _type: string) {
    // In React Native, this normally calls a library like @notifee/react-native
    // Or our custom Kotlin foreground service notification channels.
    console.log(`[Android Local Notification] ${title} - ${body}`);
  }
}

export const notificationService = new NotificationService();
export default notificationService;

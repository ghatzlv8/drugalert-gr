// Push Notification Service

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_KEY || 'BKd0G7kYUZGPKS0RkZLqV6Q5qOt6TqFEuTZLvKDXm_w7dKdOiYQkQOQWJC1H_pD3zYF7qLZYnFuPQTAiE0KkTzI';

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async subscribeToPush(userId: string) {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    const permission = await this.requestPermission();
    if (!permission) {
      throw new Error('Notification permission denied');
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      // Send subscription to backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api'}/auth/push-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromPush() {
    if (!this.registration) {
      return;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify backend
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api'}/auth/push-subscription`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }

  async testNotification() {
    if (!this.registration) {
      await this.init();
    }

    const permission = await this.requestPermission();
    if (!permission) {
      console.log('Notification permission denied');
      return;
    }

    // Show test notification
    if (this.registration && this.registration.showNotification) {
      await this.registration.showNotification('EOF Alert - Δοκιμή', {
        body: 'Οι ειδοποιήσεις λειτουργούν σωστά!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
          url: '/posts'
        }
      });
    }
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

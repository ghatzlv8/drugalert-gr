import { useState, useEffect } from 'react';
import { pushNotificationService } from '../services/pushNotifications';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

export default function PushNotificationPrompt() {
  const { user, isAuthenticated } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'unknown' | 'subscribed' | 'unsubscribed'>('unknown');

  useEffect(() => {
    // Add delay to ensure auth state is fully loaded
    const timer = setTimeout(() => {
      checkSubscriptionAndPremiumStatus();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user, isAuthenticated]);

  const checkSubscriptionAndPremiumStatus = async () => {
    if (!isAuthenticated || !user) return;

    try {
      // Check if user is premium (has active subscription or in trial)
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api'}/auth/subscription-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const isPremium = data.is_premium || data.in_trial;

      if (!isPremium) {
        setShowPrompt(false);
        // If not premium and was subscribed, unsubscribe
        if (subscriptionStatus === 'subscribed') {
          await pushNotificationService.unsubscribeFromPush();
          setSubscriptionStatus('unsubscribed');
        }
        return;
      }

      // Check if already subscribed to push notifications
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          setSubscriptionStatus('subscribed');
          setShowPrompt(false);
        } else {
          setSubscriptionStatus('unsubscribed');
          // Check if user has previously dismissed the prompt
          const dismissedTime = localStorage.getItem('pushPromptDismissed');
          if (!dismissedTime || Date.now() - parseInt(dismissedTime) > 7 * 24 * 60 * 60 * 1000) {
            // Show prompt if not dismissed or dismissed more than 7 days ago
            setShowPrompt(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      await pushNotificationService.subscribeToPush(user?.id?.toString() || '');
      setSubscriptionStatus('subscribed');
      setShowPrompt(false);
      
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('DrugAlert.gr', {
          body: 'Θα λαμβάνετε ειδοποιήσεις για νέες ανακοινώσεις του ΕΟΦ',
          icon: '/icon-192x192.png'
        });
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert('Αποτυχία εγγραφής στις ειδοποιήσεις. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pushPromptDismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <BellIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            Ενεργοποίηση Push Notifications
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Λάβετε άμεσες ειδοποιήσεις για νέες ανακοινώσεις του ΕΟΦ στη συσκευή σας.
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribing ? 'Ενεργοποίηση...' : 'Ενεργοποίηση'}
            </button>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Αργότερα
            </button>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

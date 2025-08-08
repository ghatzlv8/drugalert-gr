import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { pushNotificationService } from '../services/pushNotifications';
import Logo from '../components/Logo';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api';
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUser(userData);
      setPreferences({
        email_notifications: userData.email_notifications,
        push_notifications: userData.push_notifications
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      const token = localStorage.getItem('token');
      
      // Update preferences via the correct endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api';
      const response = await fetch(`${apiUrl}/auth/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_notifications: preferences.email_notifications,
          push_notifications: preferences.push_notifications
        })
      });
      
      if (response.ok) {
        setMessage('Οι ρυθμίσεις σας αποθηκεύτηκαν επιτυχώς');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (err) {
      setMessage('Σφάλμα κατά την αποθήκευση των ρυθμίσεων');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση ρυθμίσεων...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Logo showText={true} />
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Αρχική
                </Link>
                <Link href="/alerts" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Ανακοινώσεις
                </Link>
                <Link href="/settings" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Ρυθμίσεις
                </Link>
                <Link href="/subscription" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Συνδρομή
                </Link>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Αποσύνδεση
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Ρυθμίσεις Ειδοποιήσεων</h2>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Ειδοποιήσεις Email</h3>
                <p className="text-sm text-gray-500">Λάβετε ειδοποιήσεις για νέες ανακοινώσεις στο email σας</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={(e) => setPreferences({...preferences, email_notifications: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Push Notifications */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Push Ειδοποιήσεις</h3>
                  <p className="text-sm text-gray-500">Λάβετε άμεσες ειδοποιήσεις στον browser σας</p>
                  {user?.subscription_status !== 'active' && (
                    <p className="text-xs text-orange-600 mt-1">Διαθέσιμο μόνο για Premium συνδρομητές</p>
                  )}
                </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.push_notifications}
                  onChange={async (e) => {
                    const enabled = e.target.checked;
                    setPreferences({...preferences, push_notifications: enabled});
                    
                    // Handle push notification subscription
                    if (enabled && user?.subscription_status === 'active') {
                      try {
                        await pushNotificationService.subscribeToPush(user.id);
                        setMessage('Push ειδοποιήσεις ενεργοποιήθηκαν');
                      } catch (error) {
                        setMessage('Σφάλμα κατά την ενεργοποίηση push ειδοποιήσεων');
                        setPreferences({...preferences, push_notifications: false});
                      }
                    } else if (!enabled) {
                      await pushNotificationService.unsubscribeFromPush();
                    }
                  }}
                  disabled={user?.subscription_status !== 'active'}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
              </div>
              
              {/* Test Push Notification Button */}
              {preferences.push_notifications && user?.subscription_status === 'active' && (
                <button
                  onClick={async () => {
                    try {
                      // Initialize push notification service first
                      await pushNotificationService.init();
                      await pushNotificationService.testNotification();
                      setMessage('Δοκιμαστική ειδοποίηση στάλθηκε!');
                    } catch (error) {
                      console.error('Push notification error:', error);
                      setMessage('Σφάλμα κατά την αποστολή δοκιμαστικής ειδοποίησης');
                    }
                  }}
                  className="ml-4 px-4 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Δοκιμή Ειδοποίησης
                </button>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {message && (
                <p className={`text-sm ${message.includes('επιτυχώς') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση Ρυθμίσεων'}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Πληροφορίες Λογαριασμού</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Email:</dt>
              <dd className="text-sm text-gray-900">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Κατάσταση:</dt>
              <dd className="text-sm text-gray-900">
                {user?.subscription_status === 'active' ? 'Premium Συνδρομητής' : 'Δοκιμαστική Περίοδος'}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}

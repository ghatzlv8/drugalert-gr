import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'authenticated') {
      setIsAuthenticated(true);
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use the admin credentials
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ghatz@lv8.gr',
          password: adminPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.access_token);
        localStorage.setItem('adminAuth', 'authenticated');
        setIsAuthenticated(true);
        fetchAdminData();
      } else {
        alert('Λάθος κωδικός διαχειριστή');
      }
    } catch (error) {
      alert('Σφάλμα σύνδεσης');
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api';
      
      console.log('Fetching admin data with token:', token ? 'Token exists' : 'No token');
      
      // Fetch both stats and users in parallel
      const [statsResponse, usersResponse] = await Promise.all([
        fetch(`${apiUrl}/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${apiUrl}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);
      
      console.log('Stats response:', statsResponse.status);
      console.log('Users response:', usersResponse.status);
      
      // Process stats
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Stats data:', statsData);
        setStats(statsData);
      } else {
        const errorText = await statsResponse.text();
        console.error('Stats error:', statsResponse.status, errorText);
      }
      
      // Process users
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users data:', usersData);
        setUsers(usersData);
      } else {
        const errorText = await usersResponse.text();
        console.error('Users error:', usersResponse.status, errorText);
        setUsers([]);
      }
      
      // If stats failed but users succeeded, calculate stats from users
      if (!statsResponse.ok && usersResponse.ok && users.length > 0) {
        const totalUsers = users.length;
        const activeSubscriptions = users.filter((u: any) => u.subscription_status === 'active' || u.subscription_status === 'SubscriptionStatus.ACTIVE').length;
        const trialUsers = users.filter((u: any) => u.subscription_status === 'trial' || u.subscription_status === 'SubscriptionStatus.TRIAL').length;
        setStats({
          totalUsers,
          activeSubscriptions,
          trialUsers,
          monthlyRevenue: activeSubscriptions * 14.99,
          totalPosts: 0
        });
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      // Show empty data on error
      setStats({
        totalUsers: 0,
        activeSubscriptions: 0,
        trialUsers: 0,
        monthlyRevenue: 0,
        totalPosts: 0
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Διαχείριση DrugAlert.gr
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Εισάγετε τον κωδικό διαχειριστή
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Κωδικός Διαχειριστή
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Εισάγετε κωδικό"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Είσοδος
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση διαχείρισης...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">DrugAlert.gr - Διαχείριση</h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Αποσύνδεση
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Στατιστικά Συστήματος</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Σύνολο Χρηστών</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Ενεργές Συνδρομές</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats?.activeSubscriptions || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Δοκιμαστικοί</h3>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats?.trialUsers || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Μηνιαία Έσοδα</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.monthlyRevenue?.toFixed(2)}€</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Ανακοινώσεις</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalPosts || 0}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Χρήστες</h2>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Κατάσταση
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Εγγραφή
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Τελευταία Σύνδεση
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscription_status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.subscription_status === 'active' ? 'Premium' : 'Δοκιμαστική'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login 
                        ? format(new Date(user.last_login), 'dd/MM/yyyy HH:mm')
                        : 'Ποτέ'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Σύνοψη Εσόδων</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Ετήσιες Συνδρομές ({stats?.activeSubscriptions || 0} × 14.99€):</dt>
              <dd className="text-sm font-medium text-gray-900">{((stats?.activeSubscriptions || 0) * 14.99).toFixed(2)}€</dd>
            </div>
            <div className="flex justify-between border-t pt-2">
              <dt className="text-sm font-medium text-gray-900">Σύνολο Εσόδων:</dt>
              <dd className="text-sm font-bold text-gray-900">{((stats?.activeSubscriptions || 0) * 14.99).toFixed(2)}€</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}

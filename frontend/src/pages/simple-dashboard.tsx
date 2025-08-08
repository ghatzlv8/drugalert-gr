import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Category color mapping
const categoryColors: { [key: string]: string } = {
  'farmaka': 'bg-blue-100 text-blue-800',
  'iatrotexnologika': 'bg-green-100 text-green-800',
  'kallyntika': 'bg-purple-100 text-purple-800',
  'trofima': 'bg-orange-100 text-orange-800',
  'parigoritiki-xrisi-farmaka': 'bg-red-100 text-red-800',
  'klinikes-meletes': 'bg-yellow-100 text-yellow-800',
  'farmakoepagripnisi-farmaka': 'bg-indigo-100 text-indigo-800',
  'default': 'bg-gray-100 text-gray-800'
};

function CategoryTag({ category }: { category: { name: string; slug: string } }) {
  const colorClass = categoryColors[category.slug] || categoryColors.default;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {category.name}
    </span>
  );
}

export default function SimpleDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please login first.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/categories?include_counts=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση πίνακα ελέγχου...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Σφάλμα Φόρτωσης</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Επανάληψη
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>No data available</p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/simple-login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">EOF Alerts</h1>
              <div className="hidden md:flex space-x-4">
                <Link href="/simple-dashboard" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Αρχική
                </Link>
                <Link href="/alerts" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Ανακοινώσεις
                </Link>
                <Link href="/settings" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Καλώς ήρθατε, {dashboardData.user?.email}
          </h2>
          <p className="text-gray-600">
            Κατάσταση: {dashboardData.user?.subscription_status === 'active' ? 'Ενεργή Συνδρομή' : 'Δοκιμαστική Περίοδος'} 
            {dashboardData.user?.trial_days_remaining && 
              ` (${dashboardData.user.trial_days_remaining} ημέρες απομένουν)`
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Σύνολο Ανακοινώσεων</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.total_posts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Αδιάβαστες</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{dashboardData.unread_posts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Κατηγορίες</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.categories}</p>
          </div>
        </div>

        {/* Browse by Category Section */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Αναζήτηση ανά Κατηγορία</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/alerts?category=${category.slug}`}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{category.post_count || 0} ανακοινώσεις</p>
                </Link>
              ))}
              <Link
                href="/alerts"
                className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="text-blue-700 font-medium">Προβολή όλων των ανακοινώσεων →</span>
              </Link>
            </div>
          </div>
        )}

        {dashboardData.recent_posts && dashboardData.recent_posts.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Πρόσφατες Ανακοινώσεις</h3>
            </div>
            <div className="divide-y">
              {dashboardData.recent_posts.map((post: any) => (
                <div key={post.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-gray-900 font-medium mb-2">{post.title}</h4>
                      <div className="flex items-center gap-3 text-sm">
                        <CategoryTag category={post.category} />
                        <span className="text-gray-500">{format(new Date(post.published_date), 'dd MMM yyyy')}</span>
                        {!post.is_read && (
                          <span className="text-blue-600 font-medium">• Αδιάβαστο</span>
                        )}
                      </div>
                    </div>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Προβολή →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

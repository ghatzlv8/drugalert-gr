import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/store';
import Link from 'next/link';
import { format } from 'date-fns';

interface Category {
  id: number;
  name: string;
  slug: string;
  url: string;
  post_count: number;
}

interface Post {
  id: number;
  title: string;
  content: string;
  published_date: string;
  category_id: number;
  is_read: boolean;
  category: {
    name: string;
    slug: string;
  };
}

interface DashboardStats {
  total_posts: number;
  unread_posts: number;
  categories: number;
  recent_posts: Post[];
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyAuth = async () => {
      const isValid = await checkAuth();
      if (!isValid) {
        router.push('/login');
      }
    };
    verifyAuth();
  }, [checkAuth, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch dashboard stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!statsRes.ok) throw new Error('Failed to fetch dashboard data');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch categories with post counts
      const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/categories?include_counts=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/posts/${postId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to mark post as read:', err);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">EOF Alerts Πίνακας Ελέγχου</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/posts" className="text-gray-700 hover:text-primary-600">
                Όλες οι Ανακοινώσεις
              </Link>
              <Link href="/settings" className="text-gray-700 hover:text-primary-600">
                Ρυθμίσεις
              </Link>
              <Link href="/subscription" className="text-gray-700 hover:text-primary-600">
                Συνδρομή
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/');
                }}
                className="text-gray-700 hover:text-red-600"
              >
                Αποσύνδεση
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Καλως ήρθατε, {user?.email}
          </h2>
          <p className="text-gray-600 mt-1">
            {user?.subscription_status === 'active' 
              ? 'Premium Συνδρομητής' 
              : `Δοκιμαστική Περίοδος (${user?.trial_days_remaining || 0} ημέρες απομένουν)`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Συνολικές Ανακοινώσεις</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_posts || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Μη Αναγνωσμένες</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">{stats?.unread_posts || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Κατηγορίες</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.categories || 0}</p>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Αναζήτηση ανά Κατηγορία</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/posts?category=${category.slug}`}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-gray-900">{category.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{category.post_count || 0} ανακοινώσεις</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Posts */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Πρόσφατες Ανακοινώσεις</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {stats?.recent_posts && stats.recent_posts.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {stats.recent_posts.map((post) => (
                  <div key={post.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/posts/${post.id}`}
                          className="text-gray-900 font-medium hover:text-primary-600"
                        >
                          {post.title}
                        </Link>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <span>{post.category.name}</span>
                          <span className="mx-2">•</span>
                          <span>{format(new Date(post.published_date), 'dd MMM yyyy')}</span>
                          {!post.is_read && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-primary-600 font-medium">Μη αναγνωσμένο</span>
                            </>
                          )}
                        </div>
                      </div>
                      {!post.is_read && (
                        <button
                          onClick={() => markAsRead(post.id)}
                          className="ml-4 text-sm text-primary-600 hover:text-primary-700"
                        >
                          Σήμανση ως αναγνωσμένο
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-4 text-gray-500">Δεν υπάρχουν πρόσφατες ανακοινώσεις</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

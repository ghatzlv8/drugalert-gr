import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import Link from 'next/link';
import { Bell, FileText, Settings, CreditCard, LogOut, Menu, X, Shield } from 'lucide-react';
import Navigation from '../components/Navigation';
import Logo from '../components/Logo';
import Layout from '../components/Layout';
import { DocumentTextIcon, BellIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  total_posts: number;
  unread_posts: number;
  categories: number;
  recent_posts: any[];
  user: any;
}

export default function Dashboard() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetchDashboardData();
  }, [token, router]);

  useEffect(() => {
    filterPosts();
  }, [searchQuery, selectedCategory, recentPosts]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api';
      
      // Fetch dashboard data
      const dashResponse = await fetch(`${apiUrl}/user/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (dashResponse.ok) {
        const dashData = await dashResponse.json();
        setStats(dashData);
        setRecentPosts(dashData.recent_posts || []);
        setUser(dashData.user);
      }
      
      // Fetch categories
      const catResponse = await fetch(`${apiUrl}/categories`);
      if (catResponse.ok) {
        const catData = await catResponse.json();
        setCategories(catData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = [...recentPosts];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => 
        post.category_id === parseInt(selectedCategory)
      );
    }
    
    setFilteredPosts(filtered);
  };

  const markAsRead = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api';
      
      await fetch(`${apiUrl}/user/posts/${postId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update local state
      setRecentPosts(posts => 
        posts.map(post => 
          post.id === postId ? { ...post, is_read: true } : post
        )
      );
    } catch (err) {
      console.error('Error marking post as read:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Φόρτωση dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-16">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome & Stats */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Καλώς ήρθατε στο DrugAlert.gr</h1>
            {user?.subscription_status === 'trial' && user.trial_days_remaining > 0 && (
              <p className="mt-2 text-amber-600">
                Δοκιμαστική περίοδος: {user.trial_days_remaining} ημέρες απομένουν
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Συνολικές Ανακοινώσεις</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.total_posts || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BellIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Μη Αναγνωσμένες</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.unread_posts || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FunnelIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Κατηγορίες</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.categories || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Αναζήτηση ανακοινώσεων..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="sm:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Όλες οι κατηγορίες</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Πρόσφατες Ανακοινώσεις</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredPosts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Δεν βρέθηκαν ανακοινώσεις με τα κριτήρια αναζήτησης'
                    : 'Δεν υπάρχουν πρόσφατες ανακοινώσεις'
                  }
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      post.is_read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900">
                          {!post.is_read && (
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                          )}
                          {post.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {post.content}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>{new Date(post.published_date).toLocaleDateString('el-GR')}</span>
                          {post.category && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{post.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {!post.is_read && (
                          <button
                            onClick={() => markAsRead(post.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Σήμανση ως αναγνωσμένο
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {filteredPosts.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Link href="/alerts" className="text-sm text-blue-600 hover:text-blue-800">
                  Δείτε όλες τις ανακοινώσεις →
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

// Category color mapping
const categoryColors: { [key: string]: string } = {
  'farmaka': 'bg-blue-100 text-blue-800',
  'adeia-dynatotitas-paragogis-diakinisis-farmaka': 'bg-green-100 text-green-800',
  'anakliseis-farmakon-anthropinis-xrisis-farmaka': 'bg-red-100 text-red-800',
  'anakoinoseis-timologisis-farmakon-farnaka': 'bg-yellow-100 text-yellow-800',
  'anakoinoseis-farmaka': 'bg-purple-100 text-purple-800',
  'egkyklioi-drastikon-ousion-farmaka': 'bg-indigo-100 text-indigo-800',
  'klinikes-meletes': 'bg-orange-100 text-orange-800',
  'parigoritiki-xrisi-farmaka': 'bg-pink-100 text-pink-800',
  'farmakoepagripnisi-farmaka': 'bg-teal-100 text-teal-800',
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

export default function PostsPage() {
  const router = useRouter();
  const { category: categoryFilter, search: searchQuery, page: pageParam } = router.query;
  
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchQuery as string || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter as string || '');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(pageParam as string) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/simple-login');
      return;
    }
    
    // Update selected category from URL query parameter
    if (categoryFilter && categoryFilter !== selectedCategory) {
      setSelectedCategory(categoryFilter as string);
    }
    
    fetchCategories();
    fetchPosts();
  }, [currentPage, selectedCategory, unreadOnly, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/categories', {
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

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (search) params.append('search', search);
      if (unreadOnly) params.append('unread_only', 'true');
      // Request a large number to get all posts for client-side pagination
      // The API currently returns all matching posts anyway
      params.append('limit', '500');
      
      const response = await fetch(`http://localhost:8000/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      
      // Check if the response is an array (current format) or object with pagination
      if (Array.isArray(data)) {
        // Current API returns all matching posts as an array
        // We need to handle pagination on the client side
        const allPosts = data;
        const postsPerPage = 20;
        setTotalPosts(allPosts.length);
        setTotalPages(Math.ceil(allPosts.length / postsPerPage));
        
        // Apply client-side pagination
        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        setPosts(allPosts.slice(startIndex, endIndex));
      } else {
        // Future format with server-side pagination
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalPosts(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Σφάλμα κατά τη φόρτωση των ανακοινώσεων');
      setPosts([]); // Ensure posts is an empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const markAsRead = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/user/posts/${postId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update local state
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, is_read: true } : post
      ));
    } catch (err) {
      console.error('Error marking post as read:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/simple-login');
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση ανακοινώσεων...</p>
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
              <h1 className="text-xl font-bold text-gray-900">EOF Alerts</h1>
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Αρχική
                </Link>
                <Link href="/posts" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
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
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Αναζήτηση
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Αναζήτηση σε τίτλους και περιεχόμενο..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                >
                  Αναζήτηση
                </button>
              </div>
            </form>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Κατηγορία
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Όλες οι κατηγορίες</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mt-4 flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => {
                  setUnreadOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Μόνο αδιάβαστα</span>
            </label>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600">
          Βρέθηκαν {totalPosts} ανακοινώσεις
          {selectedCategory && ` στην κατηγορία "${categories.find(c => c.slug === selectedCategory)?.name}"`}
          {search && ` για "${search}"`}
        </div>

        {/* Posts List */}
        <div className="bg-white rounded-lg shadow">
          {posts && posts.length > 0 ? (
            <div className="divide-y">
              {posts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <CategoryTag category={{
                          name: post.category_name,
                          slug: categories.find(c => c.id === post.category_id)?.slug || 'default'
                        }} />
                        <span className="text-gray-500">
                          {format(new Date(post.publish_date || post.published_date), 'dd MMMM yyyy', { locale: el })}
                        </span>
                        {!post.is_read && (
                          <span className="text-blue-600 font-medium">• Αδιάβαστο</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markAsRead(post.id)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Προβολή →
                      </a>
                      {!post.is_read && (
                        <button
                          onClick={() => markAsRead(post.id)}
                          className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                        >
                          Σήμανση ως αναγνωσμένο
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Δεν βρέθηκαν ανακοινώσεις
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Προηγούμενη
            </button>
            
            <span className="text-sm text-gray-700">
              Σελίδα {currentPage} από {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Επόμενη →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

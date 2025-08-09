import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// Simple date formatter
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
import Link from 'next/link';
import Layout from '../components/Layout';

interface Category {
  id: number;
  name: string;
  slug: string;
  url: string;
}

interface Attachment {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
}

interface Post {
  id: number;
  title: string;
  url: string;
  content: string;
  excerpt: string;
  publish_date: string;
  tags: string;
  category_id: number;
  category_name: string;
  attachments: Attachment[];
  scraped_at: string;
  is_read?: boolean;
}

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

function CategoryTag({ category, slug }: { category: string; slug?: string }) {
  const colorClass = categoryColors[slug || 'default'] || categoryColors.default;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {category}
    </span>
  );
}

export default function Alerts() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [readPosts, setReadPosts] = useState<Set<number>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  const POSTS_PER_PAGE = 20;

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login?redirect=/alerts');
    }
  }, [router]);

  useEffect(() => {
    const { category, search } = router.query;
    if (category) setSelectedCategory(category as string);
    if (search) setSearchTerm(search as string);
  }, [router.query]);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedCategory, searchTerm, page]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/categories`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        skip: ((page - 1) * POSTS_PER_PAGE).toString(),
        limit: POSTS_PER_PAGE.toString(),
        sort_by: 'publish_date',
        order: 'desc'
      });
      
      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory);
        if (category) params.append('category_id', category.id.toString());
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/posts?${params}`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data = await response.json();
      
      if (page === 1) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === POSTS_PER_PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/posts/${postId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setReadPosts(prev => new Set(prev).add(postId));
    } catch (err) {
      console.error('Failed to mark post as read:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getCategorySlug = (categoryName: string): string => {
    const category = categories.find(c => c.name === categoryName);
    return category?.slug || 'default';
  };

  const handleShare = (post: Post) => {
    setSharePost(post);
    setShowShareModal(true);
    setShareEmail('');
    setShareMessage(`Δες αυτή την ανακοίνωση από τον ΕΟΦ: ${post.title}`);
  };

  const sendShareInvite = async () => {
    if (!shareEmail || !sharePost) return;
    
    setShareLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/share-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: shareEmail,
          post_id: sharePost.id,
          message: shareMessage
        })
      });

      if (response.ok) {
        alert('Η πρόσκληση στάλθηκε επιτυχώς!');
        setShowShareModal(false);
      } else {
        alert('Σφάλμα κατά την αποστολή πρόσκλησης');
      }
    } catch (error) {
      alert('Σφάλμα κατά την αποστολή πρόσκλησης');
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-16">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ανακοινώσεις DrugAlert.gr</h2>
          
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Κατηγορία
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Όλες οι κατηγορίες</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Αναζήτηση
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Αναζήτηση στις ανακοινώσεις..."
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {loading && page === 1 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Φόρτωση ανακοινώσεων...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Δεν βρέθηκαν ανακοινώσεις</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${
                    readPosts.has(post.id) ? 'opacity-75' : ''
                  }`}
                  onClick={() => markAsRead(post.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600"
                        >
                          {post.title}
                        </a>
                      </h3>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <CategoryTag 
                          category={post.category_name} 
                          slug={getCategorySlug(post.category_name)}
                        />
                        <span className="text-sm text-gray-500">
                          {formatDate(post.publish_date)}
                        </span>
                        {readPosts.has(post.id) && (
                          <span className="text-sm text-green-600">✓ Αναγνωσμένο</span>
                        )}
                      </div>
                      
                      {post.excerpt && (
                        <p className="text-gray-600 line-clamp-2">{post.excerpt}</p>
                      )}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Διαβάστε περισσότερα →
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(post);
                          }}
                          className="inline-flex items-center px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.316C18.114 15.562 18 16.018 18 16.5c0 .482.114.938.316 1.342m0-2.684a3 3 0 110 2.684M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Κοινοποίηση
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Load More */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Φόρτωση...' : 'Περισσότερες ανακοινώσεις'}
                </button>
              </div>
            )}
          </>
        )}
        </main>

        {/* Share Modal */}
        {showShareModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowShareModal(false)}>
          <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Κοινοποίηση Ανακοίνωσης
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  Προσκαλέστε κάποιον να εγγραφεί στο DrugAlert.gr για να δει αυτή την ανακοίνωση και να λαμβάνει ειδοποιήσεις για μελλοντικές ανακοινώσεις του ΕΟΦ.
                </p>
              </div>

              <div className="text-left mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email παραλήπτη
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                />
              </div>

              <div className="text-left mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Προσωπικό μήνυμα (προαιρετικό)
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600">
                  <strong>Τίτλος ανακοίνωσης:</strong> {sharePost?.title}
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={sendShareInvite}
                  disabled={!shareEmail || shareLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {shareLoading ? 'Αποστολή...' : 'Αποστολή Πρόσκλησης'}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
}

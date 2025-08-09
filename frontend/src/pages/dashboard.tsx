import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { MagnifyingGlassIcon, DocumentTextIcon, CalendarIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface Category {
  id: number;
  name: string;
  slug: string;
  category_type: string;
  parent_id: number | null;
  post_count?: number;
}

interface Post {
  id: number;
  title: string;
  url: string;
  content?: string;
  excerpt?: string;
  publish_date: string;
  category_id: number;
  category_name?: string;
  category_type?: string;
  is_read?: boolean;
}

const categoryTypeColors: Record<string, string> = {
  farmaka: 'bg-blue-100 text-blue-800 border-blue-200',
  ktiniatrika: 'bg-green-100 text-green-800 border-green-200',
  kallintika: 'bg-pink-100 text-pink-800 border-pink-200',
  iatrotexnologika: 'bg-purple-100 text-purple-800 border-purple-200',
  vioktona: 'bg-orange-100 text-orange-800 border-orange-200',
  diatrofika: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  kannavi: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const categoryTypeIcons: Record<string, any> = {
  farmaka: '💊',
  ktiniatrika: '🐾',
  kallintika: '💄',
  iatrotexnologika: '🔬',
  vioktona: '⚗️',
  diatrofika: '🥗',
  kannavi: '🌿',
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api';

      // Fetch categories with counts
      const categoriesRes = await fetch(`${baseUrl}/categories?include_counts=true`);
      const categoriesData: Category[] = await categoriesRes.json();
      setCategories(categoriesData);

      // Calculate stats by type
      const statsByType: Record<string, number> = {};
      categoriesData.forEach(cat => {
        if (cat.category_type && !cat.parent_id) {
          statsByType[cat.category_type] = (statsByType[cat.category_type] || 0) + (cat.post_count || 0);
        }
      });
      setStats(statsByType);

      // Fetch recent posts
      const postsRes = await fetch(`${baseUrl}/posts?limit=100`);
      const postsData = await postsRes.json();
      
      // Enrich posts with category info
      const enrichedPosts = postsData.map((post: Post) => {
        const category = categoriesData.find(c => c.id === post.category_id);
        return {
          ...post,
          category_name: category?.name,
          category_type: category?.category_type
        };
      });
      
      setPosts(enrichedPosts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesType = selectedType === 'all' || post.category_type === selectedType;
    const matchesCategory = !selectedCategory || post.category_id === parseInt(selectedCategory);
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesCategory && matchesSearch;
  });

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const categoryTypes = [
    { value: 'all', label: 'Όλες οι κατηγορίες', icon: '📋' },
    { value: 'farmaka', label: 'Φάρμακα', icon: '💊' },
    { value: 'ktiniatrika', label: 'Κτηνιατρικά', icon: '🐾' },
    { value: 'kallintika', label: 'Καλλυντικά', icon: '💄' },
    { value: 'iatrotexnologika', label: 'Ιατροτεχνολογικά', icon: '🔬' },
    { value: 'vioktona', label: 'Βιοκτόνα', icon: '⚗️' },
    { value: 'diatrofika', label: 'Διατροφικά', icon: '🥗' },
    { value: 'kannavi', label: 'Κάνναβη', icon: '🌿' },
  ];

  const filteredCategories = categories.filter(cat => 
    selectedType === 'all' || cat.category_type === selectedType
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Καλώς ήρθατε στο DrugAlert.gr</h1>
          <p className="text-gray-600">Προβολή και έλεγχος όλων των κατηγοριών προϊόντων του ΕΟΦ</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {categoryTypes.slice(1).map(type => (
            <div key={type.value} className={`p-4 rounded-lg border ${categoryTypeColors[type.value]}`}>
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="text-2xl font-bold">{stats[type.value] || 0}</div>
              <div className="text-sm">{type.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Τύπος Κατηγορίας
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setSelectedCategory('');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {categoryTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Υποκατηγορία
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Όλες οι υποκατηγορίες</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parent_id ? '— ' : ''}{cat.name} ({cat.post_count || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Αναζήτηση
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Αναζήτηση σε τίτλους και περιγραφές..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600">
          Βρέθηκαν {filteredPosts.length} ανακοινώσεις
          {selectedType !== 'all' && ` στην κατηγορία ${categoryTypes.find(t => t.value === selectedType)?.label}`}
        </div>

        {/* Posts List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {paginatedPosts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {paginatedPosts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {post.category_type && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryTypeColors[post.category_type]}`}>
                            {categoryTypeIcons[post.category_type]} {post.category_name}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          <CalendarIcon className="inline h-3 w-3 mr-1" />
                          {format(new Date(post.publish_date), 'dd MMMM yyyy', { locale: el })}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        Προβολή
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">Δεν βρέθηκαν ανακοινώσεις</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Προηγούμενη
            </button>
            <span className="text-sm text-gray-700">
              Σελίδα {currentPage} από {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Επόμενη
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import axios from 'axios';
import { CalendarIcon, TagIcon, DocumentArrowDownIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Head from 'next/head';

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
  scraped_at: string;
  attachments: Array<{
    id: number;
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}

export default function PostDetail() {
  const router = useRouter();
  const { id } = router.query;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/posts/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-red-600">Σφάλμα κατά τη φόρτωση της ανακοίνωσης.</p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Επιστροφή στον πίνακα ελέγχου
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-600">Η ανακοίνωση δεν βρέθηκε.</p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Επιστροφή στον πίνακα ελέγχου
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{post.title} - DrugAlert.gr</title>
        <meta name="description" content={post.excerpt || post.title} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Επιστροφή στον πίνακα ελέγχου
          </Link>

          {/* Main content */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(post.publish_date)}
                </div>
                {post.category_name && (
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {post.category_name}
                  </div>
                )}
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700 font-medium">{post.excerpt}</p>
                </div>
              )}

              {/* Content */}
              <div 
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Συνημμένα αρχεία
                  </h3>
                  <div className="space-y-3">
                    {post.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attachment.file_type}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Original link */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  Δείτε την πρωτότυπη ανακοίνωση στο ΕΟΦ
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

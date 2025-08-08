import Link from 'next/link';
import { useState, useEffect } from 'react';
import PricingSection from '../components/PricingSection';

export default function Home() {
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPosts: 0, todayPosts: 0 });

  useEffect(() => {
    // Fetch recent posts
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api'}/posts/recent?limit=5`)
      .then(res => res.json())
      .then(data => setRecentPosts(data))
      .catch(err => console.error('Error fetching recent posts:', err));

    // Fetch stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api'}/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">DrugAlert.gr</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="#pricing" className="text-gray-700 hover:text-gray-900">
                Τιμές
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900">
                Σύνδεση
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Εγγραφή
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Μείνετε Ενημερωμένοι για τις Ανακοινώσεις του ΕΟΦ
            </h2>
            <p className="text-xl mb-8">
              Άμεση ειδοποίηση για ανακλήσεις φαρμάκων, ιατροτεχνολογικών προϊόντων και σημαντικές ενημερώσεις
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/signup" className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100">
                Ξεκινήστε Δωρεάν
              </Link>
              <Link href="/alerts" className="border-2 border-white text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700">
                Δείτε Ανακοινώσεις
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600">{stats.totalPosts || '200+'}</div>
              <div className="text-gray-600 mt-2">Συνολικές Ανακοινώσεις</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">24/7</div>
              <div className="text-gray-600 mt-2">Συνεχής Παρακολούθηση</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600">Άμεση</div>
              <div className="text-gray-600 mt-2">Ειδοποίηση</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">Γιατί το DrugAlert.gr;</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Ενημέρωση σε Πραγματικό Χρόνο</h4>
              <p className="text-gray-600">Λαμβάνετε ειδοποιήσεις αμέσως μόλις δημοσιευτεί νέα ανακοίνωση από τον ΕΟΦ</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Αξιόπιστη Πηγή</h4>
              <p className="text-gray-600">Όλες οι ανακοινώσεις προέρχονται απευθείας από την επίσημη ιστοσελίδα του ΕΟΦ</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Πολλαπλές Ειδοποιήσεις</h4>
              <p className="text-gray-600">Email, Push notifications και SMS για να μην χάσετε καμία κρίσιμη ενημέρωση</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts Section */}
      {recentPosts.length > 0 && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center mb-12">Πρόσφατες Ανακοινώσεις</h3>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <h4 className="text-lg font-semibold mb-2">{post.title}</h4>
                  <p className="text-gray-600 mb-2">{post.excerpt}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(post.publish_date).toLocaleDateString('el-GR')}
                    </span>
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Διαβάστε περισσότερα →
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/alerts" className="text-blue-600 font-semibold hover:underline">
                Δείτε όλες τις ανακοινώσεις →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">Ξεκινήστε Σήμερα</h3>
          <p className="text-xl text-gray-600 mb-8">
            Δημιουργήστε δωρεάν λογαριασμό και λάβετε 10 ημέρες δοκιμαστικής περιόδου
          </p>
          <Link href="/signup" className="bg-blue-600 text-white px-8 py-4 rounded-md text-lg font-semibold hover:bg-blue-700">
            Δημιουργία Λογαριασμού
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <p>&copy; 2024 DrugAlert.gr. Όλα τα δικαιώματα κατοχυρωμένα.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="hover:text-gray-300">Απόρρητο</Link>
              <Link href="/terms" className="hover:text-gray-300">Όροι Χρήσης</Link>
              <Link href="/contact" className="hover:text-gray-300">Επικοινωνία</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

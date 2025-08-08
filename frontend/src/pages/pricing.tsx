import Link from 'next/link';
import PricingSection from '../components/PricingSection';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                DrugAlert.gr
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                Αρχική
              </Link>
              <Link href="/alerts" className="text-gray-700 hover:text-gray-900">
                Ανακοινώσεις
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

      <PricingSection />

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
};

export default Pricing;


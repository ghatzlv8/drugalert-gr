import Link from 'next/link';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Pricing</h1>
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/simple-dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
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
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing Plans</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="mb-4 text-gray-700">We offer various pricing plans to suit your needs.</p>
          <ul className="list-disc pl-5">
            <li className="mb-2">Free Plan: Limited access to basic features.</li>
            <li className="mb-2">Standard Plan: Access to all standard features for a monthly fee.</li>
            <li className="mb-2">Premium Plan: Full access, including premium features and priority support.</li>
          </ul>
          <p className="text-gray-700 mt-4">For more details, please <a href="#" className="text-blue-600 hover:underline">contact us</a>.</p>
        </div>
      </main>
    </div>
  );
};

export default Pricing;


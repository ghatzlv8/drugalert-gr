import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/20/solid';

const plans = [
  {
    name: 'Δοκιμαστική Περίοδος',
    id: 'trial',
    href: '/signup',
    price: '4 ημέρες δωρεάν',
    description: 'Δοκιμάστε όλες τις δυνατότητες χωρίς χρέωση',
    features: [
      'Πλήρης πρόσβαση σε όλες τις λειτουργίες',
      'Απεριόριστες ειδοποιήσεις email',
      'Άμεσες ειδοποιήσεις για νέες ανακοινώσεις',
      'Πρόσβαση σε όλο το ιστορικό ανακοινώσεων',
      'Προσωπικές ρυθμίσεις ειδοποιήσεων',
      'Αναζήτηση και φιλτράρισμα',
      'Χωρίς πιστωτική κάρτα'
    ],
    cta: 'Ξεκινήστε Δωρεάν',
    featured: false
  },
  {
    name: 'Ετήσια Συνδρομή',
    id: 'annual',
    href: '/signup',
    price: '€14.99',
    priceNote: 'ανά έτος',
    description: 'Πλήρης πρόσβαση για επαγγελματίες και ιδιώτες',
    features: [
      'Όλες οι δυνατότητες της δοκιμαστικής περιόδου',
      'Απεριόριστες ειδοποιήσεις email',
      'Προτεραιότητα στις ειδοποιήσεις',
      'Εξαγωγή ανακοινώσεων (PDF/CSV)',
      'Προηγμένα φίλτρα αναζήτησης',
      'Email υποστήριξης',
      'Ιστορικό όλων των ανακοινώσεων',
      'Προσαρμοσμένες κατηγορίες ειδοποιήσεων'
    ],
    cta: 'Εγγραφή Τώρα',
    featured: true
  }
];

export default function PricingSection() {
  return (
    <div className="bg-gray-50 py-16" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Απλή και Διαφανής Τιμολόγηση
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Δοκιμάστε δωρεάν για 4 ημέρες, μετά μόνο €14.99 το χρόνο
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-2xl lg:mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`${
                plan.featured
                  ? 'border-2 border-blue-600 shadow-xl'
                  : 'border border-gray-200'
              } rounded-lg bg-white`}
            >
              {plan.featured && (
                <div className="bg-blue-600 text-white text-center py-2 px-4 rounded-t-lg">
                  <span className="text-sm font-semibold">ΔΗΜΟΦΙΛΕΣΤΕΡΟ</span>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-gray-600">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.priceNote && (
                    <span className="text-base font-medium text-gray-500"> {plan.priceNote}</span>
                  )}
                </p>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex">
                      <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href={plan.href}
                    className={`${
                      plan.featured
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } block w-full py-3 px-6 text-center rounded-md font-semibold transition-colors duration-200`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-blue-50 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Γιατί μόνο €14.99 το χρόνο;
            </h3>
            <p className="text-gray-600 text-lg">
              Πιστεύουμε ότι η πρόσβαση σε κρίσιμες πληροφορίες υγείας πρέπει να είναι προσιτή σε όλους. 
              Με λιγότερο από €1.25 το μήνα, μένετε ενημερωμένοι για όλες τις ανακοινώσεις του ΕΟΦ 
              που αφορούν την υγεία σας και της οικογένειάς σας.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900">
            Έχετε ερωτήσεις;
          </h3>
          <p className="mt-2 text-gray-600">
            Επικοινωνήστε μαζί μας στο{' '}
            <a href="mailto:info@drugalert.gr" className="text-blue-600 hover:underline">
              info@drugalert.gr
            </a>
          </p>
        </div>

        <div className="mt-16 bg-blue-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Τι περιλαμβάνουν όλα τα πακέτα
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start">
              <CheckIcon className="flex-shrink-0 h-6 w-6 text-blue-600 mt-1" />
              <div className="ml-3">
                <h4 className="font-semibold text-gray-900">Αυτόματη ενημέρωση</h4>
                <p className="text-gray-600 text-sm">
                  Σάρωση ΕΟΦ κάθε 15 λεπτά
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckIcon className="flex-shrink-0 h-6 w-6 text-blue-600 mt-1" />
              <div className="ml-3">
                <h4 className="font-semibold text-gray-900">Ασφάλεια δεδομένων</h4>
                <p className="text-gray-600 text-sm">
                  SSL κρυπτογράφηση & GDPR
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckIcon className="flex-shrink-0 h-6 w-6 text-blue-600 mt-1" />
              <div className="ml-3">
                <h4 className="font-semibold text-gray-900">Υποστήριξη</h4>
                <p className="text-gray-600 text-sm">
                  Email & chat support
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckIcon className="flex-shrink-0 h-6 w-6 text-blue-600 mt-1" />
              <div className="ml-3">
                <h4 className="font-semibold text-gray-900">Χωρίς δέσμευση</h4>
                <p className="text-gray-600 text-sm">
                  Ακύρωση οποτεδήποτε
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckIcon className="flex-shrink-0 h-6 w-6 text-blue-600 mt-1" />
              <div className="ml-3">
                <h4 className="font-semibold text-gray-900">Mobile friendly</h4>
                <p className="text-gray-600 text-sm">
                  Responsive web app
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckIcon className="flex-shrink-0 h-6 w-6 text-blue-600 mt-1" />
              <div className="ml-3">
                <h4 className="font-semibold text-gray-900">99.9% Uptime</h4>
                <p className="text-gray-600 text-sm">
                  Αξιόπιστη υπηρεσία
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/20/solid';

const plans = [
  {
    name: 'Δωρεάν',
    id: 'free',
    href: '/signup',
    price: { monthly: '€0', annually: '€0' },
    description: 'Ιδανικό για προσωπική χρήση και δοκιμή της υπηρεσίας',
    features: [
      'Έως 5 ειδοποιήσεις email την ημέρα',
      'Πρόσβαση σε όλες τις ανακοινώσεις',
      'Βασική αναζήτηση',
      'Ιστορικό 30 ημερών',
      'Web interface'
    ],
    cta: 'Ξεκινήστε Δωρεάν',
    featured: false
  },
  {
    name: 'Επαγγελματικό',
    id: 'professional',
    href: '/signup',
    price: { monthly: '€19', annually: '€190' },
    description: 'Για επαγγελματίες υγείας και μικρές επιχειρήσεις',
    features: [
      'Απεριόριστες ειδοποιήσεις email',
      'SMS ειδοποιήσεις (50/μήνα)',
      'Προηγμένη αναζήτηση και φίλτρα',
      'API πρόσβαση',
      'Πλήρες ιστορικό',
      'Προτεραιότητα υποστήριξης',
      'Εξαγωγή δεδομένων (CSV/PDF)',
      'Προσαρμοσμένες κατηγορίες'
    ],
    cta: 'Δοκιμή 10 Ημερών',
    featured: true
  },
  {
    name: 'Επιχειρηματικό',
    id: 'enterprise',
    href: '/contact',
    price: { monthly: '€49', annually: '€490' },
    description: 'Για φαρμακευτικές εταιρείες και μεγάλους οργανισμούς',
    features: [
      'Όλα από το Επαγγελματικό',
      'Απεριόριστες SMS ειδοποιήσεις',
      'Webhook integrations',
      'Πολλαπλοί χρήστες (έως 10)',
      'Branded email templates',
      'Dedicated account manager',
      'SLA 99.9% uptime',
      'Custom integrations',
      'Compliance reports',
      'Priority API limits'
    ],
    cta: 'Επικοινωνήστε μαζί μας',
    featured: false
  }
];

export default function PricingSection() {
  return (
    <div className="bg-gray-50 py-16" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Τιμοκατάλογος
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Επιλέξτε το πακέτο που ταιριάζει στις ανάγκες σας
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
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
                    {plan.price.monthly}
                  </span>
                  <span className="text-base font-medium text-gray-500">/μήνα</span>
                </p>
                {plan.price.annually !== plan.price.monthly && (
                  <p className="text-sm text-gray-500">
                    ή {plan.price.annually}/έτος (2 μήνες δώρο)
                  </p>
                )}
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

        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900">
            Ερωτήσεις σχετικά με τις τιμές;
          </h3>
          <p className="mt-2 text-gray-600">
            Επικοινωνήστε μαζί μας στο{' '}
            <a href="mailto:info@drugalert.gr" className="text-blue-600 hover:underline">
              info@drugalert.gr
            </a>{' '}
            ή καλέστε μας στο{' '}
            <a href="tel:+302101234567" className="text-blue-600 hover:underline">
              210 123 4567
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

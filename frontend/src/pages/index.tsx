import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { 
  BellAlertIcon, 
  ShieldCheckIcon, 
  DevicePhoneMobileIcon,
  ChartBarIcon,
  CheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/lib/store/auth'
import Layout from '@/components/Layout'

const features = [
  {
    name: 'Ειδοποιήσεις σε πραγματικό χρόνο',
    description: 'Λάβετε άμεσες ειδοποιήσεις για ανακλήσεις φαρμάκων, αλλαγές τιμών και κανονιστικές ενημερώσεις.',
    icon: BellAlertIcon,
  },
  {
    name: 'Πολυκάναλες Ειδοποιήσεις',
    description: 'Λαμβάνετε ειδοποιήσεις μέσω email, push notifications ή SMS βάσει των προτιμήσεών σας.',
    icon: DevicePhoneMobileIcon,
  },
  {
    name: 'Προηγμένο Φιλτράρισμα',
    description: 'Ρυθμίστε προσαρμοσμένες ειδοποιήσεις για συγκεκριμένες κατηγορίες φαρμάκων ή λέξεις-κλειδιά.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Πλήρες Αρχείο',
    description: 'Πρόσβαση στο πλήρες ιστορικό ανακοινώσεων του ΕΟΦ με ισχυρές δυνατότητες αναζήτησης.',
    icon: ChartBarIcon,
  },
]

const pricingTiers = [
  {
    name: 'Δωρεάν Δοκιμή',
    price: '€0',
    duration: '10 ημέρες',
    features: [
      'Πλήρης πρόσβαση σε όλες τις λειτουργίες',
      'Ειδοποιήσεις μέσω email',
      'Push ειδοποιήσεις',
      'Αναζήτηση και φιλτράρισμα',
      'Χωρίς πιστωτική κάρτα',
    ],
    cta: 'Ξεκινήστε Δωρεάν',
    featured: false,
  },
  {
    name: 'Premium',
    price: '€14.99',
    duration: 'ετησίως',
    features: [
      'Όλα όσα περιλαμβάνει η Δωρεάν Δοκιμή',
      'Απεριόριστη πρόσβαση',
      'Διαθέσιμες SMS ειδοποιήσεις',
      'Προτεραιότητα υποστήριξης',
      'Εξαγωγή δεδομένων σε CSV',
      'Πρόσβαση API',
    ],
    cta: 'Αποκτήστε Premium',
    featured: true,
  },
]

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-primary-100/20">
        <div className="mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-40">
          <div className="px-6 lg:px-0 lg:pt-4">
            <div className="mx-auto max-w-2xl">
              <div className="max-w-lg">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon className="h-5 w-5 text-primary-600" />
                    <span className="text-sm font-medium text-primary-600">
                      Επίσημη Πηγή Δεδομένων ΕΟΦ
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                    Μην Χάσετε Ποτέ Ξανά Ειδοποίηση Φαρμάκων
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Μείνετε ενημερωμένοι για ανακλήσεις φαρμάκων, αλλαγές τιμών και κανονιστικές 
                    ενημερώσεις από τον Εθνικό Οργανισμό Φαρμάκων (ΕΟΦ). Λάβετε άμεσες ειδοποιήσεις 
                    στο κανάλι της προτίμησής σας.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    {isAuthenticated ? (
                      <Link
                        href="/dashboard"
                        className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      >
                        Μετάβαση στον Πίνακα Ελέγχου
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/signup"
                          className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                        >
                          Ξεκινήστε Δωρεάν Δοκιμή
                        </Link>
                        <Link
                          href="/login"
                          className="text-sm font-semibold leading-6 text-gray-900"
                        >
                          Σύνδεση <span aria-hidden="true">→</span>
                        </Link>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
          <div className="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="shadow-lg md:rounded-3xl"
            >
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 [clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]">
                <div className="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-primary-100 opacity-20 ring-1 ring-inset ring-white md:ml-20 lg:ml-36" />
                <div className="relative px-6 pt-8 sm:pt-16 md:pl-16 md:pr-0">
                  <div className="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                    <div className="w-screen overflow-hidden rounded-tl-xl bg-gray-900">
                      <div className="flex bg-gray-800/40 ring-1 ring-white/5">
                        <div className="-mb-px flex text-sm font-medium leading-6 text-gray-400">
                          <div className="border-b border-r border-b-white/20 border-r-white/10 bg-white/5 px-4 py-2 text-white">
                            Πρόσφατες Ειδοποιήσεις
                          </div>
                        </div>
                      </div>
                      <div className="px-6 pb-14 pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                              <BellAlertIcon className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">Ανάκληση Φαρμάκου</p>
                              <p className="text-sm text-gray-400">Fucidin Tablet 250mg - Παρτίδα C97096</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                              <ChartBarIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">Ενημέρωση Τιμών</p>
                              <p className="text-sm text-gray-400">Νέος τιμοκατάλογος για Q1 2025</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                              <ShieldCheckIcon className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">Νέα Κατηγορία</p>
                              <p className="text-sm text-gray-400">Αντιβιοτικά - Νέες οδηγίες</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">
            Όλα όσα χρειάζεστε
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Μείνετε ενημερωμένοι με ισχυρές λειτουργίες
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Η πλατφόρμα μας παρακολουθεί τον ιστότοπο του ΕΟΦ 24/7 και σας παραδίδει σχετικές ενημερώσεις απευθείας.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon
                    className="h-5 w-5 flex-none text-primary-600"
                    aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-32 sm:mt-56">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Τιμολόγηση</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Επιλέξτε το κατάλληλο πλάνο για εσάς
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Ξεκινήστε με δωρεάν δοκιμή 10 ημερών. Δεν απαιτείται πιστωτική κάρτα.
        </p>
        <div className="mt-16 flex justify-center gap-x-8">
          {pricingTiers.map((tier) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`rounded-3xl p-8 ring-1 ${
                tier.featured
                  ? 'bg-gray-900 ring-gray-900 lg:p-10'
                  : 'ring-gray-200'
              }`}
            >
              <h3
                className={`text-lg font-semibold leading-8 ${
                  tier.featured ? 'text-white' : 'text-gray-900'
                }`}
              >
                {tier.name}
              </h3>
              <p className="mt-4 flex items-baseline gap-x-2">
                <span
                  className={`text-4xl font-bold tracking-tight ${
                    tier.featured ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {tier.price}
                </span>
                <span
                  className={`text-base font-semibold leading-7 ${
                    tier.featured ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  /{tier.duration}
                </span>
              </p>
              <ul
                role="list"
                className={`mt-8 space-y-3 text-sm leading-6 ${
                  tier.featured ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className={`h-6 w-5 flex-none ${
                        tier.featured ? 'text-white' : 'text-primary-600'
                      }`}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/signup')}
                className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  tier.featured
                    ? 'bg-white text-gray-900 hover:bg-gray-100 focus-visible:outline-white'
                    : 'bg-primary-600 text-white hover:bg-primary-500 focus-visible:outline-primary-600'
                }`}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SMS Pricing Note */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-16">
        <div className="mx-auto max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-8 lg:mx-0 lg:flex lg:max-w-none">
          <div className="p-8 sm:p-10 lg:flex-auto">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">
              SMS Ειδοποιήσεις
            </h3>
            <p className="mt-6 text-base leading-7 text-gray-600">
              Θέλετε να λαμβάνετε κρίσιμες ειδοποιήσεις μέσω SMS; Αγοράστε μονάδες SMS με €0.15 ανά μήνυμα. 
              Πληρώστε μόνο για ό,τι χρησιμοποιείτε και ανανεώστε οποτεδήποτε.
            </p>
            <div className="mt-10 flex items-center gap-x-4">
              <h4 className="flex-none text-sm font-semibold leading-6 text-primary-600">
                Τι περιλαμβάνεται
              </h4>
              <div className="h-px flex-auto bg-gray-100" />
            </div>
            <ul
              role="list"
              className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
            >
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                Άμεση παράδοση
              </li>
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                Προσαρμόσιμες ειδοποιήσεις
              </li>
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                Αναφορές παράδοσης
              </li>
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                Χωρίς λήξη
              </li>
            </ul>
          </div>
          <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
            <div className="rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
              <div className="mx-auto max-w-xs px-8">
                <p className="text-base font-semibold text-gray-600">Πληρώστε όσο χρησιμοποιείτε</p>
                <p className="mt-6 flex items-baseline justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-gray-900">€0.15</span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">
                    ανά SMS
                  </span>
                </p>
                <p className="mt-6 text-xs leading-5 text-gray-600">
                  Αγοράστε μονάδες χονδρικά για καλύτερες τιμές
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-32 sm:mt-56 mb-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ξεκινήστε τη δωρεάν δοκιμή σας σήμερα
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Ενταχθείτε στους επαγγελματίες υγείας που εμπιστεύονται την πλατφόρμα μας για κρίσιμες ενημερώσεις ασφάλειας φαρμάκων.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/signup"
              className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Ξεκινήστε δωρεάν
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Επικοινωνία πωλήσεων <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}

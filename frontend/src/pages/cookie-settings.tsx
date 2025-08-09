import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface ConsentState {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  functionality_storage: 'granted' | 'denied';
  personalization_storage: 'granted' | 'denied';
  security_storage: 'granted' | 'denied';
}

export default function CookieSettings() {
  const [consent, setConsent] = useState<ConsentState>({
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
    security_storage: 'granted'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved consent preferences
    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent) {
      try {
        const parsedConsent = JSON.parse(savedConsent);
        setConsent(parsedConsent);
      } catch (error) {
        console.error('Error parsing saved consent:', error);
      }
    }
  }, []);

  const updateGoogleConsent = (consentState: ConsentState) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'ad_storage': consentState.ad_storage,
        'ad_user_data': consentState.ad_user_data,
        'ad_personalization': consentState.ad_personalization,
        'analytics_storage': consentState.analytics_storage,
        'functionality_storage': consentState.functionality_storage,
        'personalization_storage': consentState.personalization_storage,
        'security_storage': consentState.security_storage
      });
    }
  };

  const toggleConsent = (type: keyof ConsentState) => {
    setConsent(prev => ({
      ...prev,
      [type]: prev[type] === 'granted' ? 'denied' : 'granted'
    }));
  };

  const handleSave = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    updateGoogleConsent(consent);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    const newConsent: ConsentState = {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'granted',
      security_storage: 'granted'
    };
    setConsent(newConsent);
    localStorage.setItem('cookieConsent', JSON.stringify(newConsent));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    updateGoogleConsent(newConsent);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRejectAll = () => {
    const newConsent: ConsentState = {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      personalization_storage: 'granted',
      security_storage: 'granted'
    };
    setConsent(newConsent);
    localStorage.setItem('cookieConsent', JSON.stringify(newConsent));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    updateGoogleConsent(newConsent);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Ρυθμίσεις Cookies</h1>
          
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-700 mb-6">
              Διαχειριστείτε τις προτιμήσεις σας για τα cookies. Οι αλλαγές σας θα εφαρμοστούν αμέσως.
            </p>

            {saved && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">✓ Οι προτιμήσεις σας αποθηκεύτηκαν επιτυχώς</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Necessary Cookies */}
              <div className="border-b pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Απαραίτητα Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Αυτά τα cookies είναι απαραίτητα για τη λειτουργία του ιστοτόπου και δεν μπορούν να απενεργοποιηθούν.
                      Περιλαμβάνουν cookies για ασφάλεια, λειτουργικότητα και προσωποποίηση της εμπειρίας σας.
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="text-sm text-gray-500 font-medium">Πάντα ενεργά</span>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border-b pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Cookies Ανάλυσης</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Χρησιμοποιούμε το Google Analytics για να κατανοήσουμε πώς χρησιμοποιείτε τον ιστότοπό μας.
                      Αυτά τα cookies συλλέγουν πληροφορίες ανώνυμα και μας βοηθούν να βελτιώσουμε την υπηρεσία μας.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => toggleConsent('analytics_storage')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        consent.analytics_storage === 'granted' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          consent.analytics_storage === 'granted' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Advertising Cookies */}
              <div className="border-b pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Cookies Διαφήμισης</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Χρησιμοποιούμε το Google Ads για να εμφανίζουμε σχετικές διαφημίσεις.
                      Αυτά τα cookies μας βοηθούν να μετρήσουμε την αποτελεσματικότητα των διαφημιστικών μας καμπανιών.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => toggleConsent('ad_storage')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        consent.ad_storage === 'granted' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          consent.ad_storage === 'granted' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* User Data for Ads */}
              <div className="border-b pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Δεδομένα Χρήστη για Διαφημίσεις</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Επιτρέπει την αποστολή δεδομένων σχετικά με τη συμπεριφορά σας στη Google για 
                      διαφημιστικούς σκοπούς μέσω των προϊόντων της.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => toggleConsent('ad_user_data')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        consent.ad_user_data === 'granted' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          consent.ad_user_data === 'granted' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Ad Personalization */}
              <div className="pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Εξατομίκευση Διαφημίσεων</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Επιτρέπει τη χρήση των δεδομένων σας για την εμφάνιση εξατομικευμένων διαφημίσεων
                      που ταιριάζουν στα ενδιαφέροντά σας.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => toggleConsent('ad_personalization')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        consent.ad_personalization === 'granted' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          consent.ad_personalization === 'granted' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Απόρριψη όλων
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Αποδοχή όλων
                </button>
              </div>
              <button
                onClick={handleSave}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Αποθήκευση προτιμήσεων
              </button>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-gray-600">
                Για περισσότερες πληροφορίες σχετικά με τη χρήση των cookies και των δεδομένων σας, 
                διαβάστε την <Link href="/privacy" className="text-blue-600 hover:text-blue-500">Πολιτική Απορρήτου</Link> μας.
              </p>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

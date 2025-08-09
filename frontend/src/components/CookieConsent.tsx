import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isEURegion, setIsEURegion] = useState(true); // Default to true for safety
  const [consent, setConsent] = useState<ConsentState>({
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
    security_storage: 'granted'
  });

  useEffect(() => {
    // Detect if user is in EU region
    const detectRegion = async () => {
      try {
        // Check timezone for basic region detection
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const euTimezones = ['Europe/', 'EET', 'CET', 'WET', 'GMT', 'BST'];
        const isInEU = euTimezones.some(tz => timezone.includes(tz));
        setIsEURegion(isInEU);
        
        // Check if user has already made a choice
        const savedConsent = localStorage.getItem('cookieConsent');
        if (!savedConsent && isInEU) {
          // Show banner for new EU users
          setShowBanner(true);
        } else if (savedConsent) {
          // User has already made a choice, update consent state
          const parsedConsent = JSON.parse(savedConsent);
          setConsent(parsedConsent);
          updateGoogleConsent(parsedConsent);
        }
      } catch (error) {
        // Default to showing banner on error
        setIsEURegion(true);
        const savedConsent = localStorage.getItem('cookieConsent');
        if (!savedConsent) {
          setShowBanner(true);
        }
      }
    };
    
    detectRegion();
  }, []);

  const updateGoogleConsent = (consentState: ConsentState) => {
    if (typeof window !== 'undefined' && window.gtag) {
      // Update each consent parameter individually as per Google's advanced implementation
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
    setShowBanner(false);
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
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    updateGoogleConsent(consent);
    setShowBanner(false);
    setShowDetails(false);
  };

  const toggleConsent = (type: keyof ConsentState) => {
    setConsent(prev => ({
      ...prev,
      [type]: prev[type] === 'granted' ? 'denied' : 'granted'
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Χρησιμοποιούμε cookies 🍪
              </h3>
              <p className="text-sm text-gray-600">
                Χρησιμοποιούμε cookies και παρόμοιες τεχνολογίες για να βελτιώσουμε την εμπειρία σας, 
                να αναλύσουμε την κίνηση του ιστοτόπου και να εξατομικεύσουμε το περιεχόμενο και τις διαφημίσεις. 
                Μπορείτε να επιλέξετε ποια cookies θέλετε να επιτρέψετε.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Σύμφωνα με τον Κανονισμό (ΕΕ) 2016/679 (GDPR) και την οδηγία ePrivacy.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Απόρριψη όλων
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Προσαρμογή
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Αποδοχή όλων
              </button>
            </div>
          </div>

          {/* Detailed Settings */}
          {showDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Προτιμήσεις Cookies</h4>
              
              <div className="space-y-4">
                {/* Necessary Cookies - Always On */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">Απαραίτητα Cookies</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Αυτά τα cookies είναι απαραίτητα για τη λειτουργία του ιστοτόπου και δεν μπορούν να απενεργοποιηθούν.
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="text-sm text-gray-500">Πάντα ενεργά</span>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">Cookies Ανάλυσης</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Μας βοηθούν να κατανοήσουμε πώς οι επισκέπτες αλληλεπιδρούν με τον ιστότοπο, 
                      συλλέγοντας και αναφέροντας πληροφορίες ανώνυμα.
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

                {/* Advertising Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">Cookies Διαφήμισης</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Χρησιμοποιούνται για την εμφάνιση διαφημίσεων που σχετίζονται με εσάς και τα ενδιαφέροντά σας.
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

                {/* User Data Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">Δεδομένα Χρήστη για Διαφημίσεις</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Επιτρέπει την αποστολή δεδομένων χρήστη στη Google για διαφημιστικούς σκοπούς.
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

                {/* Personalization Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">Εξατομίκευση Διαφημίσεων</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Επιτρέπει τη χρήση δεδομένων για εξατομικευμένες διαφημίσεις.
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

              <div className="mt-6 flex justify-between items-center">
                <Link href="/privacy" className="text-sm text-blue-600 hover:text-blue-800">
                  Πολιτική Απορρήτου
                </Link>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Αποθήκευση προτιμήσεων
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

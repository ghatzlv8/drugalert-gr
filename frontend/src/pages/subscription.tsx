import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    company_name: '',
    tax_id: '',
    tax_office: '',
    billing_address: '',
    billing_city: '',
    billing_postal_code: '',
    invoice_type: 'receipt'
  });
  const [savingBilling, setSavingBilling] = useState(false);
  const [billingMessage, setBillingMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch user data
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      setUser(userData);
      
      // Set billing info from user data
      setBillingInfo({
        company_name: userData.company_name || '',
        tax_id: userData.tax_id || '',
        tax_office: userData.tax_office || '',
        billing_address: userData.billing_address || '',
        billing_city: userData.billing_city || '',
        billing_postal_code: userData.billing_postal_code || '',
        invoice_type: userData.invoice_type || 'receipt'
      });
      
      // Fetch subscription details
      const subResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/subscription/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Viva checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      alert('Σφάλμα κατά τη δημιουργία της πληρωμής');
    } finally {
      setProcessingPayment(false);
    }
  };


  const handleCancelSubscription = async () => {
    try {
      setProcessingCancel(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Η συνδρομή σας ακυρώθηκε επιτυχώς. Θα έχετε πρόσβαση μέχρι τη λήξη της τρέχουσας περιόδου.');
        setShowCancelModal(false);
        fetchSubscriptionData(); // Refresh subscription data
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      alert('Σφάλμα κατά την ακύρωση της συνδρομής');
    } finally {
      setProcessingCancel(false);
    }
  };

  const handleSaveBilling = async () => {
    try {
      setSavingBilling(true);
      setBillingMessage('');
      const token = localStorage.getItem('token');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api';
      const response = await fetch(`${apiUrl}/auth/billing-info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(billingInfo)
      });
      
      if (response.ok) {
        setBillingMessage('Τα στοιχεία τιμολόγησης αποθηκεύτηκαν επιτυχώς');
      } else {
        throw new Error('Failed to save billing info');
      }
    } catch (err) {
      console.error('Error saving billing info:', err);
      setBillingMessage('Σφάλμα κατά την αποθήκευση των στοιχείων');
    } finally {
      setSavingBilling(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Φόρτωση συνδρομής...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Διαχείριση Συνδρομής</h2>

        {/* Current Subscription Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Τρέχουσα Συνδρομή</h3>
          
          {subscription?.subscription_status === 'active' ? (
            <div>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-gray-900">Premium Συνδρομητής</h4>
                  <p className="text-sm text-gray-500">Έχετε πλήρη πρόσβαση σε όλες τις λειτουργίες</p>
                </div>
              </div>
              
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Λήξη συνδρομής:</dt>
                  <dd className="text-gray-900">
                    {subscription.subscription_ends_at ? 
                      new Date(subscription.subscription_ends_at).toLocaleDateString('el-GR') : 
                      'Δεν έχει οριστεί'
                    }
                  </dd>
                </div>
              </dl>
              
              {/* Cancel Subscription Button */}
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Ακύρωση Συνδρομής
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Η συνδρομή σας θα παραμείνει ενεργή μέχρι τη λήξη της τρέχουσας περιόδου
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-gray-900">Δοκιμαστική Περίοδος</h4>
                  <p className="text-sm text-gray-500">
                    {user?.trial_days_remaining || 0} ημέρες απομένουν
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-3">
                  Αναβαθμίστε σε Premium για να απολαύσετε:
                </p>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>✓ Απεριόριστη πρόσβαση σε όλες τις ανακοινώσεις</li>
                  <li>✓ Push ειδοποιήσεις</li>
                  <li>✓ Προτεραιότητα υποστήριξης</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade to Premium */}
        {subscription?.subscription_status !== 'active' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Αναβάθμιση σε Premium</h3>
            
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Ετήσια Συνδρομή</h4>
                  <p className="text-sm text-gray-500">Πλήρης πρόσβαση για 12 μήνες</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">14.99€</p>
                  <p className="text-sm text-gray-500">ανά έτος</p>
                </div>
              </div>
              
              <button
                onClick={handleUpgrade}
                disabled={processingPayment}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {processingPayment ? 'Επεξεργασία...' : 'Αναβάθμιση σε Premium'}
              </button>
            </div>
          </div>
        )}

        {/* Billing Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Στοιχεία Τιμολόγησης</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Τύπος Παραστατικού</label>
              <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="receipt"
                    checked={billingInfo.invoice_type === 'receipt'}
                    onChange={(e) => setBillingInfo({...billingInfo, invoice_type: e.target.value})}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Απόδειξη</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="invoice"
                    checked={billingInfo.invoice_type === 'invoice'}
                    onChange={(e) => setBillingInfo({...billingInfo, invoice_type: e.target.value})}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Τιμολόγιο</span>
                </label>
              </div>
            </div>
            
            {billingInfo.invoice_type === 'invoice' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                      Επωνυμία Εταιρείας
                    </label>
                    <input
                      type="text"
                      id="company_name"
                      value={billingInfo.company_name}
                      onChange={(e) => setBillingInfo({...billingInfo, company_name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
                      ΑΦΜ
                    </label>
                    <input
                      type="text"
                      id="tax_id"
                      value={billingInfo.tax_id}
                      onChange={(e) => setBillingInfo({...billingInfo, tax_id: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tax_office" className="block text-sm font-medium text-gray-700">
                      ΔΟΥ
                    </label>
                    <input
                      type="text"
                      id="tax_office"
                      value={billingInfo.tax_office}
                      onChange={(e) => setBillingInfo({...billingInfo, tax_office: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="billing_city" className="block text-sm font-medium text-gray-700">
                      Πόλη
                    </label>
                    <input
                      type="text"
                      id="billing_city"
                      value={billingInfo.billing_city}
                      onChange={(e) => setBillingInfo({...billingInfo, billing_city: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="billing_address" className="block text-sm font-medium text-gray-700">
                      Διεύθυνση
                    </label>
                    <input
                      type="text"
                      id="billing_address"
                      value={billingInfo.billing_address}
                      onChange={(e) => setBillingInfo({...billingInfo, billing_address: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="billing_postal_code" className="block text-sm font-medium text-gray-700">
                      Ταχυδρομικός Κώδικας
                    </label>
                    <input
                      type="text"
                      id="billing_postal_code"
                      value={billingInfo.billing_postal_code}
                      onChange={(e) => setBillingInfo({...billingInfo, billing_postal_code: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="flex items-center justify-between pt-4">
              <div>
                {billingMessage && (
                  <p className={`text-sm ${billingMessage.includes('επιτυχώς') ? 'text-green-600' : 'text-red-600'}`}>
                    {billingMessage}
                  </p>
                )}
              </div>
              <button
                onClick={handleSaveBilling}
                disabled={savingBilling}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {savingBilling ? 'Αποθήκευση...' : 'Αποθήκευση Στοιχείων'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Cancel Subscription Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ακύρωση Συνδρομής
              </h3>
              <p className="text-gray-600 mb-6">
                Είστε σίγουροι ότι θέλετε να ακυρώσετε τη συνδρομή σας; 
                Θα συνεχίσετε να έχετε πρόσβαση στις Premium λειτουργίες μέχρι 
                {subscription?.subscription_ends_at && 
                  ` τις ${new Date(subscription.subscription_ends_at).toLocaleDateString('el-GR')}`
                }.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Άκυρο
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={processingCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {processingCancel ? 'Επεξεργασία...' : 'Επιβεβαίωση Ακύρωσης'}
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </Layout>
  );
}

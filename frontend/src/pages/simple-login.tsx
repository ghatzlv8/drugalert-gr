import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SimpleLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Save token
        localStorage.setItem('token', data.access_token);
        
        // Get user info
        const userResponse = await fetch('http://localhost:8000/auth/me', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem('user', JSON.stringify({
            email: userData.email,
            subscription_status: userData.subscription_status
          }));
        }

        // Redirect to dashboard
        router.push('/simple-dashboard');
      } else {
        // Handle different error formats
        let errorMessage = 'Login failed';
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail[0]?.msg || 'Invalid credentials';
        } else if (data.detail?.msg) {
          errorMessage = data.detail.msg;
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Σύνδεση στο EOF Alerts
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ειδοποιήσεις ΕΟΦ για επαγγελματίες υγείας
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Διεύθυνση Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Διεύθυνση Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Κωδικός Πρόσβασης
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Κωδικός Πρόσβασης"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Σύνδεση...' : 'Σύνδεση'}
            </button>
          </div>

          <div className="text-sm text-center space-y-2">
            <p className="text-gray-600">Δοκιμαστικοί Λογαριασμοί:</p>
            <div className="bg-gray-100 rounded p-3 text-left">
              <p className="font-semibold">Premium Λογαριασμός:</p>
              <p>Email: ghatzpremium@live.com</p>
              <p>Κωδικός: password123</p>
            </div>
            <div className="bg-gray-100 rounded p-3 text-left">
              <p className="font-semibold">Δοκιμαστικός Λογαριασμός:</p>
              <p>Email: working@example.com</p>
              <p>Κωδικός: password123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

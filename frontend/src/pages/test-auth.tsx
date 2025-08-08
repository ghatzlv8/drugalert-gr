import { useState } from 'react';

export default function TestAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testSignup = async () => {
    try {
      addLog('Starting signup...');
      const response = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          first_name: 'Test',
          last_name: 'User',
        }),
      });

      addLog(`Signup response status: ${response.status}`);
      const data = await response.json();
      addLog(`Signup response: ${JSON.stringify(data)}`);

      if (response.ok) {
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        addLog('Token saved to localStorage');
      } else {
        setError(data.detail || 'Signup failed');
      }
    } catch (err) {
      addLog(`Signup error: ${err}`);
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  const testLogin = async () => {
    try {
      addLog('Starting login...');
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      addLog(`Login response status: ${response.status}`);
      const data = await response.json();
      addLog(`Login response: ${JSON.stringify(data)}`);

      if (response.ok) {
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        addLog('Token saved to localStorage');
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      addLog(`Login error: ${err}`);
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const testDashboard = async () => {
    try {
      const tokenToUse = token || localStorage.getItem('token');
      addLog(`Using token: ${tokenToUse?.substring(0, 20)}...`);
      
      const response = await fetch('http://localhost:8000/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
        },
      });

      addLog(`Dashboard response status: ${response.status}`);
      addLog(`Dashboard response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      const text = await response.text();
      addLog(`Dashboard response text: ${text.substring(0, 200)}...`);
      
      try {
        const data = JSON.parse(text);
        setDashboardData(data);
        addLog('Dashboard data parsed successfully');
      } catch (parseErr) {
        addLog(`JSON parse error: ${parseErr}`);
        setError('Failed to parse dashboard response');
      }
    } catch (err) {
      addLog(`Dashboard error: ${err}`);
      setError(err instanceof Error ? err.message : 'Dashboard failed');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="test@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="password123"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={testSignup}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Signup
          </button>
          <button
            onClick={testLogin}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Login
          </button>
          <button
            onClick={testDashboard}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Dashboard
          </button>
        </div>
      </div>

      {token && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Token:</h3>
          <code className="text-xs break-all">{token}</code>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {dashboardData && (
        <div className="mb-4 p-4 bg-green-100 rounded">
          <h3 className="font-semibold">Dashboard Data:</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(dashboardData, null, 2)}</pre>
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-semibold mb-2">Debug Logs:</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded text-xs font-mono space-y-1 max-h-96 overflow-auto">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

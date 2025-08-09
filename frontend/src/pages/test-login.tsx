import { useState } from 'react'

export default function TestLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult('Logging in...')
    
    try {
      const response = await fetch('https://drugalert.gr/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem('token', data.access_token)
        setResult('Login successful! Token saved. Redirecting...')
        
        // Wait a moment then redirect
        setTimeout(() => {
          window.location.href = '/dashboard-test'
        }, 1000)
      } else {
        setResult(`Login failed: ${data.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setResult(`Error: ${error}`)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Test Login</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>
          Login
        </button>
      </form>
      {result && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
          {result}
        </div>
      )}
    </div>
  )
}

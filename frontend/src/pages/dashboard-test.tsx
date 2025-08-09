export default function DashboardTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Test - No Auth Check</h1>
      <p>If you can see this page, the redirect is working.</p>
      <p>Token in localStorage: {typeof window !== 'undefined' ? (localStorage.getItem('token') ? 'Yes' : 'No') : 'Checking...'}</p>
      <a href="/dashboard" style={{ color: 'blue', textDecoration: 'underline' }}>
        Go to real dashboard
      </a>
    </div>
  )
}

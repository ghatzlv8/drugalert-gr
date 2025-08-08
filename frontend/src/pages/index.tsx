import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/simple-dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">DrugAlert.gr</h1>
        <p className="text-gray-600">Ανακατεύθυνση...</p>
      </div>
    </div>
  )
}

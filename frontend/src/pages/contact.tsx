import { useState } from 'react'
import Link from 'next/link'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      // Here you would normally send the email through your backend
      // For now, we'll use mailto as a fallback
      const mailtoLink = `mailto:info@drugalert.gr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Από: ${name}\nEmail: ${email}\n\nΜήνυμα:\n${message}`)}`
      window.location.href = mailtoLink
      
      setSubmitMessage('Το μήνυμά σας θα σταλεί. Θα επικοινωνήσουμε μαζί σας σύντομα.')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (error) {
      setSubmitMessage('Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">DrugAlert.gr</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 text-sm font-medium">
                Αρχική
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 text-sm font-medium">
                Σύνδεση
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 text-sm font-medium">
                Τιμές
              </Link>
              <Link href="/contact" className="text-blue-600 text-sm font-medium">
                Επικοινωνία
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Επικοινωνήστε μαζί μας</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Στοιχεία Επικοινωνίας</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700">Email</h3>
                  <a href="mailto:info@drugalert.gr" className="text-blue-600 hover:text-blue-500">
                    info@drugalert.gr
                  </a>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Υποστήριξη Πελατών</h3>
                  <a href="mailto:support@drugalert.gr" className="text-blue-600 hover:text-blue-500">
                    support@drugalert.gr
                  </a>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Προστασία Δεδομένων</h3>
                  <a href="mailto:privacy@drugalert.gr" className="text-blue-600 hover:text-blue-500">
                    privacy@drugalert.gr
                  </a>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 mb-3">Ωράριο Εξυπηρέτησης</h3>
                <p className="text-gray-600">Δευτέρα - Παρασκευή: 09:00 - 17:00</p>
                <p className="text-gray-600">Σάββατο - Κυριακή: Κλειστά</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Συχνές Ερωτήσεις</h2>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-700">Πώς λειτουργεί η υπηρεσία;</h3>
                  <p className="text-gray-600 mt-1">
                    Συλλέγουμε αυτόματα τις ανακοινώσεις του ΕΟΦ και σας ειδοποιούμε άμεσα.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Είναι δωρεάν η υπηρεσία;</h3>
                  <p className="text-gray-600 mt-1">
                    Προσφέρουμε 10 ημέρες δωρεάν δοκιμή. Μετά, η ετήσια συνδρομή κοστίζει 14.99€.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Πώς ακυρώνω τη συνδρομή μου;</h3>
                  <p className="text-gray-600 mt-1">
                    Μπορείτε να ακυρώσετε ανά πάσα στιγμή από τις ρυθμίσεις του λογαριασμού σας.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Φόρμα Επικοινωνίας</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Ονοματεπώνυμο *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Θέμα *
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Μήνυμα *
                </label>
                <textarea
                  id="message"
                  rows={6}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Πώς μπορούμε να σας βοηθήσουμε;"
                />
              </div>
              
              {submitMessage && (
                <div className={`p-4 rounded-md ${submitMessage.includes('σφάλμα') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                  {submitMessage}
                </div>
              )}
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Αποστολή...' : 'Αποστολή Μηνύματος'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Για επείγοντα θέματα, στείλτε απευθείας email στο{' '}
              <a href="mailto:info@drugalert.gr" className="text-blue-600 hover:text-blue-500">
                info@drugalert.gr
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

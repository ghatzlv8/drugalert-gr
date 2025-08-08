import Link from 'next/link'

export default function About() {
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
              <Link href="/about" className="text-blue-600 text-sm font-medium">
                Σχετικά
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Σχετικά με το DrugAlert.gr</h1>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-12 bg-blue-50 rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Η Αποστολή μας</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Το DrugAlert.gr δημιουργήθηκε με στόχο να κάνει την ενημέρωση για τις ανακοινώσεις 
                του ΕΟΦ πιο άμεση και προσβάσιμη. Στην εποχή της πληροφορίας, η έγκαιρη ενημέρωση 
                για θέματα φαρμάκων είναι κρίσιμη για επαγγελματίες υγείας και πολίτες.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Πώς Λειτουργεί</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-4">🔍</div>
                  <h3 className="font-semibold text-lg mb-2">1. Συλλογή</h3>
                  <p className="text-gray-600">
                    Ελέγχουμε συνεχώς την ιστοσελίδα του ΕΟΦ για νέες ανακοινώσεις
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-4">⚡</div>
                  <h3 className="font-semibold text-lg mb-2">2. Επεξεργασία</h3>
                  <p className="text-gray-600">
                    Κατηγοριοποιούμε και οργανώνουμε τις ανακοινώσεις αυτόματα
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl mb-4">📧</div>
                  <h3 className="font-semibold text-lg mb-2">3. Ειδοποίηση</h3>
                  <p className="text-gray-600">
                    Στέλνουμε άμεσες ειδοποιήσεις μέσω email ή SMS
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Γιατί DrugAlert.gr;</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-green-500 text-xl mr-3">✓</span>
                  <div>
                    <h3 className="font-semibold">Άμεση Ενημέρωση</h3>
                    <p className="text-gray-600">Λάβετε ειδοποιήσεις μέσα σε λίγα λεπτά από τη δημοσίευση</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="text-green-500 text-xl mr-3">✓</span>
                  <div>
                    <h3 className="font-semibold">Προσωποποίηση</h3>
                    <p className="text-gray-600">Επιλέξτε τις κατηγορίες που σας ενδιαφέρουν</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="text-green-500 text-xl mr-3">✓</span>
                  <div>
                    <h3 className="font-semibold">Αξιοπιστία</h3>
                    <p className="text-gray-600">Όλες οι πληροφορίες προέρχονται απευθείας από τον ΕΟΦ</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="text-green-500 text-xl mr-3">✓</span>
                  <div>
                    <h3 className="font-semibold">Εύκολη Χρήση</h3>
                    <p className="text-gray-600">Απλή και διαισθητική πλατφόρμα για όλους</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ποιους Εξυπηρετούμε</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-lg mb-3">Επαγγελματίες Υγείας</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Φαρμακοποιοί</li>
                    <li>• Γιατροί</li>
                    <li>• Νοσηλευτές</li>
                    <li>• Εργαζόμενοι σε φαρμακευτικές εταιρείες</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-lg mb-3">Ενημερωμένοι Πολίτες</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Ασθενείς με χρόνιες παθήσεις</li>
                    <li>• Γονείς</li>
                    <li>• Φροντιστές</li>
                    <li>• Όσοι ενδιαφέρονται για την υγεία τους</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Κατηγορίες Ανακοινώσεων</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-center">
                  Φάρμακα
                </div>
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center">
                  Ιατροτεχνολογικά
                </div>
                <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-center">
                  Καλλυντικά
                </div>
                <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-center">
                  Τρόφιμα
                </div>
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-center">
                  Παρηγορητική Χρήση
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-center">
                  Κλινικές Μελέτες
                </div>
                <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg text-center">
                  Φαρμακοεπαγρύπνηση
                </div>
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-center">
                  Άλλες
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Η Δέσμευσή μας</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Δεσμευόμαστε να παρέχουμε αξιόπιστη και έγκαιρη ενημέρωση. Το DrugAlert.gr:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Δεν τροποποιεί ή αλλοιώνει τις ανακοινώσεις του ΕΟΦ</li>
                  <li>• Προστατεύει τα προσωπικά σας δεδομένα</li>
                  <li>• Βελτιώνεται συνεχώς με βάση τα σχόλιά σας</li>
                  <li>• Παραμένει προσιτό για όλους</li>
                </ul>
              </div>
            </section>

            <section className="text-center py-8 bg-blue-600 text-white rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Ξεκινήστε Σήμερα</h2>
              <p className="text-lg mb-6">
                Δοκιμάστε το DrugAlert.gr δωρεάν για 10 ημέρες
              </p>
              <div className="space-x-4">
                <Link 
                  href="/signup" 
                  className="inline-block bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100"
                >
                  Εγγραφή
                </Link>
                <Link 
                  href="/pricing" 
                  className="inline-block bg-blue-700 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-800"
                >
                  Δείτε τις Τιμές
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

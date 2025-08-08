import Link from 'next/link'

export default function Terms() {
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
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Όροι Χρήσης</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Τελευταία ενημέρωση: {new Date().toLocaleDateString('el-GR')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Αποδοχή Όρων</h2>
            <p className="text-gray-700 mb-4">
              Με την εγγραφή και χρήση της υπηρεσίας DrugAlert.gr, αποδέχεστε πλήρως τους παρόντες όρους χρήσης.
              Εάν δεν συμφωνείτε με οποιονδήποτε όρο, παρακαλούμε μην χρησιμοποιήσετε την υπηρεσία.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Περιγραφή Υπηρεσίας</h2>
            <p className="text-gray-700 mb-4">
              Το DrugAlert.gr παρέχει υπηρεσία ειδοποιήσεων για τις ανακοινώσεις του Εθνικού Οργανισμού Φαρμάκων (ΕΟΦ).
              Συλλέγουμε και παρουσιάζουμε δημόσια διαθέσιμες πληροφορίες από την επίσημη ιστοσελίδα του ΕΟΦ.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Χρήση της Υπηρεσίας</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Η υπηρεσία προορίζεται αποκλειστικά για ενημερωτικούς σκοπούς</li>
              <li>Δεν αποτελεί ιατρική συμβουλή ή σύσταση</li>
              <li>Για οποιαδήποτε ιατρικά θέματα, συμβουλευτείτε τον γιατρό ή φαρμακοποιό σας</li>
              <li>Οι χρήστες είναι υπεύθυνοι για τη σωστή χρήση των πληροφοριών</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Λογαριασμός Χρήστη</h2>
            <p className="text-gray-700 mb-4">
              Για τη δημιουργία λογαριασμού απαιτείται:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Έγκυρη διεύθυνση email</li>
              <li>Ασφαλής κωδικός πρόσβασης (τουλάχιστον 8 χαρακτήρες)</li>
              <li>Ο χρήστης είναι υπεύθυνος για τη διαφύλαξη των στοιχείων πρόσβασης</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Τιμολόγηση και Πληρωμές</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Δοκιμαστική περίοδος: 10 ημέρες δωρεάν</li>
              <li>Ετήσια συνδρομή: 14.99€</li>
              <li>SMS credits: 0.15€ ανά μήνυμα</li>
              <li>Οι πληρωμές πραγματοποιούνται μέσω Stripe</li>
              <li>Δυνατότητα ακύρωσης ανά πάσα στιγμή</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Πνευματική Ιδιοκτησία</h2>
            <p className="text-gray-700 mb-4">
              Το περιεχόμενο των ανακοινώσεων ανήκει στον ΕΟΦ. Το DrugAlert.gr παρέχει μόνο την υπηρεσία 
              συλλογής και ειδοποίησης. Η πλατφόρμα και ο κώδικας του DrugAlert.gr προστατεύονται από 
              πνευματικά δικαιώματα.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Αποποίηση Ευθύνης</h2>
            <p className="text-gray-700 mb-4">
              Το DrugAlert.gr:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Δεν ευθύνεται για την ακρίβεια των πληροφοριών του ΕΟΦ</li>
              <li>Δεν παρέχει ιατρικές συμβουλές</li>
              <li>Δεν ευθύνεται για τυχόν καθυστερήσεις στις ειδοποιήσεις</li>
              <li>Δεν ευθύνεται για απώλεια δεδομένων ή διακοπή υπηρεσίας</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Τροποποίηση Όρων</h2>
            <p className="text-gray-700 mb-4">
              Διατηρούμε το δικαίωμα τροποποίησης των όρων χρήσης. Οι χρήστες θα ειδοποιούνται για 
              σημαντικές αλλαγές μέσω email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Επικοινωνία</h2>
            <p className="text-gray-700">
              Για οποιαδήποτε ερώτηση σχετικά με τους όρους χρήσης, επικοινωνήστε μαζί μας στο:
              <br />
              <a href="mailto:support@drugalert.gr" className="text-blue-600 hover:text-blue-500">
                support@drugalert.gr
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

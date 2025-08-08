import Link from 'next/link'

export default function Privacy() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Πολιτική Απορρήτου</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Τελευταία ενημέρωση: {new Date().toLocaleDateString('el-GR')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Εισαγωγή</h2>
            <p className="text-gray-700 mb-4">
              Στο DrugAlert.gr, σεβόμαστε και προστατεύουμε την ιδιωτικότητα των χρηστών μας. 
              Η παρούσα πολιτική απορρήτου εξηγεί πώς συλλέγουμε, χρησιμοποιούμε και προστατεύουμε 
              τα προσωπικά σας δεδομένα.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Δεδομένα που Συλλέγουμε</h2>
            <p className="text-gray-700 mb-4">Συλλέγουμε τα ακόλουθα δεδομένα:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Email διεύθυνση (υποχρεωτικό)</li>
              <li>Ονοματεπώνυμο (προαιρετικό)</li>
              <li>Τηλέφωνο (προαιρετικό - για SMS ειδοποιήσεις)</li>
              <li>Προτιμήσεις ειδοποιήσεων</li>
              <li>Ιστορικό ανάγνωσης ανακοινώσεων</li>
              <li>Τεχνικά δεδομένα (IP, browser, κλπ)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Σκοπός Χρήσης Δεδομένων</h2>
            <p className="text-gray-700 mb-4">Χρησιμοποιούμε τα δεδομένα σας για:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Δημιουργία και διαχείριση του λογαριασμού σας</li>
              <li>Αποστολή ειδοποιήσεων για νέες ανακοινώσεις</li>
              <li>Επικοινωνία σχετικά με την υπηρεσία</li>
              <li>Βελτίωση της υπηρεσίας μας</li>
              <li>Συμμόρφωση με νομικές υποχρεώσεις</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Νομική Βάση Επεξεργασίας</h2>
            <p className="text-gray-700 mb-4">
              Η επεξεργασία των δεδομένων σας βασίζεται στη συγκατάθεσή σας και στην εκτέλεση 
              της σύμβασης παροχής υπηρεσιών, σύμφωνα με τον GDPR.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Κοινοποίηση Δεδομένων</h2>
            <p className="text-gray-700 mb-4">
              Κοινοποιούμε δεδομένα μόνο σε:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Stripe - για την επεξεργασία πληρωμών</li>
              <li>Email/SMS παρόχους - για την αποστολή ειδοποιήσεων</li>
              <li>Αρχές - όταν απαιτείται από το νόμο</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Δεν πουλάμε ούτε ενοικιάζουμε τα προσωπικά σας δεδομένα σε τρίτους.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Ασφάλεια Δεδομένων</h2>
            <p className="text-gray-700 mb-4">
              Λαμβάνουμε τα κατάλληλα τεχνικά και οργανωτικά μέτρα για την προστασία των δεδομένων σας:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Κρυπτογράφηση δεδομένων (SSL/TLS)</li>
              <li>Ασφαλής αποθήκευση κωδικών</li>
              <li>Τακτικά backups</li>
              <li>Περιορισμένη πρόσβαση στα δεδομένα</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Διατήρηση Δεδομένων</h2>
            <p className="text-gray-700 mb-4">
              Διατηρούμε τα δεδομένα σας για όσο διάστημα είστε ενεργός χρήστης. 
              Μετά τη διαγραφή του λογαριασμού σας, τα δεδομένα διαγράφονται εντός 30 ημερών, 
              εκτός αν απαιτείται διαφορετικά από το νόμο.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Τα Δικαιώματά σας</h2>
            <p className="text-gray-700 mb-4">Έχετε τα εξής δικαιώματα:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Πρόσβαση στα δεδομένα σας</li>
              <li>Διόρθωση ανακριβών δεδομένων</li>
              <li>Διαγραφή δεδομένων ("δικαίωμα στη λήθη")</li>
              <li>Περιορισμός επεξεργασίας</li>
              <li>Φορητότητα δεδομένων</li>
              <li>Εναντίωση στην επεξεργασία</li>
              <li>Ανάκληση συγκατάθεσης</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies</h2>
            <p className="text-gray-700 mb-4">
              Χρησιμοποιούμε cookies για:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Διατήρηση της σύνδεσής σας</li>
              <li>Αποθήκευση προτιμήσεων</li>
              <li>Βελτίωση της εμπειρίας χρήσης</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Μπορείτε να διαχειριστείτε τα cookies από τις ρυθμίσεις του browser σας.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Αλλαγές στην Πολιτική</h2>
            <p className="text-gray-700 mb-4">
              Ενδέχεται να ενημερώσουμε την πολιτική απορρήτου. Θα σας ειδοποιήσουμε για 
              σημαντικές αλλαγές μέσω email ή ειδοποίησης στην πλατφόρμα.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Επικοινωνία</h2>
            <p className="text-gray-700">
              Για ερωτήσεις σχετικά με τα προσωπικά σας δεδομένα:
              <br />
              Email: <a href="mailto:privacy@drugalert.gr" className="text-blue-600 hover:text-blue-500">
                privacy@drugalert.gr
              </a>
              <br />
              <br />
              Υπεύθυνος Προστασίας Δεδομένων (DPO):
              <br />
              <a href="mailto:dpo@drugalert.gr" className="text-blue-600 hover:text-blue-500">
                dpo@drugalert.gr
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Εποπτική Αρχή</h2>
            <p className="text-gray-700">
              Έχετε δικαίωμα υποβολής καταγγελίας στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα:
              <br />
              <a href="https://www.dpa.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                www.dpa.gr
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

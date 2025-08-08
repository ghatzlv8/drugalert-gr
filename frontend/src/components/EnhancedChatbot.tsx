import { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Message {
  text: string;
  isUser: boolean;
  articles?: Array<{
    id: number;
    title: string;
    url: string;
    excerpt: string;
    publish_date: string;
  }>;
}

interface FAQ {
  question: string;
  answer: string;
  keywords: string[];
}

const faqs: FAQ[] = [
  {
    question: "Τι είναι το DrugAlert.gr;",
    answer: "Το DrugAlert.gr είναι μια υπηρεσία που σας ενημερώνει άμεσα για όλες τις ανακοινώσεις του ΕΟΦ σχετικά με ανακλήσεις φαρμάκων, ιατροτεχνολογικών προϊόντων και άλλες σημαντικές ενημερώσεις για την υγεία σας.",
    keywords: ["τι είναι", "drugalert", "υπηρεσία", "eof"]
  },
  {
    question: "Πόσο κοστίζει η υπηρεσία;",
    answer: "Προσφέρουμε 4 ημέρες δωρεάν δοκιμή χωρίς πιστωτική κάρτα. Μετά τη δοκιμαστική περίοδο, η ετήσια συνδρομή κοστίζει μόνο €14.99 (λιγότερο από €1.25 τον μήνα).",
    keywords: ["κόστος", "τιμή", "πόσο", "συνδρομή", "πληρωμή"]
  },
  {
    question: "Πώς λειτουργούν οι ειδοποιήσεις;",
    answer: "Σαρώνουμε την ιστοσελίδα του ΕΟΦ κάθε 15 λεπτά. Όταν εντοπίσουμε νέα ανακοίνωση, λαμβάνετε άμεσα ειδοποίηση μέσω email και push notifications στον browser ή το κινητό σας.",
    keywords: ["ειδοποιήσεις", "notifications", "πώς", "λειτουργεί", "email", "push"]
  },
  {
    question: "Μπορώ να ακυρώσω τη συνδρομή μου;",
    answer: "Ναι, μπορείτε να ακυρώσετε τη συνδρομή σας οποιαδήποτε στιγμή από τις ρυθμίσεις του λογαριασμού σας. Θα συνεχίσετε να έχετε πρόσβαση μέχρι το τέλος της τρέχουσας περιόδου χρέωσης.",
    keywords: ["ακύρωση", "cancel", "συνδρομή", "διακοπή"]
  },
  {
    question: "Τι είδους ανακοινώσεις θα λαμβάνω;",
    answer: "Θα λαμβάνετε όλες τις ανακοινώσεις του ΕΟΦ που αφορούν: ανακλήσεις φαρμάκων, ανακλήσεις ιατροτεχνολογικών προϊόντων, προειδοποιήσεις ασφαλείας, ενημερώσεις για παρτίδες προϊόντων και άλλες κρίσιμες πληροφορίες υγείας.",
    keywords: ["ανακοινώσεις", "είδος", "ανακλήσεις", "φάρμακα", "ιατροτεχνολογικά"]
  },
  {
    question: "Πώς ενεργοποιώ τις push notifications;",
    answer: "Μετά τη σύνδεση σας, θα εμφανιστεί αυτόματα ένα παράθυρο που θα σας ζητήσει να ενεργοποιήσετε τις push notifications. Πατήστε 'Ενεργοποίηση' και στη συνέχεια 'Επιτρέπω' στο παράθυρο του browser.",
    keywords: ["push", "notifications", "ενεργοποίηση", "browser", "ειδοποιήσεις"]
  },
  {
    question: "Είναι ασφαλή τα δεδομένα μου;",
    answer: "Ναι, χρησιμοποιούμε SSL κρυπτογράφηση για όλες τις συνδέσεις και ακολουθούμε πλήρως τον κανονισμό GDPR. Τα προσωπικά σας δεδομένα είναι ασφαλή και δεν τα μοιραζόμαστε με τρίτους.",
    keywords: ["ασφάλεια", "δεδομένα", "gdpr", "προσωπικά", "κρυπτογράφηση"]
  },
  {
    question: "Πώς μπορώ να επικοινωνήσω μαζί σας;",
    answer: "Μπορείτε να μας στείλετε email στο info@drugalert.gr για οποιαδήποτε ερώτηση ή πρόβλημα. Απαντάμε συνήθως εντός 24 ωρών.",
    keywords: ["επικοινωνία", "email", "contact", "βοήθεια", "υποστήριξη"]
  }
];

export default function EnhancedChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Γεια σας! 👋 Είμαι εδώ για να απαντήσω στις ερωτήσεις σας σχετικά με το DrugAlert.gr. Μπορώ επίσης να σας βοηθήσω να βρείτε συγκεκριμένες ανακοινώσεις του ΕΟΦ. Πώς μπορώ να σας βοηθήσω;", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const searchPosts = async (searchTerm: string) => {
    try {
      const response = await apiClient.get('/posts', {
        params: {
          search: searchTerm,
          limit: 5,
          sort_by: 'publish_date',
          order: 'desc'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  };

  const findBestAnswer = async (query: string) => {
    const normalizedQuery = query.toLowerCase();
    
    // Check if user is asking about a specific medicine or product
    const medicineKeywords = ['φάρμακο', 'φαρμάκου', 'φαρμακο', 'χάπι', 'σιρόπι', 'ένεση', 'κρέμα', 'αλοιφή', 'σπρέι', 'ιατροτεχνολογικό'];
    const recallKeywords = ['ανάκληση', 'ανακαλείται', 'ανακλήθηκε', 'απόσυρση', 'αποσύρεται'];
    
    const isAskingAboutMedicine = medicineKeywords.some(keyword => normalizedQuery.includes(keyword));
    const isAskingAboutRecall = recallKeywords.some(keyword => normalizedQuery.includes(keyword));
    
    if (isAskingAboutMedicine || isAskingAboutRecall || normalizedQuery.length > 20) {
      // Extract potential medicine name or search term
      const searchTerm = query.replace(/[;,.?!]/g, '').trim();
      const posts = await searchPosts(searchTerm);
      
      if (posts.length > 0) {
        const articleCount = posts.length;
        const articleWord = articleCount === 1 ? 'ανακοίνωση' : 'ανακοινώσεις';
        
        return {
          text: `Βρήκα ${articleCount} σχετική ${articleWord} του ΕΟΦ για την αναζήτησή σας:`,
          articles: posts
        };
      } else {
        return {
          text: `Δεν βρήκα ανακοινώσεις του ΕΟΦ σχετικά με "${searchTerm}". Μπορείτε να δοκιμάσετε διαφορετικούς όρους αναζήτησης ή να ελέγξετε τον πίνακα ελέγχου για όλες τις πρόσφατες ανακοινώσεις.`,
          articles: []
        };
      }
    }
    
    // Check FAQs for general questions
    let bestMatch: FAQ | null = null;
    let highestScore = 0;

    for (const faq of faqs) {
      let score = 0;
      
      // Check if query contains keywords
      for (const keyword of faq.keywords) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }
      
      // Check if query contains words from the question
      const questionWords = faq.question.toLowerCase().split(' ');
      for (const word of questionWords) {
        if (word.length > 3 && normalizedQuery.includes(word)) {
          score += 1;
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }
    
    if (bestMatch && highestScore > 0) {
      return { text: bestMatch.answer, articles: [] };
    }
    
    return { 
      text: "Λυπάμαι, δεν κατάλαβα την ερώτησή σας. Μπορείτε να ρωτήσετε για: τιμές, ειδοποιήσεις, ασφάλεια, ακύρωση συνδρομής ή να αναζητήσετε συγκεκριμένα φάρμακα και ανακοινώσεις. Για περισσότερη βοήθεια επικοινωνήστε στο info@drugalert.gr",
      articles: []
    };
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
    const userQuery = inputValue;
    setInputValue('');
    setIsTyping(true);
    
    // Get response
    const response = await findBestAnswer(userQuery);
    
    // Simulate typing delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: response.text, 
        isUser: false,
        articles: response.articles
      }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Πόσο κοστίζει;",
    "Πώς λειτουργεί;",
    "Ανακλήσεις φαρμάκων",
    "Πρόσφατες ανακοινώσεις"
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-200 z-40 ${
          isOpen ? 'hidden' : 'block'
        }`}
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 max-w-[calc(100vw-2rem)]">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="font-semibold">DrugAlert.gr Assistant</h3>
              <p className="text-xs opacity-90">Αναζητήστε ανακοινώσεις ΕΟΦ</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 rounded p-1"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%]`}>
                  <div
                    className={`p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.text}
                  </div>
                  
                  {/* Articles */}
                  {message.articles && message.articles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.articles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/posts/${article.id}`}
                          className="block p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-2">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                {article.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(article.publish_date)}
                              </p>
                              {article.excerpt && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {article.excerpt}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Συχνές ερωτήσεις:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(question);
                      handleSend();
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Αναζητήστε φάρμακα ή ρωτήστε..."
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { pushNotificationService } from '@/services/pushNotifications'
import PushNotificationPrompt from '@/components/PushNotificationPrompt'
import EnhancedChatbot from '@/components/EnhancedChatbot'
import Script from 'next/script'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  const initAuth = useAuthStore((state) => state.initAuth)

  useEffect(() => {
    initAuth()
    
    // Initialize push notification service
    const initPushNotifications = async () => {
      try {
        await pushNotificationService.init();
        console.log('Push notification service initialized');
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    };
    
    initPushNotifications();
  }, [initAuth])

  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-HTRYE07M9X"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-HTRYE07M9X');
        `}
      </Script>
      
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <PushNotificationPrompt />
        <EnhancedChatbot />
        <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
        />
      </QueryClientProvider>
    </>
  )
}

import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { pushNotificationService } from '@/services/pushNotifications'
import PushNotificationPrompt from '@/components/PushNotificationPrompt'
import EnhancedChatbot from '@/components/EnhancedChatbot'
import CookieConsent from '@/components/CookieConsent'
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
      {/* Initialize consent mode for GTM */}
      <Script id="gtm-consent" strategy="beforeInteractive">
        {`
          // Define dataLayer and gtag function for consent mode
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          
          // Set default consent mode for EU regions
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'functionality_storage': 'granted',
            'personalization_storage': 'granted',
            'security_storage': 'granted',
            'wait_for_update': 500,
            'region': ['EEA', 'EU', 'GR', 'GB']
          });
          
          // For users outside of EU, set more permissive defaults
          gtag('consent', 'default', {
            'ad_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted',
            'analytics_storage': 'granted',
            'functionality_storage': 'granted',
            'personalization_storage': 'granted',
            'security_storage': 'granted'
          });
          
          // Push consent mode initialization event for GTM
          window.dataLayer.push({
            'event': 'consent_mode_ready'
          });
        `}
      </Script>
      
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <PushNotificationPrompt />
        <EnhancedChatbot />
        <CookieConsent />
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

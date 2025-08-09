import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="el">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="description" content="Μείνετε ενημερωμένοι για ανακλήσεις φαρμάκων και ενημερώσεις από τον ΕΟΦ" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preconnect to Google domains for faster loading */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        
        {/* Initialize dataLayer for Tag Assistant compatibility */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize dataLayer early for Tag Assistant
              window.dataLayer = window.dataLayer || [];
              window.google_tag_assistant_api = window.google_tag_assistant_api || {};
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

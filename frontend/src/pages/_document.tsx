import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="el">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="description" content="Μείνετε ενημερωμένοι για ανακλήσεις φαρμάκων και ενημερώσεις από τον ΕΟΦ" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RSTGO — Smart Restaurant Ordering',
  description: 'NFC-powered table ordering system for modern restaurants. Guests tap, order, and split bills — staff get orders instantly.',
  keywords: 'restaurant ordering, NFC menu, QR code menu, table ordering system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="antialiased">{children}</body>
    </html>
  )
}

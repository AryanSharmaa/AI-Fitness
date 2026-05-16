import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import Navbar from '@/components/layout/Navbar'
import { Toaster } from '@/components/ui/sonner'
import NextTopLoader from 'nextjs-toploader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FitMind AI — Your Adaptive Indian Fitness Coach',
  description: 'An AI coach that understands a tired, imperfect human. Indian food, adaptive workouts, and real behavior coaching.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <NextTopLoader color="#10b981" height={3} showSpinner={false} />
          <Navbar />
          <main>{children}</main>
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}

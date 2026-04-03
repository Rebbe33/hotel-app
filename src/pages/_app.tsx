import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import { BottomNav } from '@/components/ui/BottomNav'
import { StockReminderBanner } from '@/components/stock/StockReminderBanner'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="max-w-lg mx-auto relative min-h-screen">
      <StockReminderBanner />
      <main className="pb-24">
        <Component {...pageProps} />
      </main>
      <BottomNav />
    </div>
  )
}

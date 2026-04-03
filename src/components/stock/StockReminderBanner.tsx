import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StockReminder } from '@/types'
import Link from 'next/link'

export function StockReminderBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from('hotel_stock_reminders')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      if (data) {
        const nextDate = new Date(data.next_reminder_at)
        if (new Date() >= nextDate) setShow(true)
      }
    }
    check()
  }, [])

  if (!show || dismissed) return null

  return (
    <div className="bg-terracotta-500 text-white px-4 py-3 flex items-center gap-3 animate-slide-up">
      <AlertTriangle size={18} className="flex-shrink-0" />
      <Link href="/stocks" className="flex-1 text-sm font-body font-semibold">
        Rappel : vérifier les stocks 📦
      </Link>
      <button onClick={() => setDismissed(true)} className="p-1">
        <X size={16} />
      </button>
    </div>
  )
}

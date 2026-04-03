import Link from 'next/link'
import { useRouter } from 'next/router'
import { BedDouble, Package, WashingMachine, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: BedDouble, label: 'Chambres' },
  { href: '/taches', icon: CheckSquare, label: 'Tâches' },
  { href: '/stocks', icon: Package, label: 'Stocks' },
  { href: '/lingerie', icon: WashingMachine, label: 'Lingerie' },
]

export function BottomNav() {
  const router = useRouter()

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-linen shadow-soft z-50">
      <div className="flex">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href || (href !== '/' && router.pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors',
                active ? 'text-sage-600' : 'text-gray-400'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={cn('text-[10px] font-body', active ? 'font-bold' : 'font-normal')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

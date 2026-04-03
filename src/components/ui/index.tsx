import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { ReactNode, useEffect } from 'react'

// ── Badge ────────────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode
  variant?: 'sage' | 'terra' | 'cream' | 'urgent'
  className?: string
}

export function Badge({ children, variant = 'cream', className }: BadgeProps) {
  const styles: Record<string, string> = {
    sage: 'bg-sage-400/20 text-sage-700 border-sage-400/30',
    terra: 'bg-terracotta-400/20 text-terracotta-600 border-terracotta-400/30',
    cream: 'bg-cream-200 text-gray-600 border-linen',
    urgent: 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-semibold border',
      styles[variant], className
    )}>
      {children}
    </span>
  )
}

// ── Button ───────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: 'bg-sage-600 text-white active:bg-sage-700 disabled:opacity-50',
    secondary: 'bg-cream-200 text-sage-700 border border-linen active:bg-linen',
    ghost: 'text-sage-600 active:bg-cream-100',
    danger: 'bg-terracotta-500 text-white active:bg-terracotta-600',
  }
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  }
  return (
    <button
      className={cn(
        'font-body font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Modal ────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-card animate-slide-up max-h-[90vh] overflow-y-auto pb-28">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-cream-200">
          {title && <h2 className="font-display text-lg font-semibold text-gray-800">{title}</h2>}
          <button onClick={onClose} className="ml-auto p-2 rounded-full hover:bg-cream-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="px-5 pb-8 pt-4">{children}</div>
      </div>
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-soft border border-cream-200', className)}>
      {children}
    </div>
  )
}

// ── PageHeader ───────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="px-5 pt-8 pb-4 flex items-start justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="font-body text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-3 flex-shrink-0">{action}</div>}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Plus, Package, AlertCircle, CheckCircle2, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StockItem, StockReminder, StockCategory, STOCK_CATEGORY_LABELS } from '@/types'
import { PageHeader, Card, Button, Badge, Modal } from '@/components/ui'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

const CATEGORY_ICONS: Record<StockCategory, string> = {
  linge: '🛏️',
  produits: '🧴',
  amenities: '🧼',
  autre: '📦',
}

export default function StocksPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [reminder, setReminder] = useState<StockReminder | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<StockItem | null>(null)
  const [filterCat, setFilterCat] = useState<StockCategory | 'tous'>('tous')

  const fetchAll = async () => {
    const [{ data: stockData }, { data: reminderData }] = await Promise.all([
      supabase.from('hotel_stock_items').select('*').order('category').order('name'),
      supabase.from('hotel_stock_reminders').select('*').eq('is_active', true).limit(1).maybeSingle(),
    ])
    if (stockData) setItems(stockData)
    if (reminderData) setReminder(reminderData)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const markChecked = async () => {
    if (!reminder) return
    const now = new Date()
    const next = addDays(now, reminder.interval_days)
    await supabase.from('hotel_stock_reminders').update({
      last_reminded_at: now.toISOString(),
      next_reminder_at: next.toISOString(),
    }).eq('id', reminder.id)
    // Mark all items as checked
    await supabase.from('hotel_stock_items').update({ last_checked_at: now.toISOString() })
    fetchAll()
  }

  const filtered = filterCat === 'tous' ? items : items.filter(i => i.category === filterCat)
  const lowStock = items.filter(i => i.current_qty <= i.min_qty)
  const nextCheck = reminder ? new Date(reminder.next_reminder_at) : null
  const isDue = nextCheck ? new Date() >= nextCheck : false

  return (
    <>
      <PageHeader
        title="Stocks"
        subtitle={`${items.length} articles · ${lowStock.length} en alerte`}
        action={
          <Button size="sm" onClick={() => { setEditItem(null); setShowForm(true) }}>
            <Plus size={16} /> Ajouter
          </Button>
        }
      />

      {/* Rappel */}
      {reminder && (
        <div className="px-5 mb-4">
          <Card className={cn('p-4 flex items-center gap-3', isDue ? 'border-terracotta-400 bg-terracotta-400/5' : '')}>
            <Calendar size={20} className={isDue ? 'text-terracotta-500' : 'text-sage-500'} />
            <div className="flex-1">
              <p className="text-sm font-body font-semibold text-gray-700">
                {isDue ? '⚠️ Vérification des stocks due !' : 'Prochaine vérification'}
              </p>
              <p className="text-xs text-gray-400 font-body">
                {nextCheck ? format(nextCheck, "d MMMM yyyy", { locale: fr }) : '—'}
              </p>
            </div>
            {isDue && (
              <Button size="sm" onClick={markChecked}>
                <CheckCircle2 size={14} /> OK
              </Button>
            )}
          </Card>
        </div>
      )}

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="px-5 mb-4">
          <div className="bg-terracotta-400/10 border border-terracotta-400/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-terracotta-500" />
              <span className="text-sm font-body font-semibold text-terracotta-600">
                {lowStock.length} article{lowStock.length > 1 ? 's' : ''} en stock faible
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(item => (
                <span key={item.id} className="text-xs bg-white text-terracotta-600 border border-terracotta-200 rounded-full px-2.5 py-1 font-body">
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto pb-1">
        {(['tous', 'linge', 'produits', 'amenities', 'autre'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-semibold border transition-all',
              filterCat === cat ? 'bg-sage-600 text-white border-sage-600' : 'bg-white text-gray-600 border-cream-200'
            )}
          >
            {cat === 'tous' ? 'Tous' : `${CATEGORY_ICONS[cat]} ${STOCK_CATEGORY_LABELS[cat]}`}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="px-5 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400 font-body">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-body">Aucun article</div>
        ) : (
          filtered.map(item => (
            <StockItemCard key={item.id} item={item} onEdit={() => { setEditItem(item); setShowForm(true) }} onUpdate={fetchAll} />
          ))
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editItem ? 'Modifier l\'article' : 'Nouvel article'}
      >
        <StockItemForm item={editItem} onSaved={() => { setShowForm(false); fetchAll() }} />
      </Modal>
    </>
  )
}

// ── Stock Item Card ───────────────────────────────────────────
function StockItemCard({ item, onEdit, onUpdate }: { item: StockItem; onEdit: () => void; onUpdate: () => void }) {
  const isLow = item.current_qty <= item.min_qty
  const pct = item.min_qty > 0 ? Math.min(100, Math.round((item.current_qty / (item.min_qty * 2)) * 100)) : 100

  const adjustQty = async (delta: number) => {
    const newQty = Math.max(0, item.current_qty + delta)
    await supabase.from('hotel_stock_items').update({ current_qty: newQty }).eq('id', item.id)
    onUpdate()
  }

  return (
    <Card className={cn('overflow-hidden', isLow ? 'border-terracotta-300' : '')}>
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-body font-semibold text-gray-800 text-sm">{item.name}</span>
              {isLow && <AlertCircle size={14} className="text-terracotta-500 flex-shrink-0" />}
            </div>
            <span className="text-xs text-gray-400 font-body">
              {CATEGORY_ICONS[item.category]} {STOCK_CATEGORY_LABELS[item.category]}
              {item.last_checked_at && ` · vérifié ${format(new Date(item.last_checked_at), 'd MMM', { locale: fr })}`}
            </span>
          </div>
          <button onClick={onEdit} className="text-xs text-gray-400 font-body underline">
            Modifier
          </button>
        </div>

        {/* Progress */}
        <div className="progress-bar mb-2">
          <div
            className={cn('progress-bar-fill', isLow ? '!bg-terracotta-400' : '')}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className={cn('font-display font-bold text-lg', isLow ? 'text-terracotta-500' : 'text-sage-700')}>
              {item.current_qty}
            </span>
            <span className="text-xs text-gray-400 font-body">/ min {item.min_qty} {item.unit}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustQty(-1)}
              className="w-8 h-8 rounded-full border border-cream-200 bg-white text-gray-600 font-bold text-lg flex items-center justify-center active:bg-cream-100"
            >
              −
            </button>
            <button
              onClick={() => adjustQty(1)}
              className="w-8 h-8 rounded-full bg-sage-600 text-white font-bold text-lg flex items-center justify-center active:bg-sage-700"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Stock Item Form ───────────────────────────────────────────
function StockItemForm({ item, onSaved }: { item: StockItem | null; onSaved: () => void }) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<StockCategory>(item?.category ?? 'linge')
  const [currentQty, setCurrentQty] = useState(item?.current_qty?.toString() ?? '0')
  const [minQty, setMinQty] = useState(item?.min_qty?.toString() ?? '0')
  const [unit, setUnit] = useState(item?.unit ?? 'unité')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name: name.trim(),
      category,
      current_qty: parseFloat(currentQty) || 0,
      min_qty: parseFloat(minQty) || 0,
      unit,
      notes,
    }
    if (item?.id) {
      await supabase.from('hotel_stock_items').update(payload).eq('id', item.id)
    } else {
      await supabase.from('hotel_stock_items').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  const handleDelete = async () => {
    if (!item?.id || !confirm('Supprimer cet article ?')) return
    await supabase.from('hotel_stock_items').delete().eq('id', item.id)
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Nom *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Draps king size"
          className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
      </div>
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Catégorie</label>
        <div className="grid grid-cols-2 gap-2">
          {(['linge', 'produits', 'amenities', 'autre'] as StockCategory[]).map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={cn('py-2 rounded-xl text-xs font-body font-semibold border transition-all',
                category === cat ? 'bg-sage-600 text-white border-sage-600' : 'bg-cream-50 text-gray-600 border-cream-200')}>
              {CATEGORY_ICONS[cat]} {STOCK_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-body font-semibold text-gray-700 mb-1">Quantité</label>
          <input type="number" value={currentQty} onChange={e => setCurrentQty(e.target.value)} min={0}
            className="w-full px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold text-gray-700 mb-1">Minimum</label>
          <input type="number" value={minQty} onChange={e => setMinQty(e.target.value)} min={0}
            className="w-full px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold text-gray-700 mb-1">Unité</label>
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="unité"
            className="w-full px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400 resize-none" />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={saving || !name.trim()}>
        {saving ? 'Enregistrement...' : item ? 'Mettre à jour' : 'Ajouter'}
      </Button>
      {item && (
        <Button className="w-full" variant="ghost" onClick={handleDelete}>
          <span className="text-terracotta-500">Supprimer cet article</span>
        </Button>
      )}
    </div>
  )
}

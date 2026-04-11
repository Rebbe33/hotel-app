import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, CheckCircle, Plus, Flag, Trash2, Settings } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Room, ChecklistItem, RoomSession, SessionCheck, CleanType, CLEAN_TYPE_LABELS, CATEGORY_LABELS, ChecklistCategory } from '@/types'
import { Button, Badge, Card, Modal } from '@/components/ui'
import { progressPercent, cn } from '@/lib/utils'
import { GestionTaches } from '@/components/checklist/GestionTaches'

export default function RoomDetailPage() {
  const router = useRouter()
  const { id } = router.query as { id: string }

  const [room, setRoom] = useState<Room | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [session, setSession] = useState<RoomSession | null>(null)
  const [checks, setChecks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [choixFait, setChoixFait] = useState(false)
const [cleanType, setCleanType] = useState<'recouche' | 'blanc' | null>(null)
const [blancTotalChecks, setBlancTotalChecks] = useState<Set<string>>(new Set())
  const [showGestion, setShowGestion] = useState(false)

  const fetchData = async () => {
    if (!id) return
    const [{ data: roomData }, { data: itemsData }] = await Promise.all([
      supabase.from('hotel_rooms').select('*').eq('id', id).single(),
      supabase.from('hotel_checklist_items')
  .select('*')
  .eq('room_id', id)
  .order('order_index'),
    ])
    if (roomData) setRoom(roomData)
    if (itemsData) setItems(itemsData)

    // Get or create active session
    const { data: sessionData } = await supabase
      .from('hotel_room_sessions')
      .select('*')
      .eq('room_id', id)
      .is('completed_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sessionData) {
      setSession(sessionData)
      const { data: checkData } = await supabase
        .from('hotel_session_checks')
        .select('checklist_item_id')
        .eq('session_id', sessionData.id)
      if (checkData) setChecks(new Set(checkData.map(c => c.checklist_item_id)))

      setCleanType(sessionData.clean_type as 'recouche' | 'blanc')
      setChoixFait(true)
    }

    const { data: btData } = await supabase
      .from('hotel_room_blanc_total')
      .select('checklist_item_id')
      .eq('room_id', id)
    if (btData) setBlancTotalChecks(new Set(btData.map(b => b.checklist_item_id)))

    setLoading(false) 
  }

  useEffect(() => { fetchData() }, [id])

  const startSession = async (type: 'recouche' | 'blanc') => {
    if (!room) return
    const { data } = await supabase.from('hotel_room_sessions').insert({
      room_id: room.id,
      clean_type: type,
      visit_number: 1,
    }).select().single()
    if (data) setSession(data)
    await supabase.from('hotel_rooms').update({ status: 'en_cours' }).eq('id', room.id)
    setRoom(prev => prev ? { ...prev, status: 'en_cours' } : null)
  }

  const toggleCheck = async (itemId: string) => {
    if (!session) return
    const newChecks = new Set(checks)
    if (newChecks.has(itemId)) {
      await supabase.from('hotel_session_checks')
        .delete()
        .eq('session_id', session.id)
        .eq('checklist_item_id', itemId)
      newChecks.delete(itemId)
    } else {
      await supabase.from('hotel_session_checks').insert({
        session_id: session.id,
        checklist_item_id: itemId,
      })
      newChecks.add(itemId)
    }
    setChecks(newChecks)
  }

  const completeSession = async () => {
    if (!session || !room) return
    await supabase.from('hotel_room_sessions').update({ completed_at: new Date().toISOString() }).eq('id', session.id)
    await supabase.from('hotel_rooms').update({ status: 'termine' }).eq('id', room.id)
    router.push('/')
  }

  if (loading || !room) {
    return <div className="flex items-center justify-center h-screen text-gray-400 font-body">Chargement...</div>
  }

  // Filter items for this clean type
  const relevantItems = cleanType
  ? items.filter(item => item.clean_types.includes(cleanType) && !item.clean_types.every(t => t === 'blanc_total'))
  : []
  const total = relevantItems.length
  const done = relevantItems.filter(i => checks.has(i.id)).length
  const progress = progressPercent(done, total)

  // Group by category
  const grouped = relevantItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<ChecklistCategory, ChecklistItem[]>)

const toggleBlancTotal = async (itemId: string) => {
  const newSet = new Set(blancTotalChecks)
  if (newSet.has(itemId)) {
    await supabase.from('hotel_room_blanc_total')
      .delete()
      .eq('room_id', room!.id)
      .eq('checklist_item_id', itemId)
    newSet.delete(itemId)
  } else {
    await supabase.from('hotel_room_blanc_total').insert({
      room_id: room!.id,
      checklist_item_id: itemId,
    })
    newSet.add(itemId)
  }
  setBlancTotalChecks(newSet)
}

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream-50 border-b border-cream-200 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="p-2 -ml-2 rounded-xl active:bg-cream-200">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-gray-800">Chambre {room.number}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {cleanType && (
  <Badge variant={cleanType === 'blanc' ? 'sage' : 'cream'}>
    {CLEAN_TYPE_LABELS[cleanType]}
  </Badge>
)}
              <button
  onClick={() => setShowGestion(true)}
  className="p-2 rounded-xl bg-cream-100 text-gray-600 active:bg-cream-200"
>
  <Settings size={18} />
</button>
              <span className="text-xs text-gray-400 font-body">{room.zone}</span>
            </div>
          </div>
          {session && (
            <span className="text-sm font-body font-semibold text-sage-700">{done}/{total}</span>
          )}
        </div>

        {/* Progress bar */}
        {session && (
          <div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400 font-body">{progress}% terminé</span>
              {progress === 100 && (
                <span className="text-xs text-sage-600 font-body font-semibold">✓ Tout coché !</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Start session prompt */}
     {!choixFait && (
  <Card className="p-5">
    <h2 className="font-display text-lg font-bold text-gray-800 mb-1 text-center">
      Chambre {room.number}
    </h2>
    <p className="text-sm text-gray-500 font-body text-center mb-5">
      Quel type de nettoyage ?
    </p>
    <div className="space-y-3">
      <button
        onClick={() => { setCleanType('recouche'); setChoixFait(true); startSession('recouche') }}
        className="w-full p-4 rounded-2xl border-2 border-linen bg-cream-50 text-left active:bg-linen transition-all"
      >
        <p className="font-display font-bold text-gray-800">Recouche</p>
        <p className="text-xs text-gray-500 font-body mt-1">
          {items.filter(i => i.clean_types.includes('recouche')).length} tâches — nettoyage rapide
        </p>
      </button>
      <button
        onClick={() => { setCleanType('blanc'); setChoixFait(true); startSession('blanc') }}
        className="w-full p-4 rounded-2xl border-2 border-sage-400/40 bg-sage-400/5 text-left active:bg-sage-400/10 transition-all"
      >
        <p className="font-display font-bold text-sage-700">Blanc</p>
        <p className="text-xs text-gray-500 font-body mt-1">
          {items.filter(i => i.clean_types.includes('blanc')).length} tâches — nettoyage complet
        </p>
      </button>
    </div>
  </Card>
)}

        {/* Checklist by category */}
        {session && Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <h3 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {CATEGORY_LABELS[cat as ChecklistCategory]}
            </h3>
            <Card className="overflow-hidden divide-y divide-cream-100">
              {catItems.map(item => {
                const checked = checks.has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      checked ? 'bg-sage-400/5' : 'bg-white active:bg-cream-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={checked}
                      readOnly
                    />
                    <span className={cn(
                      'font-body text-sm flex-1',
                      checked ? 'text-gray-400 line-through' : 'text-gray-700'
                    )}>
                      {item.label}
                    </span>
                    {item.is_blanc_total && (
                      <span className="text-[10px] text-terracotta-500 font-body font-semibold bg-terracotta-400/10 px-2 py-0.5 rounded-full">
                        BT
                      </span>
                    )}
                  </button>
                )
              })}
            </Card>
          </div>
        ))}
        
{/* Section Blanc Total — toujours visible, persistante */}
{choixFait && (() => {
  const btItems = items.filter(i => i.clean_types.includes('blanc_total'))
  const btDone = btItems.filter(i => blancTotalChecks.has(i.id)).length
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-sm font-semibold text-terracotta-500 uppercase tracking-wide">
          ✨ Blanc Total
        </h3>
        <span className="text-xs text-gray-400 font-body">{btDone}/{btItems.length}</span>
      </div>
      <p className="text-xs text-gray-400 font-body mb-3">
        Ces tâches se complètent sur plusieurs passages
      </p>
      <Card className="overflow-hidden divide-y divide-cream-100">
        {btItems.map(item => {
          const checked = blancTotalChecks.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => toggleBlancTotal(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                checked ? 'bg-terracotta-400/5' : 'bg-white active:bg-cream-50'
              )}
            >
              <input type="checkbox" className="checkbox-custom" checked={checked} readOnly />
              <span className={cn(
                'font-body text-sm flex-1',
                checked ? 'text-gray-400 line-through' : 'text-gray-700'
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </Card>
      {/* Barre de progression blanc total */}
      <div className="mt-2">
        <div className="progress-bar">
          <div
            className="progress-bar-fill !bg-terracotta-400"
            style={{ width: `${progressPercent(btDone, btItems.length)}%` }}
          />
        </div>
        {btDone === btItems.length && btItems.length > 0 && (
          <p className="text-xs text-terracotta-500 font-body font-semibold mt-1 text-center">
            🎉 Blanc total atteint !
          </p>
        )}
      </div>
    </div>
  )
})()}
        <button
  onClick={async () => {
    if (!confirm('Remettre à zéro toutes les tâches blanc total ?')) return
    await supabase.from('hotel_room_blanc_total').delete().eq('room_id', room!.id)
    setBlancTotalChecks(new Set())
  }}
  className="text-xs text-gray-400 font-body underline mt-2"
>
  Réinitialiser le blanc total
</button>

        {/* Complete button */}
        {session && (
          <Button
            className="w-full mt-4"
            variant={progress === 100 ? 'primary' : 'secondary'}
            onClick={completeSession}
          >
            <CheckCircle size={18} />
            {progress === 100 ? 'Marquer comme terminée' : 'Terminer (incomplet)'}
          </Button>
        )}

        {/* Notes */}
        {room.notes && (
          <Card className="p-4">
            <p className="text-xs font-body font-semibold text-gray-500 mb-1">Notes</p>
            <p className="text-sm font-body text-gray-700">{room.notes}</p>
          </Card>
        )}
      </div>
      <Modal open={showGestion} onClose={() => setShowGestion(false)} title="Gérer les tâches">
  <GestionTaches
    roomId={room.id}
    items={items}
    onUpdate={() => { fetchData(); }}
  />
</Modal>
    </>
  )
}

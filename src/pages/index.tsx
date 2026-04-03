import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Room, RoomStatus, CleanType, CLEAN_TYPE_LABELS, ROOM_STATUS_LABELS } from '@/types'
import { PageHeader, Card, Button, Badge, Modal } from '@/components/ui'
import { RoomCard } from '@/components/checklist/RoomCard'
import { RoomForm } from '@/components/checklist/RoomForm'
import { cn } from '@/lib/utils'
import { ImportChecklist } from '@/components/checklist/ImportChecklist'

const STATUS_COLORS: Record<RoomStatus, string> = {
  a_faire: 'terra',
  en_cours: 'sage',
  termine: 'cream',
  bloque: 'urgent',
}

export default function ChambresPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<RoomStatus | 'tous'>('tous')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const fetchRooms = async () => {
    const { data } = await supabase
      .from('hotel_rooms')
      .select('*')
      .order('floor')
      .order('number')
    if (data) setRooms(data)
    setLoading(false)
  }

  useEffect(() => { fetchRooms() }, [])

  const filtered = rooms.filter(r => {
    const matchSearch = r.number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'tous' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    a_faire: rooms.filter(r => r.status === 'a_faire').length,
    en_cours: rooms.filter(r => r.status === 'en_cours').length,
    termine: rooms.filter(r => r.status === 'termine').length,
    bloque: rooms.filter(r => r.status === 'bloque').length,
  }

  return (
    <>
      <PageHeader
        title="Chambres"
        subtitle={`${rooms.length} chambres · ${counts.termine} terminées`}
        action={
          <div className="flex gap-2">
  <Button size="sm" variant="secondary" onClick={() => setShowImport(true)}>
    ⚙️
  </Button>
  <Button size="sm" onClick={() => setShowForm(true)}>
    <Plus size={16} /> Ajouter
  </Button>
</div>
        }
      />

      {/* Stats rapides */}
      <div className="px-5 grid grid-cols-4 gap-2 mb-4">
        {(Object.entries(counts) as [RoomStatus, number][]).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? 'tous' : status)}
            className={cn(
              'rounded-xl p-2 text-center border transition-all',
              filterStatus === status
                ? 'bg-sage-600 text-white border-sage-600'
                : 'bg-white border-cream-200'
            )}
          >
            <div className={cn('text-xl font-display font-bold', filterStatus === status ? 'text-white' : 'text-gray-800')}>
              {count}
            </div>
            <div className={cn('text-[9px] font-body leading-tight', filterStatus === status ? 'text-white/80' : 'text-gray-500')}>
              {ROOM_STATUS_LABELS[status]}
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une chambre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400"
          />
        </div>
      </div>

      {/* Room list */}
     <div className="px-5 grid grid-cols-2 gap-3">
  {filtered.map(room => (
    <RoomCard key={room.id} room={room} onUpdate={fetchRooms} />
  ))}
</div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouvelle chambre">
        <RoomForm onSaved={() => { setShowForm(false); fetchRooms() }} />
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Importer des tâches">
  <ImportChecklist onImported={() => setShowImport(false)} />
</Modal>
    </>
  )
}

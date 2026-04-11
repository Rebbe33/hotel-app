import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Room, CleanType, CLEAN_TYPE_LABELS } from '@/types'
import { PageHeader, Card, Button, Badge, Modal } from '@/components/ui'
import { RoomCard } from '@/components/checklist/RoomCard'
import { RoomForm } from '@/components/checklist/RoomForm'
import { cn } from '@/lib/utils'
import { ImportChecklist } from '@/components/checklist/ImportChecklist'


export default function ChambresPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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

const filtered = rooms.filter(r =>
  r.number.toLowerCase().includes(search.toLowerCase())
)

  return (
    <>
      <PageHeader
        title="Chambres"
        subtitle={`${rooms.length} chambres`}
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

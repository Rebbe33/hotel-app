import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Room } from '@/types'
import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { RoomForm } from './RoomForm'
import { supabase } from '@/lib/supabase'
import { Edit2 } from 'lucide-react'

const [showEdit, setShowEdit] = useState(false) 


interface Props {
  room: Room
  onUpdate: () => void
}

export function RoomCard({ room, onUpdate }: Props) {
  return (
    <div className="relative">
  {/* Bouton édition — en dehors du Link pour ne pas déclencher la navigation */}
  <button
    onClick={() => setShowEdit(true)}
    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/80 text-gray-400 active:text-sage-600"
  >
    <Edit2 size={14} />
  </button>

  <Link href={`/chambres/${room.id}`}>
    ... {/* ton contenu existant */}
  </Link>

  <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Chambre ${room.number}`}>
    <RoomForm
      initialData={room}
      onSaved={() => { setShowEdit(false); onUpdate() }}
    />
    <div className="mt-3 pt-3 border-t border-cream-200">
      <Button
        variant="ghost"
        className="w-full"
        onClick={async () => {
          if (!confirm(`Supprimer la chambre ${room.number} ? Cette action est irréversible.`)) return
          await supabase.from('hotel_rooms').delete().eq('id', room.id)
          setShowEdit(false)
          onUpdate()
        }}
      >
        <span className="text-terracotta-500">Supprimer cette chambre</span>
      </Button>
    </div>
  </Modal>
</div>
    <Link href={`/chambres/${room.id}`}>
      <div className="rounded-2xl border-2 border-cream-200 bg-white p-4 flex flex-col gap-2 active:scale-[0.97] transition-all">
  <span className="font-display font-bold text-3xl text-gray-800">{room.number}</span>
  <span className="text-xs text-gray-400 font-body">{room.zone}</span>
</div>
    </Link>
  )
}

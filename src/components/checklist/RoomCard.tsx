import Link from 'next/link'
import { Room, RoomStatus, ROOM_STATUS_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<RoomStatus, string> = {
  a_faire: 'border-terracotta-300 bg-terracotta-400/5',
  en_cours: 'border-sage-400 bg-sage-400/5',
  termine: 'border-green-300 bg-green-50',
  bloque: 'border-red-300 bg-red-50',
}

const STATUS_DOT: Record<RoomStatus, string> = {
  a_faire: 'bg-terracotta-400',
  en_cours: 'bg-sage-500',
  termine: 'bg-green-400',
  bloque: 'bg-red-400',
}

interface Props {
  room: Room
  onUpdate: () => void
}

export function RoomCard({ room, onUpdate }: Props) {
  return (
    <Link href={`/chambres/${room.id}`}>
      <div className={cn(
        'rounded-2xl border-2 p-4 flex flex-col gap-3 active:scale-[0.97] transition-all',
        STATUS_STYLES[room.status]
      )}>
        {/* Numéro + statut dot */}
        <div className="flex items-start justify-between">
          <span className="font-display font-bold text-3xl text-gray-800">
            {room.number}
          </span>
          <span className={cn('w-3 h-3 rounded-full mt-1', STATUS_DOT[room.status])} />
        </div>

        {/* Étage */}
        <span className="text-xs text-gray-400 font-body">Étage {room.floor}</span>

        {/* Statut */}
        <span className={cn(
          'text-xs font-body font-semibold px-2 py-1 rounded-full self-start',
          room.status === 'termine' ? 'bg-green-100 text-green-700' :
          room.status === 'en_cours' ? 'bg-sage-400/20 text-sage-700' :
          room.status === 'bloque' ? 'bg-red-100 text-red-700' :
          'bg-terracotta-400/20 text-terracotta-600'
        )}>
          {ROOM_STATUS_LABELS[room.status]}
        </span>
      </div>
    </Link>
  )
}

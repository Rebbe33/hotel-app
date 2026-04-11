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
      <div className="rounded-2xl border-2 border-cream-200 bg-white p-4 flex flex-col gap-2 active:scale-[0.97] transition-all">
  <span className="font-display font-bold text-3xl text-gray-800">{room.number}</span>
  <span className="text-xs text-gray-400 font-body">Étage {room.floor}</span>
  <span className="text-xs text-gray-500 font-body">{room.type}</span>
</div>
    </Link>
  )
}

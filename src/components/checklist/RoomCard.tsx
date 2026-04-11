import Link from 'next/link'
import { cn } from '@/lib/utils'

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

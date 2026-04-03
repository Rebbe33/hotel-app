import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, BedDouble, MoreVertical } from 'lucide-react'
import { Room, RoomStatus, CleanType, CLEAN_TYPE_LABELS, ROOM_STATUS_LABELS } from '@/types'
import { supabase } from '@/lib/supabase'
import { Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

const STATUS_BADGE: Record<RoomStatus, string> = {
  a_faire: 'terra',
  en_cours: 'sage',
  termine: 'cream',
  bloque: 'urgent',
}

const CLEAN_TYPE_BADGE: Record<CleanType, string> = {
  recouche: 'cream',
  blanc: 'sage',
  blanc_total: 'terra',
}

interface Props {
  room: Room
  onUpdate: () => void
}

export function RoomCard({ room, onUpdate }: Props) {
  const [showMenu, setShowMenu] = useState(false)

  const updateStatus = async (status: RoomStatus) => {
    await supabase.from('hotel_rooms').update({ status }).eq('id', room.id)
    setShowMenu(false)
    onUpdate()
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center">
        {/* Color strip by clean type */}
        <div className={cn(
          'w-1.5 self-stretch flex-shrink-0',
          room.clean_type === 'recouche' ? 'bg-linen' :
          room.clean_type === 'blanc' ? 'bg-sage-400' : 'bg-terracotta-400'
        )} />

        <Link href={`/chambres/${room.id}`} className="flex-1 flex items-center px-4 py-3 gap-3">
          <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-sage-700 text-sm">{room.number}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-body font-semibold text-gray-800">Chambre {room.number}</span>
              <Badge variant={CLEAN_TYPE_BADGE[room.clean_type] as any} className="text-[10px]">
                {CLEAN_TYPE_LABELS[room.clean_type]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={STATUS_BADGE[room.status] as any} className="text-[10px]">
                {ROOM_STATUS_LABELS[room.status]}
              </Badge>
              <span className="text-xs text-gray-400 font-body">Étage {room.floor}</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
        </Link>

        {/* Quick status menu */}
        <div className="relative pr-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg text-gray-400 active:bg-cream-100"
          >
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 z-20 bg-white rounded-xl shadow-card border border-cream-200 overflow-hidden min-w-[150px]">
                {(['a_faire', 'en_cours', 'termine', 'bloque'] as RoomStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm font-body transition-colors',
                      room.status === s ? 'bg-cream-100 font-semibold text-sage-700' : 'hover:bg-cream-50'
                    )}
                  >
                    {ROOM_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

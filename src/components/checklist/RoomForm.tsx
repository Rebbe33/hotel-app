import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui'
import { CleanType, CLEAN_TYPE_LABELS } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  onSaved: () => void
  initialData?: {
    id: string
    number: string
    zone: string
    notes: string | null
    nb_personnes: number
    nb_lits: number
    places_par_lit: number
  }
}


export function RoomForm({ onSaved, initialData }: Props) {
  const [number, setNumber] = useState(initialData?.number ?? '')
  const [zone, setZone] = useState(initialData?.zone ?? 'RDC')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [nbPersonnes, setNbPersonnes] = useState(initialData?.nb_personnes?.toString() ?? '1')
const [nbLits, setNbLits] = useState(initialData?.nb_lits?.toString() ?? '1')
const [placesParLit, setPlacesParLit] = useState(initialData?.places_par_lit?.toString() ?? '1')

  const handleSubmit = async () => {
    if (!number.trim()) return
    setSaving(true)
    const payload = { number: number.trim(),
  zone,
  notes,
  nb_personnes: parseInt(nbPersonnes) || 1,
  nb_lits: parseInt(nbLits) || 1,
  places_par_lit: parseInt(placesParLit) || 1, }
    if (initialData?.id) {
      await supabase.from('hotel_rooms').update(payload).eq('id', initialData.id)
    } else {
      await supabase.from('hotel_rooms').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Numéro de chambre *</label>
        <input
          type="text"
          value={number}
          onChange={e => setNumber(e.target.value)}
          placeholder="ex: 101"
          className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400"
        />
      </div>
<div>
  <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Zone</label>
  <div className="grid grid-cols-3 gap-2">
    {['RDC', 'B1', 'B2', 'Annexe RDC', 'Annexe 1er'].map(z => (
      <button key={z} onClick={() => setZone(z)}
        className={cn('py-2 rounded-xl text-xs font-body font-semibold border transition-all',
          zone === z ? 'bg-sage-600 text-white border-sage-600' : 'bg-cream-50 text-gray-600 border-cream-200')}>
        {z}
      </button>
    ))}
  </div>
</div>
      <div className="grid grid-cols-3 gap-3">
  <div>
    <label className="block text-xs font-body font-semibold text-gray-700 mb-1">Personnes</label>
    <input type="number" value={nbPersonnes} onChange={e => setNbPersonnes(e.target.value)} min={1}
      className="w-full px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
  </div>
  <div>
    <label className="block text-xs font-body font-semibold text-gray-700 mb-1">Nb lits</label>
    <input type="number" value={nbLits} onChange={e => setNbLits(e.target.value)} min={1}
      className="w-full px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
  </div>
  <div>
    <label className="block text-xs font-body font-semibold text-gray-700 mb-1">Places/lit</label>
    <input type="number" value={placesParLit} onChange={e => setPlacesParLit(e.target.value)} min={1}
      className="w-full px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
  </div>
</div>
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Informations particulières..."
          className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400 resize-none"
        />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={saving || !number.trim()}>
        {saving ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Ajouter la chambre'}
      </Button>
    </div>
  )
}

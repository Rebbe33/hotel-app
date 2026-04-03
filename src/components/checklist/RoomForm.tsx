import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui'
import { CleanType, CLEAN_TYPE_LABELS } from '@/types'

interface Props {
  onSaved: () => void
  initialData?: {
    id: string
    number: string
    floor: number
    type: string
    notes: string
    nb_personnes: number
    nb_lits: number
    places_par_lit: number
  }
}


export function RoomForm({ onSaved, initialData }: Props) {
  const [number, setNumber] = useState(initialData?.number ?? '')
  const [floor, setFloor] = useState(initialData?.floor?.toString() ?? '1')
  const [type, setType] = useState(initialData?.type ?? 'standard')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [nbPersonnes, setNbPersonnes] = useState(initialData?.nb_personnes?.toString() ?? '1')
const [nbLits, setNbLits] = useState(initialData?.nb_lits?.toString() ?? '1')
const [placesParLit, setPlacesParLit] = useState(initialData?.places_par_lit?.toString() ?? '1')

  const handleSubmit = async () => {
    if (!number.trim()) return
    setSaving(true)
    const payload = { number: number.trim(),
  floor: parseInt(floor),
  type,
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Étage</label>
          <input
            type="number"
            value={floor}
            onChange={e => setFloor(e.target.value)}
            min={0}
            className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400"
          />
        </div>
        <div>
          <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400"
          >
            <option value="standard">Standard</option>
            <option value="suite">Suite</option>
            <option value="duplex">Duplex</option>
          </select>
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
        <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Type de nettoyage</label>
        <div className="grid grid-cols-3 gap-2">
          {(['recouche', 'blanc', 'blanc_total'] as CleanType[]).map(ct => (
            <button
              key={ct}
              onClick={() => setCleanType(ct)}
              className={`py-2 rounded-xl text-xs font-body font-semibold border transition-all ${
                cleanType === ct
                  ? 'bg-sage-600 text-white border-sage-600'
                  : 'bg-cream-50 text-gray-600 border-cream-200'
              }`}
            >
              {CLEAN_TYPE_LABELS[ct]}
            </button>
          ))}
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

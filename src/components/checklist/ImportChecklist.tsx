import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui'
import { ChecklistCategory, CleanType } from '@/types'

interface Props {
  onImported: () => void
}

export function ImportChecklist({ onImported }: Props) {
  const [preview, setPreview] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws)
    // Colonnes attendues : label, category, clean_types (séparés par virgule), order_index
    const parsed = rows.map((r, i) => ({
      label: r.label || r.tache || r.nom || '',
      category: (r.category || r.categorie || 'chambre') as ChecklistCategory,
      clean_types: String(r.clean_types || r.types || 'recouche,blanc,blanc_total')
        .split(',').map(s => s.trim()) as CleanType[],
      is_blanc_total: String(r.clean_types || '').includes('blanc_total') &&
        !String(r.clean_types || '').includes('recouche') &&
        !String(r.clean_types || '').includes('blanc'),
      order_index: parseInt(r.order_index) || (100 + i),
    })).filter(r => r.label)
    setPreview(parsed)
    e.target.value = ''
  }

  const handleImport = async () => {
    if (!preview.length) return
    setSaving(true)
    const { error } = await supabase.from('hotel_checklist_items').insert(preview)
    if (error) setError(error.message)
    else { setPreview([]); onImported() }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-cream-100 rounded-xl p-3 text-xs font-body text-gray-600 space-y-1">
        <p className="font-semibold">Format du fichier Excel attendu :</p>
        <p>Colonnes : <code>label</code> · <code>category</code> · <code>clean_types</code> · <code>order_index</code></p>
        <p>category : <code>chambre</code>, <code>salle_de_bain</code>, <code>entree</code>, <code>general</code></p>
        <p>clean_types : valeurs séparées par virgule ex: <code>recouche,blanc</code></p>
      </div>

      <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-cream-200 rounded-xl cursor-pointer active:bg-cream-50">
        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        <span className="text-sm font-body text-gray-500">📂 Choisir un fichier .xlsx</span>
      </label>

      {error && <p className="text-xs text-red-500 font-body">{error}</p>}

      {preview.length > 0 && (
        <>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {preview.map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-cream-50 rounded-lg">
                <span className="text-xs font-body text-gray-700 flex-1">{item.label}</span>
                <span className="text-[10px] text-gray-400 font-body">{item.category}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-sage-600 font-body font-semibold text-center">
            {preview.length} tâche{preview.length > 1 ? 's' : ''} prête{preview.length > 1 ? 's' : ''} à importer
          </p>
          <Button className="w-full" onClick={handleImport} disabled={saving}>
            {saving ? 'Import en cours...' : `Importer ${preview.length} tâches`}
          </Button>
        </>
      )}
    </div>
  )
}

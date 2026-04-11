import { useState } from 'react'
import { Trash2, Plus, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ChecklistItem, ChecklistCategory, CleanType, CATEGORY_LABELS, CLEAN_TYPE_LABELS } from '@/types'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

interface Props {
  roomId: string
  items: ChecklistItem[]
  onUpdate: () => void
}

export function GestionTaches({ roomId, items, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false)

  const deleteItem = async (itemId: string) => {
    if (!confirm('Supprimer cette tâche ?')) return
    await supabase.from('hotel_checklist_items').delete().eq('id', itemId)
    onUpdate()
  }

  const handleXlsxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws)
    const toInsert = rows
      .filter(r => r.label || r.tache || r.nom)
      .map((r, i) => ({
        label: r.label || r.tache || r.nom,
        category: r.category || r.categorie || 'chambre',
        clean_types: String(r.clean_types || 'recouche,blanc,blanc_total')
          .split(',').map((s: string) => s.trim()),
        is_blanc_total: false,
        order_index: parseInt(r.order_index) || (items.length + i + 1),
        room_id: roomId,
      }))
    await supabase.from('hotel_checklist_items').insert(toInsert)
    onUpdate()
    e.target.value = ''
  }

  // Grouper par catégorie pour l'affichage
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<ChecklistCategory, ChecklistItem[]>)

  return (
    <div className="space-y-4">

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> Ajouter une tâche
        </Button>
        <label className="flex-1 cursor-pointer">
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleXlsxImport} />
          <span className="flex items-center justify-center gap-1 w-full py-2 px-3 bg-cream-200 text-sage-700 border border-linen rounded-xl text-sm font-body font-semibold active:bg-linen">
            <Upload size={14} /> Importer xlsx
          </span>
        </label>
      </div>

      {/* Formulaire ajout rapide */}
      {showForm && (
        <AjoutTacheForm
          roomId={roomId}
          orderIndex={items.length + 1}
          onSaved={() => { setShowForm(false); onUpdate() }}
        />
      )}

      {/* Liste des tâches existantes par catégorie */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat}>
          <h3 className="text-xs font-body font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {CATEGORY_LABELS[cat as ChecklistCategory]}
          </h3>
          <Card className="overflow-hidden divide-y divide-cream-100">
            {catItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body text-gray-700 truncate">{item.label}</p>
                  <p className="text-[10px] text-gray-400 font-body mt-0.5">
                    {item.clean_types.join(' · ')}
                  </p>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 text-gray-300 active:text-terracotta-500 flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </Card>
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-center text-sm text-gray-400 font-body py-4">
          Aucune tâche pour cette chambre.<br />Ajoute-en ou importe un fichier xlsx.
        </p>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Plus, Play, Upload, Edit2, Trash2, WashingMachine, Timer } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { LaundryProgram, LaundrySession } from '@/types'
import { PageHeader, Card, Button, Modal, Badge } from '@/components/ui'
import { TimerRing } from '@/components/laundry/TimerRing'
import { useLaundryTimer } from '@/hooks/useLaundryTimer'
import { formatDuration, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const MACHINE_ICONS: Record<string, string> = {
  laveuse: '🫧',
  sécheuse: '🌀',
  repasseuse: '♨️',
}

export default function LingeriePage() {
  const [programs, setPrograms] = useState<LaundryProgram[]>([])
  const [activeSessions, setActiveSessions] = useState<LaundrySession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editProgram, setEditProgram] = useState<LaundryProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const { timers, addTimer, removeTimer } = useLaundryTimer()

  const fetchData = async () => {
    const [{ data: progData }, { data: sessData }] = await Promise.all([
      supabase.from('hotel_laundry_programs').select('*').order('order_index'),
      supabase.from('hotel_laundry_sessions').select('*').eq('completed', false).order('started_at', { ascending: false }),
    ])
    if (progData) setPrograms(progData)
    if (sessData) {
      setActiveSessions(sessData)
      // Re-attach timers for active sessions
      sessData.forEach((s: LaundrySession) => {
        addTimer(s.id, s.program_name, new Date(s.ends_at))
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const startTimer = async (prog: LaundryProgram) => {
    const now = new Date()
    const endsAt = new Date(now.getTime() + prog.duration_minutes * 60000)
    const { data } = await supabase.from('hotel_laundry_sessions').insert({
      program_id: prog.id,
      program_name: prog.name,
      duration_minutes: prog.duration_minutes,
      ends_at: endsAt.toISOString(),
    }).select().single()
    if (data) {
      setActiveSessions(prev => [data, ...prev])
      addTimer(data.id, data.program_name, endsAt)
    }
  }

  const stopTimer = async (sessionId: string) => {
    await supabase.from('hotel_laundry_sessions').update({ completed: true }).eq('id', sessionId)
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
    removeTimer(sessionId)
  }

  // Import from XLSX
  const handleXlsxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws)
    // Expected columns: nom, machine, duree_minutes, temperature, notes
    const toInsert = rows.map((r, i) => ({
      name: r.nom || r.name || `Programme ${i + 1}`,
      machine: r.machine || 'laveuse',
      duration_minutes: parseInt(r.duree_minutes || r.duration_minutes || '30'),
      temperature: r.temperature || null,
      notes: r.notes || null,
      order_index: (programs.length + i),
    }))
    await supabase.from('hotel_laundry_programs').insert(toInsert)
    fetchData()
    e.target.value = ''
  }

  const machineGroups = programs.reduce((acc, p) => {
    if (!acc[p.machine]) acc[p.machine] = []
    acc[p.machine].push(p)
    return acc
  }, {} as Record<string, LaundryProgram[]>)

  return (
    <>
      <PageHeader
        title="Lingerie"
        subtitle={`${programs.length} programmes · ${activeSessions.length} en cours`}
        action={
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleXlsxImport} />
              <span className="flex items-center gap-1 px-3 py-1.5 bg-cream-200 text-sage-700 border border-linen rounded-lg text-sm font-body font-semibold active:bg-linen">
                <Upload size={14} /> xlsx
              </span>
            </label>
            <Button size="sm" onClick={() => { setEditProgram(null); setShowForm(true) }}>
              <Plus size={16} />
            </Button>
          </div>
        }
      />

      {/* Active timers */}
      {timers.length > 0 && (
        <div className="px-5 mb-6">
          <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            En cours
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {timers.map(timer => (
              <Card key={timer.sessionId} className="p-4 flex-shrink-0 min-w-[160px] flex items-center justify-center">
                <TimerRing
                  secondsLeft={timer.secondsLeft}
                  totalSeconds={timer.totalSeconds}
                  programName={timer.programName}
                  size={130}
                  onStop={() => stopTimer(timer.sessionId)}
                />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Programs by machine */}
      <div className="px-5 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400 font-body">Chargement...</div>
        ) : Object.keys(machineGroups).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🧺</div>
            <p className="text-gray-400 font-body text-sm">Aucun programme. Ajoutez-en ou importez un fichier xlsx.</p>
          </div>
        ) : (
          Object.entries(machineGroups).map(([machine, progs]) => (
            <div key={machine}>
              <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {MACHINE_ICONS[machine] || '🔧'} {machine.charAt(0).toUpperCase() + machine.slice(1)}
              </h2>
              <div className="space-y-2">
                {progs.map(prog => {
                  const isRunning = timers.some(t => !t.completed && activeSessions.find(s => s.id === t.sessionId && s.program_id === prog.id))
                  return (
                    <Card key={prog.id} className="overflow-hidden">
                      <div className="flex items-center px-4 py-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-sm text-gray-800">{prog.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 font-body">⏱ {formatDuration(prog.duration_minutes)}</span>
                            {prog.temperature && <span className="text-xs text-gray-400 font-body">🌡 {prog.temperature}</span>}
                          </div>
                          {prog.notes && <p className="text-xs text-gray-400 font-body mt-0.5 truncate">{prog.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => { setEditProgram(prog); setShowForm(true) }}
                            className="p-2 text-gray-400 active:text-gray-600">
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => startTimer(prog)}
                            disabled={isRunning}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-body font-semibold transition-all',
                              isRunning
                                ? 'bg-cream-200 text-gray-400 cursor-not-allowed'
                                : 'bg-sage-600 text-white active:bg-sage-700'
                            )}
                          >
                            <Play size={14} fill="currentColor" />
                            {isRunning ? 'En cours' : 'Lancer'}
                          </button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editProgram ? 'Modifier le programme' : 'Nouveau programme'}
      >
        <ProgramForm
          program={editProgram}
          onSaved={() => { setShowForm(false); fetchData() }}
        />
      </Modal>
    </>
  )
}

// ── Program Form ─────────────────────────────────────────────
function ProgramForm({ program, onSaved }: { program: LaundryProgram | null; onSaved: () => void }) {
  const [name, setName] = useState(program?.name ?? '')
  const [machine, setMachine] = useState(program?.machine ?? 'laveuse')
  const [hours, setHours] = useState(Math.floor((program?.duration_minutes ?? 60) / 60).toString())
  const [minutes, setMinutes] = useState(((program?.duration_minutes ?? 60) % 60).toString())
  const [temperature, setTemperature] = useState(program?.temperature ?? '')
  const [notes, setNotes] = useState(program?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0)

  const handleSubmit = async () => {
    if (!name.trim() || totalMinutes <= 0) return
    setSaving(true)
    const payload = { name: name.trim(), machine, duration_minutes: totalMinutes, temperature: temperature || null, notes: notes || null }
    if (program?.id) {
      await supabase.from('hotel_laundry_programs').update(payload).eq('id', program.id)
    } else {
      await supabase.from('hotel_laundry_programs').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  const handleDelete = async () => {
    if (!program?.id || !confirm('Supprimer ce programme ?')) return
    await supabase.from('hotel_laundry_programs').delete().eq('id', program.id)
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Nom *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Draps coton"
          className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
      </div>
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Machine</label>
        <div className="grid grid-cols-3 gap-2">
          {['laveuse', 'sécheuse', 'repasseuse'].map(m => (
            <button key={m} onClick={() => setMachine(m)}
              className={cn('py-2 rounded-xl text-xs font-body font-semibold border transition-all',
                machine === m ? 'bg-sage-600 text-white border-sage-600' : 'bg-cream-50 text-gray-600 border-cream-200')}>
              {MACHINE_ICONS[m]} {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Durée</label>
        <div className="flex items-center gap-2">
          <input type="number" value={hours} onChange={e => setHours(e.target.value)} min={0} max={5}
            className="w-20 px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body text-center focus:outline-none focus:border-sage-400" />
          <span className="text-sm text-gray-500 font-body">h</span>
          <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} min={0} max={59}
            className="w-20 px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body text-center focus:outline-none focus:border-sage-400" />
          <span className="text-sm text-gray-500 font-body">min</span>
          <span className="text-sm text-sage-700 font-body font-semibold ml-2">= {formatDuration(totalMinutes)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-body font-semibold text-gray-700 mb-1">Température</label>
          <input value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="ex: 60°C"
            className="w-full px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
        </div>
        <div>
          <label className="block text-xs font-body font-semibold text-gray-700 mb-1">Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
        </div>
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={saving || !name.trim() || totalMinutes <= 0}>
        {saving ? 'Enregistrement...' : program ? 'Mettre à jour' : 'Ajouter le programme'}
      </Button>
      {program && (
        <Button className="w-full" variant="ghost" onClick={handleDelete}>
          <span className="text-terracotta-500">Supprimer ce programme</span>
        </Button>
      )}
    </div>
  )
}

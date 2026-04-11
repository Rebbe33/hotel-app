import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, AlertCircle, Flag, Home, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Task, Room, TaskPriority, TaskStatus, TASK_PRIORITY_LABELS } from '@/types'
import { PageHeader, Card, Button, Badge, Modal } from '@/components/ui'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  basse: 'text-gray-400',
  normale: 'text-blue-400',
  haute: 'text-amber-500',
  urgente: 'text-red-500',
}

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  basse: 'cream',
  normale: 'cream',
  haute: 'terra',
  urgente: 'urgent',
}

type ViewMode = 'globales' | 'par_chambre'

export default function TachesPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('globales')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'tous'>('tous')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    const [{ data: taskData }, { data: roomData }] = await Promise.all([
      supabase.from('hotel_tasks').select('*').order('priority', { ascending: false }).order('created_at'),
      supabase.from('hotel_rooms').select('id, number, floor').order('number'),
    ])
    if (taskData) setTasks(taskData)
    if (roomData) setRooms(roomData as Room[])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const toggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'termine' ? 'a_faire' : 'termine'
    await supabase.from('hotel_tasks').update({
      status: newStatus,
      completed_at: newStatus === 'termine' ? new Date().toISOString() : null,
    }).eq('id', task.id)
    fetchAll()
  }

  // Filter tasks
  const globalTasks = tasks.filter(t => t.room_id === null)
  const roomTasks = tasks.filter(t => t.room_id !== null)

  const displayTasks = (viewMode === 'globales' ? globalTasks : roomTasks)
    .filter(t => filterStatus === 'tous' || t.status === filterStatus)

  const pending = tasks.filter(t => t.status !== 'termine').length
  const urgent = tasks.filter(t => t.priority === 'urgente' && t.status !== 'termine').length

  // Group per-room tasks by room
  const roomGroups = rooms.reduce((acc, room) => {
    const roomTaskList = roomTasks.filter(t =>
      t.room_id === room.id &&
      (filterStatus === 'tous' || t.status === filterStatus)
    )
    if (roomTaskList.length > 0) acc[room.id] = { room, tasks: roomTaskList }
    return acc
  }, {} as Record<string, { room: Room; tasks: Task[] }>)

  return (
    <>
      <PageHeader
        title="Tâches"
        subtitle={`${pending} en attente${urgent > 0 ? ` · ${urgent} urgentes` : ''}`}
        action={
          <Button size="sm" onClick={() => { setEditTask(null); setShowForm(true) }}>
            <Plus size={16} /> Ajouter
          </Button>
        }
      />

      {/* View mode toggle */}
      <div className="px-5 mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('globales')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-body font-semibold border transition-all',
            viewMode === 'globales' ? 'bg-sage-600 text-white border-sage-600' : 'bg-white text-gray-600 border-cream-200'
          )}
        >
          <Globe size={16} /> Globales ({globalTasks.length})
        </button>
        <button
          onClick={() => setViewMode('par_chambre')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-body font-semibold border transition-all',
            viewMode === 'par_chambre' ? 'bg-sage-600 text-white border-sage-600' : 'bg-white text-gray-600 border-cream-200'
          )}
        >
          <Home size={16} /> Par chambre ({roomTasks.length})
        </button>
      </div>

      {/* Status filter */}
      <div className="px-5 mb-4 flex gap-2">
        {(['tous', 'a_faire', 'en_cours', 'termine'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-semibold border transition-all',
              filterStatus === s ? 'bg-sage-600 text-white border-sage-600' : 'bg-white text-gray-600 border-cream-200'
            )}
          >
            {s === 'tous' ? 'Toutes' : s === 'a_faire' ? 'À faire' : s === 'en_cours' ? 'En cours' : 'Terminées'}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400 font-body">Chargement...</div>
        ) : viewMode === 'globales' ? (
          // Global tasks flat list
          displayTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-body">Aucune tâche globale</div>
          ) : (
            displayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleStatus(task)}
                onEdit={() => { setEditTask(task); setShowForm(true) }}
              />
            ))
          )
        ) : (
          // Per-room grouped
          Object.keys(roomGroups).length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-body">Aucune tâche par chambre</div>
          ) : (
            Object.values(roomGroups).map(({ room, tasks: rt }) => (
              <div key={room.id}>
                <h3 className="font-display text-sm font-semibold text-gray-500 mb-2">
                  🛏 Chambre {room.number}
                  <span className="text-xs font-body font-normal text-gray-400 ml-2">Étage {room.floor}</span>
                </h3>
                <div className="space-y-2">
                  {rt.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => toggleStatus(task)}
                      onEdit={() => { setEditTask(task); setShowForm(true) }}
                    />
                  ))}
                </div>
              </div>
            ))
          )
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editTask ? 'Modifier la tâche' : 'Nouvelle tâche'}>
        <TaskForm task={editTask} rooms={rooms} onSaved={() => { setShowForm(false); fetchAll() }} />
      </Modal>
    </>
  )
}

// ── Task Card ─────────────────────────────────────────────────
function TaskCard({ task, onToggle, onEdit }: { task: Task; onToggle: () => void; onEdit: () => void }) {
  const done = task.status === 'termine'
  return (
    <Card className={cn('overflow-hidden', done ? 'opacity-60' : '')}>
      <div className="flex items-start gap-3 px-4 py-3">
        <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
          {done
            ? <CheckCircle2 size={22} className="text-sage-500" />
            : <Circle size={22} className={PRIORITY_COLOR[task.priority]} />
          }
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('font-body text-sm font-semibold', done ? 'line-through text-gray-400' : 'text-gray-800')}>
              {task.title}
            </p>
            <button onClick={onEdit} className="text-xs text-gray-400 font-body underline flex-shrink-0">
              Modifier
            </button>
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 font-body mt-0.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.priority !== 'normale' && (
              <Badge variant={PRIORITY_BADGE[task.priority] as any} className="text-[10px]">
                <Flag size={9} className="mr-1" /> {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>
            )}
            {task.due_date && (
              <span className={cn('text-[10px] font-body', new Date(task.due_date) < new Date() && !done ? 'text-terracotta-500 font-semibold' : 'text-gray-400')}>
                📅 {format(new Date(task.due_date), 'd MMM', { locale: fr })}
              </span>
            )}
            {done && task.completed_at && (
              <span className="text-[10px] text-gray-400 font-body">
                ✓ {format(new Date(task.completed_at), 'd MMM', { locale: fr })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Task Form ─────────────────────────────────────────────────
function TaskForm({ task, rooms, onSaved }: { task: Task | null; rooms: Room[]; onSaved: () => void }) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'normale')
  const [roomId, setRoomId] = useState<string>(task?.room_id ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    const payload = {
      title: title.trim(),
      description: description || null,
      priority,
      room_id: roomId || null,
      due_date: dueDate || null,
    }
    if (task?.id) {
      await supabase.from('hotel_tasks').update(payload).eq('id', task.id)
    } else {
      await supabase.from('hotel_tasks').insert({ ...payload, status: 'a_faire' })
    }
    setSaving(false)
    onSaved()
  }

  const handleDelete = async () => {
    if (!task?.id || !confirm('Supprimer cette tâche ?')) return
    await supabase.from('hotel_tasks').delete().eq('id', task.id)
    onSaved()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Titre *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="ex: Changer l'ampoule du couloir"
          className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
      </div>
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400 resize-none" />
      </div>
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-2">Priorité</label>
        <div className="grid grid-cols-4 gap-2">
          {(['basse', 'normale', 'haute', 'urgente'] as TaskPriority[]).map(p => (
            <button key={p} onClick={() => setPriority(p)}
              className={cn('py-2 rounded-xl text-xs font-body font-semibold border transition-all',
                priority === p ? 'bg-sage-600 text-white border-sage-600' : 'bg-cream-50 text-gray-600 border-cream-200')}>
              {TASK_PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Chambre (optionnel)</label>
        <select value={roomId} onChange={e => setRoomId(e.target.value)}
          className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400">
          <option value="">Tâche globale (pas de chambre)</option>
          {rooms.map(r => <option key={r.id} value={r.id}>Chambre {r.number} (étage {r.floor})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-body font-semibold text-gray-700 mb-1">Échéance</label>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          className="w-full px-4 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-body focus:outline-none focus:border-sage-400" />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={saving || !title.trim()}>
        {saving ? 'Enregistrement...' : task ? 'Mettre à jour' : 'Ajouter la tâche'}
      </Button>
      {task && (
        <Button className="w-full" variant="ghost" onClick={handleDelete}>
          <span className="text-terracotta-500">Supprimer cette tâche</span>
        </Button>
      )}
    </div>
  )
}

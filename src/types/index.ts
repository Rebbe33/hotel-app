export type CleanType = 'recouche' | 'blanc' | 'blanc_total'
export type RoomStatus = 'a_faire' | 'en_cours' | 'termine' | 'bloque'
export type TaskPriority = 'basse' | 'normale' | 'haute' | 'urgente'
export type TaskStatus = 'a_faire' | 'en_cours' | 'termine'
export type StockCategory = 'linge' | 'produits' | 'amenities' | 'autre'
export type ChecklistCategory = 'salle_de_bain' | 'chambre' | 'entree' | 'general'

export interface RoomBlancTotal {
  id: string
  room_id: string
  checklist_item_id: string
  checked_at: string
}

export interface Room {
  id: string
  number: string
  floor: number
  type: string
  status: RoomStatus
  nb_personnes: number      // ← ajouter
  nb_lits: number           // ← ajouter
  places_par_lit: number    // ← ajouter
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  label: string
  category: ChecklistCategory
  clean_types: CleanType[]
  is_blanc_total: boolean
  order_index: number
  created_at: string
}

export interface RoomSession {
  id: string
  room_id: string
  clean_type: CleanType
  started_at: string
  completed_at: string | null
  visit_number: number
  notes: string | null
}

export interface SessionCheck {
  id: string
  session_id: string
  checklist_item_id: string
  checked_at: string
}

export interface StockItem {
  id: string
  name: string
  category: StockCategory
  current_qty: number
  min_qty: number
  unit: string
  notes: string | null
  last_checked_at: string | null
  created_at: string
  updated_at: string
}

export interface StockReminder {
  id: string
  interval_days: number
  last_reminded_at: string
  next_reminder_at: string
  is_active: boolean
}

export interface LaundryProgram {
  id: string
  name: string
  machine: string
  duration_minutes: number
  temperature: string | null
  notes: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface LaundrySession {
  id: string
  program_id: string | null
  program_name: string
  duration_minutes: number
  started_at: string
  ends_at: string
  completed: boolean
  notes: string | null
}

export interface Task {
  id: string
  title: string
  description: string | null
  room_id: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// Labels français
export const CLEAN_TYPE_LABELS: Record<CleanType, string> = {
  recouche: 'Recouche',
  blanc: 'Blanc',
  blanc_total: 'Blanc Total',
}

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  termine: 'Terminée',
  bloque: 'Bloquée',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
}

export const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  entree: 'Entrée',
  chambre: 'Chambre',
  salle_de_bain: 'Salle de bain',
  general: 'Général',
}

export const STOCK_CATEGORY_LABELS: Record<StockCategory, string> = {
  linge: 'Linge',
  produits: 'Produits d\'entretien',
  amenities: 'Amenities',
  autre: 'Autre',
}

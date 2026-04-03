-- ============================================================
-- Migration : Hotel Housekeeping App
-- Préfixe : hotel_ (pour cohabiter avec un projet Supabase existant)
-- ============================================================

-- Chambres
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  floor INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'standard', -- standard, suite, duplex
  status TEXT NOT NULL DEFAULT 'a_faire', -- a_faire, en_cours, termine, bloque
  clean_type TEXT NOT NULL DEFAULT 'recouche', -- recouche, blanc, blanc_total
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items de checklist (catalogue)
CREATE TABLE IF NOT EXISTS hotel_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  category TEXT NOT NULL, -- salle_de_bain, chambre, entree, general
  clean_types TEXT[] NOT NULL DEFAULT '{recouche,blanc,blanc_total}', -- pour quels types de nettoyage
  is_blanc_total BOOLEAN DEFAULT false, -- tâche bonus blanc total
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Avancement checklist par chambre (session de nettoyage)
CREATE TABLE IF NOT EXISTS hotel_room_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,
  clean_type TEXT NOT NULL, -- recouche, blanc, blanc_total
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  visit_number INTEGER DEFAULT 1, -- numéro de passage (pour blanc total multi-passages)
  notes TEXT
);

-- Items cochés dans une session
CREATE TABLE IF NOT EXISTS hotel_session_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES hotel_room_sessions(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES hotel_checklist_items(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, checklist_item_id)
);

-- Stocks
CREATE TABLE IF NOT EXISTS hotel_stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- linge, produits, amenities, autre
  current_qty NUMERIC NOT NULL DEFAULT 0,
  min_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unité', -- unité, kg, L, rouleau...
  notes TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rappels de vérification stock
CREATE TABLE IF NOT EXISTS hotel_stock_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interval_days INTEGER NOT NULL DEFAULT 14,
  last_reminded_at TIMESTAMPTZ DEFAULT now(),
  next_reminder_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  is_active BOOLEAN DEFAULT true
);

-- Programmes machines de lingerie
CREATE TABLE IF NOT EXISTS hotel_laundry_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  machine TEXT NOT NULL DEFAULT 'laveuse', -- laveuse, sécheuse, repasseuse
  duration_minutes INTEGER NOT NULL,
  temperature TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions timer lingerie
CREATE TABLE IF NOT EXISTS hotel_laundry_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES hotel_laundry_programs(id) ON DELETE SET NULL,
  program_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT
);

-- Tâches globales et par chambre
CREATE TABLE IF NOT EXISTS hotel_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  room_id UUID REFERENCES hotel_rooms(id) ON DELETE CASCADE, -- NULL = tâche globale
  priority TEXT NOT NULL DEFAULT 'normale', -- basse, normale, haute, urgente
  status TEXT NOT NULL DEFAULT 'a_faire', -- a_faire, en_cours, termine
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Données initiales - Items de checklist
-- ============================================================

-- Recouche (nettoyage quotidien)
INSERT INTO hotel_checklist_items (label, category, clean_types, order_index) VALUES
  -- Entrée
  ('Vérifier la porte et serrure', 'entree', '{recouche,blanc,blanc_total}', 1),
  ('Vider la poubelle de l''entrée', 'entree', '{recouche,blanc,blanc_total}', 2),
  -- Chambre
  ('Aérer la chambre', 'chambre', '{recouche,blanc,blanc_total}', 10),
  ('Faire le lit (recouche)', 'chambre', '{recouche}', 11),
  ('Changer draps et taies (blanc)', 'chambre', '{blanc,blanc_total}', 12),
  ('Aspirer/balayer le sol', 'chambre', '{recouche,blanc,blanc_total}', 13),
  ('Dépoussiérer les meubles', 'chambre', '{recouche,blanc,blanc_total}', 14),
  ('Nettoyer les vitres', 'chambre', '{blanc,blanc_total}', 15),
  ('Vider corbeille', 'chambre', '{recouche,blanc,blanc_total}', 16),
  ('Réapprovisionner minibar/boissons', 'chambre', '{recouche,blanc,blanc_total}', 17),
  ('Vérifier télécommandes/guides', 'chambre', '{recouche,blanc,blanc_total}', 18),
  ('Nettoyer les interrupteurs', 'chambre', '{blanc,blanc_total}', 19),
  ('Vérifier l''éclairage', 'chambre', '{blanc,blanc_total}', 20),
  -- Salle de bain
  ('Nettoyer le lavabo', 'salle_de_bain', '{recouche,blanc,blanc_total}', 30),
  ('Nettoyer la baignoire/douche', 'salle_de_bain', '{recouche,blanc,blanc_total}', 31),
  ('Nettoyer les toilettes', 'salle_de_bain', '{recouche,blanc,blanc_total}', 32),
  ('Nettoyer le miroir', 'salle_de_bain', '{recouche,blanc,blanc_total}', 33),
  ('Changer les serviettes', 'salle_de_bain', '{recouche,blanc,blanc_total}', 34),
  ('Réapprovisionner amenities', 'salle_de_bain', '{recouche,blanc,blanc_total}', 35),
  ('Nettoyer le sol salle de bain', 'salle_de_bain', '{recouche,blanc,blanc_total}', 36),
  ('Désinfecter robinets/poignées', 'salle_de_bain', '{blanc,blanc_total}', 37),
  -- Blanc total (passages supplémentaires)
  ('Nettoyer derrière les meubles', 'chambre', '{blanc_total}', 50),
  ('Nettoyer sous le lit', 'chambre', '{blanc_total}', 51),
  ('Désinfecter téléphone', 'chambre', '{blanc_total}', 52),
  ('Nettoyer les rideaux/stores', 'chambre', '{blanc_total}', 53),
  ('Vérifier matelas (retourner si besoin)', 'chambre', '{blanc_total}', 54),
  ('Nettoyer placard et tiroirs', 'chambre', '{blanc_total}', 55),
  ('Détartrer robinets/pomme douche', 'salle_de_bain', '{blanc_total}', 56),
  ('Nettoyer joints de douche/bain', 'salle_de_bain', '{blanc_total}', 57),
  ('Nettoyer radiateur/chauffage', 'general', '{blanc_total}', 58),
  ('Nettoyer climatisation/ventilation', 'general', '{blanc_total}', 59)
ON CONFLICT DO NOTHING;

-- Programmes lingerie par défaut
INSERT INTO hotel_laundry_programs (name, machine, duration_minutes, temperature, notes, order_index) VALUES
  ('Draps coton', 'laveuse', 60, '60°C', 'Programme coton standard', 1),
  ('Serviettes', 'laveuse', 75, '60°C', 'Programme coton, essorage max', 2),
  ('Linge délicat', 'laveuse', 40, '30°C', 'Programme délicat', 3),
  ('Séchage draps', 'sécheuse', 50, 'Moyen', '', 4),
  ('Séchage serviettes', 'sécheuse', 40, 'Fort', '', 5),
  ('Repassage nappe', 'repasseuse', 20, NULL, 'Vitesse lente', 6)
ON CONFLICT DO NOTHING;

-- Rappel stock par défaut
INSERT INTO hotel_stock_reminders (interval_days, last_reminded_at, next_reminder_at)
VALUES (14, now(), now() + INTERVAL '14 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Fonctions utilitaires
-- ============================================================

-- Mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION hotel_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER hotel_rooms_updated_at
  BEFORE UPDATE ON hotel_rooms
  FOR EACH ROW EXECUTE FUNCTION hotel_update_updated_at();

CREATE OR REPLACE TRIGGER hotel_tasks_updated_at
  BEFORE UPDATE ON hotel_tasks
  FOR EACH ROW EXECUTE FUNCTION hotel_update_updated_at();

CREATE OR REPLACE TRIGGER hotel_stock_items_updated_at
  BEFORE UPDATE ON hotel_stock_items
  FOR EACH ROW EXECUTE FUNCTION hotel_update_updated_at();

-- ============================================================
-- RLS (Row Level Security) - désactivé par défaut, activer si auth
-- ============================================================
-- ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE hotel_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE hotel_stock_items ENABLE ROW LEVEL SECURITY;

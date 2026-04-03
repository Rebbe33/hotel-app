# 🏨 Guide de déploiement — Application Gouvernante

## Prérequis
- Compte GitHub ✅
- Compte Vercel ✅  
- Compte Supabase (projet existant) ✅

---

## Étape 1 — Supabase

### 1.1 Récupérer les clés API
1. Ouvre [supabase.com](https://supabase.com) → ton projet existant
2. Va dans **Settings → API**
3. Note :
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public key** → `eyJhbGci...`

### 1.2 Créer les tables
1. Va dans **SQL Editor** (menu gauche)
2. Clique **New query**
3. Copie tout le contenu du fichier `supabase/migrations/001_initial.sql`
4. Clique **Run** (▶️)
5. Tu verras apparaître toutes les tables `hotel_*` dans **Table Editor**

---

## Étape 2 — GitHub

### 2.1 Créer le dépôt
1. Va sur [github.com](https://github.com) → **New repository**
2. Nom : `hotel-gouvernante` (ou ce que tu veux)
3. Visibilité : **Private** recommandé
4. Clique **Create repository**

### 2.2 Pousser le code
Dans un terminal, depuis le dossier `hotel-app/` :

```bash
git init
git add .
git commit -m "Initial commit — application gouvernante"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/hotel-gouvernante.git
git push -u origin main
```

---

## Étape 3 — Vercel

### 3.1 Importer le projet
1. Va sur [vercel.com](https://vercel.com) → **Add New → Project**
2. Connecte ton compte GitHub si ce n'est pas fait
3. Sélectionne le dépôt `hotel-gouvernante`
4. Clique **Import**

### 3.2 Configurer les variables d'environnement
Avant de déployer, dans la section **Environment Variables**, ajoute :

| Clé | Valeur |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` |

### 3.3 Déployer
1. Clique **Deploy**
2. Attends ~2 minutes
3. 🎉 Ton app est en ligne sur `https://hotel-gouvernante.vercel.app`

---

## Étape 4 — Installer sur iPhone/Android

### iPhone (Safari)
1. Ouvre l'URL de l'app dans Safari
2. Appuie sur le bouton **Partager** (carré avec flèche)
3. Sélectionne **Sur l'écran d'accueil**
4. Nomme-la "Gouvernante" → **Ajouter**

### Android (Chrome)
1. Ouvre l'URL dans Chrome
2. Menu (⋮) → **Ajouter à l'écran d'accueil**

---

## Mises à jour

À chaque modification du code :
```bash
git add .
git commit -m "Description de la modification"
git push
```
Vercel re-déploie automatiquement en ~1 minute.

---

## Format d'import XLSX pour la lingerie

Le fichier Excel doit avoir ces colonnes (ligne 1 = en-têtes) :

| nom | machine | duree_minutes | temperature | notes |
|-----|---------|--------------|-------------|-------|
| Draps coton | laveuse | 60 | 60°C | Programme standard |
| Serviettes | laveuse | 75 | 60°C | Essorage max |
| Séchage draps | sécheuse | 50 | Moyen | |

Valeurs acceptées pour `machine` : `laveuse`, `sécheuse`, `repasseuse`

---

## Rappel des stocks

Par défaut, un rappel est configuré toutes les **2 semaines**.
Pour modifier l'intervalle, va dans **Supabase → Table Editor → hotel_stock_reminders** et change la valeur `interval_days`.

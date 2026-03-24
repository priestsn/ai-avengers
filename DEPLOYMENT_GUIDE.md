# Guida Deployment su Vercel

## Prerequisiti
- Account GitHub (repo già creato: priestsn/ai-avengers)
- Account Vercel (gratuito)
- **Neon Postgres database** (via Vercel Marketplace)

## Passi per il deployment

### 1. Configurare Neon Postgres (una volta sola)
1. Accedi a https://vercel.com/dashboard
2. Vai su "Storage" → "Create Database"
3. Seleziona **"Neon"** dal Marketplace (Vercel Postgres è deprecato)
4. Segui il setup Neon (crea progetto/database)
5. Una volta creato, il connection string sarà auto-aggiunto come `DATABASE_URL` nelle environment variables di Vercel

### 2. Inizializzare il database
1. Nel dashboard Neon, vai al tuo progetto
2. Clicca "SQL Editor"
3. Copia il contenuto di `schema.sql` da questo repository
4. Incolla ed esegui
   - Questo creerà le tabelle `positions` e `applications` con i dati di default

### 3. Deployare su Vercel
```bash
# Se non ancora fatto, aggiungi il remote Vercel (opzionale)
# Vercel lo fa automaticamente da GitHub

# Push il codice aggiornato
git add -A
git commit -m "Deploy: rinomina Lia → Harid AI + aggiunge database Postgres"
git push origin main
```

Vercel auto-triggererà il deploy dal repo GitHub. Aspetta il completamento (vedi dashboard).

### 4. Verificare il deployment
1. Accedi all'URL pubblica fornita da Vercel (es. `harid-ai.vercel.app`)
2. Testa:
   - **Candidate flow**: compila questionario → scegli posizione → avvia colloquio
   - **HR flow**: crea una nuova posizione → vedi candidature salvate
3. Refresh la pagina: i dati dovrebbero persistere (salvati nel database Neon Postgres)

---

## Troubleshooting

### Le candidature non si salvano
- **Verifica**: Controlla che DATABASE_URL sia settata nelle environment variables di Vercel
- **Console**: Apri DevTools (F12) → Console nel browser e vedi se ci sono errori API
- **Fallback**: Se l'API fallisce, l'app usa localStorage (dati temporanei, si perdono su refresh)

### Le tabelle non esistono
- Verifica di aver eseguito il `schema.sql` nel SQL Editor di Neon
- Le query createPosition/applications falliranno se le tabelle mancano

### Errore 500 su POST /api/applications
- Controlla i logs di Vercel: Dashboard → "Deployments" → seleziona latest → "Functions"
- Verifica che DATABASE_URL sia impostato correttamente

---

## Struttura Database

### Tabella `positions`
```
id (UUID, PRIMARY KEY)
title (VARCHAR 255)
department (VARCHAR 100)
description (TEXT)
requirements (JSONB array)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Tabella `applications`
```
id (UUID, PRIMARY KEY)
candidate_name (VARCHAR 255)
position_id (UUID, FOREIGN KEY → positions)
questionnaire (JSONB)
score (INTEGER)
report (TEXT)
status (VARCHAR 50: pending/approved/rejected)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

---

## Rollback (se necessario)
Se vuoi tornare a localStorage:
1. Commenta i fetch() nelle funzioni CRUD in [app/page.tsx](app/page.tsx)
2. Riabilita i vecchi useEffect() che salvano su localStorage
3. Push a GitHub — Vercel triggererà un nuovo deploy

---

## Performance Notes
- La app usa localStorage come **fallback offline** se l'API non risponde
- Su Vercel con Postgres, tutto è persistente
- Indicizzazione aggiunta su `applications.position_id` e `applications.status` per query veloci

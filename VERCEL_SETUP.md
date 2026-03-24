# Setup Vercel - Step by Step

Questo documento ti guida attraverso il setup completo di Vercel per il deployment di Harid AI.

## Step 1: Crea un progetto Vercel

1. Vai a https://vercel.com/new
2. Seleziona "Import Git Repository"
3. Collega il tuo account GitHub (se non già fatto)
4. Cerca e seleziona il repository `priestsn/ai-avengers`
5. Clicca "Import"

Vercel riconoscerà automaticamente che è un progetto Next.js e configurerà il build correttamente.

---

## Step 2: Configura il Database Neon Postgres

Vercel Postgres è deprecato. Usiamo **Neon**, che è il provider consigliato.

1. Nel dashboard Vercel, vai a "Storage"
2. Clicca "Create Database"
3. Seleziona **"Neon"** dal Marketplace (non Vercel Postgres)
4. Clicca "Create"
5. Segui il flusso Neon:
   - **Project**: crea un nuovo progetto Neon (o selezionane uno esistente)
   - **Database**: seleziona "neondb" o crea nuovo
   - **Branch**: "main" (default)
6. Una volta creato, Neon genererà un connection string

Vercel userà il connection string di Neon come variabile di ambiente `DATABASE_URL`.

---

## Step 3: Verifica le Environment Variables

Vercel dovrebbe aver aggiunto automaticamente `DATABASE_URL` con il connection string di Neon.

Per verificare:
1. Nel dashboard Vercel, vai a "Settings" → "Environment Variables"
2. Dovresti vedere `DATABASE_URL` con un valore simile a:
   ```
   postgresql://user:password@ep-host.neon.tech/dbname?sslmode=require
   ```

Se manca, aggiungilo manualmente copiando il connection string dal dashboard Neon.

---

## Step 4: Inizializza le Tabelle Database

Adesso crea le tabelle nel tuo database Neon:

### Opzione A: Usa il Neon SQL Editor (consigliato)

1. Nel dashboard Neon, vai al tuo progetto
2. Clicca il tab "SQL Editor"
3. Copia il contenuto completo di [`schema.sql`](schema.sql) da questo repository
4. Incolla nel SQL Editor
5. Clicca "Execute" o premi Ctrl+Enter

Questo creerà le tabelle `positions` e `applications` con i dati di default.

### Opzione B: Usa psql (se hai PostgreSQL installato localmente)

```bash
# Copia la DATABASE_URL dal dashboard Neon
export DATABASE_URL="postgresql://..."

# Esegui lo schema
psql $DATABASE_URL -f schema.sql
```

---

## Step 5: Deploy

Una volta il database è configurato e le tabelle sono create:

1. Vercel auto-triggererà un deploy quando hai pushato il codice su GitHub
2. Controlla il dashboard Vercel → "Deployments"
3. Aspetta che lo status diventi "Ready" (una spunta verde ✓)
4. Clicca sul deployment per vedere l'URL pubblica

Esempio URL: `https://harid-ai.vercel.app`

---

## Step 6: Verifica il Deployment

Accedi all'URL pubblica da Vercel:

### Test Candidate Flow
1. Seleziona "Candidate"
2. Compila il questionario (nome, esperienza, skills)
3. Clicca "Vedi posizioni consigliate"
4. Seleziona una posizione e "Scegli e avvia colloquio"
5. Rispondi alle domande del colloquio AI (Harid AI)
6. Al termine, controlla che il report è stato salvato

### Test HR Flow
1. Seleziona "HR"
2. Sotto "Gestione posizioni", **crea una nuova posizione**
3. Sotto "Candidature", dovresti vedere la candidatura appena creata dal test candidate
4. **IMPORTANTE**: Fai un refresh della pagina (F5)
5. La candidatura dovrebbe ancora essere lì (salvata nel database Neon)

Se tutto funziona, il deployment è **riuscito!** ✓

---

## Troubleshooting

### Il database non contiene le tabelle

```
Error: relation "positions" does not exist
```

**Soluzione**: Riesegui lo `schema.sql` nel SQL Editor di Neon.

---

### Le candidature non si salvano

1. Apri DevTools nel browser (F12)
2. Vai al tab "Console"
3. Vedi se ci sono errori come `404 /api/applications`

**Soluzione**: Controlla che:
- Le API routes siano deployate correttamente (vedi Vercel Functions in "Deployments")
- `DATABASE_URL` sia settata nelle environment variables
- Lo schema.sql sia stato eseguito (tabelle esistono)

---

### Errore "DATABASE_URL is not set"

Significa che le environment variables non sono state caricate.

**Soluzione**:
1. Vai a Vercel Dashboard → "Settings" → "Environment Variables"
2. Verifica che `DATABASE_URL` sia settata
3. Fai un re-deploy: "Deployments" → "Redeploy" sul deployment corrente

---

## Monitoraggio Continuo

Una volta deployato, puoi monitorare il tuo progetto da:

- **Vercel Dashboard**: Analytics, logs, deployments
- **Neon Dashboard**: Database usage, backups, query editor

---

## Rollback (se necessario)

Se qualcosa non funziona:

1. Vercel mantiene auto tutti i deployment precedenti
2. Vai a "Deployments" nel dashboard Vercel
3. Seleziona un deployment precedente e clicca "Redeploy Current"

Oppure, revert il commit su GitHub:
```bash
git revert HEAD
git push origin main
```

Vercel rilevererà il push e auto-deploierà la versione precedente.

---

## Prossimi Passi Opzionali

1. **Custom Domain**: Collega un dominio personalizzato (es. `harid-ai.com`) da Vercel Settings
2. **Analytics**: Abilita Web Analytics dal dashboard Vercel
3. **Monitoring**: Configura alerts per errori o downtime
4. **CI/CD**: Vercel ha già auto-CI/CD da GitHub, ma puoi aggiungere preview deployment per PRs

---

Domande? Controlla [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) per more details.


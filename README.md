# AI Avengers — Piattaforma di Video Colloqui con IA

![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Deploy](https://img.shields.io/badge/Deploy-Replit-F26207?style=flat-square&logo=replit&logoColor=white)

> **Piattaforma completa per colloqui di lavoro con recruiter vocale IA.** I candidati si candidano online e sostengono un colloquio vocale con **Harid AI**, un recruiter artificiale alimentato da Google Gemini 2.5 Flash. I responsabili HR gestiscono le posizioni aperte e consultano le valutazioni nel portale dedicato.

---

## Screenshot

### Home page — Portale HR + Accesso candidati

![Home page AI Avengers](docs/screenshots/home.svg)

*La home page divide l'interfaccia in due sezioni: a sinistra il login per gli HR, a destra l'accesso alle posizioni aperte per i candidati.*

### Dashboard HR — Lista colloqui con punteggi AI

![Dashboard HR](docs/screenshots/dashboard.svg)

*Il dashboard mostra tutti i colloqui completati con punteggio totale, raccomandazione colorata (verde/giallo/rosso) e accesso al report dettagliato.*

### Video-colloquio con Harid AI — chiamata live

![Video-colloquio Harid AI](docs/screenshots/interview.svg)

*Il colloquio avviene in videochiamata: il candidato condivide camera e microfono, Harid AI conduce il colloquio in voce italiana in tempo reale con trascrizione live e valutazione Gemini.*

---

## Indice

- [Panoramica del progetto](#panoramica-del-progetto)
- [Demo e credenziali](#demo-e-credenziali)
- [Architettura del sistema](#architettura-del-sistema)
- [Stack tecnologico](#stack-tecnologico)
- [Struttura del monorepo](#struttura-del-monorepo)
- [Avvio in locale](#avvio-in-locale)
- [Variabili d'ambiente](#variabili-dambiente)
- [API Reference](#api-reference)
- [Flusso candidato](#flusso-candidato)
- [Portale HR](#portale-hr)
- [Harid AI — Come funziona](#harid-ai--come-funziona)
- [Database](#database)
- [Deploy su Replit](#deploy-su-replit)

---

## Panoramica del progetto

**AI Avengers** è una piattaforma SaaS per la selezione del personale che automatizza i colloqui telefonici di primo screening con un recruiter IA vocale. Il sistema:

1. L'HR pubblica una posizione aperta con descrizione, tech stack e domande specifiche
2. Il candidato trova la posizione, compila il form di candidatura e avvia il colloquio
3. **Harid AI** (recruiter IA) conduce il colloquio vocale in italiano — fa domande, ascolta le risposte, approfondisce se necessario
4. Al termine, Gemini 2.5 Flash analizza la trascrizione e genera un report dettagliato con punteggi, punti di forza, debolezze e raccomandazione
5. L'HR consulta i risultati nel dashboard con verbale completo e trascrizione

---

## Demo e credenziali

L'app è deployata su Replit. Per accedere al portale HR usa una di queste credenziali:

| Utente | Email | Password |
|--------|-------|----------|
| Kristian | `kristian.wasd@gmail.com` | `sviluppo1` |
| Sviluppatore | `sviluppatore1@gmail.com` | `admin` |

> Le credenziali sono hash bcrypt in database. Non condividere le credenziali di produzione.

---

## Architettura del sistema

```
┌─────────────────────────────────────────────────────────┐
│                    CANDIDATO (browser)                   │
│  React + Vite SPA — Tailwind CSS — Web Speech API        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / SSE
┌────────────────────▼────────────────────────────────────┐
│                   API SERVER (Express 5)                  │
│  POST /api/harid/chat      → SSE streaming (Gemini)       │
│  POST /api/harid/evaluate  → JSON (Gemini, scoring)       │
│  GET/POST /api/positions   → CRUD posizioni               │
│  GET/POST /api/interviews  → CRUD colloqui                │
│  POST /api/auth/login      → Sessione HR                  │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼─────────────────┐
│  PostgreSQL (Drizzle │   │  Google Gemini 2.5 Flash     │
│  ORM) — dati HR,     │   │  (via Replit AI Integrations)│
│  posizioni, colloqui │   │  Chat SSE + Evaluate JSON     │
└─────────────────────┘   └─────────────────────────────┘
```

### Componenti principali

| Componente | Tecnologia | Ruolo |
|------------|-----------|-------|
| Frontend SPA | React 19 + Vite 7 | Interfaccia candidato e HR |
| API Server | Express 5 + TypeScript | Business logic, AI, auth |
| Database | PostgreSQL + Drizzle ORM | Persistenza dati |
| AI Engine | Google Gemini 2.5 Flash | Colloquio vocale + valutazione |
| TTS | Web Speech API (browser) | Sintesi vocale per Harid AI |
| STT | Web Speech API (browser) | Riconoscimento vocale candidato |

---

## Stack tecnologico

### Frontend (`artifacts/video-interview`)
- **React 19** + **TypeScript 5.9**
- **Vite 7** — build tool + dev server
- **Tailwind CSS 4** — styling utility-first
- **shadcn/ui** — componenti UI (Button, Card, Badge, Dialog, ecc.)
- **Wouter** — routing leggero lato client
- **TanStack Query v5** — gestione dati server-side
- **Framer Motion** — animazioni
- **Lucide React** — icone
- **Web Speech API** — TTS (Text-to-Speech) + STT (Speech-to-Text)

### Backend (`artifacts/api-server`)
- **Express 5** + **TypeScript 5.9**
- **@google/genai** — SDK ufficiale Google Gemini
- **Drizzle ORM** — type-safe ORM per PostgreSQL
- **Zod v4** — validazione runtime degli input
- **bcryptjs** — hashing password HR
- **Pino** — logging strutturato
- **esbuild** — bundle produzione (CJS)

### Database
- **PostgreSQL** (hosting Replit)
- **Drizzle ORM** — schema type-safe
- **drizzle-zod** — generazione automatica schemi Zod dalle tabelle

### AI / ML
- **Google Gemini 2.5 Flash** — LLM per chat SSE e valutazione JSON
- Temperatura 0.3 per risposte coerenti
- `cleanForSpeech()` server-side — strip markdown prima del TTS
- Truncation dopo primo `?` — una sola domanda per turno
- `responseMimeType: "application/json"` — output JSON strutturato per evaluate

### Tooling
- **pnpm workspaces** — gestione monorepo
- **Orval** — codegen React Query hooks + Zod schemas da OpenAPI 3.1
- **TypeScript composite projects** — build incrementale con project references

---

## Struttura del monorepo

```
ai-avengers/
├── artifacts/
│   ├── api-server/              # Express 5 API server
│   │   ├── src/
│   │   │   ├── app.ts           # Setup Express, CORS, routes
│   │   │   ├── index.ts         # Entry point, avvia server su PORT
│   │   │   ├── routes/
│   │   │   │   ├── harid.ts     # POST /api/harid/chat (SSE Gemini)
│   │   │   │   ├── evaluate.ts  # POST /api/harid/evaluate (scoring IA)
│   │   │   │   ├── positions.ts # CRUD /api/positions
│   │   │   │   ├── interviews.ts# CRUD /api/interviews
│   │   │   │   ├── auth.ts      # POST /api/auth/login + /logout
│   │   │   │   └── health.ts    # GET /api/health
│   │   │   ├── middlewares/
│   │   │   │   └── auth.ts      # requireAuth middleware (sessione cookie)
│   │   │   └── lib/
│   │   │       └── logger.ts    # Pino logger
│   │   └── package.json
│   │
│   ├── video-interview/         # React SPA (candidato + HR)
│   │   ├── src/
│   │   │   ├── App.tsx          # Router (Wouter), QueryClient
│   │   │   └── pages/
│   │   │       ├── home.tsx         # Landing page pubblica
│   │   │       ├── positions.tsx    # Lista posizioni aperte (pubblica)
│   │   │       ├── apply.tsx        # Flusso candidatura + colloquio IA
│   │   │       ├── dashboard.tsx    # Portale HR (protetto)
│   │   │       └── not-found.tsx    # 404
│   │   └── package.json
│   │
│   └── mockup-sandbox/          # Ambiente preview componenti (dev)
│
├── lib/
│   ├── api-spec/                # OpenAPI 3.1 spec + Orval config
│   │   └── openapi.yaml
│   ├── api-client-react/        # Hooks React Query generati da Orval
│   ├── api-zod/                 # Schemi Zod generati da Orval
│   ├── db/                      # Drizzle ORM schema + connessione
│   │   └── src/schema/
│   │       ├── positions.ts     # Tabella positions
│   │       └── interviews.ts    # Tabella interviews
│   └── integrations/
│       └── gemini-ai/           # Client Gemini (AI Integrations Replit)
│
├── scripts/                     # Script utility TypeScript
├── pnpm-workspace.yaml          # Config workspace pnpm
├── tsconfig.base.json           # Base TS options (composite, bundler)
├── tsconfig.json                # Root project references
└── package.json                 # Dev deps condivisi (typescript, prettier)
```

---

## Avvio in locale

### Prerequisiti

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)
- **PostgreSQL** (locale o remoto)
- Account **Google AI Studio** (per la chiave API Gemini)

### Installazione

```bash
# Clona il repository
git clone https://github.com/priestsn/ai-avengers.git
cd ai-avengers

# Installa le dipendenze
pnpm install

# Configura le variabili d'ambiente (vedi sezione dedicata)
cp .env.example .env
# Modifica .env con le tue credenziali

# Sincronizza lo schema del database
pnpm --filter @workspace/db run push

# Avvia il backend (porta 8080)
pnpm --filter @workspace/api-server run dev

# Avvia il frontend (porta 3000, in un altro terminale)
pnpm --filter @workspace/video-interview run dev
```

### Accedi all'app

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080/api/health

### Seed iniziale utenti HR

Gli utenti HR vanno inseriti direttamente nel database. Genera l'hash con bcrypt:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TUA_PASSWORD', 10).then(h => console.log(h))"
```

Poi inserisci in PostgreSQL:

```sql
INSERT INTO users (email, password_hash, role) VALUES ('tua@email.com', '$2b$10$...', 'hr');
```

---

## Variabili d'ambiente

Crea un file `.env` nella root (non committare mai questo file):

```env
# Database PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/ai_avengers

# Google Gemini API
AI_INTEGRATIONS_GEMINI_API_KEY=AIza...
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# Sessione Express (segreto per cookie firmati)
SESSION_SECRET=una_stringa_lunga_e_casuale_almeno_32_caratteri

# Porta del server (opzionale, default 8080)
PORT=8080
```

> **Su Replit**: `DATABASE_URL` viene fornita automaticamente. Le credenziali Gemini sono gestite tramite Replit AI Integrations (`AI_INTEGRATIONS_GEMINI_API_KEY` e `AI_INTEGRATIONS_GEMINI_BASE_URL` vengono auto-provisionate).

---

## API Reference

Tutte le API sono prefissate con `/api`.

### Autenticazione HR

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | No | Login con email/password |
| `POST` | `/api/auth/logout` | Sì | Logout, distrugge sessione |
| `GET`  | `/api/auth/me` | Sì | Utente corrente |

**Esempio login:**
```json
POST /api/auth/login
{ "email": "kristian.wasd@gmail.com", "password": "sviluppo1" }
```

---

### Posizioni (`/api/positions`)

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| `GET`  | `/api/positions` | No | Lista tutte le posizioni aperte |
| `GET`  | `/api/positions/:id` | No | Dettaglio singola posizione |
| `POST` | `/api/positions` | **Sì** | Crea nuova posizione |
| `DELETE` | `/api/positions/:id` | **Sì** | Elimina posizione |

**Body creazione posizione:**
```json
{
  "title": "Sviluppatore Full Stack React",
  "description": "Sviluppiamo una piattaforma B2B SaaS...",
  "techStack": "React, Node.js, PostgreSQL, TypeScript",
  "questions": [
    "Descrivimi un progetto React complesso che hai guidato",
    "Come gestisci lo stato in applicazioni large-scale?"
  ]
}
```

---

### Colloqui (`/api/interviews`)

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| `GET`  | `/api/interviews` | **Sì** | Lista tutti i colloqui (con join position) |
| `GET`  | `/api/interviews/:id` | **Sì** | Dettaglio colloquio |
| `POST` | `/api/interviews` | No | Salva risultato colloquio |
| `DELETE` | `/api/interviews/:id` | **Sì** | Elimina colloquio |

**Body salvataggio colloquio:**
```json
{
  "positionId": 1,
  "candidateName": "Mario Rossi",
  "candidateEmail": "mario@example.com",
  "preAnswers": { "esperienza": "5 anni React", "motivazione": "Crescita tech" },
  "totalScore": 72,
  "skillsScore": 75,
  "speechScore": 68,
  "confidenceScore": 70,
  "fillerWordCount": 12,
  "wordCount": 850,
  "aiAnalysis": "{ ... }" 
}
```

---

### Harid AI Chat (`/api/harid/chat`)

Endpoint SSE (Server-Sent Events) per il colloquio vocale in streaming.

```
POST /api/harid/chat
Content-Type: application/json
```

**Body:**
```json
{
  "messages": [],
  "positionTitle": "Sviluppatore Full Stack",
  "positionDescription": "Descrizione del ruolo...",
  "techStack": "React, Node.js, TypeScript",
  "candidateName": "Mario Rossi",
  "candidatePreAnswers": {
    "esperienza": "5 anni React",
    "motivazione": "Crescita professionale",
    "disponibilità": "Sì"
  }
}
```

> Se `messages` è un array vuoto, restituisce il messaggio di apertura hardcoded senza chiamare Gemini (latenza zero per la prima battuta).

**Response (SSE):**
```
data: {"content": "Ciao Mario, sono Harid di AI Avengers..."}
data: {"content": " Raccontami del tuo percorso."}
data: {"done": true}
```

---

### Harid AI Evaluate (`/api/harid/evaluate`)

Valutazione completa della trascrizione del colloquio tramite Gemini.

```
POST /api/harid/evaluate
Content-Type: application/json
```

**Body:**
```json
{
  "conversation": [
    { "role": "assistant", "content": "Ciao Mario..." },
    { "role": "user", "content": "Ho lavorato 5 anni in startup..." }
  ],
  "positionTitle": "Sviluppatore Full Stack",
  "positionDescription": "...",
  "techStack": "React, Node.js",
  "candidateName": "Mario Rossi"
}
```

**Response:**
```json
{
  "skillsScore": 75,
  "speechScore": 68,
  "confidenceScore": 70,
  "totalScore": 72,
  "recommendation": "consigliato",
  "skillsAnalysis": "Il candidato ha dimostrato solida esperienza React...",
  "speechAnalysis": "Comunicazione chiara e strutturata...",
  "confidenceAnalysis": "Motivazione genuina e specifica per il ruolo...",
  "strengths": ["Esperienza React avanzata", "Esempi concreti con numeri"],
  "weaknesses": ["Poca esperienza con testing", "Node.js superficiale"],
  "overallSummary": "Profilo da approfondire. Punti di forza nel frontend...",
  "conversationSummary": "Harid ha chiesto del percorso. Mario ha risposto con 5 anni..."
}
```

**Formula punteggio:**
```
totalScore = round(skillsScore * 0.60 + speechScore * 0.25 + confidenceScore * 0.15)
```

**Soglie recommendation:**
| Punteggio | Raccomandazione |
|-----------|----------------|
| ≥ 70 | `consigliato` |
| 40 – 69 | `da valutare` |
| < 40 | `non consigliato` |

---

## Flusso candidato

```
1. Home page
   └─> Esplora posizioni aperte

2. Pagina posizione (/apply/:id)
   └─> STEP 1 — Form candidatura
       ├── Nome, Email
       ├── Esperienza (testo libero)
       ├── Motivazione (testo libero)
       └── Disponibilità immediata (Sì/No)

3. STEP 2 — Colloquio IA (7 minuti)
   ├── Permesso microfono (obbligatorio)
   ├── Apertura camera (opzionale, solo preview locale)
   ├── Harid AI introduce il colloquio (TTS)
   ├── Loop: candidato parla → Harid risponde → candidato parla...
   │   ├── Riconoscimento vocale (Web Speech API)
   │   ├── Invio a /api/harid/chat (SSE)
   │   ├── Sintesi vocale risposta (Web Speech API)
   │   └── Rilevamento silenzio → turno Harid
   └── Termine: 7 minuti o fine colloquio

4. STEP 3 — Risultati
   ├── Valutazione inviata a /api/harid/evaluate
   ├── Mostra punteggi (skills, speech, motivazione, totale)
   ├── Raccomandazione colorata (verde/giallo/rosso)
   └── Dati salvati in /api/interviews
```

---

## Portale HR

Accessibile tramite login su `/dashboard`.

### Funzionalità

- **Gestione posizioni** — crea, visualizza ed elimina posizioni di lavoro con titolo, descrizione, tech stack e domande guida
- **Lista candidati** — tutti i colloqui completati con punteggi e raccomandazione
- **Dettaglio colloquio** — apri un colloquio per vedere:
  - Punteggi dettagliati (skill, comunicazione, motivazione)
  - Punti di forza e debolezze identificati dall'IA
  - **Verbale del colloquio** — riassunto fedele di ogni scambio
  - **Trascrizione completa** — ogni turno della conversazione

---

## Harid AI — Come funziona

### Identità e comportamento

Harid AI è un recruiter senior fittizio di "AI Avengers". Il system prompt definisce:

- **Ruolo fisso**: Harid è SEMPRE il recruiter, mai il candidato
- **Tono**: professionale ma umano, come una telefonata reale
- **Vietato**: frasi di circostanza ("Ottimo!", "Fantastico!"), markdown di qualsiasi tipo, più di una domanda per turno
- **Struttura colloquio**: 5 fasi (apertura → background → comportamentale STAR → fit → chiusura)

### Pulizia testo per TTS

Ogni chunk Gemini viene processato da `cleanForSpeech()` lato server:

```typescript
// Strip: **, *, __, _, backtick, heading, elenchi, simboli, slash
c = c.replace(/\*\*([^*]+)\*\*/g, "$1");
c = c.replace(/\//g, " ");
// ... ecc.
```

### Una domanda per turno

Il server monitora il testo accumulato: appena trova il primo `?` (con almeno 10 caratteri dopo), tronca lo stream e chiude la risposta. Questo garantisce che Harid non faccia mai due domande consecutive.

### Messaggio di apertura

Al primo turno (`messages = []`), il server risponde con un messaggio hardcoded senza chiamare Gemini. Questo elimina qualsiasi latenza iniziale e garantisce un'apertura sempre identica e naturale.

---

## Database

### Schema

#### `positions`

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | serial PK | ID posizione |
| `title` | text | Titolo della posizione |
| `description` | text | Descrizione del ruolo |
| `techStack` | text | Competenze richieste |
| `questions` | text (JSON) | Array domande guida |
| `createdAt` | timestamp | Data creazione |

#### `interviews`

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | serial PK | ID colloquio |
| `positionId` | integer FK | Riferimento a positions |
| `candidateName` | text | Nome candidato |
| `candidateEmail` | text | Email candidato |
| `preAnswers` | text (JSON) | Risposte form pre-colloquio |
| `totalScore` | integer | Punteggio totale (0-100) |
| `skillsScore` | integer | Punteggio competenze (0-100) |
| `speechScore` | integer | Punteggio comunicazione (0-100) |
| `confidenceScore` | integer | Punteggio motivazione (0-100) |
| `fillerWordCount` | integer | Parole riempitive rilevate |
| `wordCount` | integer | Totale parole pronunciate |
| `aiAnalysis` | text (JSON) | Report completo Gemini |
| `status` | text | Stato colloquio (`completed`) |
| `createdAt` | timestamp | Data e ora colloquio |

### Comandi database

```bash
# Sync schema in sviluppo (push senza migration)
pnpm --filter @workspace/db run push

# Forza sync (se ci sono conflitti)
pnpm --filter @workspace/db run push-force

# Genera migration SQL (per ambienti di produzione)
pnpm --filter @workspace/db run generate
```

---

## Deploy su Replit

Il progetto è ottimizzato per il deploy su Replit:

1. **Database**: PostgreSQL fornito automaticamente da Replit (`DATABASE_URL` auto-provisioned)
2. **Gemini**: Replit AI Integrations fornisce `AI_INTEGRATIONS_GEMINI_API_KEY` e `AI_INTEGRATIONS_GEMINI_BASE_URL` automaticamente
3. **Build frontend**: Vite genera i file statici in `dist/`
4. **API Server**: esbuild compila in `dist/index.cjs` (bundle singolo)
5. **Routing**: `/api/*` → porta 8080 (API Server), tutto il resto → frontend statico

### Deploy manuale

```bash
# Build produzione
pnpm run build

# Avvia API server in produzione
node artifacts/api-server/dist/index.cjs
```

---

## Push su GitHub

Se vuoi caricare questo progetto su GitHub da Replit:

### Metodo 1 — Pannello Version Control di Replit (consigliato)

1. Apri il pannello **Version Control** nella sidebar di Replit
2. Clicca **Connect to GitHub**
3. Autorizza Replit ad accedere al tuo account GitHub
4. Crea una nuova repository oppure collega una esistente
5. Replit sincronizzerà automaticamente il codice

### Metodo 2 — Git da terminale

```bash
# Configura il tuo nome e email
git config user.name "Il Tuo Nome"
git config user.email "tua@email.com"

# Aggiungi il remote (sostituisci con la tua repo)
git remote add origin https://github.com/priestsn/ai-avengers.git

# Primo commit e push
git add .
git commit -m "feat: AI Avengers — piattaforma video colloqui con Harid AI"
git push -u origin main
```

---

## Licenza

MIT — vedi file [LICENSE](LICENSE) per dettagli.

---

*Progetto sviluppato con Replit · Powered by Google Gemini 2.5 Flash*

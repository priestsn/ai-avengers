# Lia AI Recruiting (ai-avengers)

Progetto Next.js per gestione recruiting con candidato + HR, colloquio AI simulato, report e gestione posizioni.

## Requisiti
- Node.js 16+ / 18+
- npm

## Setup (una sola riga)
```bash
cd /workspaces/ai-avengers && npm install --legacy-peer-deps && npm run dev
```

## Avvio app
```bash
npm run dev
```

Apri in browser:

- http://localhost:3000

## Build produzione
```bash
npm run build
npm start
```

## Cosa trovi in app
1. scegli ruolo: `Candidate` o `HR`
2. se `Candidate`: questionario + posizioni + colloquio con Lia (testo + voce browser)
3. se `HR`: CRUD annunci + lista candidature + approva/rifiuta + report

## Dati persistenti (localStorage)
- posizioni: `lia_positions`
- candidature: `lia_applications`

## Condivisione con link pubblico (non localhost)
```bash
# Avvia l'app localmente
npm run dev

# In un altro terminale, creando un tunnel pubblico
npm run share
```

Dopo `npm run share` vedrai una URL tipo:
`https://lia-ai-recruiting.loca.lt`

Condividi quella URL e chiunque può vedere la demo.

## Comandi utili
- `npm run lint`
- `npm run build`
- `npm start`
- `npm run share`

---

### Problemi noti risolti
- dipendenza `react-mic` incompatibile con React 18 rimossa
- dipendenza `@google-cloud/generative-ai` rimossa per NPM 404
- tsconfig aggiornato con `ignoreDeprecations: "6.0"`

### Per estendere (opzionale)
- autenticação in base a ruolo
- integrazione GPT o Gemini in cloud
- speech-to-text per risposte vocali candidati
- database (Firebase/SQL) per dati duraturi

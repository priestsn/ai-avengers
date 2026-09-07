import { db } from "@workspace/db";
import { hrUsersTable, positionsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./lib/logger.js";

async function ensureTablesExist() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS hr_users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      cv_text TEXT,
      cv_file_name TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tech_stack TEXT NOT NULL,
      questions TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS interviews (
      id SERIAL PRIMARY KEY,
      position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
      candidate_name TEXT NOT NULL,
      candidate_email TEXT NOT NULL,
      pre_answers TEXT NOT NULL DEFAULT '{}',
      total_score INTEGER NOT NULL DEFAULT 0,
      skills_score INTEGER NOT NULL DEFAULT 0,
      speech_score INTEGER NOT NULL DEFAULT 0,
      confidence_score INTEGER NOT NULL DEFAULT 0,
      filler_word_count INTEGER NOT NULL DEFAULT 0,
      word_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS ai_analysis TEXT DEFAULT NULL
  `);
  await db.execute(sql`
    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS candidate_id INTEGER REFERENCES candidates(id) ON DELETE SET NULL
  `);
  await db.execute(sql`
    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS pipeline_status TEXT NOT NULL DEFAULT 'completato'
  `);
}

async function seedHrUsers() {
  const existing = await db.select().from(hrUsersTable);
  if (existing.length > 0) return;

  const hash1 = await bcrypt.hash("sviluppo1", 10);
  const hash2 = await bcrypt.hash("admin", 10);

  await db.insert(hrUsersTable).values([
    { email: "kristian.wasd@gmail.com", name: "Kristian HR", password: hash1 },
    { email: "sviluppatore1@gmail.com", name: "Sviluppatore HR", password: hash2 },
  ]);

  logger.info("HR users seeded");
}

async function seedPositions() {
  const existing = await db.select().from(positionsTable);
  if (existing.length > 0) return;

  const positions = [
    {
      title: "Fullstack Developer",
      description: "Cerchiamo un Fullstack Developer esperto per costruire e mantenere applicazioni web scalabili usando React sul frontend e Node.js sul backend con PostgreSQL. Lavorerai in un team agile dinamico.",
      techStack: "React/Node.js/PostgreSQL",
      questions: JSON.stringify([
        "Spiegaci la differenza tra React hooks e class components e quando useresti l'uno o l'altro.",
        "Come gestisci lo stato in un'applicazione React di grandi dimensioni?",
        "Descrivi la tua esperienza con REST vs GraphQL.",
        "Come ottimizzeresti le query PostgreSQL per le performance?",
        "Come struttureresti un'applicazione Node.js Express?",
        "Qual è il tuo approccio al testing fullstack?",
      ]),
    },
    {
      title: "Frontend Engineer",
      description: "Unisciti al nostro team come Frontend Engineer per creare interfacce belle e responsive con React, Tailwind CSS e TypeScript. Lavorerai su funzionalità real-time con WebRTC.",
      techStack: "React/Tailwind CSS/TypeScript",
      questions: JSON.stringify([
        "Descrivi i pattern di useEffect e le insidie comuni.",
        "Come approcci il design responsive con Tailwind CSS?",
        "Quali sono le tue strategie per ottimizzare le performance frontend?",
        "Come gestisci i tipi TypeScript in un codebase grande?",
        "Spiegaci come funziona WebRTC ad alto livello.",
        "Come garantisci l'accessibilità nel tuo lavoro frontend?",
      ]),
    },
    {
      title: "Backend Developer",
      description: "Cerchiamo un Backend Developer con solide competenze in Node.js ed Express per costruire API robuste, gestire deployment con PM2 e integrare servizi cloud AWS.",
      techStack: "Node.js/Express/AWS",
      questions: JSON.stringify([
        "Come gestisci l'ordine dei middleware in Express?",
        "Spiegaci i vantaggi del clustering PM2 per Node.js.",
        "Cosa sono i cold start di AWS Lambda e come li mitighi?",
        "Come metti in sicurezza una REST API contro le vulnerabilità comuni?",
        "Descrivi il tuo approccio al logging e al monitoraggio in produzione.",
        "Come gestisci il connection pooling del database in Node.js?",
      ]),
    },
    {
      title: "Cassiere McDonald's",
      description: "Cerchiamo un cassiere entusiasta e sorridente per il nostro ristorante McDonald's. Dovrai gestire i pagamenti, accogliere i clienti e mantenere la postazione in ordine.",
      techStack: "Cassa registratrice/Attenzione al cliente/Lavoro di squadra",
      questions: JSON.stringify([
        "Come gestiresti una coda lunga di clienti durante l'ora di punta?",
        "Cosa faresti se un cliente si lamentasse del suo ordine?",
        "Come ti organizzeresti per dare il resto corretto senza errori?",
        "Sei disponibile a lavorare nei weekend e durante le festività?",
        "Come mantieni la calma in un ambiente di lavoro frenetico?",
        "Descrivi una situazione in cui hai lavorato bene in squadra.",
      ]),
    },
    {
      title: "Guardiano del Faro",
      description: "Posizione unica per chi ama la solitudine e il mare. Cercasi guardiano del faro per sorvegliare le acque costiere, mantenere il funzionamento della luce rotante e scrivere diari meteorologici.",
      techStack: "Resistenza alla solitudine/Navigazione/Meteorologia",
      questions: JSON.stringify([
        "Come trascorreresti 6 mesi completamente da solo senza internet?",
        "Sai leggere le mappe nautiche e riconoscere le condizioni meteo pericolose?",
        "Cosa faresti se la luce del faro si spegnesse a mezzanotte?",
        "Hai esperienza con motori diesel di backup per generatori?",
        "Come ti comporteresti di fronte a una petroliera in avaria nelle vicinanze?",
        "Sei disposto a ricevere rifornimenti solo una volta al mese via elicottero?",
      ]),
    },
    {
      title: "Astronauta NASA (tirocinio)",
      description: "Tirocinio retribuito per aspiranti astronauti. Missione principale: sopravvivere nello spazio, non toccare i bottoni rossi e ricordare di riportare le rocce lunari.",
      techStack: "Resistenza alle G/Fisica quantistica/Non paura del vuoto",
      questions: JSON.stringify([
        "Come affronteresti una perdita d'ossigeno nella tuta spaziale?",
        "Hai mai pilotato veicoli a gravità zero o simulato ambienti di microgravità?",
        "Come gestiresti il conflitto con un collega su una stazione spaziale senza poter uscire?",
        "Sai riparare un pannello solare con una chiave inglese e guanti pressurizzati?",
        "Descrivi la tua capacità di mangiare cibo liofilizzato per 18 mesi consecutivi.",
        "Cosa faresti se incontrassi un'intelligenza extraterrestre durante una passeggiata spaziale?",
      ]),
    },
    {
      title: "Domatore di Leoni (Circo Nazionale)",
      description: "Il Circo Nazionale Italiano cerca un domatore di leoni coraggioso. Dovrai gestire 4 leoni africani adulti, garantire la loro nutrizione e esibirti due volte a sera sotto il tendone.",
      techStack: "Coraggio/Linguaggio felino/Frustino professionale",
      questions: JSON.stringify([
        "Come distingui un leone arrabbiato da uno che ha solo fame?",
        "Qual è la tua esperienza pregressa con felini di grossa taglia?",
        "Come reagiresti se un leone uscisse dalla gabbia durante lo spettacolo?",
        "Sei disposto a lavorare di notte per nutrire i leoni e pulire le gabbie?",
        "Descrivi la tua tecnica per mantenere l'attenzione di un leone senza usare la frusta.",
        "Hai una polizza assicurativa per infortuni da morso?",
      ]),
    },
    {
      title: "Sommelier di Gelato Artigianale",
      description: "Per la nostra gelateria d'élite cerchiamo un esperto assaggiatore di gelato. Dovrai abbinare i gusti con i vini, analizzare la texture cremosa e proporre nuovi accostamenti stagionali.",
      techStack: "Palato fino/Chimica dei gelati/Resistenza al freddo",
      questions: JSON.stringify([
        "Come distingueresti un gelato artigianale da uno industriale ad occhi chiusi?",
        "Quale vino abbineresti a un gelato al cioccolato fondente e peperoncino?",
        "Sai calcolare il PAC (Potere Anti-Congelante) di un gelato?",
        "Descrivi la differenza di cremosità tra gelato con e senza emulsionanti.",
        "Hai mai creato un gusto ispirato a una destinazione geografica? Raccontaci.",
        "Come gestiresti un cliente che si lamenta che il pistacchio è 'troppo verde'?",
      ]),
    },
    {
      title: "Esperto di Comunicazione Extraterrestre",
      description: "Agenzia governativa cerca specialista in comunicazione aliena. Capacità richiesta: tradurre segnali radio da galassie lontane, non farsi prendere dal panico.",
      techStack: "SETI/Linguistica universale/Calma olimpica",
      questions: JSON.stringify([
        "Come affronteresti la ricezione di un segnale radio regolare da Kepler-452b?",
        "Quali principi matematici useresti per costruire un linguaggio universale?",
        "Come gestiresti la pressione mediatica mondiale nel caso di primo contatto?",
        "Hai esperienza con sistemi di decodifica di segnali analogici a frequenze non standard?",
        "Cosa faresti se gli alieni rispondessero in italiano perfetto?",
        "Come distingueresti un segnale artificiale da rumore cosmico di fondo?",
      ]),
    },
    {
      title: "Barista e Mixologist",
      description: "Ricercato barista creativo per cocktail bar di lusso in centro. Dovrai creare drink signature, gestire l'inventario e intrattenere i clienti con flair bartending spettacolare.",
      techStack: "Mixologia/Flair bartending/Attenzione al cliente",
      questions: JSON.stringify([
        "Quale è la differenza tra uno Spritz e un Aperol Spritz tradizionale veneziano?",
        "Come creeresti un cocktail signature ispirato alla città di Milano?",
        "Come gestiresti un cliente che ordina un Negroni 'non troppo amaro'?",
        "Descrivi la tua tecnica di flair bartending più spettacolare.",
        "Come organizzi il back-bar per massimizzare l'efficienza durante il servizio?",
        "Hai esperienza con la carbonatazione di cocktail o tecniche di infusione?",
      ]),
    },
    {
      title: "Sviluppatore Fullstack Senior",
      description: "Cerchiamo uno sviluppatore fullstack senior con esperienza in architetture microservizi, DevOps e leadership tecnica per guidare un team di 5 sviluppatori.",
      techStack: "React/Node.js/Docker/Kubernetes/AWS",
      questions: JSON.stringify([
        "Come progetteresti un sistema di microservizi per un e-commerce ad alto traffico?",
        "Descrivi la tua esperienza con CI/CD e automazione del deployment.",
        "Come hai gestito la leadership tecnica in passato?",
        "Qual è la tua esperienza con sistemi distribuiti e CAP theorem?",
        "Come affronti il debito tecnico in un codebase legacy?",
        "Descrivi un progetto complesso che hai completato con successo e le sfide incontrate.",
      ]),
    },
  ];

  for (const pos of positions) {
    await db.insert(positionsTable).values(pos);
  }

  logger.info({ count: positions.length }, "Positions seeded");
}

export async function runStartup() {
  const MAX_ATTEMPTS = 8;
  const BASE_DELAY_MS = 2000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      logger.info("Running startup checks...");
      await ensureTablesExist();
      await seedHrUsers();
      await seedPositions();
      logger.info("Startup checks complete");
      return;
    } catch (err) {
      const isEndpointDisabled =
        err instanceof Error &&
        (err.message.includes("endpoint has been disabled") ||
          err.message.includes("endpoint is disabled"));

      if (attempt < MAX_ATTEMPTS && isEndpointDisabled) {
        const delay = BASE_DELAY_MS * Math.pow(1.8, attempt - 1);
        logger.warn(
          { attempt, delay, err },
          `DB endpoint not ready, retrying in ${Math.round(delay / 1000)}s...`
        );
        await new Promise((r) => setTimeout(r, delay));
      } else {
        logger.error({ err }, "Fatal startup error");
        throw err;
      }
    }
  }
}

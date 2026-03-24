'use client';
import { useEffect, useMemo, useState } from 'react';

type Position = { id: string; title: string; department: string; description: string; requirements: string[]; };
type Application = { id: string; candidateName: string; positionId: string; questionnaire: Record<string, string>; score: number; report: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; };

type InterviewStep = { question: string; answer: string };

const initialPositions: Position[] = [
  { id: '1', title: 'Sviluppatore frontend', department: 'Engineering', description: 'Costruisci interfacce moderne e reattive.', requirements: ['React', 'Next.js', 'TypeScript'] },
  { id: '2', title: 'Data Analyst', department: 'Data', description: 'Analizza e interprete i dati aziendali.', requirements: ['SQL', 'Python', 'Visualizzazione dati'] },
  { id: '3', title: 'Recruiter HR', department: 'HR', description: 'Gestisci il processo di selezione e colloqui.', requirements: ['Comunicazione', 'Gestione processi', 'Empatia'] },
];

const defaultQuestions = [
  'Raccontami del tuo percorso lavorativo più significativo.',
  'Perché questa posizione ti interessa in particolare?',
  'Qual è la tua maggiore forza e come l\'hai utilizzata in progetti reali?',
  'Come gestisci il feedback negativo durante un colloquio o in team?',
  'Racconta un esempio di difficoltà lavorativa e come l\'hai risolta.',
];

const pickAIQuestion = (step: number, position: Position | null) => {
  if (!position) return defaultQuestions[step];
  const base = position.requirements[step % position.requirements.length] || 'comunicazione';
  return `Parliamo di ${base}: come lo applichi nella tua esperienza finora?`;
};

const speakText = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'it-IT';
  msg.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(msg);
};

export default function Home() {
  const [role, setRole] = useState<'candidate' | 'hr' | null>(null);
  const [step, setStep] = useState<'onboarding' | 'positions' | 'interview'>('onboarding');
  const [questionnaire, setQuestionnaire] = useState({ name: '', experience: '', skills: '', availability: '' });
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('1');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPassword, setHrPassword] = useState('');
  const [isHRAuthenticated, setIsHRAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviewSteps, setInterviewSteps] = useState<InterviewStep[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [interviewing, setInterviewing] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [recruiterFeedback, setRecruiterFeedback] = useState<string>('Benvenuto, iniziamo il colloquio.');

  const selectedPosition = useMemo(() => positions.find((p) => p.id === selectedPositionId) ?? null, [positions, selectedPositionId]);

  // Carica posizioni e candidature da API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [posRes, appRes] = await Promise.all([
          fetch('/api/positions'),
          fetch('/api/applications'),
        ]);
        
        if (posRes.ok) {
          const posData = await posRes.json();
          setPositions(posData.map((p: any) => ({
            id: p.id,
            title: p.title,
            department: p.department,
            description: p.description,
            requirements: typeof p.requirements === 'string' ? JSON.parse(p.requirements) : p.requirements,
          })));
        }
        
        if (appRes.ok) {
          const appData = await appRes.json();
          setApplications(appData.map((a: any) => ({
            id: a.id,
            candidateName: a.candidate_name || a.candidateName,
            positionId: a.position_id || a.positionId,
            questionnaire: a.questionnaire,
            score: a.score,
            report: a.report,
            status: a.status,
            createdAt: a.created_at || a.createdAt,
          })));
        }
      } catch (error) {
        console.error('Errore caricamento dati da API, usando localStorage:', error);
        // Fallback a localStorage durante development
        const stored = typeof window !== 'undefined' ? localStorage.getItem('lia_positions') : null;
        if (stored) setPositions(JSON.parse(stored));
        const apps = typeof window !== 'undefined' ? localStorage.getItem('lia_applications') : null;
        if (apps) setApplications(JSON.parse(apps));
      }
    };
    fetchData();
  }, []);

  // Salva posizioni su localStorage per fallback offline
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lia_positions', JSON.stringify(positions));
    }
  }, [positions]);

  // Salva candidature su localStorage per fallback offline
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lia_applications', JSON.stringify(applications));
    }
  }, [applications]);

  const questionRecommendations = useMemo(() => {
    if (!questionnaire.skills) return positions;
    const keywords = questionnaire.skills.toLowerCase().split(/[, ]+/).filter(Boolean);
    return positions.filter((p) => keywords.some((k) => p.title.toLowerCase().includes(k) || p.requirements.some((r) => r.toLowerCase().includes(k))));
  }, [questionnaire, positions]);

  const startInterview = () => {
    setStep('interview');
    setCurrentQuestionIndex(0);
    setInterviewSteps([]);
    setInterviewing(true);
    setInterviewEnded(false);
    setRecruiterFeedback('Il recruiter virtuale sta per iniziare.');
    setTimeout(() => speakText('Ciao, sono Harid AI, il tuo recruiter AI. Iniziamo il colloquio.'), 200);
  };

  const nextQuestion = () => {
    const q = pickAIQuestion(currentQuestionIndex, selectedPosition);
    setRecruiterFeedback(q);
    speakText(q);
  };

  useEffect(() => {
    if (interviewing && !interviewEnded) {
      nextQuestion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewing, currentQuestionIndex, interviewEnded]);

  const submitAnswer = async () => {
    if (!answerText.trim()) return;
    const nextSteps = [...interviewSteps, { question: recruiterFeedback, answer: answerText.trim() }];
    setInterviewSteps(nextSteps);
    setAnswerText('');

    const isFinish = currentQuestionIndex >= 4 || nextSteps.length >= 6;
    if (isFinish) {
      const score = Math.max(60, Math.min(100, 70 + nextSteps.reduce((a, c) => a + c.answer.length / 30, 0)));
      const summary = `Colloquio completato per ${questionnaire.name || 'il candidato'} su posizione ${selectedPosition?.title}. Punteggio stimato: ${Math.round(score)}.`;
      const report = [
        summary,
        'Dettaglio risposte:',
        ...nextSteps.map((s, i) => `${i + 1}. Q:${s.question} -> A:${s.answer}`),
      ].join('\n');

      const newApplication: Application = {
        id: `app-${Date.now()}`,
        candidateName: questionnaire.name || 'Candidato anonimo',
        positionId: selectedPositionId,
        questionnaire: { ...questionnaire },
        score: Math.round(score),
        report,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      try {
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName: newApplication.candidateName,
            positionId: newApplication.positionId,
            questionnaire: newApplication.questionnaire,
            score: newApplication.score,
            report: newApplication.report,
            status: newApplication.status,
          }),
        });

        if (response.ok) {
          const created = await response.json();
          setApplications((prev) => [{
            id: created.id,
            candidateName: created.candidateName || created.candidate_name,
            positionId: created.positionId || created.position_id,
            questionnaire: created.questionnaire,
            score: created.score,
            report: created.report,
            status: created.status,
            createdAt: created.createdAt || created.created_at,
          }, ...prev]);
        } else {
          console.error('Errore salvataggio candidatura');
          setApplications((prev) => [newApplication, ...prev]);
        }
      } catch (error) {
        console.error('Errore API candidatura:', error);
        setApplications((prev) => [newApplication, ...prev]);
      }

      setInterviewing(false);
      setInterviewEnded(true);
      setRecruiterFeedback('Colloquio concluso. Grazie per aver partecipato, invio report a HR.');
      speakText('Ho raccolto abbastanza informazioni. Il colloquio è concluso e invio il report al team HR.');
      return;
    }

    setCurrentQuestionIndex((p) => p + 1);
    const follow = `Grazie, ho capito. Prossima domanda.`;
    setRecruiterFeedback(follow);
    speakText(follow);
    setTimeout(() => setRecruiterFeedback(''), 700);
  };

  const createPosition = async (position: Position) => {
    try {
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: position.title,
          department: position.department,
          description: position.description,
          requirements: position.requirements,
        }),
      });

      if (response.ok) {
        const created = await response.json();
        setPositions((prev) => [...prev, {
          id: created.id,
          title: created.title,
          department: created.department,
          description: created.description,
          requirements: typeof created.requirements === 'string' ? JSON.parse(created.requirements) : created.requirements,
        }]);
      } else {
        setPositions((prev) => [...prev, position]);
      }
    } catch (error) {
      console.error('Errore creazione posizione:', error);
      setPositions((prev) => [...prev, position]);
    }
  };

  const updatePosition = async (position: Position) => {
    try {
      const response = await fetch(`/api/positions/${position.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: position.title,
          department: position.department,
          description: position.description,
          requirements: position.requirements,
        }),
      });

      if (response.ok) {
        setPositions((prev) => prev.map((p) => (p.id === position.id ? position : p)));
      } else {
        setPositions((prev) => prev.map((p) => (p.id === position.id ? position : p)));
      }
    } catch (error) {
      console.error('Errore aggiornamento posizione:', error);
      setPositions((prev) => prev.map((p) => (p.id === position.id ? position : p)));
    }
  };

  const deletePosition = async (positionId: string) => {
    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPositions((prev) => prev.filter((p) => p.id !== positionId));
      } else {
        setPositions((prev) => prev.filter((p) => p.id !== positionId));
      }
    } catch (error) {
      console.error('Errore eliminazione posizione:', error);
      setPositions((prev) => prev.filter((p) => p.id !== positionId));
    }
  };

  const updateApplicationStatus = async (appId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setApplications((prev) => prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app)));
      } else {
        setApplications((prev) => prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app)));
      }
    } catch (error) {
      console.error('Errore aggiornamento candidatura:', error);
      setApplications((prev) => prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app)));
    }
  };

  const handleHRLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (hrEmail.trim() === 'dev@mail.it' && hrPassword === 'admin') {
      setIsHRAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Credenziali HR non valide.');
      setIsHRAuthenticated(false);
    }
  };

  const handleHRLogout = () => {
    setIsHRAuthenticated(false);
    setHrEmail('');
    setHrPassword('');
    setAuthError('');
  };

  return (
    <main className="container">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(130deg, #0f172a 0%, #1e3a8a 100%);
          color: #e2e8f0;
          min-height: 100vh;
        }
        .container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 2rem;
        }
        .card {
          background: rgba(15, 23, 42, 0.9);
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          padding: 1.25rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(6px);
        }
        h1, h2, h3 {
          margin: 0 0 0.75rem 0;
          font-weight: 800;
          color: #f8fafc;
        }
        p {
          color: #cbd5e1;
        }
        .button {
          cursor: pointer;
          border: none;
          border-radius: 10px;
          padding: 0.75rem 1.15rem;
          color: #ffffff;
          background: linear-gradient(90deg, #4f46e5, #22d3ee);
          font-weight: 700;
          margin-right: 0.55rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 10px 20px rgba(34, 211, 238, 0.35);
        }
        .button:hover { transform: translateY(-1px); box-shadow: 0 14px 22px rgba(34, 211, 238, 0.5); }
        .button.secondary {
          background: linear-gradient(90deg, #6b7280, #334155);
          box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
        }
        .input, .textarea, .select {
          width: 100%;
          border: 1px solid rgba(148, 163, 184, 0.4);
          border-radius: 10px;
          padding: 0.75rem;
          margin-top: 0.4rem;
          margin-bottom: 0.8rem;
          background: rgba(15, 23, 42, 0.65);
          color: #e2e8f0;
          outline: none;
        }
        .input:focus, .textarea:focus, .select:focus {
          border-color: #22d3ee;
          box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.25);
        }
        .pre {
          background: #020617;
          color: #e2e8f0;
          padding: 0.75rem;
          border-radius: 10px;
          white-space: pre-wrap;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }
        .label { font-weight: 700; color: #f1f5f9; }
        .section-header { margin-bottom: 0.8rem; color: #e2e8f0; }
      `}</style>
      <div className="card">
        <h1>🌟 Harid AI Recruiting Platform</h1>
        <p>Seleziona il tuo ruolo per iniziare: candidate o HR.</p>
        <div style={{ marginTop: 8 }}>
          <button className="button" onClick={() => setRole('candidate')}>Candidate</button>
          <button className="button secondary" onClick={() => setRole('hr')}>HR</button>
        </div>
      </div>

      {role === 'candidate' && (
        <div className="card">
          <h2 className="section-header">1) Registrazione e questionario</h2>
          <label className="label">Nome</label>
          <input className="input" value={questionnaire.name} onChange={(e) => setQuestionnaire((prev) => ({ ...prev, name: e.target.value }))} placeholder="Es. Maria Rossi" />
          <label className="label">Esperienza</label>
          <textarea className="textarea" value={questionnaire.experience} onChange={(e) => setQuestionnaire((prev) => ({ ...prev, experience: e.target.value }))} placeholder="Breve descrizione esperienza" />
          <label className="label">Skills & interessi</label>
          <input className="input" value={questionnaire.skills} onChange={(e) => setQuestionnaire((prev) => ({ ...prev, skills: e.target.value }))} placeholder="React, Python, HR" />
          <label className="label">Disponibilità</label>
          <input className="input" value={questionnaire.availability} onChange={(e) => setQuestionnaire((prev) => ({ ...prev, availability: e.target.value }))} placeholder="Immediata / 1 mese" />

          <button className="button" onClick={() => setStep('positions')}>Vedi posizioni consigliate</button>
        </div>
      )}

      {role === 'candidate' && step === 'positions' && (
        <div className="card">
          <h2 className="section-header">2) Posizioni consigliate</h2>
          {questionRecommendations.length > 0 ? (
            questionRecommendations.map((position) => (
              <div key={position.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                <h3>{position.title} - {position.department}</h3>
                <p>{position.description}</p>
                <p>Requisiti: {position.requirements.join(', ')}</p>
                <button className="button" onClick={() => { setSelectedPositionId(position.id); startInterview(); }}>
                  Scegli e avvia colloquio
                </button>
              </div>
            ))
          ) : (
            <p>Nessuna posizione specifica trovata. Prova una ricerca più ampia.</p>
          )}
        </div>
      )}

      {role === 'candidate' && step === 'interview' && (
        <div className="card">
          <h2 className="section-header">3) Colloquio live con Harid AI</h2>
          <p><strong>Posizione:</strong> {selectedPosition?.title}</p>
          <p><strong>Status:</strong> {interviewEnded ? 'Terminato' : 'In corso'}</p>
          <div className="pre">{recruiterFeedback || 'In attesa di domanda...'}</div>
          {interviewing && !interviewEnded && (
            <>
              <textarea className="textarea" value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Rispondi qui..." rows={4}/>
              <button className="button" onClick={submitAnswer}>Invia risposta</button>
            </>
          )}
          {interviewEnded && <p>Colloquio concluso. Report inviato a HR.</p>}
          <h3 style={{ marginTop: '1rem' }}>Chat Log</h3>
          <div className="pre">{interviewSteps.map((s, idx) => `${idx + 1}. ${s.question}\nRisposta: ${s.answer}`).join('\n\n') || 'Nessun messaggio ancora.'}</div>
        </div>
      )}

      {role === 'hr' && (
        <div className="card">
          <h2 className="section-header">Area HR</h2>
          {!isHRAuthenticated ? (
            <div>
              <p>Accesso limitato. Inserisci credenziali speciali.</p>
              <form onSubmit={handleHRLogin} style={{ display: 'grid', gap: '0.75rem' }}>
                <label className="label">Email</label>
                <input className="input" type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} placeholder="dev@mail.it" />
                <label className="label">Password</label>
                <input className="input" type="password" value={hrPassword} onChange={(e) => setHrPassword(e.target.value)} placeholder="admin" />
                {authError && <p style={{ color: '#dc2626' }}>{authError}</p>}
                <button className="button" type="submit">Login HR</button>
              </form>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: 12 }}><strong>Sei connesso come HR</strong> <button className="button secondary" onClick={handleHRLogout}>Logout</button></p>
              <h3>Gestione posizioni</h3>
              <PositionManager positions={positions} onCreate={createPosition} onUpdate={updatePosition} onDelete={deletePosition} />
              <h3>Candidature</h3>
              {applications.length === 0 && <p>Nessuna candidatura ancora.</p>}
              {applications.map((application) => {
                const position = positions.find((p) => p.id === application.positionId);
                return (
                  <div key={application.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                    <strong>{application.candidateName}</strong> - {position?.title || 'Posizione rimossa'}
                    <p>Stato: {application.status} - Punteggio: {application.score}</p>
                    <p>{application.report}</p>
                    <button className="button" onClick={() => updateApplicationStatus(application.id, 'approved')}>Approva</button>
                    <button className="button secondary" onClick={() => updateApplicationStatus(application.id, 'rejected')}>Rifiuta</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function PositionManager({ positions, onCreate, onUpdate, onDelete }: { positions: Position[]; onCreate: (p: Position) => void; onUpdate: (p: Position) => void; onDelete: (id: string) => void; }) {
  const [form, setForm] = useState({ id: '', title: '', department: '', description: '', requirements: '' });
  const [editMode, setEditMode] = useState(false);

  const submit = () => {
    if (!form.title || !form.department) return;
    const position: Position = {
      id: editMode ? form.id : `pos-${Date.now()}`,
      title: form.title,
      department: form.department,
      description: form.description,
      requirements: form.requirements.split(',').map((item) => item.trim()).filter(Boolean),
    };
    if (editMode) {
      onUpdate(position);
    } else {
      onCreate(position);
    }
    setForm({ id: '', title: '', department: '', description: '', requirements: '' });
    setEditMode(false);
  };

  const load = (position: Position) => {
    setForm({ ...position, requirements: position.requirements.join(', ') });
    setEditMode(true);
  };

  return (
    <div>
      <p className="label">Titolo</p>
      <input className="input" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
      <p className="label">Dipartimento</p>
      <input className="input" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} />
      <p className="label">Descrizione</p>
      <textarea className="textarea" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
      <p className="label">Requisiti (separati da virgola)</p>
      <input className="input" value={form.requirements} onChange={(e) => setForm((prev) => ({ ...prev, requirements: e.target.value }))} />
      <button className="button" onClick={submit}>{editMode ? 'Aggiorna posizione' : 'Aggiungi posizione'}</button>
      {editMode && <button className="button secondary" onClick={() => { setForm({ id: '', title: '', department: '', description: '', requirements: '' }); setEditMode(false); }}>Annulla</button>}

      <div style={{ marginTop: 12 }}>
        {positions.map((position) => (
          <div key={position.id} style={{ border: '1px dashed #ddd', borderRadius: 8, padding: 8, marginBottom: 8 }}>
            <strong>{position.title}</strong> ({position.department})
            <p>{position.description}</p>
            <p>Req: {position.requirements.join(', ')}</p>
            <button className="button" onClick={() => load(position)}>Modifica</button>
            <button className="button secondary" onClick={() => onDelete(position.id)}>Elimina</button>
          </div>
        ))}
      </div>
    </div>
  );
}

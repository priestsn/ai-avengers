-- Crea tabella posizioni
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea tabella candidature
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name VARCHAR(255) NOT NULL,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  questionnaire JSONB DEFAULT '{}',
  score INTEGER DEFAULT 0,
  report TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_applications_position_id ON applications(position_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Inserisci posizioni di default
INSERT INTO positions (id, title, department, description, requirements)
VALUES
  ('1', 'Sviluppatore frontend', 'Engineering', 'Costruisci interfacce moderne e reattive.', '["React", "Next.js", "TypeScript"]'),
  ('2', 'Data Analyst', 'Data', 'Analizza e interprete i dati aziendali.', '["SQL", "Python", "Visualizzazione dati"]'),
  ('3', 'Recruiter HR', 'HR', 'Gestisci il processo di selezione e colloqui.', '["Comunicazione", "Gestione processi", "Empatia"]')
ON CONFLICT DO NOTHING;

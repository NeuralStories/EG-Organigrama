
CREATE TABLE study_phases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sections JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

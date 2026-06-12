-- Classifica jogadores como mensalistas (padrão) ou diaristas (avulso, sem mensalidade fixa)
ALTER TABLE public.jogadores
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'mensalista'
    CHECK (tipo IN ('mensalista', 'diarista'));

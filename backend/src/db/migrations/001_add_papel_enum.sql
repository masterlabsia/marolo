-- Migration 001: formaliza os papéis válidos da tabela membros como enum
-- Executar no Supabase SQL Editor

CREATE TYPE public.papel_tipo AS ENUM ('admin', 'jogador', 'diarista');

ALTER TABLE public.membros
  ALTER COLUMN papel DROP DEFAULT,
  ALTER COLUMN papel TYPE public.papel_tipo
    USING papel::public.papel_tipo,
  ALTER COLUMN papel SET DEFAULT 'jogador';

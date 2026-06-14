-- Coluna de foto para jogadores mensalistas
ALTER TABLE public.jogadores ADD COLUMN foto_url text;

-- Bucket de fotos de jogadores (público para leitura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'jogadores-fotos',
  'jogadores-fotos',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública
CREATE POLICY "jogadores_fotos_leitura_publica"
ON storage.objects FOR SELECT
USING (bucket_id = 'jogadores-fotos');

-- Upload apenas para usuários autenticados
CREATE POLICY "jogadores_fotos_upload_autenticado"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'jogadores-fotos');

-- Substituição apenas para usuários autenticados
CREATE POLICY "jogadores_fotos_update_autenticado"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'jogadores-fotos');

-- Exclusão apenas para usuários autenticados
CREATE POLICY "jogadores_fotos_delete_autenticado"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'jogadores-fotos');

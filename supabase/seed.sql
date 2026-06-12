-- Seed de desenvolvimento local
-- Executado automaticamente pelo `supabase db reset`

-- Cria um perfil de time
INSERT INTO public.perfis (usuario_id, nome_time, slug, descricao)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Marolo FC',
  'marolo-fc',
  'Time de futebol amador'
);

-- Cria jogadores de exemplo
INSERT INTO public.jogadores (perfil_id, nome, posicao, numero_camisa, ativo)
VALUES
  (1, 'Carlos Silva',    'Atacante',   9,  true),
  (1, 'Bruno Santos',    'Meio-campo', 8,  true),
  (1, 'Diego Oliveira',  'Defensor',   4,  true),
  (1, 'Felipe Avulso',   'Atacante',   99, true);  -- este é o diarista

-- Cria um membro admin (dono do time)
INSERT INTO public.membros (perfil_id, usuario_id, papel)
VALUES (1, '00000000-0000-0000-0000-000000000001', 'admin');

-- Cria um membro jogador regular
INSERT INTO public.membros (perfil_id, usuario_id, papel)
VALUES (1, '00000000-0000-0000-0000-000000000002', 'jogador');

-- Cria um membro diarista (o novo tipo)
INSERT INTO public.membros (perfil_id, usuario_id, papel)
VALUES (1, '00000000-0000-0000-0000-000000000003', 'diarista');

-- Perfil do time
INSERT INTO public.perfis (id, usuario_id, nome_time, slug, descricao)
VALUES (1, '00000000-0000-0000-0000-000000000001', 'Marolo FC', 'marolo-fc', 'Time de futebol amador');

SELECT setval('public.perfis_id_seq', 1);

-- Elenco
INSERT INTO public.jogadores (perfil_id, nome, posicao, numero_camisa, ativo, tipo)
VALUES
  (1, 'Carlos Silva',   'Atacante',   9,  true, 'mensalista'),
  (1, 'Bruno Santos',   'Meio-campo', 8,  true, 'mensalista'),
  (1, 'Diego Oliveira', 'Defensor',   4,  true, 'mensalista'),
  (1, 'Felipe Avulso',  'Atacante',   99, true, 'diarista');

-- Membros com acesso ao app
INSERT INTO public.membros (perfil_id, usuario_id, papel) VALUES
  (1, '00000000-0000-0000-0000-000000000001', 'admin'),
  (1, '00000000-0000-0000-0000-000000000002', 'jogador'),
  (1, '00000000-0000-0000-0000-000000000003', 'diarista');

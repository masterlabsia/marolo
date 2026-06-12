-- Jogos (6 realizados, 2 agendados, 1 cancelado)
-- IDs dos jogadores: Carlos=1, Bruno=2, Diego=3, Felipe=4
INSERT INTO public.jogos (id, perfil_id, data_hora, adversario, local, status, resultado, formacao, notas)
VALUES
  (1, 1, now() - interval '6 weeks', 'Estrela do Norte FC',  'Campo do Trabalhador',  'realizado', '{"gols_nossos":3,"gols_adversario":1}', '4-3-3', 'Boa atuacao no segundo tempo'),
  (2, 1, now() - interval '5 weeks', 'Vila Nova SC',         'Estadio Municipal',     'realizado', '{"gols_nossos":1,"gols_adversario":1}', '4-4-2', null),
  (3, 1, now() - interval '4 weeks', 'Atletico Bairro',      'Campo do Trabalhador',  'realizado', '{"gols_nossos":2,"gols_adversario":0}', '4-3-3', 'Vitoria convincente'),
  (4, 1, now() - interval '3 weeks', 'Sao Cristovao Amador', 'Campo do Sao Cristovao','realizado', '{"gols_nossos":0,"gols_adversario":2}', '4-4-2', 'Segundo tempo fraco'),
  (5, 1, now() - interval '2 weeks', 'Unidos do Parque',     'Campo do Trabalhador',  'realizado', '{"gols_nossos":4,"gols_adversario":2}', '4-3-3', 'Felipe fez dois gols'),
  (6, 1, now() - interval '1 week',  'Raposa EC',            'Campo do Raposa',       'realizado', '{"gols_nossos":1,"gols_adversario":3}', '4-5-1', 'Derrota por falta de finalizacao'),
  (7, 1, now() + interval '1 week',  'Estrela do Norte FC',  'Campo do Trabalhador',  'agendado',  null,                                   '4-3-3', 'Revanche do primeiro jogo'),
  (8, 1, now() + interval '3 weeks', 'Vila Nova SC',         'Estadio Municipal',     'agendado',  null,                                   null,    null),
  (9, 1, now() - interval '7 weeks', 'Gremio Amador',        'Campo Central',         'cancelado', null,                                   null,    'Chuva forte');

SELECT setval('public.jogos_id_seq', 9);

-- Presenças e estatísticas dos jogos realizados
-- Jogo 1: vitória 3x1 — Carlos 2G 1A, Bruno 0G 2A, Felipe 1G
INSERT INTO public.presencas (jogo_id, jogador_id, presente, gols, assistencias, avaliacao) VALUES
  (1, 1, true,  2, 1, 8),
  (1, 2, true,  0, 2, 7),
  (1, 3, true,  0, 0, 7),
  (1, 4, true,  1, 0, 8);

-- Jogo 2: empate 1x1 — Bruno 1G; Felipe ausente
INSERT INTO public.presencas (jogo_id, jogador_id, presente, gols, assistencias, avaliacao) VALUES
  (2, 1, true,  0, 0, 6),
  (2, 2, true,  1, 0, 7),
  (2, 3, true,  0, 0, 6),
  (2, 4, false, 0, 0, null);

-- Jogo 3: vitória 2x0 — Carlos 1G, Diego 1G
INSERT INTO public.presencas (jogo_id, jogador_id, presente, gols, assistencias, avaliacao) VALUES
  (3, 1, true, 1, 0, 8),
  (3, 2, true, 0, 1, 7),
  (3, 3, true, 1, 0, 8),
  (3, 4, true, 0, 1, 7);

-- Jogo 4: derrota 0x2 — Bruno ausente
INSERT INTO public.presencas (jogo_id, jogador_id, presente, gols, assistencias, avaliacao) VALUES
  (4, 1, true,  0, 0, 5),
  (4, 2, false, 0, 0, null),
  (4, 3, true,  0, 0, 5),
  (4, 4, true,  0, 0, 5);

-- Jogo 5: vitória 4x2 — Felipe 2G, Carlos 1G 1A, Bruno 1G 1A
INSERT INTO public.presencas (jogo_id, jogador_id, presente, gols, assistencias, avaliacao) VALUES
  (5, 1, true, 1, 1, 8),
  (5, 2, true, 1, 1, 8),
  (5, 3, true, 0, 1, 7),
  (5, 4, true, 2, 0, 9);

-- Jogo 6: derrota 1x3 — Bruno 1G
INSERT INTO public.presencas (jogo_id, jogador_id, presente, gols, assistencias, avaliacao) VALUES
  (6, 1, true, 0, 0, 5),
  (6, 2, true, 1, 0, 6),
  (6, 3, true, 0, 0, 5),
  (6, 4, true, 0, 0, 5);

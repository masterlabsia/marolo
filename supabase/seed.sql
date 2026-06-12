-- Seed de desenvolvimento local
-- Executado automaticamente pelo `supabase db reset`

-- Cria usuários de teste em auth.users
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token, email_change_token_new
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@marolo.test',
    crypt('senha123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'jogador@marolo.test',
    crypt('senha123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'diarista@marolo.test',
    crypt('senha123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, '', '', ''
  );

-- auth.identities é obrigatório para o login email/senha funcionar no Supabase v2+
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'admin@marolo.test',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@marolo.test","email_verified":true}'::jsonb,
    'email', now(), now(), now()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    'jogador@marolo.test',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"jogador@marolo.test","email_verified":true}'::jsonb,
    'email', now(), now(), now()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    'diarista@marolo.test',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"diarista@marolo.test","email_verified":true}'::jsonb,
    'email', now(), now(), now()
  );

-- Cria o perfil do time
INSERT INTO public.perfis (id, usuario_id, nome_time, slug, descricao)
VALUES (1, '00000000-0000-0000-0000-000000000001', 'Marolo FC', 'marolo-fc', 'Time de futebol amador');

SELECT setval('public.perfis_id_seq', 1);

-- Cria jogadores de exemplo
INSERT INTO public.jogadores (perfil_id, nome, posicao, numero_camisa, ativo)
VALUES
  (1, 'Carlos Silva',   'Atacante',   9,  true),
  (1, 'Bruno Santos',   'Meio-campo', 8,  true),
  (1, 'Diego Oliveira', 'Defensor',   4,  true),
  (1, 'Felipe Avulso',  'Atacante',   99, true);

-- Cria membros com os 3 papéis disponíveis
INSERT INTO public.membros (perfil_id, usuario_id, papel) VALUES
  (1, '00000000-0000-0000-0000-000000000001', 'admin'),
  (1, '00000000-0000-0000-0000-000000000002', 'jogador'),
  (1, '00000000-0000-0000-0000-000000000003', 'diarista');

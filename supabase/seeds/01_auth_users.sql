-- Usuários de teste no Supabase Auth
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@marolo.test',
    crypt('senha123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'jogador@marolo.test',
    crypt('senha123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'diarista@marolo.test',
    crypt('senha123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    false, '', '', '', '', ''
  );

-- auth.identities obrigatório para login email/senha no Supabase v2+
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

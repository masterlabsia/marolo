-- Seed single-team consultivo (Marolo)
-- Preencha os UUIDs abaixo com os IDs reais de auth.users:
-- admin_marolo@marolo.app
-- marolo@marolo.app

begin;

-- 1) Time unico (admin dono do perfil)
insert into public.perfis (usuario_id, nome_time, slug, descricao)
values (
  '0a679a31-ac26-4e93-a8a2-045d55eaf7cf',
  'Marolo',
  'marolo',
  'Time unico Marolo'
)
on conflict (slug) do update
set nome_time = excluded.nome_time,
    descricao = excluded.descricao,
    updated_at = now();

-- 2) Garantir usuario admin como membro admin (opcional, ja e dono)
insert into public.membros (perfil_id, usuario_id, papel)
select p.id, '0a679a31-ac26-4e93-a8a2-045d55eaf7cf', 'admin'
from public.perfis p
where p.slug = 'marolo'
on conflict (perfil_id, usuario_id) do update
set papel = excluded.papel;

-- 3) Usuario jogador somente leitura
insert into public.membros (perfil_id, usuario_id, papel)
select p.id, 'cdc59d0f-f614-48da-b886-1e47736ddf9e', 'jogador'
from public.perfis p
where p.slug = 'marolo'
on conflict (perfil_id, usuario_id) do update
set papel = excluded.papel;

commit;

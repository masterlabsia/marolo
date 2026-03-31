import { supabase } from "@/lib/supabase";
import type { Jogo, Jogador, MovimentacaoCaixa, Pagamento, Perfil, Presenca } from "@/types/domain";

export async function createPerfil(payload: Pick<Perfil, "nome_time" | "slug" | "descricao">, userId: string) {
  const { data, error } = await supabase
    .from("perfis")
    .insert({ ...payload, usuario_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  return data as Perfil;
}

export async function updatePerfilConfiguracao(perfilId: number, configuracao_tema: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("perfis")
    .update({ configuracao_tema })
    .eq("id", perfilId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Perfil;
}

export async function listJogadores(perfilId: number) {
  const { data, error } = await supabase
    .from("jogadores")
    .select("*")
    .eq("perfil_id", perfilId)
    .order("nome", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Jogador[];
}

export async function createJogador(
  perfilId: number,
  payload: Pick<Jogador, "nome" | "posicao" | "numero_camisa" | "telefone" | "email" | "tags">,
) {
  const { data, error } = await supabase
    .from("jogadores")
    .insert({ ...payload, perfil_id: perfilId })
    .select("*")
    .single();

  if (error) throw error;
  return data as Jogador;
}

export async function updateJogador(id: number, payload: Partial<Jogador>) {
  const { data, error } = await supabase
    .from("jogadores")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Jogador;
}

export async function removeJogador(id: number) {
  const { error } = await supabase.from("jogadores").delete().eq("id", id);
  if (error) throw error;
}

export async function listJogos(perfilId: number) {
  const { data, error } = await supabase
    .from("jogos")
    .select("*")
    .eq("perfil_id", perfilId)
    .order("data_hora", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Jogo[];
}

export async function createJogo(
  perfilId: number,
  payload: Pick<Jogo, "data_hora" | "adversario" | "local" | "formacao" | "notas">,
) {
  const { data, error } = await supabase
    .from("jogos")
    .insert({ ...payload, perfil_id: perfilId, status: "agendado" })
    .select("*")
    .single();

  if (error) throw error;
  return data as Jogo;
}

export async function updateJogo(id: number, payload: Partial<Jogo>) {
  const { data, error } = await supabase
    .from("jogos")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Jogo;
}

export async function removeJogo(id: number) {
  const { error } = await supabase.from("jogos").delete().eq("id", id);
  if (error) throw error;
}

export async function listPresencasByJogo(jogoId: number) {
  const { data, error } = await supabase
    .from("presencas")
    .select("*, jogadores(id, nome)")
    .eq("jogo_id", jogoId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((item: any) => ({
    ...item,
    jogador: item.jogadores,
  })) as Presenca[];
}

export async function upsertPresenca(
  payload: Pick<Presenca, "jogo_id" | "jogador_id" | "presente" | "gols" | "assistencias" | "notas" | "cartoes" | "avaliacao">,
) {
  const cleanPayload = {
    jogo_id: payload.jogo_id,
    jogador_id: payload.jogador_id,
    presente: payload.presente,
    gols: payload.gols,
    assistencias: payload.assistencias,
    cartoes: payload.cartoes ?? null,
    notas: payload.notas ?? null,
    avaliacao: payload.avaliacao ?? null,
  };

  const existing = await supabase
    .from("presencas")
    .select("id")
    .eq("jogo_id", cleanPayload.jogo_id)
    .eq("jogador_id", cleanPayload.jogador_id)
    .maybeSingle<{ id: number }>();

  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    const { data, error } = await supabase
      .from("presencas")
      .update(cleanPayload)
      .eq("id", existing.data.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Presenca;
  }

  const { data, error } = await supabase
    .from("presencas")
    .insert(cleanPayload)
    .select("*")
    .single();

  if (error) throw error;
  return data as Presenca;
}

export async function listCaixa(perfilId: number) {
  const { data, error } = await supabase
    .from("caixa")
    .select("*")
    .eq("perfil_id", perfilId)
    .order("data_movimento", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MovimentacaoCaixa[];
}

export async function createCaixa(
  perfilId: number,
  payload: Pick<MovimentacaoCaixa, "tipo" | "categoria" | "descricao" | "valor" | "data_movimento" | "metodo_pagamento">,
) {
  const { data, error } = await supabase
    .from("caixa")
    .insert({ ...payload, perfil_id: perfilId })
    .select("*")
    .single();

  if (error) throw error;
  return data as MovimentacaoCaixa;
}

export async function updateCaixa(
  id: number,
  payload: Pick<MovimentacaoCaixa, "tipo" | "categoria" | "descricao" | "valor" | "data_movimento" | "metodo_pagamento">,
) {
  const { data, error } = await supabase
    .from("caixa")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as MovimentacaoCaixa;
}

export async function removeCaixa(id: number) {
  const { error } = await supabase.from("caixa").delete().eq("id", id);
  if (error) throw error;
}

export async function listPagamentos(perfilId: number, mes: number, ano: number) {
  const { data, error } = await supabase
    .from("pagamentos")
    .select("*, jogadores(id, nome)")
    .eq("perfil_id", perfilId)
    .eq("mes", mes)
    .eq("ano", ano)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item: any) => ({
    ...item,
    jogador: item.jogadores,
  })) as Pagamento[];
}

export async function listPagamentosInadimplentesAntesDe(perfilId: number, mes: number, ano: number) {
  const { data, error } = await supabase
    .from("pagamentos")
    .select("jogador_id, mes, ano, valor, status")
    .eq("perfil_id", perfilId)
    .neq("status", "pago");

  if (error) throw error;

  return ((data ?? []) as Pick<Pagamento, "jogador_id" | "mes" | "ano" | "valor" | "status">[]).filter(
    (item) => item.ano < ano || (item.ano === ano && item.mes < mes),
  );
}

export async function closePagamentosMes(perfilId: number, mes: number, ano: number) {
  const { data, error } = await supabase
    .from("pagamentos")
    .update({ status: "vencido" })
    .eq("perfil_id", perfilId)
    .eq("mes", mes)
    .eq("ano", ano)
    .eq("status", "pendente")
    .select("id");

  if (error) throw error;
  return (data ?? []).length;
}

export async function upsertPagamento(
  perfilId: number,
  payload: Pick<Pagamento, "jogador_id" | "mes" | "ano" | "valor" | "status" | "data_vencimento" | "data_pagamento">,
) {
  const { data, error } = await supabase
    .from("pagamentos")
    .upsert({ ...payload, perfil_id: perfilId }, { onConflict: "perfil_id,jogador_id,mes,ano" })
    .select("*, jogadores(id, nome)")
    .single();

  if (error) throw error;

  return { ...data, jogador: (data as any).jogadores } as Pagamento;
}

export async function bulkCreateMensalidades(perfilId: number, jogadorIds: number[], mes: number, ano: number, valor = 130) {
  const inadimplencias = await listPagamentosInadimplentesAntesDe(perfilId, mes, ano);
  const carryByJogador = inadimplencias.reduce<Record<number, number>>((acc, row) => {
    const jogadorId = Number(row.jogador_id);
    acc[jogadorId] = (acc[jogadorId] || 0) + Number(row.valor || 0);
    return acc;
  }, {});

  const payload = jogadorIds.map((jogadorId) => ({
    perfil_id: perfilId,
    jogador_id: jogadorId,
    mes,
    ano,
    valor: Number(valor) + Number(carryByJogador[jogadorId] || 0),
    status: "pendente",
    data_vencimento: `${ano}-${String(mes).padStart(2, "0")}-10`,
  }));

  const { error } = await supabase
    .from("pagamentos")
    .upsert(payload, { onConflict: "perfil_id,jogador_id,mes,ano", ignoreDuplicates: true });

  if (error) throw error;
}

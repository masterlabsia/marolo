import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/Layout/AppShell";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { listJogadores, listPagamentosByJogador, listPresencasByJogador } from "@/lib/team-api";
import { useProfile } from "@/hooks/useProfile";

type TimelineEvent =
  | {
      id: string;
      date: string;
      type: "presenca";
      title: string;
      detail: string;
    }
  | {
      id: string;
      date: string;
      type: "pagamento";
      title: string;
      detail: string;
    };

const PlayerTimelinePage = () => {
  const { playerId } = useParams();
  const numericPlayerId = Number(playerId);
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;

  const playersQuery = useQuery({
    queryKey: ["players", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogadores(perfilId as number),
  });

  const presencasQuery = useQuery({
    queryKey: ["player-presences", perfilId, numericPlayerId],
    enabled: Boolean(perfilId && numericPlayerId),
    queryFn: () => listPresencasByJogador(perfilId as number, numericPlayerId),
  });

  const pagamentosQuery = useQuery({
    queryKey: ["player-payments", perfilId, numericPlayerId],
    enabled: Boolean(perfilId && numericPlayerId),
    queryFn: () => listPagamentosByJogador(perfilId as number, numericPlayerId),
  });

  const selectedPlayer = useMemo(
    () => (playersQuery.data || []).find((p) => p.id === numericPlayerId),
    [numericPlayerId, playersQuery.data],
  );

  const events = useMemo(() => {
    const presenceEvents: TimelineEvent[] = (presencasQuery.data || []).map((row) => ({
      id: `presence_${row.id}`,
      date: row.jogo?.data_hora || new Date().toISOString(),
      type: "presenca",
      title: row.jogo ? `Jogo vs ${row.jogo.adversario}` : "Registro de presenca",
      detail: `${row.presente ? "Presente" : "Ausente"} | G:${row.gols} A:${row.assistencias} | Nota: ${Number(row.avaliacao || 0).toFixed(1)}`,
    }));

    const paymentEvents: TimelineEvent[] = (pagamentosQuery.data || []).map((row) => ({
      id: `payment_${row.id}`,
      date: row.data_pagamento || `${row.ano}-${String(row.mes).padStart(2, "0")}-10`,
      type: "pagamento",
      title: `Mensalidade ${String(row.mes).padStart(2, "0")}/${row.ano}`,
      detail: `Status: ${row.status} | Valor: R$ ${Number(row.valor || 0).toFixed(2)}`,
    }));

    return [...presenceEvents, ...paymentEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [pagamentosQuery.data, presencasQuery.data]);

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Timeline do jogador</h1>
          <p className="text-sm text-muted-foreground">
            {selectedPlayer ? selectedPlayer.nome : "Jogador"} - historico unificado de presenca, scout e pagamentos.
          </p>
        </div>
        <Link to="/jogadores" className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
          Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <div className="glass-card">
          <p className="label-text">Total de eventos</p>
          <p className="stat-number text-3xl">{events.length}</p>
        </div>
        <div className="glass-card">
          <p className="label-text">Ultima presenca</p>
          <p className="text-sm font-medium mt-2">
            {presencasQuery.data?.[0]?.jogo?.data_hora ? formatDateTime(presencasQuery.data[0].jogo?.data_hora || null) : "-"}
          </p>
        </div>
        <div className="glass-card">
          <p className="label-text">Ultimo pagamento</p>
          <p className="text-sm font-medium mt-2">{formatDate(pagamentosQuery.data?.[0]?.data_pagamento || null)}</p>
        </div>
      </div>

      <div className="glass-card mt-4">
        <h2 className="font-semibold mb-3">Linha do tempo</h2>
        <div className="space-y-2">
          {events.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos para este jogador.</p>}
          {events.map((event) => (
            <div key={event.id} className="rounded-xl bg-muted/20 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{event.title}</p>
                <span className="text-xs text-muted-foreground">{formatDateTime(event.date)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{event.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default PlayerTimelinePage;

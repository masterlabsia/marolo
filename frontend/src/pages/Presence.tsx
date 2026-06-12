import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { enqueuePresenceUpdates, flushPresenceQueue, listPresenceQueue } from "@/lib/offline-queue";
import { canManageRole } from "@/lib/permissions";
import { listJogadores, listJogos, listPresencasByJogo, upsertPresenca } from "@/lib/team-api";

type PresenceMeta = {
  justificativa: string;
  atrasoMinutos: number;
  minutosJogados: number;
  finalizacoes: number;
  desarmes: number;
  notaTatica: number;
  notaTecnica: number;
  observacoes: string;
};

type PresenceRowState = {
  jogador_id: number;
  nome: string;
  tipo: "mensalista" | "diarista";
  presente: boolean;
  gols: number;
  assistencias: number;
  cartaoAmarelo: number;
  cartaoVermelho: number;
  avaliacao: number;
  meta: PresenceMeta;
};

const emptyMeta: PresenceMeta = {
  justificativa: "",
  atrasoMinutos: 0,
  minutosJogados: 0,
  finalizacoes: 0,
  desarmes: 0,
  notaTatica: 0,
  notaTecnica: 0,
  observacoes: "",
};

function parseNotasMeta(notas: string | null | undefined) {
  if (!notas) return emptyMeta;
  try {
    const parsed = JSON.parse(notas) as { meta?: Partial<PresenceMeta> };
    const meta = parsed.meta || {};
    return {
      justificativa: meta.justificativa || "",
      atrasoMinutos: Number(meta.atrasoMinutos || 0),
      minutosJogados: Number(meta.minutosJogados || 0),
      finalizacoes: Number(meta.finalizacoes || 0),
      desarmes: Number(meta.desarmes || 0),
      notaTatica: Number(meta.notaTatica || 0),
      notaTecnica: Number(meta.notaTecnica || 0),
      observacoes: meta.observacoes || "",
    };
  } catch {
    return { ...emptyMeta, observacoes: notas };
  }
}

function buildNotas(meta: PresenceMeta) {
  return JSON.stringify({ meta });
}

const PresencePage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;
  const canManage = canManageRole(profileData?.role);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [queuedCount, setQueuedCount] = useState(() => listPresenceQueue().length);

  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [editedRows, setEditedRows] = useState<Record<number, PresenceRowState>>({});

  const gamesQuery = useQuery({
    queryKey: ["games", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogos(perfilId as number),
  });

  const playersQuery = useQuery({
    queryKey: ["players", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogadores(perfilId as number),
  });

  const attendanceQuery = useQuery({
    queryKey: ["attendance", selectedGameId],
    enabled: Boolean(selectedGameId),
    queryFn: () => listPresencasByJogo(selectedGameId as number),
  });

  const saveBatchMutation = useMutation({
    mutationFn: async (rowsToSave: PresenceRowState[]) => {
      if (!selectedGameId) return;
      const payloads = rowsToSave.map((row) => ({
        jogo_id: selectedGameId,
        jogador_id: row.jogador_id,
        presente: row.presente,
        gols: row.gols,
        assistencias: row.assistencias,
        cartoes: {
          amarelo: row.cartaoAmarelo,
          vermelho: row.cartaoVermelho,
        },
        avaliacao: Math.round(row.avaliacao),
        notas: buildNotas(row.meta),
      }));

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const total = enqueuePresenceUpdates(payloads);
        return { queued: true, total };
      }

      await Promise.all(payloads.map((payload) => upsertPresenca(payload)));
      return { queued: false, total: 0 };
    },
    onSuccess: async (result) => {
      if (result?.queued) {
        setQueuedCount(result.total);
        toast.info(`Sem internet: ${result.total} atualizacoes ficaram na fila offline`);
        return;
      }
      toast.success("Presencas e scout salvos em lote");
      await queryClient.invalidateQueries({ queryKey: ["attendance", selectedGameId] });
      await queryClient.invalidateQueries({ queryKey: ["attendance-all"] });
    },
    onError: (error: any) => toast.error(error.message || "Erro ao salvar presencas"),
  });

  const rows = useMemo<PresenceRowState[]>(() => {
    const allPlayers = playersQuery.data || [];
    const recordMap = new Map((attendanceQuery.data || []).map((row) => [row.jogador_id, row]));

    return allPlayers.map((player) => {
      const existing = recordMap.get(player.id);
      const parsedMeta = parseNotasMeta(existing?.notas);
      return {
        jogador_id: player.id,
        nome: player.nome,
        tipo: player.tipo ?? "mensalista",
        presente: existing?.presente ?? false,
        gols: existing?.gols ?? 0,
        assistencias: existing?.assistencias ?? 0,
        cartaoAmarelo: Number(existing?.cartoes?.amarelo || 0),
        cartaoVermelho: Number(existing?.cartoes?.vermelho || 0),
        avaliacao: Number(existing?.avaliacao || 0),
        meta: parsedMeta,
      };
    });
  }, [attendanceQuery.data, playersQuery.data]);

  useEffect(() => {
    const next: Record<number, PresenceRowState> = {};
    rows.forEach((row) => {
      next[row.jogador_id] = row;
    });
    setEditedRows(next);
  }, [rows]);

  useEffect(() => {
    let syncing = false;
    const syncQueuedChanges = async () => {
      if (syncing) return;
      syncing = true;
      const result = await flushPresenceQueue();
      setQueuedCount(result.failed);
      if (result.sent > 0) {
        toast.success(`Sincronizacao concluida: ${result.sent} atualizacoes enviadas`);
        await queryClient.invalidateQueries({ queryKey: ["attendance", selectedGameId] });
        await queryClient.invalidateQueries({ queryKey: ["attendance-all"] });
      }
      syncing = false;
    };

    const handleOnline = () => {
      setIsOnline(true);
      syncQueuedChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncQueuedChanges();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient, selectedGameId]);

  const dirtyCount = useMemo(() => {
    return rows.reduce((count, row) => {
      const edited = editedRows[row.jogador_id];
      if (!edited) return count;
      const changed = JSON.stringify(edited) !== JSON.stringify(row);
      return changed ? count + 1 : count;
    }, 0);
  }, [editedRows, rows]);

  const scoutSummary = useMemo(() => {
    const list = Object.values(editedRows);
    if (list.length === 0) return null;
    const presentes = list.filter((r) => r.presente).length;
    const gols = list.reduce((acc, r) => acc + Number(r.gols || 0), 0);
    const assistencias = list.reduce((acc, r) => acc + Number(r.assistencias || 0), 0);
    const amarelos = list.reduce((acc, r) => acc + Number(r.cartaoAmarelo || 0), 0);
    const vermelhos = list.reduce((acc, r) => acc + Number(r.cartaoVermelho || 0), 0);
    const finalizacoes = list.reduce((acc, r) => acc + Number(r.meta.finalizacoes || 0), 0);
    const desarmes = list.reduce((acc, r) => acc + Number(r.meta.desarmes || 0), 0);
    const orderedByRating = [...list].sort((a, b) => Number(b.avaliacao || 0) - Number(a.avaliacao || 0));
    const mvp = orderedByRating[0];

    return {
      presentes,
      gols,
      assistencias,
      amarelos,
      vermelhos,
      finalizacoes,
      desarmes,
      mvpNome: mvp?.nome || "-",
      mvpNota: Number(mvp?.avaliacao || 0),
    };
  }, [editedRows]);

  const handleSaveBatch = () => {
    const rowsToSave = rows
      .map((row) => ({ original: row, edited: editedRows[row.jogador_id] }))
      .filter(({ edited }) => Boolean(edited))
      .filter(({ original, edited }) => (edited ? JSON.stringify(edited) !== JSON.stringify(original) : false))
      .map(({ edited }) => edited as PresenceRowState);

    if (rowsToSave.length === 0) {
      toast.info("Nenhuma alteracao para salvar");
      return;
    }

    saveBatchMutation.mutate(rowsToSave);
  };

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold">Presenca Avancada e Scout</h1>
      <p className="text-sm text-muted-foreground mb-6">Edite todos os dados do jogo e salve em lote uma unica vez.</p>

      {!isOnline && (
        <div className="glass-card mb-4 text-sm">
          Modo offline ativo. Alteracoes serao salvas localmente e sincronizadas quando a internet voltar.
        </div>
      )}
      {queuedCount > 0 && (
        <div className="glass-card mb-4 text-sm">
          Fila offline pendente: {queuedCount} alteracoes aguardando sincronizacao.
        </div>
      )}

      <div className="glass-card mb-4">
        <label className="text-xs text-muted-foreground">Jogo</label>
        <select
          className="mt-1 w-full rounded-xl bg-muted/40 border border-border px-3 py-2.5"
          value={selectedGameId ?? ""}
          onChange={(e) => setSelectedGameId(Number(e.target.value) || null)}
        >
          <option value="">Selecione...</option>
          {(gamesQuery.data || []).map((game) => (
            <option key={game.id} value={game.id}>
              {new Date(game.data_hora).toLocaleDateString("pt-BR")} - vs {game.adversario}
            </option>
          ))}
        </select>
      </div>

      {selectedGameId && canManage && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              className="rounded-xl bg-muted/50 px-3 py-2 text-xs"
              onClick={() =>
                setEditedRows((prev) => {
                  const next = { ...prev };
                  Object.keys(next).forEach((id) => {
                    next[Number(id)] = { ...next[Number(id)], presente: true };
                  });
                  return next;
                })
              }
            >
              Marcar todos presentes
            </button>
            <button
              className="rounded-xl bg-muted/50 px-3 py-2 text-xs"
              onClick={() =>
                setEditedRows((prev) => {
                  const next = { ...prev };
                  Object.keys(next).forEach((id) => {
                    next[Number(id)] = { ...next[Number(id)], presente: false };
                  });
                  return next;
                })
              }
            >
              Marcar todos ausentes
            </button>
          </div>
          <button
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm disabled:opacity-60"
            disabled={dirtyCount === 0 || saveBatchMutation.isPending}
            onClick={handleSaveBatch}
          >
            {saveBatchMutation.isPending
              ? "Salvando..."
              : dirtyCount > 0
                ? `Salvar em lote (${dirtyCount})`
                : "Salvar em lote"}
          </button>
        </div>
      )}

      {selectedGameId && scoutSummary && (
        <div className="glass-card mb-4">
          <h2 className="font-semibold mb-3">Scout da partida</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            <div className="rounded-xl bg-muted/20 px-3 py-2 flex justify-between"><span>Presentes</span><span>{scoutSummary.presentes}</span></div>
            <div className="rounded-xl bg-muted/20 px-3 py-2 flex justify-between"><span>Gols</span><span>{scoutSummary.gols}</span></div>
            <div className="rounded-xl bg-muted/20 px-3 py-2 flex justify-between"><span>Assist.</span><span>{scoutSummary.assistencias}</span></div>
            <div className="rounded-xl bg-muted/20 px-3 py-2 flex justify-between"><span>Cartoes</span><span>{scoutSummary.amarelos}/{scoutSummary.vermelhos}</span></div>
            <div className="rounded-xl bg-muted/20 px-3 py-2 flex justify-between"><span>Finalizacoes</span><span>{scoutSummary.finalizacoes}</span></div>
            <div className="rounded-xl bg-muted/20 px-3 py-2 flex justify-between"><span>Desarmes</span><span>{scoutSummary.desarmes}</span></div>
            <div className="rounded-xl bg-muted/20 px-3 py-2 flex justify-between"><span>MVP</span><span>{scoutSummary.mvpNome}</span></div>
            <div className="rounded-xl bg-muted/20 px-3 py-2 flex justify-between"><span>Nota MVP</span><span>{scoutSummary.mvpNota}</span></div>
          </div>
        </div>
      )}

      {selectedGameId && (
        <div className="glass-card overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-muted-foreground">
              <tr>
                <th className="text-left py-2">Jogador</th>
                <th className="text-left py-2">Presente</th>
                <th className="text-left py-2">G</th>
                <th className="text-left py-2">A</th>
                <th className="text-left py-2">CA/CV</th>
                <th className="text-left py-2">Final.</th>
                <th className="text-left py-2">Des.</th>
                <th className="text-left py-2">Atraso</th>
                <th className="text-left py-2">Min.</th>
                <th className="text-left py-2">Tatica</th>
                <th className="text-left py-2">Tecnica</th>
                <th className="text-left py-2">Nota</th>
                <th className="text-left py-2">Justificativa/Obs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const edited = editedRows[row.jogador_id] ?? row;
                return (
                  <tr key={row.jogador_id} className="border-b border-border/40">
                    <td className="py-2">
                      <div className="flex flex-col gap-0.5">
                        <span>{row.nome}</span>
                        {row.tipo === "diarista" ? (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-medium w-fit">Diarista</span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-medium w-fit">Mensalista</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      <input
                        disabled={!canManage}
                        type="checkbox"
                        checked={edited.presente}
                        onChange={(e) =>
                          setEditedRows((prev) => ({
                            ...prev,
                            [row.jogador_id]: { ...edited, presente: e.target.checked },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2"><input disabled={!canManage} type="number" min={0} value={edited.gols} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, gols: Number(e.target.value) || 0 } }))} className="w-14 rounded-lg bg-muted/40 border border-border px-2 py-1" /></td>
                    <td className="py-2"><input disabled={!canManage} type="number" min={0} value={edited.assistencias} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, assistencias: Number(e.target.value) || 0 } }))} className="w-14 rounded-lg bg-muted/40 border border-border px-2 py-1" /></td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <input disabled={!canManage} type="number" min={0} value={edited.cartaoAmarelo} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, cartaoAmarelo: Number(e.target.value) || 0 } }))} className="w-12 rounded-lg bg-muted/40 border border-border px-1 py-1" />
                        <input disabled={!canManage} type="number" min={0} value={edited.cartaoVermelho} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, cartaoVermelho: Number(e.target.value) || 0 } }))} className="w-12 rounded-lg bg-muted/40 border border-border px-1 py-1" />
                      </div>
                    </td>
                    <td className="py-2"><input disabled={!canManage} type="number" min={0} value={edited.meta.finalizacoes} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, meta: { ...edited.meta, finalizacoes: Number(e.target.value) || 0 } } }))} className="w-14 rounded-lg bg-muted/40 border border-border px-2 py-1" /></td>
                    <td className="py-2"><input disabled={!canManage} type="number" min={0} value={edited.meta.desarmes} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, meta: { ...edited.meta, desarmes: Number(e.target.value) || 0 } } }))} className="w-14 rounded-lg bg-muted/40 border border-border px-2 py-1" /></td>
                    <td className="py-2"><input disabled={!canManage} type="number" min={0} value={edited.meta.atrasoMinutos} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, meta: { ...edited.meta, atrasoMinutos: Number(e.target.value) || 0 } } }))} className="w-16 rounded-lg bg-muted/40 border border-border px-2 py-1" /></td>
                    <td className="py-2"><input disabled={!canManage} type="number" min={0} value={edited.meta.minutosJogados} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, meta: { ...edited.meta, minutosJogados: Number(e.target.value) || 0 } } }))} className="w-16 rounded-lg bg-muted/40 border border-border px-2 py-1" /></td>
                    <td className="py-2"><input disabled={!canManage} type="number" min={0} max={10} value={edited.meta.notaTatica} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, meta: { ...edited.meta, notaTatica: Number(e.target.value) || 0 } } }))} className="w-16 rounded-lg bg-muted/40 border border-border px-2 py-1" /></td>
                    <td className="py-2"><input disabled={!canManage} type="number" min={0} max={10} value={edited.meta.notaTecnica} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, meta: { ...edited.meta, notaTecnica: Number(e.target.value) || 0 } } }))} className="w-16 rounded-lg bg-muted/40 border border-border px-2 py-1" /></td>
                    <td className="py-2"><input disabled={!canManage} type="number" min={0} max={10} value={edited.avaliacao} onChange={(e) => setEditedRows((prev) => ({ ...prev, [row.jogador_id]: { ...edited, avaliacao: Number(e.target.value) || 0 } }))} className="w-16 rounded-lg bg-muted/40 border border-border px-2 py-1" /></td>
                    <td className="py-2">
                      <div className="space-y-1">
                        <input
                          disabled={!canManage}
                          value={edited.meta.justificativa}
                          onChange={(e) =>
                            setEditedRows((prev) => ({
                              ...prev,
                              [row.jogador_id]: { ...edited, meta: { ...edited.meta, justificativa: e.target.value } },
                            }))
                          }
                          placeholder="Justificativa"
                          className="w-56 rounded-lg bg-muted/40 border border-border px-2 py-1"
                        />
                        <input
                          disabled={!canManage}
                          value={edited.meta.observacoes}
                          onChange={(e) =>
                            setEditedRows((prev) => ({
                              ...prev,
                              [row.jogador_id]: { ...edited, meta: { ...edited.meta, observacoes: e.target.value } },
                            }))
                          }
                          placeholder="Observacoes"
                          className="w-56 rounded-lg bg-muted/40 border border-border px-2 py-1"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
};

export default PresencePage;

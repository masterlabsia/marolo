import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { listJogadores, listJogos, listPresencasByJogo, upsertPresenca } from "@/lib/team-api";

const PresencePage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;
  const canManage = profileData?.role === "presidente";

  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

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

  const upsertMutation = useMutation({
    mutationFn: upsertPresenca,
    onSuccess: async () => {
      toast.success("Presenca atualizada");
      await queryClient.invalidateQueries({ queryKey: ["attendance", selectedGameId] });
    },
    onError: (error: any) => toast.error(error.message || "Erro ao salvar presenca"),
  });

  const rows = useMemo(() => {
    const allPlayers = playersQuery.data || [];
    const recordMap = new Map((attendanceQuery.data || []).map((row) => [row.jogador_id, row]));

    return allPlayers.map((player) => {
      const existing = recordMap.get(player.id);
      return {
        jogador_id: player.id,
        nome: player.nome,
        presente: existing?.presente ?? false,
        gols: existing?.gols ?? 0,
        assistencias: existing?.assistencias ?? 0,
        notas: existing?.notas ?? "",
      };
    });
  }, [attendanceQuery.data, playersQuery.data]);

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold">Presenca e Gols</h1>
      <p className="text-sm text-muted-foreground mb-6">Registro por jogo com atualizacao imediata.</p>

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

      {selectedGameId && (
        <div className="glass-card overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-muted-foreground">
              <tr>
                <th className="text-left py-2">Jogador</th>
                <th className="text-left py-2">Presente</th>
                <th className="text-left py-2">Gols</th>
                <th className="text-left py-2">Assist.</th>
                <th className="text-left py-2">Notas</th>
                {canManage && <th className="text-right py-2">Salvar</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <PresenceRow
                  key={row.jogador_id}
                  row={row}
                  canManage={canManage}
                  onSave={(payload) => {
                    upsertMutation.mutate({
                      jogo_id: selectedGameId,
                      jogador_id: row.jogador_id,
                      ...payload,
                    });
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
};

const PresenceRow = ({
  row,
  canManage,
  onSave,
}: {
  row: { jogador_id: number; nome: string; presente: boolean; gols: number; assistencias: number; notas: string };
  canManage: boolean;
  onSave: (payload: { presente: boolean; gols: number; assistencias: number; notas: string }) => void;
}) => {
  const [state, setState] = useState(row);
  const [lastSaved, setLastSaved] = useState(row);

  useEffect(() => {
    setState(row);
    setLastSaved(row);
  }, [row]);

  const isDirty =
    state.presente !== lastSaved.presente ||
    state.gols !== lastSaved.gols ||
    state.assistencias !== lastSaved.assistencias ||
    state.notas !== lastSaved.notas;

  return (
    <tr className="border-b border-border/40">
      <td className="py-2">{row.nome}</td>
      <td className="py-2">
        <input disabled={!canManage} type="checkbox" checked={state.presente} onChange={(e) => setState((p) => ({ ...p, presente: e.target.checked }))} />
      </td>
      <td className="py-2">
        <input disabled={!canManage} type="number" min={0} value={state.gols} onChange={(e) => setState((p) => ({ ...p, gols: Number(e.target.value) || 0 }))} className="w-16 rounded-lg bg-muted/40 border border-border px-2 py-1" />
      </td>
      <td className="py-2">
        <input disabled={!canManage} type="number" min={0} value={state.assistencias} onChange={(e) => setState((p) => ({ ...p, assistencias: Number(e.target.value) || 0 }))} className="w-16 rounded-lg bg-muted/40 border border-border px-2 py-1" />
      </td>
      <td className="py-2">
        <input disabled={!canManage} value={state.notas} onChange={(e) => setState((p) => ({ ...p, notas: e.target.value }))} className="rounded-lg bg-muted/40 border border-border px-2 py-1" />
      </td>
      {canManage && (
        <td className="py-2 text-right">
          {isDirty && (
            <button
              className="text-xs rounded-lg bg-primary text-primary-foreground px-2 py-1"
              onClick={() => {
                onSave({
                  presente: state.presente,
                  gols: state.gols,
                  assistencias: state.assistencias,
                  notas: state.notas,
                });
                setLastSaved(state);
              }}
            >
              Salvar
            </button>
          )}
        </td>
      )}
    </tr>
  );
};

export default PresencePage;

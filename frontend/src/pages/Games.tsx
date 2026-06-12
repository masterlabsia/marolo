import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { formatDateTime } from "@/lib/formatters";
import { canManageRole } from "@/lib/permissions";
import { createJogo, listJogos, removeJogo, updateJogo } from "@/lib/team-api";
import type { Jogo } from "@/types/domain";

const GamesPage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;
  const canManage = canManageRole(profileData?.role);

  const [form, setForm] = useState({
    data_hora: "",
    adversario: "",
    local: "",
    formacao: "",
    notas: "",
    status: "agendado" as Jogo["status"],
    gols_nossos: "",
    gols_adversario: "",
  });
  const [editingGameId, setEditingGameId] = useState<number | null>(null);

  const gamesQuery = useQuery({
    queryKey: ["games", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogos(perfilId as number),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      const payload = {
        data_hora: form.data_hora,
        adversario: form.adversario,
        local: form.local || null,
        formacao: form.formacao || null,
        notas: form.notas || null,
        status: form.status,
        resultado:
          form.gols_nossos !== "" && form.gols_adversario !== ""
            ? {
                gols_nossos: Number(form.gols_nossos),
                gols_adversario: Number(form.gols_adversario),
                vencido: Number(form.gols_nossos) > Number(form.gols_adversario),
              }
            : null,
      };

      if (editingGameId) {
        return updateJogo(editingGameId, payload);
      }
      return createJogo(perfilId, payload);
    },
    onSuccess: async () => {
      toast.success(editingGameId ? "Jogo atualizado" : "Jogo agendado");
      setForm({
        data_hora: "",
        adversario: "",
        local: "",
        formacao: "",
        notas: "",
        status: "agendado",
        gols_nossos: "",
        gols_adversario: "",
      });
      setEditingGameId(null);
      await queryClient.invalidateQueries({ queryKey: ["games", perfilId] });
    },
    onError: (error: any) => toast.error(error.message || "Falha ao salvar jogo"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Jogo["status"] }) => updateJogo(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["games", perfilId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeJogo(id),
    onSuccess: async () => {
      toast.success("Jogo removido");
      await queryClient.invalidateQueries({ queryKey: ["games", perfilId] });
    },
  });

  const games = gamesQuery.data || [];
  const upcoming = games.filter((g) => g.status === "agendado");
  const done = games.filter((g) => g.status !== "agendado");

  const setEditMode = (game: Jogo) => {
    const dt = new Date(game.data_hora);
    const localValue = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;

    setEditingGameId(game.id);
    setForm({
      data_hora: localValue,
      adversario: game.adversario || "",
      local: game.local || "",
      formacao: game.formacao || "",
      notas: game.notas || "",
      status: game.status || "agendado",
      gols_nossos: game.resultado?.gols_nossos != null ? String(game.resultado.gols_nossos) : "",
      gols_adversario: game.resultado?.gols_adversario != null ? String(game.resultado.gols_adversario) : "",
    });
  };

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold">Jogos</h1>
      <p className="text-sm text-muted-foreground mb-6">Agendamento, status e detalhes de partidas.</p>

      {canManage && (
        <div className="glass-card mb-4">
          <h2 className="font-semibold mb-3">Novo jogo</h2>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <input type="datetime-local" required value={form.data_hora} onChange={(e) => setForm((p) => ({ ...p, data_hora: e.target.value }))} className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input required value={form.adversario} onChange={(e) => setForm((p) => ({ ...p, adversario: e.target.value }))} placeholder="Adversario" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input value={form.local} onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))} placeholder="Local" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input value={form.formacao} onChange={(e) => setForm((p) => ({ ...p, formacao: e.target.value }))} placeholder="Formacao (4-3-3)" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Jogo["status"] }))} className="rounded-xl bg-muted/40 border border-border px-3 py-2.5">
              <option value="agendado">Agendado</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                value={form.gols_nossos}
                onChange={(e) => setForm((p) => ({ ...p, gols_nossos: e.target.value }))}
                placeholder="Gols nossos"
                className="rounded-xl bg-muted/40 border border-border px-3 py-2.5"
              />
              <input
                type="number"
                min={0}
                value={form.gols_adversario}
                onChange={(e) => setForm((p) => ({ ...p, gols_adversario: e.target.value }))}
                placeholder="Gols adversario"
                className="rounded-xl bg-muted/40 border border-border px-3 py-2.5"
              />
            </div>
            <textarea value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} placeholder="Notas" className="md:col-span-2 rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                {saveMutation.isPending ? "Salvando..." : editingGameId ? "Salvar alteracoes" : "Agendar jogo"}
              </button>
              {editingGameId && (
                <button
                  type="button"
                  className="rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
                  onClick={() => {
                    setEditingGameId(null);
                    setForm({
                      data_hora: "",
                      adversario: "",
                      local: "",
                      formacao: "",
                      notas: "",
                      status: "agendado",
                      gols_nossos: "",
                      gols_adversario: "",
                    });
                  }}
                >
                  Cancelar edicao
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card">
          <h2 className="font-semibold mb-3">Proximos</h2>
          <div className="space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Sem jogos agendados.</p>}
            {upcoming.map((game) => (
              <div key={game.id} className="rounded-xl bg-muted/20 px-3 py-2">
                <p className="font-medium">vs {game.adversario}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(game.data_hora)} {game.local ? `- ${game.local}` : ""}</p>
                {game.resultado && (
                  <p className="text-xs mt-1">Placar: {game.resultado.gols_nossos} x {game.resultado.gols_adversario}</p>
                )}
                {canManage && (
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs px-2 py-1 rounded-lg bg-primary/20 text-primary" onClick={() => setEditMode(game)}>Editar</button>
                    <button className="text-xs px-2 py-1 rounded-lg bg-success/20 text-success" onClick={() => statusMutation.mutate({ id: game.id, status: "realizado" })}>Finalizar</button>
                    <button className="text-xs px-2 py-1 rounded-lg bg-destructive/20 text-destructive" onClick={() => deleteMutation.mutate(game.id)}>Excluir</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <h2 className="font-semibold mb-3">Historico</h2>
          <div className="space-y-2">
            {done.length === 0 && <p className="text-sm text-muted-foreground">Ainda nao ha jogos finalizados.</p>}
            {done.map((game) => (
              <div key={game.id} className="rounded-xl bg-muted/20 px-3 py-2">
                <p className="font-medium">vs {game.adversario}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(game.data_hora)}</p>
                <p className="text-xs mt-1">Status: {game.status}</p>
                {game.resultado && (
                  <p className="text-xs mt-1">Placar: {game.resultado.gols_nossos} x {game.resultado.gols_adversario}</p>
                )}
                {canManage && (
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs px-2 py-1 rounded-lg bg-primary/20 text-primary" onClick={() => setEditMode(game)}>Editar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default GamesPage;

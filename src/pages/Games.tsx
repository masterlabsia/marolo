import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { formatDateTime } from "@/lib/formatters";
import { createJogo, listJogos, removeJogo, updateJogo } from "@/lib/team-api";
import type { Jogo } from "@/types/domain";

const GamesPage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;
  const canManage = profileData?.role === "presidente";

  const [form, setForm] = useState({
    data_hora: "",
    adversario: "",
    local: "",
    formacao: "",
    notas: "",
  });

  const gamesQuery = useQuery({
    queryKey: ["games", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogos(perfilId as number),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      return createJogo(perfilId, {
        data_hora: form.data_hora,
        adversario: form.adversario,
        local: form.local || null,
        formacao: form.formacao || null,
        notas: form.notas || null,
      });
    },
    onSuccess: async () => {
      toast.success("Jogo agendado");
      setForm({ data_hora: "", adversario: "", local: "", formacao: "", notas: "" });
      await queryClient.invalidateQueries({ queryKey: ["games", perfilId] });
    },
    onError: (error: any) => toast.error(error.message || "Falha ao criar jogo"),
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
              createMutation.mutate();
            }}
          >
            <input type="datetime-local" required value={form.data_hora} onChange={(e) => setForm((p) => ({ ...p, data_hora: e.target.value }))} className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input required value={form.adversario} onChange={(e) => setForm((p) => ({ ...p, adversario: e.target.value }))} placeholder="Adversario" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input value={form.local} onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))} placeholder="Local" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input value={form.formacao} onChange={(e) => setForm((p) => ({ ...p, formacao: e.target.value }))} placeholder="Formacao (4-3-3)" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <textarea value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} placeholder="Notas" className="md:col-span-2 rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <button type="submit" className="md:col-span-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm">
              {createMutation.isPending ? "Salvando..." : "Agendar jogo"}
            </button>
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
                {canManage && (
                  <div className="flex gap-2 mt-2">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default GamesPage;

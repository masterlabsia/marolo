import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { canManageRole } from "@/lib/permissions";
import { createJogador, listJogadores, removeJogador, updateJogador } from "@/lib/team-api";
import type { Jogador } from "@/types/domain";

const emptyForm = {
  nome: "",
  posicao: "",
  numero_camisa: "",
  telefone: "",
  email: "",
  tags: "",
};

const PlayersPage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;
  const canManage = canManageRole(profileData?.role);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const playersQuery = useQuery({
    queryKey: ["players", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogadores(perfilId as number),
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      const payload = {
        nome: form.nome,
        posicao: form.posicao || null,
        numero_camisa: form.numero_camisa ? Number(form.numero_camisa) : null,
        telefone: form.telefone || null,
        email: form.email || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      };

      if (editingId) {
        return updateJogador(editingId, payload as Partial<Jogador>);
      }

      return createJogador(perfilId, payload);
    },
    onSuccess: async () => {
      toast.success(editingId ? "Jogador atualizado" : "Jogador criado");
      setForm(emptyForm);
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["players", perfilId] });
    },
    onError: (error: any) => toast.error(error.message || "Falha ao salvar jogador"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeJogador(id),
    onSuccess: async () => {
      toast.success("Jogador removido");
      await queryClient.invalidateQueries({ queryKey: ["players", perfilId] });
    },
    onError: (error: any) => toast.error(error.message || "Falha ao remover"),
  });

  const rows = useMemo(() => {
    const all = playersQuery.data || [];
    if (!search.trim()) return all;
    return all.filter((item) => item.nome.toLowerCase().includes(search.toLowerCase()));
  }, [playersQuery.data, search]);

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold">Jogadores</h1>
      <p className="text-sm text-muted-foreground mb-6">CRUD completo do elenco com busca em tempo real.</p>

      {canManage && (
        <div className="glass-card mb-4">
          <h2 className="font-semibold mb-3">{editingId ? "Editar jogador" : "Novo jogador"}</h2>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              upsertMutation.mutate();
            }}
          >
            <input required value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input value={form.posicao} onChange={(e) => setForm((p) => ({ ...p, posicao: e.target.value }))} placeholder="Posicao" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input type="number" min={1} max={99} value={form.numero_camisa} onChange={(e) => setForm((p) => ({ ...p, numero_camisa: e.target.value }))} placeholder="Numero" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input value={form.telefone} onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))} placeholder="Telefone" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="Tags (capitao,reserva)" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                {upsertMutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-xl bg-muted/40 px-4 py-2.5 text-sm">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="glass-card">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold">Elenco</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome" className="rounded-xl bg-muted/40 border border-border px-3 py-2 text-sm" />
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-muted-foreground">
              <tr>
                <th className="text-left py-2">Nome</th>
                <th className="text-left py-2">Posicao</th>
                <th className="text-left py-2">Camisa</th>
                <th className="text-left py-2">Tags</th>
                {canManage && <th className="text-right py-2">Acoes</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((player) => (
                <tr key={player.id} className="border-b border-border/40">
                  <td className="py-2">{player.nome}</td>
                  <td className="py-2">{player.posicao || "-"}</td>
                  <td className="py-2">{player.numero_camisa || "-"}</td>
                  <td className="py-2">{(player.tags || []).join(", ") || "-"}</td>
                  {canManage && (
                    <td className="py-2 text-right">
                      <button
                        className="text-xs px-2 py-1 rounded-lg bg-muted/40 mr-1"
                        onClick={() => {
                          setEditingId(player.id);
                          setForm({
                            nome: player.nome,
                            posicao: player.posicao || "",
                            numero_camisa: player.numero_camisa ? String(player.numero_camisa) : "",
                            telefone: player.telefone || "",
                            email: player.email || "",
                            tags: (player.tags || []).join(","),
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button className="text-xs px-2 py-1 rounded-lg bg-destructive/20 text-destructive" onClick={() => deleteMutation.mutate(player.id)}>
                        Remover
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
};

export default PlayersPage;

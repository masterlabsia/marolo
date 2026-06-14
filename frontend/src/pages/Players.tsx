import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { canManageRole } from "@/lib/permissions";
import { createJogador, listJogadores, removeJogador, updateJogador, uploadFotoJogador } from "@/lib/team-api";
import type { Jogador } from "@/types/domain";

const emptyForm = {
  nome: "",
  posicao: "",
  numero_camisa: "",
  tags: "",
  tipo: "mensalista" as "mensalista" | "diarista",
};

const TipoBadge = ({ tipo }: { tipo: Jogador["tipo"] }) =>
  tipo === "diarista" ? (
    <span className="inline-block text-xs px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-medium">Diarista</span>
  ) : (
    <span className="inline-block text-xs px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-medium">Mensalista</span>
  );

const PlayersPage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;
  const canManage = canManageRole(profileData?.role);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);

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
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
        tipo: form.tipo,
      };

      if (editingId) {
        const jogador = await updateJogador(editingId, payload as Partial<Jogador>);
        if (fotoFile && form.tipo === "mensalista") {
          const url = await uploadFotoJogador(perfilId, editingId, fotoFile);
          await updateJogador(editingId, { foto_url: url });
        }
        return jogador;
      }

      return createJogador(perfilId, payload);
    },
    onSuccess: async () => {
      toast.success(editingId ? "Jogador atualizado" : "Jogador criado");
      setForm(emptyForm);
      setEditingId(null);
      setFotoFile(null);
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
            <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="Tags (capitao,reserva)" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Tipo</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="mensalista"
                    checked={form.tipo === "mensalista"}
                    onChange={() => setForm((p) => ({ ...p, tipo: "mensalista" }))}
                  />
                  <span className="text-sm">Mensalista</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="diarista"
                    checked={form.tipo === "diarista"}
                    onChange={() => setForm((p) => ({ ...p, tipo: "diarista" }))}
                  />
                  <span className="text-sm">Diarista (avulso, sem mensalidade)</span>
                </label>
              </div>
            </div>
            {editingId && form.tipo === "mensalista" && (
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Foto</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 2 * 1024 * 1024) {
                      toast.error("Imagem muito grande. Máximo 2 MB.");
                      e.target.value = "";
                      return;
                    }
                    setFotoFile(file);
                  }}
                  className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted/40 file:px-3 file:py-1.5 file:text-sm"
                />
              </div>
            )}
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                {upsertMutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setFotoFile(null); }} className="rounded-xl bg-muted/40 px-4 py-2.5 text-sm">
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
                <th className="w-10 py-2"></th>
                <th className="text-left py-2">Nome</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-left py-2">Posicao</th>
                <th className="text-left py-2">Camisa</th>
                <th className="text-left py-2">Tags</th>
                <th className="text-right py-2">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((player) => (
                <tr key={player.id} className="border-b border-border/40">
                  <td className="py-2">
                    {player.tipo === "mensalista" && (
                      player.foto_url
                        ? <img src={player.foto_url} alt={player.nome} className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-xs font-medium text-muted-foreground">{player.nome.charAt(0).toUpperCase()}</div>
                    )}
                  </td>
                  <td className="py-2">{player.nome}</td>
                  <td className="py-2">
                    <TipoBadge tipo={player.tipo ?? "mensalista"} />
                  </td>
                  <td className="py-2">{player.posicao || "-"}</td>
                  <td className="py-2">{player.numero_camisa || "-"}</td>
                  <td className="py-2">{(player.tags || []).join(", ") || "-"}</td>
                  <td className="py-2 text-right">
                    <Link to={`/jogadores/${player.id}`} className="text-xs px-2 py-1 rounded-lg bg-muted/40 mr-1 inline-block">
                      Timeline
                    </Link>
                    {canManage && (
                      <>
                        <button
                          className="text-xs px-2 py-1 rounded-lg bg-muted/40 mr-1"
                          onClick={() => {
                            setEditingId(player.id);
                            setForm({
                              nome: player.nome,
                              posicao: player.posicao || "",
                              numero_camisa: player.numero_camisa ? String(player.numero_camisa) : "",
                              tags: (player.tags || []).join(","),
                              tipo: player.tipo ?? "mensalista",
                            });
                          }}
                        >
                          Editar
                        </button>
                        <button className="text-xs px-2 py-1 rounded-lg bg-destructive/20 text-destructive" onClick={() => deleteMutation.mutate(player.id)}>
                          Remover
                        </button>
                      </>
                    )}
                  </td>
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

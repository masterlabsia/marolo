import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useMonetaryPrivacy } from "@/hooks/useMonetaryPrivacy";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency } from "@/lib/formatters";
import { canManageRole } from "@/lib/permissions";
import { createCaixa, listCaixa, removeCaixa, updateCaixa } from "@/lib/team-api";

const CashPage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const { hidden } = useMonetaryPrivacy();
  const perfilId = profileData?.perfil?.id;
  const canManage = canManageRole(profileData?.role);

  const [form, setForm] = useState({
    tipo: "entrada",
    categoria: "mensalidade",
    descricao: "",
    valor: "",
    data_movimento: new Date().toISOString().slice(0, 10),
    metodo_pagamento: "pix",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const cashQuery = useQuery({
    queryKey: ["cash", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listCaixa(perfilId as number),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      const payload = {
        tipo: form.tipo as "entrada" | "saida",
        categoria: form.categoria || null,
        descricao: form.descricao,
        valor: Number(form.valor),
        data_movimento: form.data_movimento,
        metodo_pagamento: form.metodo_pagamento || null,
      };

      if (editingId) {
        return updateCaixa(editingId, payload);
      }

      return createCaixa(perfilId, payload);
    },
    onSuccess: async () => {
      toast.success(editingId ? "Movimentacao atualizada" : "Movimentacao registrada");
      setEditingId(null);
      setForm({
        tipo: "entrada",
        categoria: "mensalidade",
        descricao: "",
        valor: "",
        data_movimento: new Date().toISOString().slice(0, 10),
        metodo_pagamento: "pix",
      });
      await queryClient.invalidateQueries({ queryKey: ["cash", perfilId] });
    },
    onError: (error: any) => toast.error(error.message || "Erro ao salvar movimentacao"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeCaixa(id),
    onSuccess: async () => {
      toast.success("Movimentacao excluida");
      await queryClient.invalidateQueries({ queryKey: ["cash", perfilId] });
    },
    onError: (error: any) => toast.error(error.message || "Erro ao excluir movimentacao"),
  });

  const summary = useMemo(() => {
    const rows = cashQuery.data || [];
    const entradas = rows.filter((r) => r.tipo === "entrada").reduce((acc, r) => acc + Number(r.valor), 0);
    const saidas = rows.filter((r) => r.tipo === "saida").reduce((acc, r) => acc + Number(r.valor), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [cashQuery.data]);

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold">Caixa</h1>
      <p className="text-sm text-muted-foreground mb-6">Entradas, saidas e saldo em tempo real.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-card"><p className="label-text">Entradas</p><p className="stat-number text-3xl">{hidden ? "R$ ••••" : formatCurrency(summary.entradas)}</p></div>
        <div className="glass-card"><p className="label-text">Saidas</p><p className="stat-number text-3xl">{hidden ? "R$ ••••" : formatCurrency(summary.saidas)}</p></div>
        <div className="glass-card"><p className="label-text">Saldo</p><p className={`stat-number text-3xl ${summary.saldo < 0 ? "text-destructive" : ""}`}>{hidden ? "R$ ••••" : formatCurrency(summary.saldo)}</p></div>
      </div>

      {canManage && (
        <div className="glass-card mt-4">
          <h2 className="font-semibold mb-3">Nova movimentacao</h2>
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))} className="rounded-xl bg-muted/40 border border-border px-3 py-2.5">
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
            </select>
            <input value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} placeholder="Categoria" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input required value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Descricao" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input required type="number" step="0.01" value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))} placeholder="Valor" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input required type="date" value={form.data_movimento} onChange={(e) => setForm((p) => ({ ...p, data_movimento: e.target.value }))} className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input value={form.metodo_pagamento} onChange={(e) => setForm((p) => ({ ...p, metodo_pagamento: e.target.value }))} placeholder="Metodo" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar alteracoes" : "Registrar"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="rounded-xl bg-muted/40 px-4 py-2.5 text-sm"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      tipo: "entrada",
                      categoria: "mensalidade",
                      descricao: "",
                      valor: "",
                      data_movimento: new Date().toISOString().slice(0, 10),
                      metodo_pagamento: "pix",
                    });
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="glass-card mt-4 overflow-auto">
        <h2 className="font-semibold mb-3">Movimentacoes recentes</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 text-muted-foreground">
            <tr>
              <th className="text-left py-2">Data</th>
              <th className="text-left py-2">Tipo</th>
              <th className="text-left py-2">Descricao</th>
              <th className="text-left py-2">Valor</th>
              {canManage && <th className="text-right py-2">Acoes</th>}
            </tr>
          </thead>
          <tbody>
            {(cashQuery.data || []).map((row) => (
              <tr key={row.id} className="border-b border-border/40">
                <td className="py-2">{new Date(row.data_movimento).toLocaleDateString("pt-BR")}</td>
                <td className="py-2 capitalize">{row.tipo}</td>
                <td className="py-2">{row.descricao}</td>
                <td className={`py-2 ${row.tipo === "entrada" ? "text-success" : "text-destructive"}`}>{hidden ? "R$ ••••" : formatCurrency(Number(row.valor))}</td>
                {canManage && (
                  <td className="py-2 text-right space-x-1">
                    <button
                      className="text-xs px-2 py-1 rounded-lg bg-primary/20 text-primary"
                      onClick={() => {
                        setEditingId(row.id);
                        setForm({
                          tipo: row.tipo,
                          categoria: row.categoria || "",
                          descricao: row.descricao,
                          valor: String(row.valor),
                          data_movimento: row.data_movimento,
                          metodo_pagamento: row.metodo_pagamento || "",
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded-lg bg-destructive/20 text-destructive"
                      onClick={() => deleteMutation.mutate(row.id)}
                    >
                      Excluir
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
};

export default CashPage;

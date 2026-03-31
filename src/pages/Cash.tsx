import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useMonetaryPrivacy } from "@/hooks/useMonetaryPrivacy";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency } from "@/lib/formatters";
import { canManageRole } from "@/lib/permissions";
import { createCaixa, listCaixa, removeCaixa, updateCaixa, updatePerfilConfiguracao } from "@/lib/team-api";

const CashPage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const { hidden } = useMonetaryPrivacy();
  const perfilId = profileData?.perfil?.id;
  const canManage = canManageRole(profileData?.role);
  const now = new Date();

  const [periodoMes, setPeriodoMes] = useState(now.getMonth() + 1);
  const [periodoAno, setPeriodoAno] = useState(now.getFullYear());
  const [form, setForm] = useState({
    tipo: "entrada",
    categoria: "mensalidade",
    descricao: "",
    valor: "",
    data_movimento: new Date().toISOString().slice(0, 10),
    metodo_pagamento: "pix",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const profileConfig = (profileData?.perfil?.configuracao_tema ?? {}) as Record<string, unknown>;
  const closedMonths = Array.isArray(profileConfig.fechamento_mensal)
    ? (profileConfig.fechamento_mensal as string[])
    : [];
  const currentPeriodKey = `${periodoAno}-${String(periodoMes).padStart(2, "0")}`;
  const isPeriodClosed = closedMonths.includes(currentPeriodKey);

  const cashQuery = useQuery({
    queryKey: ["cash", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listCaixa(perfilId as number),
  });

  const filteredRows = useMemo(() => {
    return (cashQuery.data || []).filter((row) => {
      const date = new Date(`${row.data_movimento}T00:00:00`);
      return date.getMonth() + 1 === periodoMes && date.getFullYear() === periodoAno;
    });
  }, [cashQuery.data, periodoAno, periodoMes]);

  const suggestedCategory = useMemo(() => {
    const normalized = form.descricao.trim().toLowerCase();
    if (!normalized || !cashQuery.data?.length) return null;
    const matches = cashQuery.data
      .filter((r) => r.descricao.trim().toLowerCase() === normalized && r.categoria)
      .map((r) => r.categoria as string);
    if (matches.length === 0) return null;
    const frequency = new Map<string, number>();
    matches.forEach((cat) => frequency.set(cat, (frequency.get(cat) || 0) + 1));
    return [...frequency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [cashQuery.data, form.descricao]);

  const duplicateWarning = useMemo(() => {
    const valor = Number(form.valor);
    if (!form.descricao || !form.data_movimento || !Number.isFinite(valor)) return null;
    const same = (cashQuery.data || []).find(
      (r) =>
        r.id !== editingId &&
        r.tipo === form.tipo &&
        Number(r.valor) === valor &&
        r.data_movimento === form.data_movimento &&
        r.descricao.trim().toLowerCase() === form.descricao.trim().toLowerCase(),
    );
    if (!same) return null;
    return `Possivel duplicidade detectada: ${same.descricao} (${same.data_movimento}).`;
  }, [cashQuery.data, editingId, form.data_movimento, form.descricao, form.tipo, form.valor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      if (isPeriodClosed) {
        throw new Error("Periodo fechado. Abra o mes para editar movimentacoes.");
      }
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
    mutationFn: async (id: number) => {
      if (isPeriodClosed) throw new Error("Periodo fechado. Abra o mes para excluir movimentacoes.");
      return removeCaixa(id);
    },
    onSuccess: async () => {
      toast.success("Movimentacao excluida");
      await queryClient.invalidateQueries({ queryKey: ["cash", perfilId] });
    },
    onError: (error: any) => toast.error(error.message || "Erro ao excluir movimentacao"),
  });

  const lockMonthMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      const nextClosed = isPeriodClosed
        ? closedMonths.filter((m) => m !== currentPeriodKey)
        : [...new Set([...closedMonths, currentPeriodKey])];
      await updatePerfilConfiguracao(perfilId, {
        ...profileConfig,
        fechamento_mensal: nextClosed,
      });
    },
    onSuccess: async () => {
      toast.success(isPeriodClosed ? "Mes reaberto para edicao" : "Mes fechado com sucesso");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: any) => toast.error(error.message || "Erro ao atualizar fechamento mensal"),
  });

  const summary = useMemo(() => {
    const entradas = filteredRows.filter((r) => r.tipo === "entrada").reduce((acc, r) => acc + Number(r.valor), 0);
    const saidas = filteredRows.filter((r) => r.tipo === "saida").reduce((acc, r) => acc + Number(r.valor), 0);
    const byCategory = filteredRows
      .filter((r) => r.tipo === "saida")
      .reduce<Record<string, number>>((acc, row) => {
        const key = row.categoria || "sem_categoria";
        acc[key] = (acc[key] || 0) + Number(row.valor || 0);
        return acc;
      }, {});
    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      dreDespesas: Object.entries(byCategory)
        .map(([categoria, valor]) => ({ categoria, valor }))
        .sort((a, b) => b.valor - a.valor),
    };
  }, [filteredRows]);

  const exportCsv = () => {
    const header = "data,tipo,categoria,descricao,valor,metodo_pagamento";
    const rows = filteredRows.map((r) =>
      [r.data_movimento, r.tipo, r.categoria || "", `"${(r.descricao || "").replace(/"/g, '""')}"`, Number(r.valor).toFixed(2), r.metodo_pagamento || ""].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dre_${currentPeriodKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold">Caixa</h1>
      <p className="text-sm text-muted-foreground mb-3">DRE por periodo, conciliacao automatica e fechamento mensal.</p>

      <div className="glass-card mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <input type="number" min={1} max={12} value={periodoMes} onChange={(e) => setPeriodoMes(Number(e.target.value) || 1)} className="w-20 rounded-xl bg-muted/40 border border-border px-3 py-2" />
          <input type="number" value={periodoAno} onChange={(e) => setPeriodoAno(Number(e.target.value) || now.getFullYear())} className="w-24 rounded-xl bg-muted/40 border border-border px-3 py-2" />
          <button className="rounded-xl bg-muted/50 px-3 py-2 text-sm" onClick={exportCsv}>Exportar CSV</button>
          <button className="rounded-xl bg-muted/50 px-3 py-2 text-sm" onClick={() => window.print()}>Exportar PDF</button>
          {canManage && (
            <button className={`rounded-xl px-3 py-2 text-sm ${isPeriodClosed ? "bg-warning/20 text-warning" : "bg-primary text-primary-foreground"}`} onClick={() => lockMonthMutation.mutate()}>
              {lockMonthMutation.isPending ? "Atualizando..." : isPeriodClosed ? "Reabrir mes" : "Fechar mes"}
            </button>
          )}
          <span className={`text-xs ${isPeriodClosed ? "text-warning" : "text-muted-foreground"}`}>{isPeriodClosed ? "Periodo fechado para edicao" : "Periodo aberto para edicao"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-card"><p className="label-text">Receitas</p><p className="stat-number text-3xl">{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(summary.entradas)}</p></div>
        <div className="glass-card"><p className="label-text">Despesas</p><p className="stat-number text-3xl">{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(summary.saidas)}</p></div>
        <div className="glass-card"><p className="label-text">Resultado</p><p className={`stat-number text-3xl ${summary.saldo < 0 ? "text-destructive" : ""}`}>{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(summary.saldo)}</p></div>
      </div>

      <div className="glass-card mt-4">
        <h2 className="font-semibold mb-2">DRE simplificado (despesas por categoria)</h2>
        <div className="space-y-2 text-sm">
          {summary.dreDespesas.length === 0 && <p className="text-muted-foreground">Sem despesas no periodo selecionado.</p>}
          {summary.dreDespesas.map((item) => (
            <div key={item.categoria} className="flex justify-between rounded-xl bg-muted/20 px-3 py-2">
              <span>{item.categoria}</span>
              <span>{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(item.valor)}</span>
            </div>
          ))}
        </div>
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
            <select disabled={isPeriodClosed} value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))} className="rounded-xl bg-muted/40 border border-border px-3 py-2.5">
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
            </select>
            <input disabled={isPeriodClosed} value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} placeholder="Categoria" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input disabled={isPeriodClosed} required value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Descricao" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input disabled={isPeriodClosed} required type="number" step="0.01" value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))} placeholder="Valor" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input disabled={isPeriodClosed} required type="date" value={form.data_movimento} onChange={(e) => setForm((p) => ({ ...p, data_movimento: e.target.value }))} className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            <input disabled={isPeriodClosed} value={form.metodo_pagamento} onChange={(e) => setForm((p) => ({ ...p, metodo_pagamento: e.target.value }))} placeholder="Metodo" className="rounded-xl bg-muted/40 border border-border px-3 py-2.5" />
            {(suggestedCategory || duplicateWarning) && (
              <div className="md:col-span-3 text-xs space-y-1">
                {suggestedCategory && (
                  <p className="text-muted-foreground">
                    Sugestao de categoria por historico: <strong>{suggestedCategory}</strong>{" "}
                    <button type="button" className="underline" onClick={() => setForm((p) => ({ ...p, categoria: suggestedCategory }))}>
                      aplicar
                    </button>
                  </p>
                )}
                {duplicateWarning && <p className="text-warning">{duplicateWarning}</p>}
              </div>
            )}
            <div className="md:col-span-3 flex gap-2">
              <button disabled={isPeriodClosed} type="submit" className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm disabled:opacity-50">
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
        <h2 className="font-semibold mb-3">Movimentacoes do periodo</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 text-muted-foreground">
            <tr>
              <th className="text-left py-2">Data</th>
              <th className="text-left py-2">Tipo</th>
              <th className="text-left py-2">Categoria</th>
              <th className="text-left py-2">Descricao</th>
              <th className="text-left py-2">Valor</th>
              {canManage && <th className="text-right py-2">Acoes</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="border-b border-border/40">
                <td className="py-2">{new Date(row.data_movimento).toLocaleDateString("pt-BR")}</td>
                <td className="py-2 capitalize">{row.tipo}</td>
                <td className="py-2">{row.categoria || "-"}</td>
                <td className="py-2">{row.descricao}</td>
                <td className={`py-2 ${row.tipo === "entrada" ? "text-success" : "text-destructive"}`}>{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(Number(row.valor))}</td>
                {canManage && (
                  <td className="py-2 text-right space-x-1">
                    <button
                      disabled={isPeriodClosed}
                      className="text-xs px-2 py-1 rounded-lg bg-primary/20 text-primary disabled:opacity-50"
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
                      disabled={isPeriodClosed}
                      className="text-xs px-2 py-1 rounded-lg bg-destructive/20 text-destructive disabled:opacity-50"
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

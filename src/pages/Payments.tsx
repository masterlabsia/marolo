import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useMonetaryPrivacy } from "@/hooks/useMonetaryPrivacy";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { canManageRole } from "@/lib/permissions";
import {
  bulkCreateMensalidades,
  closePagamentosMes,
  createCaixa,
  listJogadores,
  listPagamentos,
  listPagamentosInadimplentesAntesDe,
  updatePerfilConfiguracao,
  upsertPagamento,
} from "@/lib/team-api";

const DEFAULT_MENSALIDADE = 130;

function getPreviousMonthYear(month: number, year: number) {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const { hidden } = useMonetaryPrivacy();
  const perfilId = profileData?.perfil?.id;
  const canManage = canManageRole(profileData?.role);

  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [editedValues, setEditedValues] = useState<Record<number, string>>({});
  const profileConfig = (profileData?.perfil?.configuracao_tema ?? {}) as Record<string, unknown>;
  const persistedDefaultMensalidade =
    Number(profileConfig.mensalidade_valor_padrao) > 0
      ? Number(profileConfig.mensalidade_valor_padrao)
      : DEFAULT_MENSALIDADE;
  const [defaultMensalidadeInput, setDefaultMensalidadeInput] = useState(String(persistedDefaultMensalidade));
  const closedMonths = Array.isArray(profileConfig.fechamento_mensalidades)
    ? (profileConfig.fechamento_mensalidades as string[])
    : [];
  const selectedMonthKey = `${ano}-${String(mes).padStart(2, "0")}`;
  const isSelectedMonthClosed = closedMonths.includes(selectedMonthKey);

  useEffect(() => {
    setDefaultMensalidadeInput(String(persistedDefaultMensalidade));
  }, [persistedDefaultMensalidade]);

  const playersQuery = useQuery({
    queryKey: ["players", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogadores(perfilId as number),
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", perfilId, mes, ano],
    enabled: Boolean(perfilId),
    queryFn: () => listPagamentos(perfilId as number, mes, ano),
  });

  const previousDebtQuery = useQuery({
    queryKey: ["payments-debt-before", perfilId, mes, ano],
    enabled: Boolean(perfilId),
    queryFn: () => listPagamentosInadimplentesAntesDe(perfilId as number, mes, ano),
  });

  const generateMonthMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      if (isSelectedMonthClosed) {
        throw new Error("Mes selecionado ja esta fechado.");
      }
      const previous = getPreviousMonthYear(mes, ano);
      const previousMonthKey = `${previous.year}-${String(previous.month).padStart(2, "0")}`;
      if (!closedMonths.includes(previousMonthKey)) {
        const previousMonthRows = await listPagamentos(perfilId, previous.month, previous.year);
        if (previousMonthRows.length > 0) {
          throw new Error(`Feche primeiro ${String(previous.month).padStart(2, "0")}/${previous.year} antes de gerar ${String(mes).padStart(2, "0")}/${ano}.`);
        }
      }
      const ids = (playersQuery.data || []).map((p) => p.id);
      await bulkCreateMensalidades(perfilId, ids, mes, ano, persistedDefaultMensalidade);
    },
    onSuccess: async () => {
      toast.success("Mensalidades geradas com carregamento de inadimplencia anterior");
      await queryClient.invalidateQueries({ queryKey: ["payments", perfilId, mes, ano] });
      await queryClient.invalidateQueries({ queryKey: ["payments-debt-before", perfilId, mes, ano] });
    },
    onError: (error: any) => toast.error(error.message || "Falha ao gerar mensalidades"),
  });

  const closeMonthMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return 0;
      if (isSelectedMonthClosed) {
        return 0;
      }
      const updatedRows = await closePagamentosMes(perfilId, mes, ano);
      const nextClosed = [...new Set([...closedMonths, selectedMonthKey])];
      await updatePerfilConfiguracao(perfilId, {
        ...profileConfig,
        fechamento_mensalidades: nextClosed,
      });
      return updatedRows;
    },
    onSuccess: async (updatedRows) => {
      toast.success(`Fechamento concluido: ${updatedRows || 0} pendencias movidas para vencido.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments", perfilId, mes, ano] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
      ]);
    },
    onError: (error: any) => toast.error(error.message || "Falha ao fechar cobranca do mes"),
  });

  const saveDefaultMensalidadeMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      const value = Number(defaultMensalidadeInput);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Valor padrao invalido");
      }
      await updatePerfilConfiguracao(perfilId, {
        ...profileConfig,
        mensalidade_valor_padrao: value,
      });
    },
    onSuccess: async () => {
      toast.success("Valor padrao salvo");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: any) => toast.error(error.message || "Falha ao salvar valor padrao"),
  });

  const savePaymentMutation = useMutation({
    mutationFn: async (payload: { payment: any; nextStatus?: "pendente" | "pago" | "vencido"; nextValor?: number }) => {
      if (!perfilId) return;
      const payment = payload.payment;
      const nextStatus = payload.nextStatus ?? payment.status;
      const nextValor = payload.nextValor ?? Number(payment.valor);

      const updated = await upsertPagamento(perfilId, {
        jogador_id: payment.jogador_id,
        mes,
        ano,
        valor: Number(nextValor) || 130,
        status: nextStatus,
        data_vencimento: `${ano}-${String(mes).padStart(2, "0")}-10`,
        data_pagamento: nextStatus === "pago" ? new Date().toISOString().slice(0, 10) : null,
      });

      const oldStatus = payment.status;
      const oldValor = Number(payment.valor);
      const diff = Number(nextValor) - oldValor;

      if (oldStatus !== "pago" && nextStatus === "pago") {
        await createCaixa(perfilId, {
          tipo: "entrada",
          categoria: "mensalidade",
          descricao: `Mensalidade ${mes}/${ano} - ${payment.jogador?.nome || payment.jogador_id}`,
          valor: Number(nextValor) || 130,
          data_movimento: new Date().toISOString().slice(0, 10),
          metodo_pagamento: "pix",
        });
      }

      if (oldStatus === "pago" && nextStatus !== "pago") {
        await createCaixa(perfilId, {
          tipo: "saida",
          categoria: "estorno_mensalidade",
          descricao: `Estorno mensalidade ${mes}/${ano} - ${payment.jogador?.nome || payment.jogador_id}`,
          valor: oldValor,
          data_movimento: new Date().toISOString().slice(0, 10),
          metodo_pagamento: "pix",
        });
      }

      if (oldStatus === "pago" && nextStatus === "pago" && diff !== 0) {
        await createCaixa(perfilId, {
          tipo: diff > 0 ? "entrada" : "saida",
          categoria: "ajuste_mensalidade",
          descricao: `Ajuste mensalidade ${mes}/${ano} - ${payment.jogador?.nome || payment.jogador_id}`,
          valor: Math.abs(diff),
          data_movimento: new Date().toISOString().slice(0, 10),
          metodo_pagamento: "pix",
        });
      }

      return updated;
    },
    onSuccess: async (_data, variables) => {
      toast.success("Pagamento salvo");
      if (variables?.payment?.id) {
        setEditedValues((prev) => {
          const next = { ...prev };
          delete next[variables.payment.id];
          return next;
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments", perfilId, mes, ano] }),
        queryClient.invalidateQueries({ queryKey: ["cash", perfilId] }),
      ]);
    },
    onError: (error: any) => toast.error(error.message || "Erro ao salvar pagamento"),
  });

  const rows = paymentsQuery.data || [];
  const previousDebtByJogador = useMemo(() => {
    return (previousDebtQuery.data || []).reduce<Record<number, number>>((acc, row) => {
      acc[row.jogador_id] = (acc[row.jogador_id] || 0) + Number(row.valor || 0);
      return acc;
    }, {});
  }, [previousDebtQuery.data]);

  const summary = useMemo(() => {
    const carryTotal = Object.values(previousDebtByJogador).reduce((acc, value) => acc + Number(value || 0), 0);
    const baseTotal = rows.reduce(
      (acc, r) => acc + Math.min(Number(r.valor || 0), Number(persistedDefaultMensalidade || 0)),
      0,
    );
    const atrasoTotal = rows.reduce(
      (acc, r) => acc + Math.max(0, Number(r.valor || 0) - Number(persistedDefaultMensalidade || 0)),
      0,
    );
    return {
      paid: rows.filter((p) => p.status === "pago").length,
      pending: rows.filter((p) => p.status === "pendente").length,
      overdue: rows.filter((p) => p.status === "vencido").length,
      total: rows.reduce((acc, r) => acc + Number(r.valor || 0), 0),
      carryTotal,
      baseTotal,
      atrasoTotal,
    };
  }, [persistedDefaultMensalidade, previousDebtByJogador, rows]);

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Pagamentos</h1>
          <p className="text-sm text-muted-foreground">Controle mensal de inadimplencia e baixas.</p>
        </div>
        <div className="flex gap-2">
          <input type="number" min={1} max={12} value={mes} onChange={(e) => setMes(Number(e.target.value) || 1)} className="w-16 rounded-xl bg-muted/40 border border-border px-2 py-2" />
          <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value) || now.getFullYear())} className="w-24 rounded-xl bg-muted/40 border border-border px-2 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div className="glass-card"><p className="label-text">Pagos</p><p className="stat-number text-3xl">{summary.paid}</p></div>
        <div className="glass-card"><p className="label-text">Pendentes</p><p className="stat-number text-3xl">{summary.pending}</p></div>
        <div className="glass-card"><p className="label-text">Vencidos</p><p className="stat-number text-3xl">{summary.overdue}</p></div>
        <div className="glass-card"><p className="label-text">Valor previsto</p><p className="stat-number text-3xl">{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(summary.total)}</p></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <div className="glass-card"><p className="label-text">Valor base</p><p className="stat-number text-2xl">{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(summary.baseTotal)}</p></div>
        <div className="glass-card"><p className="label-text">Atraso carregado</p><p className="stat-number text-2xl">{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(summary.atrasoTotal)}</p></div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Inadimplencia acumulada antes de {String(mes).padStart(2, "0")}/{ano}: {hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(summary.carryTotal)}.
      </p>

      {canManage && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground">Valor padrao (R$)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={defaultMensalidadeInput}
            onChange={(e) => setDefaultMensalidadeInput(e.target.value)}
            className="w-28 rounded-xl bg-muted/40 border border-border px-3 py-2"
          />
          {Number(defaultMensalidadeInput || 0) !== persistedDefaultMensalidade && (
            <button
              className="rounded-xl bg-muted/50 px-3 py-2 text-sm"
              onClick={() => saveDefaultMensalidadeMutation.mutate()}
            >
              {saveDefaultMensalidadeMutation.isPending ? "Salvando..." : "Salvar valor padrao"}
            </button>
          )}
          <button
            disabled={isSelectedMonthClosed}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm disabled:opacity-50"
            onClick={() => generateMonthMutation.mutate()}
          >
            {generateMonthMutation.isPending ? "Gerando..." : "Gerar mensalidades do mes"}
          </button>
          <button
            disabled={isSelectedMonthClosed}
            className="rounded-xl bg-warning/20 text-warning px-4 py-2.5 text-sm disabled:opacity-50"
            onClick={() => closeMonthMutation.mutate()}
          >
            {closeMonthMutation.isPending ? "Fechando..." : isSelectedMonthClosed ? "Mes fechado" : "Fechar cobranca do mes"}
          </button>
        </div>
      )}
      <p className={`text-xs mt-2 ${isSelectedMonthClosed ? "text-warning" : "text-muted-foreground"}`}>
        {isSelectedMonthClosed
          ? `Cobranca de ${String(mes).padStart(2, "0")}/${ano} fechada. Edicoes e nova geracao bloqueadas.`
          : "Mes em aberto para ajustes e fechamento."}
      </p>

      <div className="glass-card mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 text-muted-foreground">
            <tr>
              <th className="text-left py-2">Jogador</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Vencimento</th>
              <th className="text-left py-2">Base</th>
              <th className="text-left py-2">Atraso</th>
              <th className="text-left py-2">Valor total</th>
              {canManage && <th className="text-right py-2">Acoes</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((payment) => (
              <tr key={payment.id} className="border-b border-border/40">
                <td className="py-2">{payment.jogador?.nome || payment.jogador_id}</td>
                <td className="py-2 capitalize">{payment.status}</td>
                <td className="py-2">{formatDate(payment.data_vencimento)}</td>
                <td className="py-2">
                  {hidden
                    ? "R$ â€¢â€¢â€¢â€¢"
                    : formatCurrency(Math.min(Number(payment.valor || 0), Number(persistedDefaultMensalidade || 0)))}
                </td>
                <td className="py-2">
                  {hidden
                    ? "R$ â€¢â€¢â€¢â€¢"
                    : formatCurrency(Math.max(0, Number(payment.valor || 0) - Number(persistedDefaultMensalidade || 0)))}
                </td>
                <td className="py-2">
                  {!hidden && Number(previousDebtByJogador[payment.jogador_id] || 0) > 0 && (
                    <p className="text-[11px] text-warning mb-1">
                      Inclui atraso anterior: {formatCurrency(Number(previousDebtByJogador[payment.jogador_id] || 0))}
                    </p>
                  )}
                  {canManage && !hidden ? (
                    <input
                      disabled={isSelectedMonthClosed}
                      type="number"
                      step="0.01"
                      value={editedValues[payment.id] ?? String(payment.valor)}
                      onChange={(e) => setEditedValues((p) => ({ ...p, [payment.id]: e.target.value }))}
                      className="w-28 rounded-lg bg-muted/40 border border-border px-2 py-1 disabled:opacity-50"
                    />
                  ) : (
                    hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(Number(payment.valor))
                  )}
                </td>
                {canManage && (
                  <td className="py-2 text-right space-x-1">
                    {!hidden && Number(editedValues[payment.id] ?? payment.valor) !== Number(payment.valor) && (
                      <button
                        disabled={isSelectedMonthClosed}
                        className="text-xs px-2 py-1 rounded-lg bg-primary/20 text-primary"
                        onClick={() =>
                          savePaymentMutation.mutate({
                            payment,
                            nextValor: Number(editedValues[payment.id] ?? payment.valor),
                          })
                        }
                      >
                        Salvar valor
                      </button>
                    )}
                    {payment.status !== "pago" && (
                      <button
                        disabled={isSelectedMonthClosed}
                        className="text-xs px-2 py-1 rounded-lg bg-success/20 text-success"
                        onClick={() =>
                          savePaymentMutation.mutate({
                            payment,
                            nextStatus: "pago",
                            nextValor: Number(editedValues[payment.id] ?? payment.valor),
                          })
                        }
                      >
                        Marcar pago
                      </button>
                    )}
                    {payment.status === "pago" && (
                      <button
                        disabled={isSelectedMonthClosed}
                        className="text-xs px-2 py-1 rounded-lg bg-warning/20 text-warning"
                        onClick={() =>
                          savePaymentMutation.mutate({
                            payment,
                            nextStatus: "pendente",
                            nextValor: Number(editedValues[payment.id] ?? payment.valor),
                          })
                        }
                      >
                        Desfazer pago
                      </button>
                    )}
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

export default PaymentsPage;

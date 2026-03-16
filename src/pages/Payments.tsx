import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { bulkCreateMensalidades, listJogadores, listPagamentos, upsertPagamento } from "@/lib/team-api";

const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;
  const canManage = profileData?.role === "presidente";

  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

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

  const generateMonthMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      const ids = (playersQuery.data || []).map((p) => p.id);
      await bulkCreateMensalidades(perfilId, ids, mes, ano, 100);
    },
    onSuccess: async () => {
      toast.success("Mensalidades geradas");
      await queryClient.invalidateQueries({ queryKey: ["payments", perfilId, mes, ano] });
    },
    onError: (error: any) => toast.error(error.message || "Falha ao gerar mensalidades"),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (jogadorId: number) => {
      if (!perfilId) return;
      return upsertPagamento(perfilId, {
        jogador_id: jogadorId,
        mes,
        ano,
        valor: 100,
        status: "pago",
        data_vencimento: `${ano}-${String(mes).padStart(2, "0")}-10`,
        data_pagamento: new Date().toISOString().slice(0, 10),
      });
    },
    onSuccess: async () => {
      toast.success("Pagamento atualizado");
      await queryClient.invalidateQueries({ queryKey: ["payments", perfilId, mes, ano] });
    },
    onError: (error: any) => toast.error(error.message || "Erro ao atualizar pagamento"),
  });

  const rows = paymentsQuery.data || [];
  const summary = useMemo(() => {
    return {
      paid: rows.filter((p) => p.status === "pago").length,
      pending: rows.filter((p) => p.status === "pendente").length,
      overdue: rows.filter((p) => p.status === "vencido").length,
      total: rows.reduce((acc, r) => acc + Number(r.valor || 0), 0),
    };
  }, [rows]);

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
        <div className="glass-card"><p className="label-text">Valor previsto</p><p className="stat-number text-3xl">{formatCurrency(summary.total)}</p></div>
      </div>

      {canManage && (
        <button className="mt-4 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm" onClick={() => generateMonthMutation.mutate()}>
          {generateMonthMutation.isPending ? "Gerando..." : "Gerar mensalidades do mes"}
        </button>
      )}

      <div className="glass-card mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 text-muted-foreground">
            <tr>
              <th className="text-left py-2">Jogador</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Vencimento</th>
              <th className="text-left py-2">Valor</th>
              {canManage && <th className="text-right py-2">Acoes</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((payment) => (
              <tr key={payment.id} className="border-b border-border/40">
                <td className="py-2">{payment.jogador?.nome || payment.jogador_id}</td>
                <td className="py-2 capitalize">{payment.status}</td>
                <td className="py-2">{formatDate(payment.data_vencimento)}</td>
                <td className="py-2">{formatCurrency(Number(payment.valor))}</td>
                {canManage && (
                  <td className="py-2 text-right">
                    {payment.status !== "pago" && (
                      <button className="text-xs px-2 py-1 rounded-lg bg-success/20 text-success" onClick={() => markPaidMutation.mutate(payment.jogador_id)}>
                        Marcar pago
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

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { useMonetaryPrivacy } from "@/hooks/useMonetaryPrivacy";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { canManageRole } from "@/lib/permissions";
import { listCaixa, listJogadores, listJogos, listPagamentos, listPresencasByJogo, updatePerfilConfiguracao } from "@/lib/team-api";

const Index = () => {
  const queryClient = useQueryClient();
  const { data: profileData, isLoading: loadingProfile } = useProfile();
  const { hidden } = useMonetaryPrivacy();
  const canManage = canManageRole(profileData?.role);

  const perfilId = profileData?.perfil?.id;

  const playersQuery = useQuery({
    queryKey: ["players", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogadores(perfilId as number),
  });

  const gamesQuery = useQuery({
    queryKey: ["games", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogos(perfilId as number),
  });

  const cashQuery = useQuery({
    queryKey: ["cash", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listCaixa(perfilId as number),
  });

  const now = new Date();
  const profileConfig = (profileData?.perfil?.configuracao_tema ?? {}) as Record<string, unknown>;
  const persistedGoal = Number(profileConfig.meta_financeira_valor) > 0 ? Number(profileConfig.meta_financeira_valor) : 0;
  const persistedDefaultMensalidade = Number(profileConfig.mensalidade_valor_padrao) > 0 ? Number(profileConfig.mensalidade_valor_padrao) : 130;
  const [financialGoalInput, setFinancialGoalInput] = useState(String(persistedGoal || ""));

  useEffect(() => {
    setFinancialGoalInput(persistedGoal ? String(persistedGoal) : "");
  }, [persistedGoal]);
  const paymentsQuery = useQuery({
    queryKey: ["payments", perfilId, now.getMonth() + 1, now.getFullYear()],
    enabled: Boolean(perfilId),
    queryFn: () => listPagamentos(perfilId as number, now.getMonth() + 1, now.getFullYear()),
  });

  const attendanceForLastGames = useQuery({
    queryKey: ["attendance-last-games", gamesQuery.data?.slice(0, 3).map((g) => g.id)],
    enabled: Boolean(gamesQuery.data?.length),
    queryFn: async () => {
      const gameIds = (gamesQuery.data || []).slice(0, 3).map((g) => g.id);
      const byGame = await Promise.all(gameIds.map((id) => listPresencasByJogo(id)));
      return gameIds.map((id, idx) => ({ gameId: id, presencas: byGame[idx] }));
    },
  });

  const attendanceForAllGames = useQuery({
    queryKey: ["attendance-all-games", gamesQuery.data?.map((g) => g.id)],
    enabled: Boolean(gamesQuery.data?.length),
    queryFn: async () => {
      const gameIds = (gamesQuery.data || []).map((g) => g.id);
      const byGame = await Promise.all(gameIds.map((id) => listPresencasByJogo(id)));
      return byGame.flat();
    },
  });

  const saveGoalMutation = useMutation({
    mutationFn: async () => {
      if (!perfilId) return;
      const value = Number(financialGoalInput);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Meta financeira invalida");
      }
      await updatePerfilConfiguracao(perfilId, {
        ...profileConfig,
        meta_financeira_valor: value,
      });
    },
    onSuccess: async () => {
      toast.success("Meta financeira salva");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: any) => toast.error(error.message || "Falha ao salvar meta"),
  });

  const dashboard = useMemo(() => {
    const jogos = gamesQuery.data || [];
    const pagamentos = paymentsQuery.data || [];
    const caixa = cashQuery.data || [];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const saldo = caixa.reduce((acc, mov) => (mov.tipo === "entrada" ? acc + Number(mov.valor) : acc - Number(mov.valor)), 0);
    const caixaMes = caixa.filter((mov) => {
      const data = new Date(`${mov.data_movimento}T00:00:00`);
      return data.getMonth() === currentMonth && data.getFullYear() === currentYear;
    });
    const totalEntradasMes = caixaMes
      .filter((mov) => mov.tipo === "entrada")
      .reduce((acc, mov) => acc + Number(mov.valor || 0), 0);
    const totalSaidasMes = caixaMes
      .filter((mov) => mov.tipo === "saida")
      .reduce((acc, mov) => acc + Number(mov.valor || 0), 0);
    const resultadoMes = totalEntradasMes - totalSaidasMes;
    const saidasDetalhadasMes = caixaMes
      .filter((mov) => mov.tipo === "saida")
      .sort((a, b) => new Date(b.data_movimento).getTime() - new Date(a.data_movimento).getTime());
    const pendentes = pagamentos.filter((p) => p.status !== "pago").length;
    const adimplentes = pagamentos.filter((p) => p.status === "pago").length;
    const pagamentoBaseMes = pagamentos.reduce(
      (acc, p) => acc + Math.min(Number(p.valor || 0), Number(persistedDefaultMensalidade || 0)),
      0,
    );
    const pagamentoAtrasoMes = pagamentos.reduce(
      (acc, p) => acc + Math.max(0, Number(p.valor || 0) - Number(persistedDefaultMensalidade || 0)),
      0,
    );
    const proximoJogo = jogos
      .filter((jogo) => jogo.status === "agendado" && new Date(jogo.data_hora).getTime() >= Date.now())
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())[0];

    const lastGames = attendanceForLastGames.data || [];
    const allAttendance = attendanceForAllGames.data || [];
    const goalsByPlayer = new Map<string, number>();
    const assistsByPlayer = new Map<string, number>();

    allAttendance.forEach((p) => {
      const name = p.jogador?.nome || `Jogador ${p.jogador_id}`;
      goalsByPlayer.set(name, (goalsByPlayer.get(name) || 0) + (p.gols || 0));
      assistsByPlayer.set(name, (assistsByPlayer.get(name) || 0) + (p.assistencias || 0));
    });

    const topScorers = Array.from(goalsByPlayer.entries())
      .map(([nome, gols]) => ({ nome, gols }))
      .sort((a, b) => b.gols - a.gols)
      .slice(0, 5);

    const topAssists = Array.from(assistsByPlayer.entries())
      .map(([nome, assistencias]) => ({ nome, assistencias }))
      .sort((a, b) => b.assistencias - a.assistencias)
      .slice(0, 5);

    const cashByMonth = new Map<string, { entradas: number; saidas: number }>();
    caixa.forEach((mov) => {
      const date = new Date(`${mov.data_movimento}T00:00:00`);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const row = cashByMonth.get(key) || { entradas: 0, saidas: 0 };
      if (mov.tipo === "entrada") row.entradas += Number(mov.valor || 0);
      if (mov.tipo === "saida") row.saidas += Number(mov.valor || 0);
      cashByMonth.set(key, row);
    });
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentMonthCash = cashByMonth.get(currentMonthKey) || { entradas: 0, saidas: 0 };
    const monthlyRows = Array.from(cashByMonth.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 4)
      .map(([, value]) => value);
    const historicalAvgExpense = monthlyRows.length > 1
      ? monthlyRows.slice(1).reduce((acc, item) => acc + item.saidas, 0) / (monthlyRows.length - 1)
      : 0;

    const recentPresenceRate = lastGames.length
      ? Math.round(
          (lastGames.reduce((acc, g) => acc + g.presencas.filter((p) => p.presente).length / Math.max(1, g.presencas.length), 0) /
            lastGames.length) *
            100,
        )
      : 100;

    const totalPagamentos = pendentes + adimplentes;
    const inadimplenciaRate = totalPagamentos > 0 ? (pendentes / totalPagamentos) * 100 : 0;
    const alerts: string[] = [];
    if (inadimplenciaRate >= 30) {
      alerts.push(`Inadimplencia elevada: ${inadimplenciaRate.toFixed(0)}%`);
    }
    if (recentPresenceRate < 70) {
      alerts.push(`Queda de presenca recente: ${recentPresenceRate}% nas ultimas partidas`);
    }
    if (historicalAvgExpense > 0 && currentMonthCash.saidas > historicalAvgExpense * 1.3) {
      alerts.push("Despesas do mes atual acima da media historica");
    }

    const financialGoal = persistedGoal;
    const goalProgress = financialGoal > 0 ? Math.min(100, (currentMonthCash.entradas / financialGoal) * 100) : 0;

    return {
      totalJogadores: playersQuery.data?.length || 0,
      pendentes,
      adimplentes,
      saldo,
      proximoJogo,
      topScorers,
      topAssists,
      recentPresence: lastGames,
      alerts,
      goal: {
        target: financialGoal,
        progress: goalProgress,
        currentEntradas: currentMonthCash.entradas,
      },
      pagamentos: {
        baseMes: pagamentoBaseMes,
        atrasoMes: pagamentoAtrasoMes,
      },
      dre: {
        totalEntradasMes,
        totalSaidasMes,
        resultadoMes,
        saidasDetalhadasMes,
      },
    };
  }, [attendanceForAllGames.data, attendanceForLastGames.data, cashQuery.data, gamesQuery.data, paymentsQuery.data, persistedDefaultMensalidade, persistedGoal, playersQuery.data]);

  if (loadingProfile) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando perfil...</div>;
  }

  if (!profileData?.perfil) {
    return (
      <AppShell>
        <div className="max-w-xl glass-card">
          <h1 className="text-2xl font-bold">Nenhum time cadastrado</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {profileData?.schemaMissing
              ? "Schema do Supabase ainda nao foi aplicado. Execute backend/src/db/schema.sql no SQL Editor do Supabase."
              : "Nenhum time no sistema. Contate o administrador para configurar."}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Visao geral do time e indicadores em tempo real.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card"><p className="label-text">Jogadores</p><p className="stat-number text-3xl">{dashboard.totalJogadores}</p></div>
        <div className="glass-card"><p className="label-text">Pagamentos pendentes</p><p className="stat-number text-3xl">{dashboard.pendentes}</p></div>
        <div className="glass-card"><p className="label-text">Caixa</p><p className="stat-number text-3xl">{hidden ? "R$ ••••" : formatCurrency(dashboard.saldo)}</p></div>
        <div className="glass-card">
          <p className="label-text">Proximo jogo</p>
          <p className="text-sm font-medium mt-2">{dashboard.proximoJogo ? `vs ${dashboard.proximoJogo.adversario}` : "-"}</p>
          <p className="text-xs text-muted-foreground">{dashboard.proximoJogo ? formatDateTime(dashboard.proximoJogo.data_hora) : "Sem jogo agendado"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="glass-card"><p className="label-text">Cobranca base (mes)</p><p className="stat-number text-3xl">{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(dashboard.pagamentos.baseMes)}</p></div>
        <div className="glass-card"><p className="label-text">Atraso carregado (mes)</p><p className="stat-number text-3xl">{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(dashboard.pagamentos.atrasoMes)}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="glass-card">
          <h2 className="font-semibold">Artilheiros (Top 5)</h2>
          <div className="mt-3 space-y-2 text-sm">
            {dashboard.topScorers.length === 0 && <p className="text-muted-foreground">Sem dados ainda.</p>}
            {dashboard.topScorers.map((row) => (
              <div key={row.nome} className="flex justify-between"><span>{row.nome}</span><span>{row.gols}</span></div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <h2 className="font-semibold">Assistencias (Top 5)</h2>
          <div className="mt-3 space-y-2 text-sm">
            {dashboard.topAssists.length === 0 && <p className="text-muted-foreground">Sem dados ainda.</p>}
            {dashboard.topAssists.map((row) => (
              <div key={row.nome} className="flex justify-between"><span>{row.nome}</span><span>{row.assistencias}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card mt-4">
        <h2 className="font-semibold mb-3">Ultimas 3 presencas</h2>
        <div className="space-y-2 text-sm">
          {dashboard.recentPresence.length === 0 && <p className="text-muted-foreground">Sem jogos com presenca registrada.</p>}
          {dashboard.recentPresence.map((g) => {
            const game = gamesQuery.data?.find((x) => x.id === g.gameId);
            const presentes = g.presencas.filter((p) => p.presente).length;
            return (
              <div key={g.gameId} className="flex justify-between rounded-xl bg-muted/20 px-3 py-2">
                <span>{game ? `vs ${game.adversario}` : `Jogo ${g.gameId}`}</span>
                <span>{presentes}/{g.presencas.length}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card mt-4">
        <h2 className="font-semibold mb-3">Meta financeira</h2>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">Meta de receitas do mes:</span>
          {canManage && (
            <>
              <input
                type="number"
                min={0}
                value={financialGoalInput}
                onChange={(e) => setFinancialGoalInput(e.target.value)}
                className="w-32 rounded-xl bg-muted/40 border border-border px-3 py-2"
              />
              {Number(financialGoalInput || 0) !== persistedGoal && (
                <button className="rounded-xl bg-muted/50 px-3 py-2 text-sm" onClick={() => saveGoalMutation.mutate()}>
                  {saveGoalMutation.isPending ? "Salvando..." : "Salvar meta"}
                </button>
              )}
            </>
          )}
          {!canManage && <span className="text-sm">{dashboard.goal.target ? formatCurrency(dashboard.goal.target) : "Nao definida"}</span>}
        </div>
        <div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${dashboard.goal.progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {dashboard.goal.target > 0
            ? `${dashboard.goal.progress.toFixed(1)}% da meta atingida (${hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(dashboard.goal.currentEntradas)} de ${hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(dashboard.goal.target)})`
            : "Defina uma meta para acompanhar o progresso mensal."}
        </p>
      </div>

      <div className="glass-card mt-4">
        <h2 className="font-semibold mb-3">Alertas inteligentes</h2>
        <div className="space-y-2 text-sm">
          {dashboard.alerts.length === 0 && <p className="text-muted-foreground">Nenhum alerta critico no momento.</p>}
          {dashboard.alerts.map((alert) => (
            <div key={alert} className="rounded-xl bg-warning/10 text-warning px-3 py-2">
              {alert}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card mt-4">
        <h2 className="font-semibold mb-1">DRE simplificado (mes atual)</h2>
        <p className="text-xs text-muted-foreground mb-3">Resumo de receitas e despesas com detalhamento das saidas.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-muted/20 px-3 py-2 flex items-center justify-between">
            <span>Receitas</span>
            <span>{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(dashboard.dre.totalEntradasMes)}</span>
          </div>
          <div className="rounded-xl bg-muted/20 px-3 py-2 flex items-center justify-between">
            <span>Despesas</span>
            <span>{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(dashboard.dre.totalSaidasMes)}</span>
          </div>
          <div className="rounded-xl bg-muted/20 px-3 py-2 flex items-center justify-between">
            <span>Resultado</span>
            <span>{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(dashboard.dre.resultadoMes)}</span>
          </div>
        </div>

        <div className="mt-3 space-y-2 text-sm">
          {dashboard.dre.saidasDetalhadasMes.length === 0 && (
            <p className="text-muted-foreground">Sem saidas registradas no mes atual.</p>
          )}
          {dashboard.dre.saidasDetalhadasMes.map((mov) => (
            <div key={mov.id} className="rounded-xl bg-muted/20 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{mov.descricao || "Sem descricao"}</span>
                <span>{hidden ? "R$ â€¢â€¢â€¢â€¢" : formatCurrency(Number(mov.valor || 0))}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mov.data_movimento} {mov.categoria ? `• ${mov.categoria}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card mt-4">
        <h2 className="font-semibold mb-3">Acoes rapidas</h2>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <>
              <Link to="/jogos" className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm">+ Novo jogo</Link>
              <Link to="/jogadores" className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm">+ Novo jogador</Link>
            </>
          )}
          <Link to="/estatisticas" className="px-3 py-2 rounded-xl bg-muted/40 text-sm">Ver estatisticas</Link>
          <Link to="/caixa" className="px-3 py-2 rounded-xl bg-muted/40 text-sm">Caixa</Link>
        </div>
      </div>
    </AppShell>
  );
};

export default Index;

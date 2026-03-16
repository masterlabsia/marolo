import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency, formatDateTime, toSlug } from "@/lib/formatters";
import { createPerfil, listCaixa, listJogadores, listJogos, listPagamentos, listPresencasByJogo } from "@/lib/team-api";

const Index = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profileData, isLoading: loadingProfile } = useProfile();
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");

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

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const slug = `${toSlug(teamName)}-${Math.floor(Math.random() * 1000)}`;
      await createPerfil({ nome_time: teamName, descricao: teamDescription || null, slug }, user.id);
    },
    onSuccess: async () => {
      toast.success("Time criado com sucesso");
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setTeamName("");
      setTeamDescription("");
    },
    onError: (error: any) => toast.error(error.message || "Falha ao criar time"),
  });

  const dashboard = useMemo(() => {
    const jogos = gamesQuery.data || [];
    const pagamentos = paymentsQuery.data || [];
    const caixa = cashQuery.data || [];

    const saldo = caixa.reduce((acc, mov) => (mov.tipo === "entrada" ? acc + Number(mov.valor) : acc - Number(mov.valor)), 0);
    const pendentes = pagamentos.filter((p) => p.status !== "pago").length;
    const adimplentes = pagamentos.filter((p) => p.status === "pago").length;
    const proximoJogo = jogos
      .filter((jogo) => jogo.status === "agendado" && new Date(jogo.data_hora).getTime() >= Date.now())
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())[0];

    const lastGames = attendanceForLastGames.data || [];
    const goalsByPlayer = new Map<string, number>();
    const assistsByPlayer = new Map<string, number>();

    lastGames.forEach((entry) => {
      entry.presencas.forEach((p) => {
        const name = p.jogador?.nome || `Jogador ${p.jogador_id}`;
        goalsByPlayer.set(name, (goalsByPlayer.get(name) || 0) + (p.gols || 0));
        assistsByPlayer.set(name, (assistsByPlayer.get(name) || 0) + (p.assistencias || 0));
      });
    });

    const topScorers = Array.from(goalsByPlayer.entries())
      .map(([nome, gols]) => ({ nome, gols }))
      .sort((a, b) => b.gols - a.gols)
      .slice(0, 5);

    const topAssists = Array.from(assistsByPlayer.entries())
      .map(([nome, assistencias]) => ({ nome, assistencias }))
      .sort((a, b) => b.assistencias - a.assistencias)
      .slice(0, 5);

    return {
      totalJogadores: playersQuery.data?.length || 0,
      pendentes,
      adimplentes,
      saldo,
      proximoJogo,
      topScorers,
      topAssists,
      recentPresence: lastGames,
    };
  }, [attendanceForLastGames.data, cashQuery.data, gamesQuery.data, paymentsQuery.data, playersQuery.data]);

  if (loadingProfile) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando perfil...</div>;
  }

  if (!profileData?.perfil) {
    return (
      <AppShell>
        <div className="max-w-xl glass-card">
          <h1 className="text-2xl font-bold">Crie seu primeiro time</h1>
          <p className="text-sm text-muted-foreground mt-2">Onboarding inicial do presidente para liberar o dashboard.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createTeamMutation.mutate();
            }}
          >
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              placeholder="Nome do time"
              className="w-full rounded-xl bg-muted/40 border border-border px-3 py-2.5"
            />
            <textarea
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Descricao"
              className="w-full rounded-xl bg-muted/40 border border-border px-3 py-2.5"
            />
            <button className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 font-medium" type="submit">
              {createTeamMutation.isPending ? "Criando..." : "Criar time"}
            </button>
          </form>
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
        <div className="glass-card"><p className="label-text">Caixa</p><p className="stat-number text-3xl">{formatCurrency(dashboard.saldo)}</p></div>
        <div className="glass-card">
          <p className="label-text">Proximo jogo</p>
          <p className="text-sm font-medium mt-2">{dashboard.proximoJogo ? `vs ${dashboard.proximoJogo.adversario}` : "-"}</p>
          <p className="text-xs text-muted-foreground">{dashboard.proximoJogo ? formatDateTime(dashboard.proximoJogo.data_hora) : "Sem jogo agendado"}</p>
        </div>
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
        <h2 className="font-semibold mb-3">Acoes rapidas</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/jogos" className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm">+ Novo jogo</Link>
          <Link to="/jogadores" className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm">+ Novo jogador</Link>
          <Link to="/estatisticas" className="px-3 py-2 rounded-xl bg-muted/40 text-sm">Ver estatisticas</Link>
          <Link to="/caixa" className="px-3 py-2 rounded-xl bg-muted/40 text-sm">Caixa</Link>
        </div>
      </div>
    </AppShell>
  );
};

export default Index;

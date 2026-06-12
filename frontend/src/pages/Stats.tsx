import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { listJogadores, listJogos, listPresencasByJogo } from "@/lib/team-api";

const COLORS = ["#0ea5e9", "#22c55e", "#eab308", "#ef4444", "#a855f7"];

type PeriodType = "mes_atual" | "trimestre" | "ano" | "geral";

const StatsPage = () => {
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;
  const [periodType, setPeriodType] = useState<PeriodType>("mes_atual");

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

  const finishedGames = useMemo(
    () => (gamesQuery.data || []).filter((g) => g.status === "realizado" || (g.status as string) === "finalizado"),
    [gamesQuery.data],
  );

  const filteredGames = useMemo(() => {
    const now = new Date();
    if (periodType === "geral") return finishedGames;
    if (periodType === "ano") return finishedGames.filter((g) => new Date(g.data_hora).getFullYear() === now.getFullYear());
    if (periodType === "trimestre") {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterStartMonth, 1);
      return finishedGames.filter((g) => new Date(g.data_hora) >= start);
    }
    return finishedGames.filter((g) => {
      const dt = new Date(g.data_hora);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    });
  }, [finishedGames, periodType]);

  const attendanceQuery = useQuery({
    queryKey: ["attendance-all", filteredGames.map((g) => g.id)],
    enabled: Boolean(filteredGames.length),
    queryFn: async () => {
      const list = await Promise.all(filteredGames.map((g) => listPresencasByJogo(g.id)));
      return list.flat();
    },
  });

  const recentFiveGameIds = useMemo(
    () => [...filteredGames].sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()).slice(0, 5).map((g) => g.id),
    [filteredGames],
  );

  const stats = useMemo(() => {
    const allPlayers = playersQuery.data || [];
    const allAttendance = attendanceQuery.data || [];
    const totalFinishedGames = filteredGames.length;

    const map = new Map<number, { nome: string; gols: number; assistencias: number; jogos: number; presencas: number; forma5: number; participacaoGols: number; score: number }>();
    allPlayers.forEach((p) =>
      map.set(p.id, {
        nome: p.nome,
        gols: 0,
        assistencias: 0,
        jogos: totalFinishedGames,
        presencas: 0,
        forma5: 0,
        participacaoGols: 0,
        score: 0,
      }),
    );

    let totalTeamGoals = 0;
    allAttendance.forEach((a) => {
      const row = map.get(a.jogador_id);
      if (!row) return;
      const gols = Number(a.gols || 0);
      const assistencias = Number(a.assistencias || 0);
      row.gols += gols;
      row.assistencias += assistencias;
      row.presencas += a.presente ? 1 : 0;
      totalTeamGoals += gols;
      if (recentFiveGameIds.includes(a.jogo_id)) {
        row.forma5 += gols * 2 + assistencias;
      }
    });

    const ranking = Array.from(map.values()).map((r) => {
      const participacao = totalTeamGoals > 0 ? ((r.gols + r.assistencias) / totalTeamGoals) * 100 : 0;
      const presencePct = r.jogos > 0 ? (r.presencas / r.jogos) * 100 : 0;
      const score = r.gols * 4 + r.assistencias * 3 + r.forma5 * 2 + presencePct * 0.2;
      return {
        ...r,
        participacaoGols: participacao,
        score,
      };
    }).sort((a, b) => b.score - a.score);

    const totalPresenceSlots = totalFinishedGames * allPlayers.length;
    const totalPresences = allAttendance.filter((a) => a.presente).length;
    const totalAbsences = Math.max(0, totalPresenceSlots - totalPresences);

    return {
      totalTeamGoals,
      ranking,
      goalsChart: ranking.slice(0, 8).map((r) => ({ nome: r.nome.split(" ")[0], gols: r.gols })),
      assistsChart: ranking.slice(0, 8).map((r) => ({ nome: r.nome.split(" ")[0], assistencias: r.assistencias })),
      presenceChart: [
        { name: "Presencas", value: totalPresences },
        { name: "Ausencias", value: totalAbsences },
      ],
    };
  }, [attendanceQuery.data, filteredGames.length, playersQuery.data, recentFiveGameIds]);

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold">Estatisticas</h1>
      <p className="text-sm text-muted-foreground mb-3">Desempenho por periodo com forma recente e ranking ponderado.</p>

      <div className="glass-card mb-4">
        <div className="flex flex-wrap gap-2">
          <button className={`rounded-xl px-3 py-2 text-xs ${periodType === "mes_atual" ? "bg-primary text-primary-foreground" : "bg-muted/40"}`} onClick={() => setPeriodType("mes_atual")}>Mes atual</button>
          <button className={`rounded-xl px-3 py-2 text-xs ${periodType === "trimestre" ? "bg-primary text-primary-foreground" : "bg-muted/40"}`} onClick={() => setPeriodType("trimestre")}>Trimestre</button>
          <button className={`rounded-xl px-3 py-2 text-xs ${periodType === "ano" ? "bg-primary text-primary-foreground" : "bg-muted/40"}`} onClick={() => setPeriodType("ano")}>Ano</button>
          <button className={`rounded-xl px-3 py-2 text-xs ${periodType === "geral" ? "bg-primary text-primary-foreground" : "bg-muted/40"}`} onClick={() => setPeriodType("geral")}>Geral</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card h-80">
          <h2 className="font-semibold mb-2">Top artilheiros</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={stats.goalsChart}>
              <XAxis dataKey="nome" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="gols" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card h-80">
          <h2 className="font-semibold mb-2">Top assistencias</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={stats.assistsChart}>
              <XAxis dataKey="nome" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="assistencias" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="glass-card h-80 lg:col-span-1">
          <h2 className="font-semibold mb-2">Presenca geral</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={stats.presenceChart} dataKey="value" nameKey="name" outerRadius={95} label>
                {stats.presenceChart.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card lg:col-span-2 overflow-auto">
          <h2 className="font-semibold mb-3">Ranking ponderado</h2>
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-muted-foreground">
              <tr>
                <th className="text-left py-2">Jogador</th>
                <th className="text-left py-2">G</th>
                <th className="text-left py-2">A</th>
                <th className="text-left py-2">Forma 5</th>
                <th className="text-left py-2">Part. gols</th>
                <th className="text-left py-2">Presenca %</th>
                <th className="text-left py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {stats.ranking.map((row) => (
                <tr key={row.nome} className="border-b border-border/40">
                  <td className="py-2">{row.nome}</td>
                  <td className="py-2">{row.gols}</td>
                  <td className="py-2">{row.assistencias}</td>
                  <td className="py-2">{row.forma5}</td>
                  <td className="py-2">{row.participacaoGols.toFixed(1)}%</td>
                  <td className="py-2">{row.jogos ? Math.round((row.presencas / row.jogos) * 100) : 0}%</td>
                  <td className="py-2">{row.score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
};

export default StatsPage;

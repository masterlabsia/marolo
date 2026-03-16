import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { listJogadores, listJogos, listPresencasByJogo } from "@/lib/team-api";

const COLORS = ["#0ea5e9", "#22c55e", "#eab308", "#ef4444", "#a855f7"];

const StatsPage = () => {
  const { data: profileData } = useProfile();
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

  const attendanceQuery = useQuery({
    queryKey: ["attendance-all", gamesQuery.data?.map((g) => g.id)],
    enabled: Boolean(gamesQuery.data?.length),
    queryFn: async () => {
      const gameIds = (gamesQuery.data || []).map((g) => g.id);
      const list = await Promise.all(gameIds.map((id) => listPresencasByJogo(id)));
      return list.flat();
    },
  });

  const stats = useMemo(() => {
    const allPlayers = playersQuery.data || [];
    const allAttendance = attendanceQuery.data || [];

    const map = new Map<number, { nome: string; gols: number; assistencias: number; jogos: number; presencas: number }>();
    allPlayers.forEach((p) => map.set(p.id, { nome: p.nome, gols: 0, assistencias: 0, jogos: 0, presencas: 0 }));

    allAttendance.forEach((a) => {
      const row = map.get(a.jogador_id);
      if (!row) return;
      row.gols += a.gols || 0;
      row.assistencias += a.assistencias || 0;
      row.jogos += 1;
      row.presencas += a.presente ? 1 : 0;
    });

    const ranking = Array.from(map.values()).sort((a, b) => b.gols - a.gols);

    return {
      ranking,
      goalsChart: ranking.slice(0, 8).map((r) => ({ nome: r.nome.split(" ")[0], gols: r.gols })),
      assistsChart: ranking.slice(0, 8).map((r) => ({ nome: r.nome.split(" ")[0], assistencias: r.assistencias })),
      presenceChart: [
        { name: "Presencas", value: allAttendance.filter((a) => a.presente).length },
        { name: "Ausencias", value: allAttendance.filter((a) => !a.presente).length },
      ],
    };
  }, [attendanceQuery.data, playersQuery.data]);

  return (
    <AppShell>
      <h1 className="text-2xl md:text-3xl font-display font-bold">Estatisticas</h1>
      <p className="text-sm text-muted-foreground mb-6">Gols, assistencias e tendencia de presencas.</p>

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
          <h2 className="font-semibold mb-2">Top assists</h2>
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
          <h2 className="font-semibold mb-3">Ranking completo</h2>
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-muted-foreground">
              <tr>
                <th className="text-left py-2">Jogador</th>
                <th className="text-left py-2">Gols</th>
                <th className="text-left py-2">Assistencias</th>
                <th className="text-left py-2">Jogos</th>
                <th className="text-left py-2">Presenca %</th>
              </tr>
            </thead>
            <tbody>
              {stats.ranking.map((row) => (
                <tr key={row.nome} className="border-b border-border/40">
                  <td className="py-2">{row.nome}</td>
                  <td className="py-2">{row.gols}</td>
                  <td className="py-2">{row.assistencias}</td>
                  <td className="py-2">{row.jogos}</td>
                  <td className="py-2">{row.jogos ? Math.round((row.presencas / row.jogos) * 100) : 0}%</td>
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

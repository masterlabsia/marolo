import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import jsPDF from "jspdf";
import AppShell from "@/components/Layout/AppShell";
import { useProfile } from "@/hooks/useProfile";
import { listJogadores, listPresencasByJogador } from "@/lib/team-api";
import { formatDate } from "@/lib/formatters";
import type { Jogador } from "@/types/domain";

type PresencaMeta = {
  finalizacoes?: number;
  desarmes?: number;
  minutosJogados?: number;
};

const TipoBadge = ({ tipo }: { tipo: Jogador["tipo"] }) =>
  tipo === "diarista" ? (
    <span className="inline-block text-xs px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-medium">Diarista</span>
  ) : (
    <span className="inline-block text-xs px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-medium">Mensalista</span>
  );

// Tenta carregar imagem de URL e retorna dataURL, ou null em caso de falha CORS/rede
async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const PlayerStatsPage = () => {
  const { playerId } = useParams();
  const numericPlayerId = Number(playerId);
  const { data: profileData } = useProfile();
  const perfilId = profileData?.perfil?.id;
  const [pdfLoading, setPdfLoading] = useState(false);

  const playersQuery = useQuery({
    queryKey: ["players", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogadores(perfilId as number),
  });

  const presencasQuery = useQuery({
    queryKey: ["player-presences", perfilId, numericPlayerId],
    enabled: Boolean(perfilId && numericPlayerId),
    queryFn: () => listPresencasByJogador(perfilId as number, numericPlayerId),
  });

  const selectedPlayer = useMemo(
    () => (playersQuery.data || []).find((p) => p.id === numericPlayerId),
    [numericPlayerId, playersQuery.data],
  );

  const computedStats = useMemo(() => {
    const presencas = presencasQuery.data ?? [];
    const jogados = presencas.filter(
      (p) => p.jogo?.status === "realizado" || (p.jogo?.status as string) === "finalizado",
    );

    const totalJogos = jogados.length;
    const totalPresentes = jogados.filter((p) => p.presente).length;
    const totalGols = jogados.reduce((s, p) => s + Number(p.gols || 0), 0);
    const totalAssistencias = jogados.reduce((s, p) => s + Number(p.assistencias || 0), 0);
    const totalAmareloes = jogados.reduce((s, p) => s + Number(p.cartoes?.amarelo || 0), 0);
    const totalVermelhos = jogados.reduce((s, p) => s + Number(p.cartoes?.vermelho || 0), 0);

    const avaliacoes = jogados
      .filter((p) => p.presente && p.avaliacao != null)
      .map((p) => Number(p.avaliacao));
    const avgAvaliacao = avaliacoes.length
      ? avaliacoes.reduce((s, v) => s + v, 0) / avaliacoes.length
      : 0;

    const presencaPct = totalJogos > 0 ? (totalPresentes / totalJogos) * 100 : 0;

    const metas: PresencaMeta[] = jogados
      .filter((p) => p.presente && p.notas)
      .map((p) => {
        try { return JSON.parse(p.notas!) as PresencaMeta; }
        catch { return null; }
      })
      .filter(Boolean) as PresencaMeta[];

    const totalMinutos = metas.reduce((s, m) => s + Number(m.minutosJogados || 0), 0);
    const totalFinalizacoes = metas.reduce((s, m) => s + Number(m.finalizacoes || 0), 0);
    const totalDesarmes = metas.reduce((s, m) => s + Number(m.desarmes || 0), 0);

    const radarData = [
      { subject: "Gols", value: Math.min(100, (totalGols / 20) * 100), fullMark: 100 },
      { subject: "Assistências", value: Math.min(100, (totalAssistencias / 15) * 100), fullMark: 100 },
      { subject: "Presença %", value: presencaPct, fullMark: 100 },
      { subject: "Avaliação", value: avgAvaliacao * 10, fullMark: 100 },
      { subject: "Finalizações", value: Math.min(100, (totalFinalizacoes / 50) * 100), fullMark: 100 },
      { subject: "Desarmes", value: Math.min(100, (totalDesarmes / 40) * 100), fullMark: 100 },
    ];

    const gameHistory = [...jogados]
      .sort((a, b) => new Date(b.jogo?.data_hora || 0).getTime() - new Date(a.jogo?.data_hora || 0).getTime())
      .slice(0, 15);

    return {
      totalGols, totalAssistencias, totalAmareloes, totalVermelhos,
      presencaPct, avgAvaliacao, totalMinutos, totalJogos, totalPresentes,
      totalFinalizacoes, totalDesarmes, radarData, gameHistory,
    };
  }, [presencasQuery.data]);

  const downloadPDF = async () => {
    if (!selectedPlayer) return;
    setPdfLoading(true);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const DARK = [15, 23, 42] as const;
      const CARD = [30, 41, 59] as const;
      const CARD2 = [22, 34, 54] as const;
      const PRIMARY = [14, 165, 233] as const;
      const TEXT = [241, 245, 249] as const;
      const MUTED = [100, 116, 139] as const;
      const AMBER = [251, 191, 36] as const;
      const RED = [239, 68, 68] as const;

      // Fundo total
      doc.setFillColor(...DARK);
      doc.rect(0, 0, W, 297, "F");

      // Barra header
      doc.setFillColor(...PRIMARY);
      doc.rect(0, 0, W, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(profileData?.perfil?.nome_time || "Marolo", 10, 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Perfil do Jogador", W - 10, 14, { align: "right" });

      let y = 32;

      // Foto do jogador (círculo)
      const PHOTO_SIZE = 24;
      const photoX = 10;
      const photoY = y;
      let photoLoaded = false;

      if (selectedPlayer.foto_url) {
        const dataUrl = await urlToDataUrl(selectedPlayer.foto_url);
        if (dataUrl) {
          // Clippath circular via retângulo arredondado (jsPDF não tem clip circular nativo)
          doc.addImage(dataUrl, "JPEG", photoX, photoY, PHOTO_SIZE, PHOTO_SIZE, undefined, "FAST");
          photoLoaded = true;
        }
      }

      if (!photoLoaded) {
        // Iniciais como fallback
        doc.setFillColor(...PRIMARY);
        doc.circle(photoX + PHOTO_SIZE / 2, photoY + PHOTO_SIZE / 2, PHOTO_SIZE / 2, "F");
        doc.setTextColor(...TEXT);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(
          selectedPlayer.nome.charAt(0).toUpperCase(),
          photoX + PHOTO_SIZE / 2,
          photoY + PHOTO_SIZE / 2 + 5,
          { align: "center" },
        );
      }

      // Nome e info do jogador (ao lado da foto)
      const textX = photoX + PHOTO_SIZE + 6;
      doc.setTextColor(...TEXT);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(selectedPlayer.nome, textX, y + 9);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      const sub = [
        selectedPlayer.posicao || "Sem posição",
        selectedPlayer.numero_camisa ? `#${selectedPlayer.numero_camisa}` : null,
        selectedPlayer.tipo === "diarista" ? "Diarista" : "Mensalista",
      ].filter(Boolean).join("   ·   ");
      doc.text(sub, textX, y + 17);

      y += PHOTO_SIZE + 10;

      // ── Stats cards (2x2) ──────────────────────────────────────────
      const cardW = (W - 25) / 2;
      const cardH = 20;
      const cardGap = 5;
      const cards = [
        { label: "GOLS", value: String(computedStats.totalGols), color: PRIMARY },
        { label: "ASSISTÊNCIAS", value: String(computedStats.totalAssistencias), color: PRIMARY },
        {
          label: "PRESENÇA",
          value: `${computedStats.presencaPct.toFixed(0)}%`,
          sub: `${computedStats.totalPresentes}/${computedStats.totalJogos} jogos`,
          color: PRIMARY,
        },
        { label: "AVALIAÇÃO MÉDIA", value: computedStats.avgAvaliacao.toFixed(1), color: PRIMARY },
      ];

      cards.forEach((card, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = 10 + col * (cardW + cardGap);
        const cy = y + row * (cardH + cardGap);

        doc.setFillColor(...CARD);
        doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "F");

        doc.setTextColor(...MUTED);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(card.label, cx + 4, cy + 6);

        doc.setTextColor(...(card.color as [number, number, number]));
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(card.value, cx + 4, cy + 15);

        if (card.sub) {
          doc.setTextColor(...MUTED);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.text(card.sub, cx + cardW - 4, cy + 15, { align: "right" });
        }
      });

      y += 2 * (cardH + cardGap) + 4;

      // ── Disciplina & Volume ────────────────────────────────────────
      doc.setFillColor(...CARD);
      doc.roundedRect(10, y, W - 20, 32, 2, 2, "F");

      doc.setTextColor(...MUTED);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("DISCIPLINA & VOLUME", 14, y + 7);

      const discItems = [
        { label: "Amarelos", value: String(computedStats.totalAmareloes), color: AMBER },
        { label: "Vermelhos", value: String(computedStats.totalVermelhos), color: RED },
        { label: "Minutos", value: String(computedStats.totalMinutos), color: TEXT },
        { label: "Finalizações", value: String(computedStats.totalFinalizacoes), color: TEXT },
        { label: "Desarmes", value: String(computedStats.totalDesarmes), color: TEXT },
      ];
      const discW = (W - 20) / discItems.length;
      discItems.forEach((item, i) => {
        const cx = 10 + i * discW + discW / 2;
        doc.setTextColor(...(item.color as [number, number, number]));
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(item.value, cx, y + 20, { align: "center" });
        doc.setTextColor(...MUTED);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(item.label, cx, y + 27, { align: "center" });
      });

      y += 38;

      // ── Últimos jogos ──────────────────────────────────────────────
      if (computedStats.gameHistory.length > 0) {
        doc.setTextColor(...MUTED);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("ÚLTIMOS JOGOS", 10, y);
        y += 4;

        // Cabeçalho da tabela
        doc.setFillColor(...CARD);
        doc.rect(10, y, W - 20, 7, "F");
        doc.setTextColor(...MUTED);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        const cols = [13, 42, 105, 125, 138, 150, 163];
        const headers = ["DATA", "ADVERSÁRIO", "RES", "P", "G", "A", "NOTA"];
        headers.forEach((h, i) => doc.text(h, cols[i], y + 5));
        y += 7;

        computedStats.gameHistory.slice(0, 10).forEach((p, i) => {
          if (i % 2 === 0) {
            doc.setFillColor(...CARD2);
            doc.rect(10, y, W - 20, 7, "F");
          }
          const res = p.jogo?.resultado
            ? `${p.jogo.resultado.gols_nossos}-${p.jogo.resultado.gols_adversario}`
            : "-";

          doc.setFontSize(6.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...TEXT);
          doc.text(formatDate(p.jogo?.data_hora || null) || "-", cols[0], y + 5);
          doc.text((p.jogo?.adversario || "-").substring(0, 18), cols[1], y + 5);
          doc.text(res, cols[2], y + 5);
          doc.setTextColor(p.presente ? 34 : 239, p.presente ? 197 : 68, p.presente ? 94 : 68);
          doc.text(p.presente ? "✓" : "✗", cols[3], y + 5);
          doc.setTextColor(...TEXT);
          doc.text(String(Number(p.gols || 0)), cols[4], y + 5);
          doc.text(String(Number(p.assistencias || 0)), cols[5], y + 5);
          doc.text(p.avaliacao != null ? Number(p.avaliacao).toFixed(1) : "-", cols[6], y + 5);
          y += 7;
        });
      }

      // ── Footer ─────────────────────────────────────────────────────
      doc.setFillColor(...CARD);
      doc.rect(0, 285, W, 12, "F");
      doc.setTextColor(...MUTED);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text("Gerado por Marolo", W / 2, 292, { align: "center" });

      const filename = `stats-${selectedPlayer.nome.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      doc.save(filename);
    } finally {
      setPdfLoading(false);
    }
  };

  const isLoading = playersQuery.isLoading || presencasQuery.isLoading;

  if (!isLoading && !selectedPlayer) {
    return (
      <AppShell>
        <p className="text-muted-foreground">Jogador não encontrado.</p>
        <Link to="/jogadores" className="rounded-xl bg-muted/40 px-3 py-2 text-sm mt-4 inline-block">
          Voltar
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-20 h-20 rounded-full bg-muted/40 animate-pulse" />
          ) : selectedPlayer?.foto_url ? (
            <img
              src={selectedPlayer.foto_url}
              alt={selectedPlayer.nome}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
              {selectedPlayer?.nome.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            {isLoading ? (
              <div className="h-8 w-40 bg-muted/40 rounded animate-pulse" />
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-display font-bold">{selectedPlayer?.nome}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-muted-foreground">{selectedPlayer?.posicao || "Sem posição"}</span>
                  {selectedPlayer?.numero_camisa && (
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground">
                      #{selectedPlayer.numero_camisa}
                    </span>
                  )}
                  {selectedPlayer && <TipoBadge tipo={selectedPlayer.tipo ?? "mensalista"} />}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          {!isLoading && (
            <button
              onClick={downloadPDF}
              disabled={pdfLoading}
              className="rounded-xl bg-primary/20 text-primary px-3 py-2 text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              {pdfLoading ? "Gerando..." : "↓ PDF"}
            </button>
          )}
          <Link to={`/jogadores/${numericPlayerId}`} className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
            Timeline
          </Link>
          <Link to="/jogadores" className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
            Voltar
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="glass-card">
            <p className="label-text">Gols</p>
            <p className="stat-number text-3xl">{computedStats.totalGols}</p>
          </div>
          <div className="glass-card">
            <p className="label-text">Assistências</p>
            <p className="stat-number text-3xl">{computedStats.totalAssistencias}</p>
          </div>
          <div className="glass-card">
            <p className="label-text">Presença</p>
            <p className="stat-number text-3xl">{computedStats.presencaPct.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-1">{computedStats.totalPresentes}/{computedStats.totalJogos} jogos</p>
          </div>
          <div className="glass-card">
            <p className="label-text">Avaliação média</p>
            <p className="stat-number text-3xl">{computedStats.avgAvaliacao.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Radar + Disciplinar */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="glass-card h-80 animate-pulse" />
          <div className="glass-card animate-pulse h-80" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="glass-card h-80">
            <h2 className="font-semibold mb-2">Radar de atributos</h2>
            <ResponsiveContainer width="100%" height="90%">
              <RadarChart data={computedStats.radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 9 }} tickCount={3} />
                <Radar
                  name={selectedPlayer?.nome}
                  dataKey="value"
                  fill="#0ea5e9"
                  fillOpacity={0.25}
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
                <Tooltip formatter={(v: number) => v.toFixed(1)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card">
            <h2 className="font-semibold mb-4">Disciplina & Volume</h2>
            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              <div>
                <p className="text-2xl font-bold text-amber-400">{computedStats.totalAmareloes}</p>
                <p className="text-xs text-muted-foreground mt-1">Amarelos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{computedStats.totalVermelhos}</p>
                <p className="text-xs text-muted-foreground mt-1">Vermelhos</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{computedStats.totalMinutos}</p>
                <p className="text-xs text-muted-foreground mt-1">Minutos</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-muted/20 p-3">
                <p className="text-xl font-bold">{computedStats.totalFinalizacoes}</p>
                <p className="text-xs text-muted-foreground mt-1">Finalizações</p>
              </div>
              <div className="rounded-xl bg-muted/20 p-3">
                <p className="text-xl font-bold">{computedStats.totalDesarmes}</p>
                <p className="text-xs text-muted-foreground mt-1">Desarmes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game history */}
      {isLoading ? (
        <div className="glass-card h-48 animate-pulse" />
      ) : (
        <div className="glass-card overflow-auto">
          <h2 className="font-semibold mb-3">Últimos {computedStats.gameHistory.length} jogos</h2>
          {computedStats.gameHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem jogos registrados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 text-muted-foreground">
                <tr>
                  <th className="text-left py-2">Data</th>
                  <th className="text-left py-2">Adversário</th>
                  <th className="text-left py-2">Resultado</th>
                  <th className="text-left py-2">P</th>
                  <th className="text-left py-2">G</th>
                  <th className="text-left py-2">A</th>
                  <th className="text-left py-2">Nota</th>
                </tr>
              </thead>
              <tbody>
                {computedStats.gameHistory.map((p) => (
                  <tr key={p.id} className="border-b border-border/40">
                    <td className="py-2">{formatDate(p.jogo?.data_hora || null)}</td>
                    <td className="py-2">{p.jogo?.adversario || "-"}</td>
                    <td className="py-2">
                      {p.jogo?.resultado
                        ? `${p.jogo.resultado.gols_nossos}-${p.jogo.resultado.gols_adversario}`
                        : "-"}
                    </td>
                    <td className="py-2">
                      {p.presente
                        ? <span className="text-green-400">✓</span>
                        : <span className="text-destructive">✗</span>}
                    </td>
                    <td className="py-2">{Number(p.gols || 0)}</td>
                    <td className="py-2">{Number(p.assistencias || 0)}</td>
                    <td className="py-2">{p.avaliacao != null ? Number(p.avaliacao).toFixed(1) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default PlayerStatsPage;

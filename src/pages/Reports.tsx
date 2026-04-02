import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import AppShell from "@/components/Layout/AppShell";
import { useMonetaryPrivacy } from "@/hooks/useMonetaryPrivacy";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency } from "@/lib/formatters";
import { listCaixa, listJogos, listPagamentos, listPresencasByJogo } from "@/lib/team-api";
import { downloadSimplePdf } from "@/lib/pdf";

function padMonth(value: number) {
  return String(value).padStart(2, "0");
}

const ReportsPage = () => {
  const { data: profileData } = useProfile();
  const { hidden } = useMonetaryPrivacy();
  const perfilId = profileData?.perfil?.id;

  const now = new Date();
  const [params] = useSearchParams();
  const [mes, setMes] = useState(Number(params.get("mes")) || now.getMonth() + 1);
  const [ano, setAno] = useState(Number(params.get("ano")) || now.getFullYear());

  const jogosQuery = useQuery({
    queryKey: ["games", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listJogos(perfilId as number),
  });

  const pagamentosQuery = useQuery({
    queryKey: ["payments", perfilId, mes, ano],
    enabled: Boolean(perfilId),
    queryFn: () => listPagamentos(perfilId as number, mes, ano),
  });

  const caixaQuery = useQuery({
    queryKey: ["cash", perfilId],
    enabled: Boolean(perfilId),
    queryFn: () => listCaixa(perfilId as number),
  });

  const attendanceQuery = useQuery({
    queryKey: ["report-attendance", perfilId, mes, ano, jogosQuery.data?.length],
    enabled: Boolean(perfilId && jogosQuery.data),
    queryFn: async () => {
      const monthGames = (jogosQuery.data || []).filter((game) => {
        const dt = new Date(game.data_hora);
        return dt.getMonth() + 1 === mes && dt.getFullYear() === ano;
      });
      const allPresence = await Promise.all(monthGames.map((game) => listPresencasByJogo(game.id)));
      return { monthGames, rows: allPresence.flat() };
    },
  });

  const report = useMemo(() => {
    const pagamentos = pagamentosQuery.data || [];
    const caixa = (caixaQuery.data || []).filter((row) => {
      const dt = new Date(`${row.data_movimento}T00:00:00`);
      return dt.getMonth() + 1 === mes && dt.getFullYear() === ano;
    });
    const monthGames = attendanceQuery.data?.monthGames || [];
    const presenceRows = attendanceQuery.data?.rows || [];

    const receitas = caixa.filter((mov) => mov.tipo === "entrada").reduce((acc, mov) => acc + Number(mov.valor || 0), 0);
    const despesas = caixa.filter((mov) => mov.tipo === "saida").reduce((acc, mov) => acc + Number(mov.valor || 0), 0);
    const resultado = receitas - despesas;

    const pagos = pagamentos.filter((p) => p.status === "pago").length;
    const pendentes = pagamentos.filter((p) => p.status === "pendente").length;
    const vencidos = pagamentos.filter((p) => p.status === "vencido").length;
    const atletasVencidos = pagamentos
      .filter((p) => p.status === "vencido")
      .map((p) => p.jogador?.nome || `Jogador ${p.jogador_id}`)
      .sort((a, b) => a.localeCompare(b));
    const totalMensalidades = pagamentos.reduce((acc, row) => acc + Number(row.valor || 0), 0);

    const jogosRealizados = monthGames.filter((j) => j.status === "realizado" || j.status === "finalizado");
    const placares = jogosRealizados
      .map((j) => j.resultado)
      .filter(Boolean) as Array<{ gols_nossos?: number; gols_adversario?: number }>;
    const golsPro = placares.reduce((acc, row) => acc + Number(row.gols_nossos || 0), 0);
    const golsContra = placares.reduce((acc, row) => acc + Number(row.gols_adversario || 0), 0);
    const vitorias = placares.filter((row) => Number(row.gols_nossos || 0) > Number(row.gols_adversario || 0)).length;
    const empates = placares.filter((row) => Number(row.gols_nossos || 0) === Number(row.gols_adversario || 0)).length;
    const derrotas = placares.length - vitorias - empates;

    const scorerMap = new Map<string, number>();
    presenceRows.forEach((row) => {
      const name = row.jogador?.nome || `Jogador ${row.jogador_id}`;
      scorerMap.set(name, (scorerMap.get(name) || 0) + Number(row.gols || 0));
    });
    const topScorers = Array.from(scorerMap.entries())
      .map(([nome, gols]) => ({ nome, gols }))
      .sort((a, b) => b.gols - a.gols)
      .slice(0, 5);

    return {
      receitas,
      despesas,
      resultado,
      pagos,
      pendentes,
      vencidos,
      atletasVencidos,
      totalMensalidades,
      jogosRealizados: jogosRealizados.length,
      golsPro,
      golsContra,
      vitorias,
      empates,
      derrotas,
      topScorers,
    };
  }, [attendanceQuery.data, caixaQuery.data, mes, ano, pagamentosQuery.data]);

  const reportLines = useMemo(() => {
    const teamName = profileData?.perfil?.nome_time || "Marolo";
    return [
      `${teamName} - Relatorio mensal`,
      `Competencia: ${padMonth(mes)}/${ano}`,
      "",
      "Financeiro",
      `Receitas: ${formatCurrency(report.receitas)}`,
      `Despesas: ${formatCurrency(report.despesas)}`,
      `Resultado: ${formatCurrency(report.resultado)}`,
      "",
      "Mensalidades",
      `Pagos: ${report.pagos}`,
      `Pendentes: ${report.pendentes}`,
      `Vencidos: ${report.vencidos}`,
      "Atletas com pagamento vencido:",
      ...(report.atletasVencidos.length ? report.atletasVencidos.map((nome) => `- ${nome}`) : ["- Nenhum"]),
      `Valor previsto: ${formatCurrency(report.totalMensalidades)}`,
      "",
      "Desempenho esportivo",
      `Jogos realizados: ${report.jogosRealizados}`,
      `Campanha: ${report.vitorias}V ${report.empates}E ${report.derrotas}D`,
      `Gols pro: ${report.golsPro}`,
      `Gols contra: ${report.golsContra}`,
      "",
      "Top artilheiros no periodo",
      ...(report.topScorers.length
        ? report.topScorers.map((row, index) => `${index + 1}. ${row.nome}: ${row.gols}`)
        : ["Sem dados"]),
    ];
  }, [ano, mes, profileData?.perfil?.nome_time, report]);

  const shareMessage = useMemo(
    () =>
      `Resumo ${padMonth(mes)}/${ano} - ${profileData?.perfil?.nome_time || "Marolo"}%0A` +
      `Financeiro: ${encodeURIComponent(formatCurrency(report.receitas))} entradas, ${encodeURIComponent(formatCurrency(report.despesas))} saidas.%0A` +
      `Resultado: ${encodeURIComponent(formatCurrency(report.resultado))}.%0A` +
      `Mensalidades: pagos ${report.pagos}, pendentes ${report.pendentes}, vencidos ${report.vencidos}.%0A` +
      `Atletas vencidos: ${encodeURIComponent(report.atletasVencidos.length ? report.atletasVencidos.join(", ") : "nenhum")}.%0A` +
      `Campanha: ${report.vitorias}V-${report.empates}E-${report.derrotas}D.`,
    [ano, mes, profileData?.perfil?.nome_time, report],
  );

  const handleExportAndAutoSend = async () => {
    const filename = `relatorio_${ano}_${padMonth(mes)}.pdf`;
    downloadSimplePdf(filename, reportLines);
    toast.success("PDF gerado");

    const plainText = reportLines.join("\n");
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Relatorio ${padMonth(mes)}/${ano}`,
          text: plainText,
        });
        toast.success("Resumo enviado");
        return;
      }
    } catch {
      // ignore and fallback below
    }

    const whatsappUrl = `https://wa.me/?text=${shareMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    toast.info("Envio automatico disparado via WhatsApp Web");
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Relatorios</h1>
          <p className="text-sm text-muted-foreground">Resumo financeiro e esportivo mensal com PDF e envio automatico.</p>
        </div>
        <div className="flex gap-2">
          <input type="number" min={1} max={12} value={mes} onChange={(e) => setMes(Number(e.target.value) || 1)} className="w-16 rounded-xl bg-muted/40 border border-border px-2 py-2" />
          <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value) || now.getFullYear())} className="w-24 rounded-xl bg-muted/40 border border-border px-2 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <div className="glass-card">
          <p className="label-text">Receitas</p>
          <p className="stat-number text-3xl">{hidden ? "R$ ****" : formatCurrency(report.receitas)}</p>
        </div>
        <div className="glass-card">
          <p className="label-text">Despesas</p>
          <p className="stat-number text-3xl">{hidden ? "R$ ****" : formatCurrency(report.despesas)}</p>
        </div>
        <div className="glass-card">
          <p className="label-text">Resultado</p>
          <p className="stat-number text-3xl">{hidden ? "R$ ****" : formatCurrency(report.resultado)}</p>
        </div>
      </div>

      <div className="glass-card mt-4">
        <h2 className="font-semibold mb-3">Resumo do periodo</h2>
        <div className="space-y-2 text-sm">
          {reportLines.map((line, index) => (
            <p key={`${line}_${index}`} className={line === "" ? "h-2" : ""}>
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="glass-card mt-4">
        <h2 className="font-semibold mb-3">Atletas com pagamento vencido</h2>
        <div className="space-y-2 text-sm">
          {report.atletasVencidos.length ? (
            report.atletasVencidos.map((nome) => (
              <p key={nome} className="rounded-xl bg-warning/10 text-warning px-3 py-2">
                {nome}
              </p>
            ))
          ) : (
            <p className="text-muted-foreground">Nenhum atleta com pagamento vencido neste periodo.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={handleExportAndAutoSend} className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm">
          Exportar PDF e enviar resumo
        </button>
      </div>
    </AppShell>
  );
};

export default ReportsPage;

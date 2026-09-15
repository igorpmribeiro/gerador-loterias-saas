"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis";
import { LOTTERIES, type LotteryId } from "@/lib/lotteries";
import {
  analysisApiUrl,
  analysisPath,
  type AnalysisWindow,
} from "@/lib/analysis-window";
import { useLottery } from "@/components/lottery-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { AnalysisView } from "@/components/analysis-view";
import { SectionLoading, SectionMessage } from "@/components/section-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Parte interativa da análise. O servidor já entregou a combinação
 * `initialLottery` + `initialWindow` renderizada; este componente só assume
 * quando o usuário troca de loteria ou de janela.
 *
 * A seleção vai para a URL (`?loteria=&janela=`) por três motivos: sobrevive a
 * um refresh, pode ser compartilhada, e dá ao buscador um endereço próprio
 * para cada recorte.
 */
export function AnalysisPageClient({
  initialLottery,
  lotteryFromUrl,
  initialWindow,
  initialData,
}: {
  initialLottery: LotteryId;
  /** A loteria veio de `?loteria=` (e não do padrão da rota). */
  lotteryFromUrl: boolean;
  initialWindow: AnalysisWindow;
  initialData: AnalysisResult | null;
}) {
  const { lottery, cfg, dataVersion, setLottery } = useLottery();
  const [windowSize, setWindowSize] = useState<AnalysisWindow>(initialWindow);
  /** Antes de hidratar, vale a loteria do servidor — é a que está na tela. */
  const [hydrated, setHydrated] = useState(false);
  const adopted = useRef(false);

  // Quando a URL pede uma loteria explícita, ela vence a preferência salva no
  // navegador: foi esse endereço que o usuário (ou o buscador) abriu. Sem
  // `?loteria=`, a preferência salva continua mandando.
  /* eslint-disable react-hooks/set-state-in-effect -- a troca de
     "renderizado no servidor" para "controlado pelo cliente" só pode
     acontecer depois da hidratação; é exatamente o que este estado marca. */
  useEffect(() => {
    if (adopted.current) {
      setHydrated(true);
      return;
    }
    adopted.current = true;
    if (lotteryFromUrl && lottery !== initialLottery) {
      setLottery(initialLottery);
      return; // espera o contexto refletir antes de assumir o controle
    }
    setHydrated(true);
  }, [lottery, lotteryFromUrl, initialLottery, setLottery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const active = hydrated ? lottery : initialLottery;
  const activeCfg = active === lottery ? cfg : LOTTERIES[active];
  const url = analysisApiUrl(active, windowSize);
  const { data, loading, error, reload } = useApiResource<AnalysisResult>(
    url,
    dataVersion,
    initialData
      ? { url: analysisApiUrl(initialLottery, initialWindow), data: initialData }
      : undefined
  );

  // Espelha a seleção na barra de endereços sem empurrar histórico: o botão
  // "Voltar" continua saindo da página, não desfazendo filtros um a um.
  useEffect(() => {
    if (!hydrated) return;
    const path = analysisPath(active, windowSize);
    if (window.location.pathname + window.location.search !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [hydrated, active, windowSize]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium">Período analisado</p>
          <p className="text-xs text-muted-foreground">
            Recortes curtos mostram o momento; o histórico completo mostra a
            tendência.
          </p>
        </div>
        <Select
          value={windowSize}
          onValueChange={(v) => setWindowSize(v as AnalysisWindow)}
        >
          <SelectTrigger
            className="h-11 w-44 sm:h-9"
            aria-label="Período analisado"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100">Últimos 100</SelectItem>
            <SelectItem value="300">Últimos 300</SelectItem>
            <SelectItem value="500">Últimos 500</SelectItem>
            <SelectItem value="1000">Últimos 1000</SelectItem>
            <SelectItem value="all">Histórico completo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <SectionLoading label={`Calculando a análise da ${activeCfg.name}`} />
      ) : error ? (
        <SectionMessage
          message={`Não foi possível carregar a análise da ${activeCfg.name} agora (${error}). Os dados são sincronizados toda madrugada, tente de novo em instantes.`}
          onRetry={reload}
        />
      ) : data ? (
        <AnalysisView data={data} cfg={activeCfg} />
      ) : null}
    </>
  );
}

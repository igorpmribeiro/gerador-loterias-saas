"use client";

import { useEffect, useRef, useState } from "react";
import { LOTTERIES, type LotteryId } from "@/lib/lotteries";
import type { DrawRow } from "@/lib/draw-table";
import type { CycleSummary } from "@/lib/cycles";
import { useLottery } from "@/components/lottery-context";
import { TableView } from "@/components/table-view";

interface TablePayload {
  lottery: string;
  rows: DrawRow[];
  cycle: CycleSummary | null;
}

/**
 * Parte interativa da tabela. O servidor entrega a loteria da URL já
 * calculada; o cliente só assume quando o usuário troca de loteria na barra
 * superior, e devolve a escolha para a URL para que ela sobreviva a um
 * refresh e possa ser compartilhada.
 */
export function TablePageClient({
  initialLottery,
  lotteryFromUrl,
  initialData,
}: {
  initialLottery: LotteryId;
  /** A loteria veio de `?loteria=` (e não do padrão da rota). */
  lotteryFromUrl: boolean;
  initialData: TablePayload | null;
}) {
  const { lottery, cfg, dataVersion, setLottery } = useLottery();
  const [hydrated, setHydrated] = useState(false);
  const adopted = useRef(false);

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
      return;
    }
    setHydrated(true);
  }, [lottery, lotteryFromUrl, initialLottery, setLottery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const active = hydrated ? lottery : initialLottery;
  const activeCfg = active === lottery ? cfg : LOTTERIES[active];

  useEffect(() => {
    if (!hydrated) return;
    const path = active === "megasena" ? "/tabela" : `/tabela?loteria=${active}`;
    if (window.location.pathname + window.location.search !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [hydrated, active]);

  return (
    <TableView
      key={`${active}-${dataVersion}`}
      cfg={activeCfg}
      initialData={
        active === initialLottery && dataVersion === 0 ? initialData : null
      }
    />
  );
}

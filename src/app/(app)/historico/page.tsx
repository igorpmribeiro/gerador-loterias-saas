"use client";

import type { Draw } from "@/lib/lotteries";
import { useLottery } from "@/components/lottery-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { PageHeader } from "@/components/page-header";
import { HistoryView } from "@/components/history-view";
import {
  SectionLoading,
  SectionMessage,
} from "@/components/section-states";

export default function HistoricoPage() {
  const { lottery, cfg, dataVersion } = useLottery();
  const { data, loading, error, reload } = useApiResource<{ draws: Draw[] }>(
    `/api/draws?lottery=${lottery}&limit=120`,
    dataVersion
  );
  const draws = data?.draws ?? [];

  return (
    <div>
      <PageHeader
        title="Histórico de sorteios"
        description={`Os resultados mais recentes da ${cfg.name}, do concurso mais novo ao mais antigo.`}
      />

      {loading ? (
        <SectionLoading />
      ) : error ? (
        <SectionMessage
          message={`${error}. Sincronize o histórico pela barra superior.`}
          onRetry={reload}
        />
      ) : draws.length > 0 ? (
        <HistoryView draws={draws} cfg={cfg} />
      ) : (
        <SectionMessage
          variant="empty"
          message="Nenhum concurso armazenado ainda."
        />
      )}
    </div>
  );
}

"use client";

import type { SpecialAnalysis } from "@/lib/special-analysis";
import { useLottery } from "@/components/lottery-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { PageHeader } from "@/components/page-header";
import { SpecialView } from "@/components/special-view";
import { SectionLoading, SectionMessage } from "@/components/section-states";
import { getSpecialSeries } from "@/lib/special-draws";

export default function EspeciaisPage() {
  const { lottery, cfg, dataVersion } = useLottery();
  const series = getSpecialSeries(lottery);
  const { data, loading, error, reload } = useApiResource<SpecialAnalysis>(
    `/api/special?lottery=${lottery}`,
    dataVersion
  );

  return (
    <div>
      <PageHeader
        title="Sorteios especiais"
        description={`Estatística exclusiva da ${series.name} — só as edições especiais, comparadas com os concursos comuns da ${cfg.name}.`}
      />

      {loading ? (
        <SectionLoading />
      ) : error ? (
        <SectionMessage
          message={`${error}. Sincronize o histórico pela barra superior.`}
          onRetry={reload}
        />
      ) : data ? (
        <SpecialView data={data} cfg={cfg} />
      ) : null}
    </div>
  );
}

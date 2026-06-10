"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/analysis";
import { useLottery } from "@/components/lottery-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { PageHeader } from "@/components/page-header";
import { AnalysisView } from "@/components/analysis-view";
import {
  SectionLoading,
  SectionMessage,
} from "@/components/section-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AnalisePage() {
  const { lottery, cfg, dataVersion } = useLottery();
  const [windowSize, setWindowSize] = useState("all");
  const { data, loading, error, reload } = useApiResource<AnalysisResult>(
    `/api/analysis?lottery=${lottery}&window=${windowSize}`,
    dataVersion
  );

  return (
    <div>
      <PageHeader
        title="Análise estatística"
        description={`Frequência, atrasos, somas e outros padrões da ${cfg.name} para embasar as suas escolhas.`}
        action={
          <Select value={windowSize} onValueChange={setWindowSize}>
            <SelectTrigger className="w-44">
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
        }
      />

      {loading ? (
        <SectionLoading />
      ) : error ? (
        <SectionMessage
          message={`${error}. Sincronize o histórico pela barra superior.`}
          onRetry={reload}
        />
      ) : data ? (
        <AnalysisView data={data} cfg={cfg} />
      ) : null}
    </div>
  );
}

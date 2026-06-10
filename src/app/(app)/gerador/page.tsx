"use client";

import { useLottery } from "@/components/lottery-context";
import { PageHeader } from "@/components/page-header";
import { GeneratorTab } from "@/components/generator-tab";

export default function GeradorPage() {
  const { cfg, dataVersion } = useLottery();

  return (
    <div>
      <PageHeader
        title="Gerador de jogos"
        description={`Monte jogos com o modelo estatístico ou faça fechamentos da ${cfg.name}.`}
      />
      <GeneratorTab key={`${cfg.id}-${dataVersion}`} cfg={cfg} />
    </div>
  );
}

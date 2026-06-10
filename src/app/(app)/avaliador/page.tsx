"use client";

import { useLottery } from "@/components/lottery-context";
import { PageHeader } from "@/components/page-header";
import { EvaluatorView } from "@/components/evaluator-view";

export default function AvaliadorPage() {
  const { cfg, dataVersion } = useLottery();

  return (
    <div>
      <PageHeader
        title="Avaliador de jogos"
        description={`Preencha o volante da ${cfg.name} e veja como o seu jogo se compara aos padrões históricos — e se ele já teria sido premiado.`}
      />
      <EvaluatorView key={`${cfg.id}-${dataVersion}`} cfg={cfg} />
    </div>
  );
}

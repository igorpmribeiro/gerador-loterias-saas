"use client";

import { useLottery } from "@/components/lottery-context";
import { PageHeader } from "@/components/page-header";
import { TableView } from "@/components/table-view";

export default function TabelaPage() {
  const { cfg, dataVersion } = useLottery();

  return (
    <div>
      <PageHeader
        title="Tabela detalhada"
        description={`Os 20 últimos concursos da ${cfg.name}, com soma, paridade, primos, sequências e mais — concurso a concurso.`}
      />
      <TableView key={`${cfg.id}-${dataVersion}`} cfg={cfg} />
    </div>
  );
}

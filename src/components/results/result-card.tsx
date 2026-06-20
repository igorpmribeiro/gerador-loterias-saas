import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Ball } from "@/components/ball";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LOTTERIES } from "@/lib/lotteries";
import { formatDate } from "@/lib/format";
import type { ResultView } from "@/lib/results";

/** Cartão de resumo de um resultado, usado no hub /resultados. */
export function ResultCard({ data }: { data: ResultView }) {
  const tone = LOTTERIES[data.lottery].colorVar;
  const accentBg = tone === "mega" ? "bg-mega" : "bg-lotofacil";
  const accentFg =
    tone === "mega" ? "text-mega-foreground" : "text-lotofacil-foreground";
  const href = `/resultados/${data.slug}`;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div
        className={`flex items-center justify-between px-5 py-3 ${accentBg} ${accentFg}`}
      >
        <h2 className="font-semibold">{data.name}</h2>
        <span className="rounded-md bg-black/15 px-2 py-0.5 text-xs font-medium tnum">
          Concurso {data.contest}
        </span>
      </div>

      <CardContent className="flex flex-1 flex-col gap-4 pt-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Último resultado
          </span>
          <span className="text-xs text-muted-foreground tnum">
            {formatDate(data.date)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {data.numbers.map((n) => (
            <Ball key={n} n={n} tone={tone} size="lg" />
          ))}
        </div>

        <div>
          {data.accumulated ? (
            <Badge variant="warning">Acumulou</Badge>
          ) : (
            <Badge variant="success">
              {data.topWinners.toLocaleString("pt-BR")} ganhador(es)
            </Badge>
          )}
        </div>

        <Link
          href={href}
          className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong transition-colors hover:underline"
        >
          Ver resultado completo da {data.name}
          <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

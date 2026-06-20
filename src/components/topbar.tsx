"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, RefreshCw, Check, ExternalLink } from "lucide-react";
import { LOTTERY_LIST } from "@/lib/lotteries";
import { useLottery } from "./lottery-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Rotas onde a loteria selecionada importa — só essas mostram o switcher.
const LOTTERY_AWARE_PREFIXES = [
  "/analise",
  "/tabela",
  "/gerador",
  "/avaliador",
  "/historico",
];

// O refresh manual é limitado a 1x/dia: a sincronização com a Caixa já roda no
// servidor via cron todo dia às 3h, então clicar repetido só geraria carga
// desnecessária no proxy da Caixa sem trazer dados novos. Guardamos a data do
// último uso (YYYY-MM-DD, horário local) no localStorage.
const REFRESH_KEY = "loterias-ia:last-refresh";

function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { lottery, setLottery, bumpDataVersion } = useLottery();
  const pathname = usePathname();
  const showSwitcher = LOTTERY_AWARE_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  const [synced, setSynced] = useState(false);
  // Já atualizou hoje? Botão fica visível, porém desabilitado até amanhã.
  const [usedToday, setUsedToday] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setUsedToday(localStorage.getItem(REFRESH_KEY) === todayKey());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Recarrega os dados já armazenados e marca o uso do dia.
  function refresh() {
    if (usedToday) return;
    bumpDataVersion();
    localStorage.setItem(REFRESH_KEY, todayKey());
    setUsedToday(true);
    setSynced(true);
    setTimeout(() => setSynced(false), 2500);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Abrir menu"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {/* Seletor de loteria — oculto na Início, que já mostra as duas */}
      {showSwitcher && (
        <div
          role="tablist"
          aria-label="Loteria"
          className="flex items-center gap-1 rounded-lg border bg-card p-1"
        >
          {LOTTERY_LIST.map((l) => {
            const active = l.id === lottery;
            return (
              <button
                key={l.id}
                role="tab"
                aria-selected={active}
                onClick={() => setLottery(l.id)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3.5",
                  active
                    ? l.id === "megasena"
                      ? "bg-mega text-mega-foreground"
                      : "bg-lotofacil text-lotofacil-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={usedToday}
          title={
            usedToday
              ? "Os resultados são sincronizados automaticamente todo dia às 3h. Novo refresh manual liberado amanhã."
              : "Recarregar os resultados mais recentes"
          }
          aria-label={
            usedToday ? "Já atualizado hoje" : "Atualizar resultados"
          }
          // O disabled padrão do Button usa pointer-events-none (some o cursor);
          // reabilitamos só para exibir o cursor de "proibido" no estado travado.
          className="text-muted-foreground disabled:pointer-events-auto disabled:cursor-not-allowed"
        >
          {synced || usedToday ? (
            <Check className="text-success" />
          ) : (
            <RefreshCw />
          )}
          <span className="hidden sm:inline">
            {synced
              ? "Atualizado"
              : usedToday
                ? "Atualizado hoje"
                : "Atualizar"}
          </span>
        </Button>

        <Button asChild size="sm" variant="outline">
          <a
            href="https://loterias.caixa.gov.br/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink />
            <span className="hidden sm:inline">Apostar na Caixa</span>
          </a>
        </Button>
      </div>
    </header>
  );
}

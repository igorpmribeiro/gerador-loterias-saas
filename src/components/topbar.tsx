"use client";

import { useState } from "react";
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

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { lottery, setLottery, bumpDataVersion } = useLottery();
  const pathname = usePathname();
  const showSwitcher = LOTTERY_AWARE_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  const [synced, setSynced] = useState(false);

  // A sincronização com a Caixa roda no servidor via cron (/api/sync).
  // Aqui apenas recarregamos os dados já armazenados.
  function refresh() {
    bumpDataVersion();
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
          className="text-muted-foreground"
        >
          {synced ? <Check className="text-success" /> : <RefreshCw />}
          <span className="hidden sm:inline">
            {synced ? "Atualizado" : "Atualizar"}
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

"use client";

import { useState } from "react";
import { LotteryProvider } from "./lottery-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Chrome da área logada/app: sidebar + topbar + contexto de loteria.
 * Usado apenas pelo grupo de rotas (app); a landing e as telas de auth têm
 * seus próprios layouts.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <LotteryProvider>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-h-screen">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main id="conteudo" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </LotteryProvider>
  );
}

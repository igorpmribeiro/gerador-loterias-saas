"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIFETIME_PRICE, formatBRL } from "@/lib/plans";

/**
 * Barra de ação fixa no rodapé do celular. A landing tem mais de dez telas de
 * rolagem; sem isto, o visitante que se convence no meio do caminho precisa
 * rolar até o topo ou até o fim para encontrar um botão.
 *
 * Some enquanto o hero está visível (o CTA principal já está na tela) e
 * enquanto a seção de planos está visível (onde os botões reais mandam).
 */
export function LandingCtaBar() {
  const [hiddenBy, setHiddenBy] = useState<Set<string>>(
    () => new Set(["hero"])
  );

  useEffect(() => {
    const targets = ["hero", "planos"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setHiddenBy((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            if (entry.isIntersecting) next.add(entry.target.id);
            else next.delete(entry.target.id);
          }
          return next;
        });
      },
      { threshold: 0 }
    );
    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const visible = hiddenBy.size === 0;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md transition-[opacity,transform] duration-300 ease-out md:hidden motion-reduce:transition-none ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Comece de graça</p>
          <p className="truncate text-xs text-muted-foreground">
            Premium por {formatBRL(LIFETIME_PRICE.launch)}, uma única vez
          </p>
        </div>
        <Button size="lg" asChild tabIndex={visible ? undefined : -1}>
          <Link href="/register">
            Criar conta
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

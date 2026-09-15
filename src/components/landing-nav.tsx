"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogBehavior } from "@/hooks/use-dialog-behavior";

const SECTIONS = [
  { id: "como-funciona", label: "Como funciona" },
  { id: "recursos", label: "Recursos" },
  { id: "planos", label: "Planos" },
  { id: "faq", label: "FAQ" },
];

const PAGES = [
  { href: "/resultados", label: "Resultados" },
  { href: "/analise", label: "Análises" },
  { href: "/especiais", label: "Sorteios especiais" },
  { href: "/tabela", label: "Tabela de concursos" },
];

/** Rola até a seção sem sujar a URL nem o histórico do navegador. */
function scrollToSection(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  return true;
}

/**
 * Navegação da landing. No desktop, links na barra; abaixo de `md`, um menu
 * em painel — sem ele a página inteira (mais de dez telas de rolagem) ficava
 * sem nenhuma forma de navegar no celular, que é de onde vem a maior parte
 * do público.
 *
 * As âncoras rolam suavemente SEM alterar a URL nem empurrar entrada no
 * histórico, para o botão "Voltar" retornar à página anterior limpa. O `href`
 * continua como fallback acessível e sem JS.
 */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const panelRef = useDialogBehavior(open, close);

  /* eslint-disable react-hooks/set-state-in-effect -- só depois de montar
     existe `document.body` para receber o portal. */
  useEffect(() => setMounted(true), []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleAnchor(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    if (!scrollToSection(id)) return; // sem alvo: deixa o href nativo agir
    e.preventDefault();
    close();
  }

  return (
    <>
      <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex lg:gap-7">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => handleAnchor(e, s.id)}
            className="transition-colors hover:text-foreground"
          >
            {s.label}
          </a>
        ))}
        <Link
          href="/resultados"
          className="transition-colors hover:text-foreground"
        >
          Resultados
        </Link>
        <Link href="/analise" className="transition-colors hover:text-foreground">
          Análises
        </Link>
      </nav>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="menu-landing"
        className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
      >
        <Menu className="size-5" strokeWidth={2} />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div
            id="menu-landing"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            className="absolute inset-x-0 top-0 max-h-[85dvh] overflow-y-auto border-b bg-card shadow-xl outline-none"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <span className="text-sm font-medium">Menu</span>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar menu"
                className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>

            <nav aria-label="Seções da página" className="px-2 pb-2">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => handleAnchor(e, s.id)}
                  className="flex min-h-12 items-center rounded-md px-3 text-base font-medium transition-colors hover:bg-secondary"
                >
                  {s.label}
                </a>
              ))}
            </nav>

            <div className="border-t px-2 py-2">
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dados abertos
              </p>
              <nav aria-label="Páginas abertas">
                {PAGES.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    onClick={close}
                    className="flex min-h-12 items-center rounded-md px-3 text-base text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {p.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-2 border-t p-4">
              <Button size="lg" asChild>
                <Link href="/register" onClick={close}>
                  Criar conta grátis
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login" onClick={close}>
                  Entrar
                </Link>
              </Button>
            </div>
          </div>
          </div>,
          document.body
        )}
    </>
  );
}

"use client";

import Link from "next/link";

const SECTIONS = [
  { id: "recursos", label: "Recursos" },
  { id: "planos", label: "Planos" },
];

/**
 * Navegação por seções da landing. Rola suavemente até a seção SEM alterar a
 * URL nem empurrar uma entrada no histórico — assim o botão "Voltar" do
 * navegador retorna à página anterior limpa, em vez de um estado `/#recursos`.
 * Mantém o `href` como fallback acessível/sem-JS.
 */
export function LandingNav() {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id);
    if (!el) return; // sem JS-target: deixa o href nativo agir
    e.preventDefault();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          onClick={(e) => handleClick(e, s.id)}
          className="transition-colors hover:text-foreground"
        >
          {s.label}
        </a>
      ))}
      <Link href="/analise" className="transition-colors hover:text-foreground">
        Análises
      </Link>
    </nav>
  );
}

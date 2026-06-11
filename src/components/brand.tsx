import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logomark — versão vetorial da marca: escadinha de dezenas nas cores da logo
 * (verde → teal → azul → violeta) formando o "D", sobre o navy da identidade.
 * O navy é fixo (não muda com o tema) para a marca ser estável em qualquer fundo.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        className
      )}
      style={{ background: "var(--dz-navy)" }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[64%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* coluna baixa */}
        <rect x="1.6" y="9.4" width="3.4" height="3.4" rx="1.1" style={{ fill: "var(--dz-blue)" }} />
        <rect x="1.6" y="13.6" width="3.4" height="3.4" rx="1.1" style={{ fill: "var(--dz-violet)" }} />
        {/* coluna média */}
        <rect x="5.8" y="5.2" width="3.4" height="3.4" rx="1.1" style={{ fill: "var(--dz-green)" }} />
        <rect x="5.8" y="9.4" width="3.4" height="3.4" rx="1.1" style={{ fill: "var(--dz-teal)" }} />
        <rect x="5.8" y="13.6" width="3.4" height="3.4" rx="1.1" style={{ fill: "var(--dz-blue)" }} />
        <rect x="5.8" y="17.8" width="3.4" height="3.4" rx="1.1" style={{ fill: "var(--dz-violet)" }} />
        {/* topo da escada */}
        <rect x="10" y="1" width="3.4" height="3.4" rx="1.1" style={{ fill: "var(--dz-green)" }} />
        {/* curva do D */}
        <path
          d="M12.2 6.4h1.3a5.6 5.6 0 0 1 0 11.2h-1.3"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/**
 * Marca completa — usa as logos oficiais (PNG, fundo transparente sobre o
 * navy do tema). `compact` mostra só o símbolo; o padrão mostra o wordmark.
 * `priority`: a marca aparece sempre above the fold (sidebar/auth) e tende a
 * ser o LCP dessas telas — eager + fetchpriority=high + preload.
 */
export function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Image
        src="/logo-mobile.png"
        alt="Dezena"
        width={148}
        height={102}
        sizes="56px"
        priority
        className="h-9 w-auto"
      />
    );
  }
  return (
    <Image
      src="/logo-desktop.png"
      alt="Dezena — análise e geração de jogos para loterias"
      width={720}
      height={181}
      sizes="160px"
      priority
      className="h-10 w-auto"
    />
  );
}

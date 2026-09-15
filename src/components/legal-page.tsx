import Link from "next/link";
import { legalUpdatedLabel } from "@/lib/legal";

/**
 * Casca dos documentos legais: cabeçalho, data de revisão, índice e a coluna
 * de leitura. A medida fica em ~68ch — abaixo disso o texto jurídico vira
 * escada, acima o olho perde a linha.
 */
export function LegalPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro: string;
  sections: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <nav
        aria-label="Você está em"
        className="mb-4 text-sm text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          Início
        </Link>{" "}
        / <span className="text-foreground">{title}</span>
      </nav>

      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        {intro}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Última atualização:{" "}
        <time dateTime={legalUpdatedLabel()} className="tnum">
          {legalUpdatedLabel()}
        </time>
      </p>

      <nav aria-label="Índice" className="mt-8 rounded-xl border bg-card p-5">
        <p className="text-sm font-medium">Nesta página</p>
        <ol className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id} className="flex gap-2 text-sm">
              <span className="tnum text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <a
                href={`#${s.id}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-10">{children}</div>
    </div>
  );
}

/** Uma cláusula: título ancorável + corpo. */
export function LegalSection({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex gap-3 text-xl font-medium tracking-tight">
        <span aria-hidden className="tnum text-muted-foreground">
          {String(index).padStart(2, "0")}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-muted-foreground [&_a]:text-brand-strong [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

/** Lista de itens dentro de uma cláusula. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-[0.6em] size-1 shrink-0 rounded-full bg-brand"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

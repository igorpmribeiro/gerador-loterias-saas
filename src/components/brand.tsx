import { cn } from "@/lib/utils";

/**
 * Logomark — uma grade 2×2 que remete a um volante de loteria, com uma
 * marcação em âmbar (cor-assinatura) sobre tinta.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[58%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="7.5" cy="7.5" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="16.5" cy="7.5" r="3" fill="currentColor" />
        <circle cx="7.5" cy="16.5" r="3" fill="currentColor" />
        <circle cx="16.5" cy="16.5" r="3" style={{ fill: "var(--brand)" }} />
      </svg>
    </span>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className="size-9 shrink-0" />
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-[15px] font-medium tracking-tight">
            Dezena
          </p>
          <p className="text-[11px] text-muted-foreground">
            Inteligência aplicada
          </p>
        </div>
      )}
    </div>
  );
}

import { Lightbulb, ChevronDown } from "lucide-react";

/**
 * Painel de dicas recolhível. Usa <details> nativo — acessível e sem JS.
 */
export function InfoPanel({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border bg-secondary/40"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <Lightbulb className="size-4 shrink-0 text-amber-500" />
        {title}
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2 border-t px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

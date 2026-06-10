import { cn } from "@/lib/utils";

type BallTone = "mega" | "lotofacil" | "hot" | "cold" | "neutral" | "muted";
type BallSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<BallSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-11 text-base",
};

const toneClasses: Record<BallTone, string> = {
  mega: "bg-mega text-mega-foreground",
  lotofacil: "bg-lotofacil text-lotofacil-foreground",
  hot: "bg-rose-500 text-white",
  cold: "bg-sky-500 text-white",
  neutral: "bg-secondary text-secondary-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function Ball({
  n,
  tone = "neutral",
  size = "md",
  className,
  onClick,
  title,
}: {
  n: number;
  tone?: BallTone;
  size?: BallSize;
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  const label = n.toString().padStart(2, "0");
  const classes = cn(
    "inline-flex items-center justify-center rounded-full font-semibold tabular-nums shadow-sm select-none",
    sizeClasses[size],
    toneClasses[tone],
    onClick &&
      "cursor-pointer outline-none transition hover:brightness-110 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={title ?? `Detalhes do número ${label}`}
        title={title}
        className={classes}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={classes} title={title}>
      {label}
    </span>
  );
}

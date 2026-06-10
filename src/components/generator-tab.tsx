"use client";

import { useState } from "react";
import { Dices, Layers } from "lucide-react";
import type { LotteryConfig } from "@/lib/lotteries";
import { GeneratorView } from "./generator-view";
import { WheelView } from "./wheel-view";
import { cn } from "@/lib/utils";

type Mode = "ia" | "fechamento";

export function GeneratorTab({ cfg }: { cfg: LotteryConfig }) {
  const [mode, setMode] = useState<Mode>("ia");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <TabPill
          active={mode === "ia"}
          onClick={() => setMode("ia")}
          icon={<Dices className="size-4" />}
          label="Geração inteligente"
        />
        <TabPill
          active={mode === "fechamento"}
          onClick={() => setMode("fechamento")}
          icon={<Layers className="size-4" />}
          label="Fechamento"
        />
      </div>

      {mode === "ia" ? (
        <GeneratorView cfg={cfg} />
      ) : (
        <WheelView cfg={cfg} />
      )}
    </div>
  );
}

function TabPill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:bg-accent/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

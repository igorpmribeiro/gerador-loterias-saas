"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, CheckCircle2, LogIn } from "lucide-react";
import type { LotteryConfig } from "@/lib/lotteries";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Kind = "single" | "teimosinha";

interface SaveGameCardProps {
  cfg: LotteryConfig;
  numbers: number[];
  lastContest: number | null;
}

function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function SaveGameCard({ cfg, numbers, lastContest }: SaveGameCardProps) {
  const { data: session, isPending } = useSession();
  const nextContest = (lastContest ?? 0) + 1;

  const [kind, setKind] = useState<Kind>("single");
  const [startContest, setStartContest] = useState<number>(nextContest);
  const [span, setSpan] = useState<number>(5);
  const [cost, setCost] = useState<number>(cfg.betPrice);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    setSavedId(null);
    setStartContest(nextContest);
  }, [nextContest]);

  const endContest = useMemo(
    () => (kind === "single" ? startContest : startContest + span - 1),
    [kind, startContest, span]
  );
  const windowSize = endContest - startContest + 1;
  const totalCost = cost * windowSize;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lottery: cfg.id,
          numbers,
          kind,
          startContest,
          endContest,
          costPerDraw: cost,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "falha ao salvar");
      setSavedId(json.game.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  if (isPending) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Salvar este jogo</CardTitle>
            <CardDescription>
              Acompanhe o resultado em Meus Jogos depois do sorteio.
            </CardDescription>
          </div>
          <BookmarkPlus className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!session ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-secondary/40 p-3">
            <p className="text-sm text-muted-foreground">
              Entre na sua conta para salvar este jogo e acompanhar a
              performance.
            </p>
            <Button asChild size="sm">
              <Link href="/login">
                <LogIn className="size-4" />
                Entrar para salvar
              </Link>
            </Button>
          </div>
        ) : savedId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                Jogo salvo! Vamos acompanhar a partir do concurso{" "}
                {startContest}
                {kind === "teimosinha" && ` até o ${endContest}`}.
              </span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/meus-jogos">Ver Meus Jogos</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <KindToggle value={kind} onChange={setKind} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-contest">
                  {kind === "single" ? "Concurso" : "Concurso inicial"}
                </Label>
                <Input
                  id="start-contest"
                  type="number"
                  min={1}
                  value={startContest}
                  onChange={(e) =>
                    setStartContest(Math.max(1, Number(e.target.value) || 0))
                  }
                />
              </div>

              {kind === "teimosinha" && (
                <div className="space-y-1.5">
                  <Label htmlFor="span">Por quantos concursos?</Label>
                  <Input
                    id="span"
                    type="number"
                    min={2}
                    max={50}
                    value={span}
                    onChange={(e) =>
                      setSpan(
                        Math.min(50, Math.max(2, Number(e.target.value) || 0))
                      )
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Até o concurso {endContest}.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="cost">Valor por aposta (R$)</Label>
                <Input
                  id="cost"
                  type="number"
                  min={0}
                  step="0.5"
                  value={cost}
                  onChange={(e) =>
                    setCost(Math.max(0, Number(e.target.value) || 0))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Input
                id="notes"
                type="text"
                maxLength={280}
                placeholder="ex.: jogo da família, números do aniversário..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
              <div>
                <p className="font-medium">
                  Custo total: {formatBRL(totalCost)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {windowSize}{" "}
                  {windowSize === 1 ? "concurso" : "concursos"} ×{" "}
                  {formatBRL(cost)}
                </p>
              </div>
              <Button onClick={save} disabled={saving}>
                <BookmarkPlus className="size-4" />
                {saving ? "Salvando..." : "Salvar jogo"}
              </Button>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function KindToggle({
  value,
  onChange,
}: {
  value: Kind;
  onChange: (k: Kind) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo de jogo"
      className="inline-flex rounded-md border p-0.5 text-sm"
    >
      {(
        [
          { v: "single", label: "Concurso único" },
          { v: "teimosinha", label: "Teimosinha" },
        ] as const
      ).map((opt) => (
        <button
          key={opt.v}
          type="button"
          role="radio"
          aria-checked={value === opt.v}
          onClick={() => onChange(opt.v)}
          className={
            "rounded px-3 py-1.5 transition-colors " +
            (value === opt.v
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary")
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

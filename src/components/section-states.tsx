"use client";

import { Loader2, Database, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SectionLoading({ label = "Carregando dados" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}...
    </div>
  );
}

export function SectionMessage({
  variant = "error",
  message,
  onRetry,
}: {
  variant?: "error" | "empty";
  message: string;
  onRetry?: () => void;
}) {
  const Icon = variant === "empty" ? Database : TriangleAlert;
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
        <Icon className="size-7 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

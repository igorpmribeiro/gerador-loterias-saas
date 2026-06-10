"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Loader2, Plus, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PasskeyRow {
  id: string;
  name?: string | null;
  deviceType?: string | null;
  createdAt: Date | string;
}

function formatDate(d: Date | string): string {
  const iso = d instanceof Date ? d.toISOString() : d;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function PasskeyCard() {
  const [list, setList] = useState<PasskeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "err"; msg: string } | null
  >(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await authClient.passkey.listUserPasskeys();
    setLoading(false);
    if (error) {
      setFeedback({
        kind: "err",
        msg: error.message ?? "não foi possível carregar passkeys",
      });
      return;
    }
    setList((data ?? []) as unknown as PasskeyRow[]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function add() {
    setFeedback(null);
    if (!window.PublicKeyCredential) {
      setFeedback({
        kind: "err",
        msg: "seu navegador não suporta passkeys",
      });
      return;
    }
    setAdding(true);
    const { error } = await authClient.passkey.addPasskey({
      name: newName.trim() || undefined,
    });
    setAdding(false);
    if (error) {
      setFeedback({
        kind: "err",
        msg: error.message ?? "falha ao registrar passkey",
      });
      return;
    }
    setNewName("");
    setFeedback({ kind: "ok", msg: "passkey adicionada" });
    refresh();
  }

  async function remove(id: string) {
    const { error } = await authClient.passkey.deletePasskey({ id });
    if (error) {
      setFeedback({
        kind: "err",
        msg: error.message ?? "falha ao remover",
      });
      return;
    }
    refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Acesso sem senha (Passkeys)</CardTitle>
            <CardDescription>
              Registre o Face ID, Touch ID, Windows Hello ou uma chave física
              para entrar sem precisar lembrar da senha.
            </CardDescription>
          </div>
          <Fingerprint className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="passkey-name">
              Nome do dispositivo (opcional)
            </Label>
            <Input
              id="passkey-name"
              type="text"
              maxLength={40}
              placeholder="ex.: MacBook Pessoal, iPhone..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <Button onClick={add} disabled={adding}>
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {adding ? "Aguardando confirmação..." : "Adicionar passkey"}
          </Button>
        </div>

        {feedback && (
          <p
            className={
              "rounded-md px-3 py-2 text-sm " +
              (feedback.kind === "ok"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-destructive/10 text-destructive")
            }
            role={feedback.kind === "err" ? "alert" : "status"}
          >
            {feedback.msg}
          </p>
        )}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Passkeys registradas
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : list.length === 0 ? (
            <p className="rounded-md border border-dashed bg-card/40 p-4 text-sm text-muted-foreground">
              Você ainda não cadastrou nenhuma passkey.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {list.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm"
                >
                  <Fingerprint className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {p.name || "Passkey sem nome"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.deviceType ?? "dispositivo"} · criada em{" "}
                      {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(p.id)}
                    aria-label="Remover passkey"
                    title="Remover"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

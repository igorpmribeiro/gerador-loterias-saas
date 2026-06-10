"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, KeyRound, Save, UserCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PageHeader } from "./page-header";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasskeyCard } from "./passkey-card";

interface SettingsViewProps {
  initialName: string;
  email: string;
}

export function SettingsView({ initialName, email }: SettingsViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Configurações"
        description="Gerencie seus dados, senha e a sua conta."
      />

      <ProfileCard initialName={initialName} email={email} />
      <PasswordCard />
      <PasskeyCard />
      <DangerZoneCard />
    </div>
  );
}

function ProfileCard({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "err"; msg: string } | null
  >(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ kind: "err", msg: "informe um nome" });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const { error } = await authClient.updateUser({ name: name.trim() });
    setSaving(false);
    if (error) {
      setFeedback({
        kind: "err",
        msg: error.message ?? "não foi possível salvar",
      });
      return;
    }
    setFeedback({ kind: "ok", msg: "dados atualizados" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Dados da conta</CardTitle>
            <CardDescription>
              Seu nome aparece na barra lateral e no Meus Jogos.
            </CardDescription>
          </div>
          <UserCircle2 className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} disabled readOnly />
            <p className="text-[11px] text-muted-foreground">
              O e-mail não pode ser alterado por enquanto.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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

          <div className="flex justify-end">
            <Button type="submit" disabled={saving || name === initialName}>
              <Save className="size-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [revoke, setRevoke] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "err"; msg: string } | null
  >(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (next.length < 8) {
      setFeedback({ kind: "err", msg: "nova senha precisa de 8+ caracteres" });
      return;
    }
    setSaving(true);
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: revoke,
    });
    setSaving(false);
    if (error) {
      setFeedback({
        kind: "err",
        msg: error.message ?? "não foi possível trocar a senha",
      });
      return;
    }
    setFeedback({ kind: "ok", msg: "senha alterada com sucesso" });
    setCurrent("");
    setNext("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Senha</CardTitle>
            <CardDescription>
              Troque sua senha periodicamente. Recomendamos 12+ caracteres.
            </CardDescription>
          </div>
          <KeyRound className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="current">Senha atual</Label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next">Nova senha</Label>
              <Input
                id="next"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              checked={revoke}
              onChange={(e) => setRevoke(e.target.checked)}
            />
            <span>
              Deslogar outros dispositivos depois de trocar
            </span>
          </label>

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

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving || !current || !next}
              variant="secondary"
            >
              <KeyRound className="size-4" />
              {saving ? "Alterando..." : "Alterar senha"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DangerZoneCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setError(null);
    if (confirmText !== "DELETAR") {
      setError("digite DELETAR para confirmar");
      return;
    }
    setDeleting(true);
    const { error: err } = await authClient.deleteUser({ password });
    setDeleting(false);
    if (err) {
      setError(err.message ?? "não foi possível excluir");
      return;
    }
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-destructive">Excluir conta</CardTitle>
            <CardDescription>
              Apaga sua conta e todos os jogos salvos. Não há como desfazer.
            </CardDescription>
          </div>
          <AlertTriangle className="size-5 text-destructive" />
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            setOpen(true);
            setError(null);
            setPassword("");
            setConfirmText("");
          }}
        >
          Excluir minha conta
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Essa ação apaga permanentemente seus dados e todos os jogos
              salvos. Tem certeza?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="delete-password">Sua senha</Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">
                Digite <strong>DELETAR</strong> para confirmar
              </Label>
              <Input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>

            {error && (
              <p
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={remove}
              disabled={deleting || !password || confirmText !== "DELETAR"}
            >
              {deleting ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

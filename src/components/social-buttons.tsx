"use client";

import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { authClient, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true";

export function SocialButtons({
  callbackURL = "/",
  includePasskey = true,
}: {
  callbackURL?: string;
  includePasskey?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [passkeySupported, setPasskeySupported] = useState(false);

  useEffect(() => {
    setPasskeySupported(
      includePasskey &&
        typeof window !== "undefined" &&
        !!window.PublicKeyCredential
    );
  }, [includePasskey]);

  if (!GOOGLE_ENABLED && !passkeySupported) return null;

  async function withGoogle() {
    setBusy("google");
    await signIn.social({ provider: "google", callbackURL });
    setBusy(null);
  }

  async function withPasskey() {
    setBusy("passkey");
    try {
      await authClient.signIn.passkey({
        fetchOptions: {
          onSuccess() {
            window.location.href = callbackURL;
          },
        },
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="relative my-2">
        <div
          className="absolute inset-0 flex items-center"
          aria-hidden="true"
        >
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
            ou continue com
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {GOOGLE_ENABLED && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={withGoogle}
            disabled={busy !== null}
          >
            <GoogleIcon />
            {busy === "google" ? "Redirecionando..." : "Continuar com Google"}
          </Button>
        )}

        {passkeySupported && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={withPasskey}
            disabled={busy !== null}
          >
            <Fingerprint className="size-4" />
            {busy === "passkey" ? "Aguardando..." : "Entrar com passkey"}
          </Button>
        )}
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.93h5.5c-.24 1.42-1.7 4.17-5.5 4.17-3.31 0-6.02-2.74-6.02-6.12 0-3.38 2.71-6.12 6.02-6.12 1.89 0 3.15.8 3.87 1.49l2.64-2.55C16.86 3.46 14.66 2.5 12 2.5 6.92 2.5 2.8 6.62 2.8 11.7c0 5.08 4.12 9.2 9.2 9.2 5.31 0 8.83-3.73 8.83-8.99 0-.6-.06-1.06-.15-1.51H12z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.43 0 4.46-.8 5.95-2.17l-2.84-2.21c-.79.55-1.86.94-3.11.94-2.39 0-4.42-1.61-5.14-3.79H3.93v2.36A9.2 9.2 0 0 0 12 21.5z"
      />
      <path
        fill="#FBBC05"
        d="M6.86 14.27a5.5 5.5 0 0 1 0-3.54V8.37H3.93a9.2 9.2 0 0 0 0 8.26l2.93-2.36z"
      />
      <path
        fill="#4285F4"
        d="M12 5.7c1.33 0 2.5.46 3.43 1.36l2.52-2.52C16.46 3.16 14.42 2.5 12 2.5 8.42 2.5 5.27 4.6 3.93 7.74l2.93 2.36C7.58 7.31 9.61 5.7 12 5.7z"
      />
    </svg>
  );
}

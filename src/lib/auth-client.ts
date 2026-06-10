"use client";

import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined"
      ? process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
      : window.location.origin,
  plugins: [passkeyClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

import { headers } from "next/headers";
import { auth, type Session } from "./auth";

export async function getCurrentSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser(): Promise<Session["user"]> {
  const session = await getCurrentSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session.user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("não autenticado");
    this.name = "UnauthorizedError";
  }
}

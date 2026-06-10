import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { dbUrl, dbAuthToken } from "./db";

const googleEnabled =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

// Sem segredo em produção o Better Auth cairia num default conhecido —
// melhor recusar a subir do que assinar sessões com segredo público.
if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET não configurado em produção — gere um com `openssl rand -base64 32`"
  );
}

export const auth = betterAuth({
  appName: "Dezena",
  baseURL: process.env.BETTER_AUTH_URL,
  // Requisições do navegador (com cookie) passam pelo check de origem do
  // Better Auth. Sem origens confiáveis, até a requisição legítima recebe
  // 403 "Invalid origin". Fixamos os domínios de produção (apex + www).
  trustedOrigins: [
    "https://www.dezena.app.br",
    "https://dezena.app.br",
  ],
  database: {
    dialect: new LibsqlDialect(
      dbAuthToken ? { url: dbUrl, authToken: dbAuthToken } : { url: dbUrl }
    ),
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,
  plugins: [passkey()],
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    // O storage default é em memória — inócuo em serverless (cada instância
    // tem a sua). Persistir no banco torna o limite efetivo entre instâncias.
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      // Endpoints sensíveis a brute force / credential stuffing.
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
});

/** Flags públicas de configuração — para a UI esconder/mostrar opções. */
export const authFeatures = {
  google: googleEnabled,
};

export type Session = typeof auth.$Infer.Session;

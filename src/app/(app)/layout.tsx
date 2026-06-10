import { AppShell } from "@/components/app-shell";

/**
 * Layout da área do aplicativo: envolve as telas com o AppShell (sidebar +
 * topbar + contexto de loteria). As páginas que exigem login fazem a checagem
 * de sessão por conta própria (Meus jogos, Meu plano, Configurações) — o resto
 * é público (vitrine de dados), por filosofia de máxima visibilidade.
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}

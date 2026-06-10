"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  House,
  ChartColumnBig,
  Table2,
  Dices,
  ClipboardCheck,
  History,
  CreditCard,
  Receipt,
  Settings,
  X,
  LogIn,
  LogOut,
  Bookmark,
  type LucideIcon,
} from "lucide-react";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavItem[] = [
  { href: "/painel", label: "Início", icon: House },
  { href: "/analise", label: "Análise", icon: ChartColumnBig },
  { href: "/tabela", label: "Tabela", icon: Table2 },
  { href: "/gerador", label: "Gerador", icon: Dices },
  { href: "/avaliador", label: "Avaliador", icon: ClipboardCheck },
  { href: "/historico", label: "Histórico", icon: History },
];

const AUTH_NAV: NavItem[] = [
  { href: "/meus-jogos", label: "Meus jogos", icon: Bookmark },
];

const ACCOUNT_NAV: { label: string; icon: LucideIcon }[] = [
  { label: "Pagamentos", icon: Receipt },
];

const ACCOUNT_LINK_NAV: NavItem[] = [
  { href: "/meu-plano", label: "Meu plano", icon: CreditCard },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          active ? "" : "text-muted-foreground/80"
        )}
        strokeWidth={2}
      />
      {item.label}
      {active && (
        <span className="ml-auto size-1.5 rounded-full bg-brand" />
      )}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="px-4 py-5">
        <Brand />
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Plataforma
        </p>
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={
              item.href === "/painel"
                ? pathname === "/painel"
                : pathname.startsWith(item.href)
            }
            onNavigate={onNavigate}
          />
        ))}
        {session &&
          AUTH_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              onNavigate={onNavigate}
            />
          ))}
      </nav>

      <nav className="mt-4 flex flex-col gap-0.5 px-3">
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Conta
        </p>
        {session &&
          ACCOUNT_LINK_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        {ACCOUNT_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              disabled
              title="Disponível em breve"
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/55"
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={2} />
              {item.label}
              <span className="ml-auto rounded-sm border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                em breve
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <AccountCard onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function initialsFor(input: string): string {
  const cleaned = input.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AccountCard({ onNavigate }: { onNavigate: () => void }) {
  const { data, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div className="size-9 shrink-0 animate-pulse rounded-full bg-secondary" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
          <div className="h-2.5 w-32 animate-pulse rounded bg-secondary/60" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm font-medium transition-colors hover:bg-secondary"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
          <LogIn className="size-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate">Entrar</p>
          <p className="truncate text-xs text-muted-foreground">
            Salve seus jogos
          </p>
        </div>
      </Link>
    );
  }

  const display = data.user.name || data.user.email;
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
        {initialsFor(display)}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">{display}</p>
        <p className="truncate text-xs text-muted-foreground">
          {data.user.email}
        </p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/");
          router.refresh();
        }}
        aria-label="Sair"
        title="Sair"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent onNavigate={() => {}} />
        </div>
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={onClose}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r bg-card shadow-xl">
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar menu"
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

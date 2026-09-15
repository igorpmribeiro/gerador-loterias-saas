"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Comportamento de diálogo para painéis abertos por cima da página (menu
 * mobile, drawer da sidebar): fecha no Escape, prende o Tab dentro do painel,
 * trava o scroll do fundo e devolve o foco a quem abriu.
 *
 * Um painel sem isso parece fechado e não está: o teclado continua passeando
 * pelo conteúdo de trás, que o leitor de tela ainda anuncia.
 *
 * Devolve a ref que deve ser aplicada no elemento do painel.
 */
export function useDialogBehavior<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void
) {
  const panelRef = useRef<T>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    // Foco no painel para que leitores de tela entrem no contexto certo.
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [open, onClose]);

  return panelRef;
}

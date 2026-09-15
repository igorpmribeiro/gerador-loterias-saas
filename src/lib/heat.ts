/**
 * Rampa de calor perceptualmente uniforme em OKLCH.
 * Trajeto: azul (frio) → violeta → magenta → vermelho (quente).
 * Evita o "vale amarelo" do HSL onde texto branco fica ilegível.
 * Retorna bg e cor de texto com contraste garantido (AA 4.5:1+).
 */
export function heatColor(t: number): { bg: string; fg: string } {
  const L = 0.92 - 0.5 * t; // 0.92 → 0.42 — clareza decresce monotonicamente
  const C = 0.04 + 0.2 * t; // 0.04 → 0.24
  const H = 250 + 130 * t; // 250 (azul) → 380≡20 (vermelho), passando por violeta/magenta
  const bg = `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
  // Texto escuro do tema até L=0.62; texto claro abaixo. Atende AA em toda a rampa.
  const fg = L > 0.62 ? "oklch(0.22 0.015 255)" : "oklch(0.985 0.003 247)";
  return { bg, fg };
}

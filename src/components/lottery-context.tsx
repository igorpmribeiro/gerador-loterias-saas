"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { isLotteryId, LOTTERIES, type LotteryId } from "@/lib/lotteries";

interface LotteryContextValue {
  lottery: LotteryId;
  setLottery: (l: LotteryId) => void;
  cfg: (typeof LOTTERIES)[LotteryId];
  /** Incrementa quando os dados são sincronizados — páginas usam como dep. */
  dataVersion: number;
  bumpDataVersion: () => void;
}

const LotteryContext = createContext<LotteryContextValue | null>(null);
const STORAGE_KEY = "loterias-ia:lottery";

export function LotteryProvider({ children }: { children: React.ReactNode }) {
  const [lottery, setLotteryState] = useState<LotteryId>("megasena");
  const [dataVersion, setDataVersion] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isLotteryId(saved)) setLotteryState(saved);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setLottery = useCallback((l: LotteryId) => {
    setLotteryState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const bumpDataVersion = useCallback(
    () => setDataVersion((v) => v + 1),
    []
  );

  return (
    <LotteryContext.Provider
      value={{
        lottery,
        setLottery,
        cfg: LOTTERIES[lottery],
        dataVersion,
        bumpDataVersion,
      }}
    >
      {children}
    </LotteryContext.Provider>
  );
}

export function useLottery(): LotteryContextValue {
  const ctx = useContext(LotteryContext);
  if (!ctx) {
    throw new Error("useLottery deve ser usado dentro de LotteryProvider");
  }
  return ctx;
}

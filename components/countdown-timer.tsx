"use client";

import { useState, useEffect, useCallback } from "react";

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [units, setUnits] = useState(127);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 10 * 60;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulated units dropping
  const scheduleNextDrop = useCallback(() => {
    const delay = (Math.random() * 5 + 3) * 1000; // 3-8 seconds
    return setTimeout(() => {
      setUnits((prev) => {
        if (prev <= 65) return 65;
        const drop = Math.floor(Math.random() * 4) + 1; // drop 1-4
        return Math.max(65, prev - drop);
      });
    }, delay);
  }, []);

  useEffect(() => {
    if (units <= 65) return;
    const timeout = scheduleNextDrop();
    return () => clearTimeout(timeout);
  }, [units, scheduleNextDrop]);

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:gap-3">
      <div className="flex flex-col items-center justify-center rounded-lg bg-[#8b1636] px-3 py-3 text-center sm:px-4 sm:py-4">
        <p className="text-[11px] font-medium text-white sm:text-xs">Oferta garantida por</p>
        <p className="text-xl font-bold tabular-nums text-white sm:text-2xl">
          {minutes}:{seconds}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg bg-[#8b1636] px-3 py-3 text-center sm:px-4 sm:py-4">
        <p className="text-[11px] font-medium text-white sm:text-xs">Restam apenas</p>
        <p className="text-xl font-bold text-white sm:text-2xl">{units} unidades</p>
      </div>
    </div>
  );
}

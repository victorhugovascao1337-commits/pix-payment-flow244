"use client";

import { useState, useEffect } from "react";

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 10 * 60;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        <p className="text-xl font-bold text-white sm:text-2xl">65 unidades</p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Landmark, Sparkles } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

// 💵 세로형 녹색 테두리 달러/수표 지폐 카드 컴포넌트
const VerticalDollarBillCard: React.FC<{
  tx: number;
  ty: number;
  rotate: number;
  scale: number;
  delay: number;
  isBurst: boolean;
}> = ({ tx, ty, rotate, scale, delay, isBurst }) => {
  return (
    <div
      className="absolute left-1/2 top-1/2 pointer-events-none transition-all ease-out duration-650"
      style={{
        transform: isBurst
          ? `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotate}deg) scale(${scale})`
          : "translate(-50%, -10%) rotate(0deg) scale(0.3)",
        opacity: isBurst ? 1 : 0,
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Vertical Portrait Dollar Bill Card (Perfect Center Alignment) */}
      <div className="w-14 h-24 sm:w-16 sm:h-28 bg-gradient-to-b from-slate-900 via-emerald-950/95 to-slate-950 border-2 border-emerald-400 rounded-xl p-1 shadow-xl shadow-emerald-500/40 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
        {/* Inner vertical dotted border frame */}
        <div className="w-full h-full border border-dashed border-emerald-400/60 rounded-lg flex flex-col justify-between p-1 relative">
          {/* Top Header: $ and 100 */}
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black text-emerald-300">
            <span>$</span>
            <span className="text-[7px] text-emerald-400/80">100</span>
            <span>$</span>
          </div>

          {/* Center Oval Seal with Dollar Symbol */}
          <div className="flex flex-col items-center justify-center my-auto">
            <div className="w-7 h-9 sm:w-8 sm:h-10 rounded-full border border-emerald-400/90 bg-emerald-900/50 flex flex-col items-center justify-center shadow-inner">
              <span className="text-emerald-300 font-black text-xs sm:text-sm">
                $
              </span>
              <span className="text-[5px] font-bold text-emerald-400 tracking-tighter">
                RICH
              </span>
            </div>
          </div>

          {/* Bottom Footer: Barcode / Serial Line & $ */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-full h-1 bg-emerald-400/30 rounded-xs flex items-center justify-around px-1">
              <div className="w-0.5 h-full bg-emerald-400" />
              <div className="w-0.5 h-full bg-emerald-400" />
              <div className="w-0.5 h-full bg-emerald-400" />
            </div>
            <div className="flex items-center justify-between w-full text-[7px] font-black text-emerald-300">
              <span>$</span>
              <span className="text-[6px] tracking-widest text-emerald-400">100</span>
              <span>$</span>
            </div>
          </div>

          {/* Subtle background guilloche dot pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:4px_4px] opacity-20 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [stage, setStage] = useState<"enter" | "absorbing" | "burst" | "fadeout">("enter");

  // 💐 Y축(건물 아이콘 중앙선)과 100% 완벽하게 일치하는 좌우 완벽 대칭 꽃다발 좌표
  const bills = [
    { id: 1, tx: -24, ty: -60, rotate: -6, scale: 0.98, delay: 0 },
    { id: 2, tx: -8,  ty: -68, rotate: -2, scale: 1.03, delay: 30 },
    { id: 3, tx: 8,   ty: -68, rotate: 2,  scale: 1.03, delay: 60 },
    { id: 4, tx: 24,  ty: -60, rotate: 6,  scale: 0.98, delay: 90 },
  ];

  useEffect(() => {
    // 1단계 (0.9초 후): 텍스트가 건물 아이콘 속으로 스르륵 흡수
    const t1 = setTimeout(() => {
      setStage("absorbing");
    }, 900);

    // 2단계 (1.4초 후): 건물 아이콘 바운스 & 세로형 돈꽃다발이 수직으로 쑥 솟아오름!
    const t2 = setTimeout(() => {
      setStage("burst");
    }, 1400);

    // 3단계 (2.4초 후): 화면 부드럽게 페이드아웃
    const t3 = setTimeout(() => {
      setStage("fadeout");
    }, 2400);

    // 4단계 (3.0초 후): 메인 화면 완전 입장
    const t4 = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-out select-none ${
        stage === "fadeout" ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient Glow */}
      <div className="absolute w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -top-12 -left-12 animate-pulse" />
      <div className="absolute w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none -bottom-12 -right-12 animate-pulse" />

      <div className="relative flex flex-col items-center justify-center w-full max-w-sm">
        {/* Building (Landmark) Icon & Vertical Bouquet Bills */}
        <div className="relative flex items-center justify-center">
          {/* 💐 Vertical Dollar Bills Bouquet (Centered Perfectly on Y-Axis) */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {bills.map((bill) => (
              <VerticalDollarBillCard
                key={bill.id}
                tx={bill.tx}
                ty={bill.ty}
                rotate={bill.rotate}
                scale={bill.scale}
                delay={bill.delay}
                isBurst={stage === "burst" || stage === "fadeout"}
              />
            ))}
          </div>

          {/* Building (Landmark) Icon */}
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 flex items-center justify-center shadow-2xl transition-all duration-500 relative z-20 ${
              stage === "burst"
                ? "scale-110 shadow-emerald-400/80 ring-6 ring-emerald-400/60"
                : stage === "absorbing"
                ? "scale-108 shadow-emerald-400/60 ring-4 ring-emerald-400/50"
                : "scale-100 shadow-emerald-500/30 ring-2 ring-emerald-400/20"
            }`}
          >
            <Landmark className="w-12 h-12 sm:w-14 sm:h-14 text-slate-950 stroke-[2.5]" />
            {stage === "burst" && (
              <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
            )}
          </div>
        </div>

        {/* Title Text that smoothly absorbs into the building icon */}
        <div
          className={`mt-6 flex flex-col items-center transition-all duration-600 ease-in-out text-center ${
            stage === "absorbing" || stage === "burst" || stage === "fadeout"
              ? "opacity-0 -translate-y-8 scale-50 max-h-0 pointer-events-none"
              : "opacity-100 translate-y-0 scale-100 max-h-32"
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-400 bg-clip-text text-transparent drop-shadow-sm text-center">
            Wanna Be Rich?
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-2 tracking-widest uppercase">
            RICH OS · Smart Asset Ledger
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

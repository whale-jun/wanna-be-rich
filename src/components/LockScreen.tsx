import React, { useState } from "react";
import { Lock, Landmark, ArrowRight, ShieldCheck } from "lucide-react";

interface LockScreenProps {
  onUnlock: (password: string) => boolean;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    const success = onUnlock(password);
    if (!success) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassword("");
    }
  };

  const handleKeyClick = (num: string) => {
    if (password.length < 8) {
      const newPin = password + num;
      setPassword(newPin);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPassword((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPassword("");
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 text-slate-100 font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
          <Landmark className="w-7 h-7 text-slate-950 stroke-[2.5]" />
        </div>

        <h1 className="text-xl font-extrabold bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
          Wanna Be Rich?
        </h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>보안 잠금 상태입니다. 비밀번호를 입력하세요.</span>
        </p>

        <div className={`my-6 flex justify-center items-center gap-3 ${shake ? "animate-bounce" : ""}`}>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                autoFocus
                placeholder="비밀번호 입력"
                className={`w-full bg-slate-950 border text-center text-xl font-bold tracking-widest py-3 px-4 rounded-2xl focus:outline-none transition ${
                  error
                    ? "border-rose-500 text-rose-400 focus:border-rose-500 shadow-rose-500/20 shadow-lg"
                    : "border-slate-700 text-white focus:border-emerald-500"
                }`}
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition"
              >
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </form>
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-400 mb-4 animate-in fade-in">
            ⚠️ 비밀번호가 일치하지 않습니다. 다시 입력해주세요.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyClick(num)}
              className="py-3 bg-slate-950/60 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl border border-slate-800 transition active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 bg-slate-950/60 hover:bg-slate-800 text-slate-400 font-semibold text-xs rounded-2xl border border-slate-800 transition active:scale-95"
          >
            전체 삭제
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick("0")}
            className="py-3 bg-slate-950/60 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl border border-slate-800 transition active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-3 bg-slate-950/60 hover:bg-slate-800 text-slate-400 font-semibold text-xs rounded-2xl border border-slate-800 transition active:scale-95"
          >
            ← 지우기
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>브라우저 로컬 암호화 보안 적용</span>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;

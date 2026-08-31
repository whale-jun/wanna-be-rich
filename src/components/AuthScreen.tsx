import React, { useState, useEffect } from "react";
import { 
  Landmark, 
  Lock, 
  User, 
  Phone, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  Clock,
  KeyRound,
  Zap
} from "lucide-react";
import type { useAuth } from "../hooks/useAuth";

interface AuthScreenProps {
  auth: ReturnType<typeof useAuth>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ auth }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");

  // 1. 로그인 폼 상태
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // 2. 회원가입 폼 상태
  const [signupUsername, setSignupUsername] = useState("");
  const [isUsernameChecked, setIsUsernameChecked] = useState<boolean | null>(null);
  const [usernameCheckMsg, setUsernameCheckMsg] = useState("");

  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false);

  const [signupPhone, setSignupPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [isSmsSent, setIsSmsSent] = useState(false);
  const [isSmsVerified, setIsSmsVerified] = useState(false);
  const [smsSuccessMsg, setSmsSuccessMsg] = useState("");
  const [sentCodeAlert, setSentCodeAlert] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [signupError, setSignupError] = useState("");

  // 타이머 카운트다운
  useEffect(() => {
    let interval: any = null;
    if (isSmsSent && !isSmsVerified && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSmsSent, isSmsVerified, timerSeconds]);

  // 전화번호 자동 포맷팅 (010-XXXX-XXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setSignupPhone(formatted);
    // 번호가 바뀌면 인증 상태 초기화
    if (isSmsVerified || isSmsSent) {
      setIsSmsSent(false);
      setIsSmsVerified(false);
      setSmsSuccessMsg("");
      setSentCodeAlert("");
    }
  };

  // 아이디 중복 확인 핸들러
  const handleCheckUsername = () => {
    const trimmed = signupUsername.trim();
    if (!trimmed || trimmed.length < 3) {
      setIsUsernameChecked(false);
      setUsernameCheckMsg("아이디는 3자 이상 입력해주세요.");
      return;
    }
    const available = auth.checkUsernameAvailable(trimmed);
    setIsUsernameChecked(available);
    if (available) {
      setUsernameCheckMsg("사용 가능한 멋진 아이디입니다! ✨");
    } else {
      setUsernameCheckMsg("이미 존재하는 아이디입니다. 다른 아이디를 입력해주세요.");
    }
  };

  // SMS 인증번호 전송
  const handleSendSms = () => {
    setSignupError("");
    const res = auth.sendSmsCode(signupPhone);
    if (res.success) {
      setIsSmsSent(true);
      setIsSmsVerified(false);
      setTimerSeconds(180);
      setSmsSuccessMsg("인증번호가 발송되었습니다.");
      setSentCodeAlert(res.code);
    } else {
      setSignupError(res.message);
    }
  };

  // SMS 인증번호 확인
  const handleVerifySms = () => {
    setSignupError("");
    if (!smsCode || smsCode.length < 4) {
      setSignupError("인증번호 6자리를 입력해주세요.");
      return;
    }
    const res = auth.verifySmsCode(signupPhone, smsCode);
    if (res.success) {
      setIsSmsVerified(true);
      setSmsSuccessMsg("휴대폰 본인 인증이 완료되었습니다! ✅");
      setSentCodeAlert("");
    } else {
      setSignupError(res.message);
    }
  };

  // 로그인 제출
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginUsername.trim()) {
      setLoginError("아이디를 입력해주세요.");
      return;
    }
    if (!loginPassword) {
      setLoginError("비밀번호를 입력해주세요.");
      return;
    }

    const res = auth.login(loginUsername, loginPassword);
    if (!res.success) {
      setLoginError(res.error || "로그인에 실패했습니다.");
    }
  };

  // 회원가입 제출
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (!signupUsername.trim()) {
      setSignupError("아이디를 입력해주세요.");
      return;
    }
    if (isUsernameChecked !== true) {
      setSignupError("아이디 중복확인을 완료해주세요.");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("비밀번호는 6자리 이상이어야 합니다.");
      return;
    }
    if (signupPassword !== signupPasswordConfirm) {
      setSignupError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (!isSmsVerified) {
      setSignupError("전화번호 인증을 완료해주세요.");
      return;
    }

    const res = auth.signup({
      username: signupUsername,
      password: signupPassword,
      phone: signupPhone,
    });

    if (!res.success) {
      setSignupError(res.error || "회원가입에 실패했습니다.");
    }
  };

  // 비밀번호 보안 강도 계산
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "약함", color: "bg-rose-500 text-rose-400" };
    if (score <= 2) return { score: 2, label: "보통", color: "bg-amber-500 text-amber-400" };
    return { score: 3, label: "안전", color: "bg-emerald-500 text-emerald-400" };
  };

  const pwdStrength = getPasswordStrength(signupPassword);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-6 z-10 space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-500/25 mb-1">
          <Landmark className="w-7 h-7 text-slate-950 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
          <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
            Wanna Be Rich?
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          부자가 되는 지름길 • 스마트 AI 자산관리 가계부
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md z-10 space-y-6">
        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setLoginError("");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              mode === "login"
                ? "bg-slate-800 text-emerald-400 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setSignupError("");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              mode === "signup"
                ? "bg-slate-800 text-emerald-400 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 1. 로그인 폼 */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* 아이디 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">아이디</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-black py-3.5 rounded-xl text-sm shadow-xl shadow-emerald-500/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>로그인하기</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            {/* 원클릭 데모 체험 로그인 */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={auth.loginDemo}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>체험용 1초 간편 로그인 (둘러보기)</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. 회원가입 폼 */}
        {mode === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-4 animate-in fade-in">
            {signupError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                <span>{signupError}</span>
              </div>
            )}

            {/* 가상 SMS 알림 토스트 (인증번호 발송 시) */}
            {sentCodeAlert && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-bounce">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>[인증번호 발송] <strong>{sentCodeAlert}</strong> (3분 이내 입력)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsCode(sentCodeAlert)}
                  className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold text-[11px]"
                >
                  자동입력
                </button>
              </div>
            )}

            {/* ① 아이디 & 중복확인 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                아이디 <span className="text-emerald-400">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => {
                      setSignupUsername(e.target.value);
                      setIsUsernameChecked(null);
                      setUsernameCheckMsg("");
                    }}
                    placeholder="아이디 (4~16자)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCheckUsername}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition shrink-0 active:scale-95"
                >
                  중복확인
                </button>
              </div>
              {usernameCheckMsg && (
                <p className={`text-[11px] font-medium flex items-center gap-1 ${
                  isUsernameChecked ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {isUsernameChecked ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>{usernameCheckMsg}</span>
                </p>
              )}
            </div>

            {/* ② 비밀번호 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  비밀번호 <span className="text-emerald-400">*</span>
                </label>
                {signupPassword && (
                  <span className={`text-[10px] font-bold ${pwdStrength.color}`}>
                    보안강도: {pwdStrength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showSignupPassword ? "text" : "password"}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="비밀번호 (6자리 이상)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ③ 비밀번호 확인 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                비밀번호 확인 <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showSignupPasswordConfirm ? "text" : "password"}
                  value={signupPasswordConfirm}
                  onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 한 번 더 입력하세요"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPasswordConfirm(!showSignupPasswordConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showSignupPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {signupPasswordConfirm && (
                <p className={`text-[11px] font-medium flex items-center gap-1 ${
                  signupPassword === signupPasswordConfirm ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {signupPassword === signupPasswordConfirm ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>비밀번호가 일치합니다.</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>비밀번호가 일치하지 않습니다.</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* ④ 전화번호 / 인증 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                휴대폰 번호 & 본인인증 <span className="text-emerald-400">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    placeholder="010-0000-0000"
                    disabled={isSmsVerified}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-60 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendSms}
                  disabled={isSmsVerified || signupPhone.length < 12}
                  className="px-3.5 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition shrink-0 active:scale-95 disabled:opacity-50"
                >
                  {isSmsSent ? "재발송" : "인증요청"}
                </button>
              </div>

              {/* 인증번호 입력창 (발송 후) */}
              {isSmsSent && !isSmsVerified && (
                <div className="flex gap-2 pt-1 animate-in fade-in">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      placeholder="인증번호 6자리"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono tracking-widest text-center"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-amber-400 flex items-center gap-1 pointer-events-none">
                      <Clock className="w-3 h-3" />
                      <span>
                        {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifySms}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition shrink-0 active:scale-95"
                  >
                    인증확인
                  </button>
                </div>
              )}

              {/* 인증 완료 뱃지 */}
              {isSmsVerified && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{smsSuccessMsg || "휴대폰 본인인증이 완료되었습니다."}</span>
                </div>
              )}
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-black py-3.5 rounded-xl text-sm shadow-xl shadow-emerald-500/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Wanna Be Rich 회원가입 완료</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;

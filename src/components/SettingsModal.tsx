import React, { useState } from "react";
import type { ThemeMode } from "../hooks/useTheme";
import { 
  X, 
  Sun, 
  Moon, 
  Monitor, 
  Lock, 
  KeyRound, 
  Bot, 
  Check, 
  Database,
  Building2,
  Zap,
  User,
  LogOut
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  isPasswordEnabled: boolean;
  onSetPassword: (newPin: string) => void;
  onDisablePassword: () => void;
  onLockApp: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onOpenDataMenu: () => void;
  onOpenBankConnect?: () => void;
  onOpenAutoSync?: () => void;
  currentUser?: { username: string; phone?: string; name?: string } | null;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  isPasswordEnabled,
  onSetPassword,
  onDisablePassword,
  onLockApp,
  apiKey,
  onApiKeyChange,
  onOpenDataMenu,
  onOpenBankConnect,
  onOpenAutoSync,
  currentUser,
  onLogout,
}) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 4) {
      setPasswordError("비밀번호는 최소 4자리 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    onSetPassword(newPassword);
    setPasswordSuccess(true);
    setIsChangingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleTogglePassword = () => {
    if (isPasswordEnabled) {
      if (confirm("비밀번호 잠금을 해제하시겠습니까? 누구나 가계부를 열람할 수 있게 됩니다.")) {
        onDisablePassword();
        setIsChangingPassword(false);
      }
    } else {
      setIsChangingPassword(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              ⚙️
            </div>
            <h3 className="text-lg font-bold">환경 설정</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 0. 로그인 사용자 계정 정보 */}
          {currentUser && (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">@{currentUser.username}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                      로그인 중
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {currentUser.phone ? `인증번호: ${currentUser.phone}` : "인증 계정"}
                  </p>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("로그아웃 하시겠습니까?")) {
                      onClose();
                      onLogout();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition active:scale-95 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              )}
            </div>
          )}

          {/* 1. 화면 테마 설정 (화이트 / 블랙 / 시스템 설정) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎨 화면 색상 테마</span>
              </span>
              <span className="text-xs text-slate-400">
                {theme === "light" ? "화이트 (라이트)" : theme === "dark" ? "블랙 (다크)" : "시스템 설정에 따름"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              원하시는 화면 모드를 선택하세요. 시스템 설정을 선택하면 OS 테마에 자동으로 맞춰집니다.
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onThemeChange("light")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                  theme === "light"
                    ? "bg-amber-500/10 border-amber-400 text-amber-300 font-bold shadow-lg shadow-amber-500/10"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Sun className="w-5 h-5 text-amber-400" />
                <span className="text-xs">화이트 (라이트)</span>
              </button>

              <button
                type="button"
                onClick={() => onThemeChange("dark")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                  theme === "dark"
                    ? "bg-emerald-500/10 border-emerald-400 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Moon className="w-5 h-5 text-emerald-400" />
                <span className="text-xs">블랙 (다크)</span>
              </button>

              <button
                type="button"
                onClick={() => onThemeChange("system")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                  theme === "system"
                    ? "bg-sky-500/10 border-sky-400 text-sky-300 font-bold shadow-lg shadow-sky-500/10"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Monitor className="w-5 h-5 text-sky-400" />
                <span className="text-xs">시스템 설정</span>
              </button>
            </div>
          </div>

          {/* 2. 비밀번호 보안 잠금 설정 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>비밀번호 보안 잠금</span>
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  앱 실행 시 비밀번호 입력을 요구하여 금융 정보를 안전하게 보호합니다.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTogglePassword}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPasswordEnabled ? "bg-emerald-500" : "bg-slate-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPasswordEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {passwordSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>비밀번호가 성공적으로 설정되었습니다.</span>
              </div>
            )}

            {isPasswordEnabled && !isChangingPassword && (
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2 px-3 rounded-xl transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>비밀번호 변경</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLockApp();
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold py-2 px-3 rounded-xl transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>지금 바로 잠그기</span>
                </button>
              </div>
            )}

            {isChangingPassword && (
              <form onSubmit={handlePasswordSave} className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in">
                <div className="text-xs font-semibold text-emerald-400">
                  {isPasswordEnabled ? "새 비밀번호로 변경" : "새 비밀번호 설정"}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">비밀번호 (4자리 이상)</label>
                    <input
                      type="password"
                      placeholder="••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">비밀번호 확인</label>
                    <input
                      type="password"
                      placeholder="••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-center"
                    />
                  </div>
                </div>

                {passwordError && (
                  <p className="text-xs text-rose-400">{passwordError}</p>
                )}

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl text-xs"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                  >
                    비밀번호 저장
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 3. Gemini API Key 관리 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-400" />
                <span>Google Gemini API 키</span>
              </span>
              <span className="text-[11px] text-slate-400">브라우저 로컬 저장</span>
            </div>
            <p className="text-xs text-slate-400">
              AI 재무 진단 및 CFO 조언을 위해 API 키를 등록하세요. (미입력 시 기본 로컬 진단 알고리즘 작동)
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AI Studio에서 발급받은 Gemini API 키 입력"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* 4. 마이데이터 은행 & 카드 연동 */}
          {onOpenBankConnect && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/30 transition">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">마이데이터 은행 & 카드사 연동</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    실시간
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  토스, 카카오뱅크, 국민, 신한, 현대카드 등 공인인증/간편인증 자산 자동 수집
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBankConnect();
                }}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition shrink-0"
              >
                연동 관리 →
              </button>
            </div>
          )}

          {/* 5. 결제 문자 & 알림톡 100% 자동 연동 센터 */}
          {onOpenAutoSync && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/30 transition">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  <span className="text-sm font-bold text-white">결제 문자 & 알림톡 자동 연동</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    단축어
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  아이폰 단축어 자동화로 카드 결제 시 가계부에 1초 만에 자동 기록
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAutoSync();
                }}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition shrink-0"
              >
                자동 설정 →
              </button>
            </div>
          )}

          {/* 6. 데이터 백업 바로가기 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>데이터 백업 & CSV 관리</span>
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                가계부 엑셀 CSV 내보내기/가져오기 및 전체 데이터 백업
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenDataMenu();
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition shrink-0"
            >
              열기 →
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

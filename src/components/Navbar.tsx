import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  Repeat, 
  Landmark, 
  Bot, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Settings, 
  Lock, 
  Zap, 
  X,
  Check,
  Building2
} from "lucide-react";

export type NavTab = "dashboard" | "transactions" | "budgets" | "recurring" | "accounts" | "ai";

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentMonth: string; // YYYY-MM
  setCurrentMonth: (month: string) => void;
  onOpenSettings: () => void;
  onOpenAutoSyncModal?: () => void;
  onOpenBankConnect?: () => void;
  isPasswordEnabled?: boolean;
  onLockApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentMonth,
  setCurrentMonth,
  onOpenSettings,
  onOpenAutoSyncModal,
  onOpenBankConnect,
  isPasswordEnabled,
  onLockApp,
}) => {
  const [year, month] = currentMonth.split("-").map(Number);

  // 하단 바텀시트 달력 피커 상태
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  // 현재 실제 날짜
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevDate = new Date(year, month - 2, 1);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, "0");
    setCurrentMonth(`${y}-${m}`);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextDate = new Date(year, month, 1);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, "0");
    setCurrentMonth(`${y}-${m}`);
  };

  const handleOpenPicker = () => {
    setPickerYear(year);
    setIsPickerOpen(true);
  };

  const handleSelectMonth = (selectedM: number) => {
    const mStr = String(selectedM).padStart(2, "0");
    setCurrentMonth(`${pickerYear}-${mStr}`);
    setIsPickerOpen(false);
  };

  const handleGoToday = () => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    setCurrentMonth(`${y}-${m}`);
    setIsPickerOpen(false);
  };

  const navItems = [
    { id: "dashboard" as NavTab, label: "대시보드", icon: LayoutDashboard },
    { id: "transactions" as NavTab, label: "가계부 내역", icon: Receipt },
    { id: "budgets" as NavTab, label: "예산 관리", icon: Target },
    { id: "recurring" as NavTab, label: "고정비 & 정기결제", icon: Repeat },
    { id: "accounts" as NavTab, label: "자산 & 계좌", icon: Landmark },
    { id: "ai" as NavTab, label: "AI 재무 분석", icon: Bot },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 w-full overflow-x-hidden pt-[env(safe-area-inset-top)]">
        {/* Top Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-14 sm:h-16">
            {/* Left: Brand Logo & Title */}
            <div 
              className="flex items-center gap-2 sm:gap-2.5 shrink-0 select-none group z-10"
              title="Wanna Be Rich?"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <Landmark className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
              </div>

              <div className="flex items-center font-extrabold text-sm sm:text-base tracking-tight">
                <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-400 bg-clip-text text-transparent font-black">
                  Be Rich
                </span>
                <span className="hidden lg:inline-block ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  RICH OS
                </span>
              </div>
            </div>

            {/* Center: Month Selector - 100% Perfectly Centered on Mobile & Pure White Text */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center h-9 bg-slate-950/90 border border-slate-800 rounded-xl px-1 sm:px-1.5 shadow-inner z-20">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition active:scale-90"
                title="이전 달"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Click to Open Month/Year Bottom Sheet */}
              <button 
                onClick={handleOpenPicker}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 h-7 transition cursor-pointer select-none active:scale-95 group"
                title="달력으로 년/월 선택하기"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span 
                  className="whitespace-nowrap font-black text-xs sm:text-sm tracking-wide text-center"
                  style={{ color: "#ffffff" }}
                >
                  {year}년 {month}월
                </span>
              </button>

              <button
                onClick={handleNextMonth}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition active:scale-90"
                title="다음 달"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
              {isPasswordEnabled && onLockApp && (
                <button
                  onClick={onLockApp}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition active:scale-95"
                  title="지금 잠그기"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                </button>
              )}

              {/* 🏦 마이데이터 은행/카드사 연동 아이콘 버튼 */}
              {onOpenBankConnect && (
                <button
                  onClick={onOpenBankConnect}
                  className="w-9 h-9 flex items-center justify-center text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition active:scale-95 shadow-sm"
                  title="마이데이터 은행 & 카드사 실시간 연동"
                >
                  <Building2 className="w-4 h-4 stroke-[2.2]" />
                </button>
              )}

              {onOpenAutoSyncModal && (
                <button
                  onClick={onOpenAutoSyncModal}
                  className="h-9 px-2.5 sm:px-3 flex items-center gap-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
                  title="은행/카드 결제 100% 자동 연동 센터"
                >
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  <span className="hidden sm:inline">자동연동</span>
                </button>
              )}

              <button
                onClick={onOpenSettings}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition active:scale-95"
                title="환경 설정 (테마, 비밀번호, 데이터 관리)"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs (Desktop View) */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* iOS Style Bottom Sheet: Pops up smoothly from the BOTTOM */}
      {isPickerOpen && typeof document !== "undefined" && createPortal(
        <div 
          onClick={() => setIsPickerOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-700 rounded-t-[32px] sm:rounded-3xl shadow-2xl p-5 sm:p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-slate-100 animate-in slide-in-from-bottom duration-300"
          >
            {/* Drag Handle Bar on Mobile */}
            <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-3 sm:hidden" />

            {/* Header: Year Selector with prominent BLACK year text in pill badge */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <button
                onClick={() => setPickerYear(prev => prev - 1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-slate-200 hover:text-white transition active:scale-90"
                title="이전 년도"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Bold Black Year Label in High-Contrast White Pill */}
              <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-md">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span 
                  className="text-base sm:text-lg font-black tracking-tight select-none"
                  style={{ color: "#000000" }}
                >
                  {pickerYear}년
                </span>
              </div>

              <button
                onClick={() => setPickerYear(prev => prev + 1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-slate-200 hover:text-white transition active:scale-90"
                title="다음 년도"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* 12 Months 3x4 Grid (Easy to tap with thumb) */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 py-4">
              {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => {
                const isSelected = pickerYear === year && m === month;
                const isCurrentActualMonth = pickerYear === todayYear && m === todayMonth;

                return (
                  <button
                    key={m}
                    onClick={() => handleSelectMonth(m)}
                    className={`py-3.5 px-2 rounded-2xl text-sm font-black transition active:scale-95 relative flex items-center justify-center ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/40 scale-105 ring-2 ring-emerald-300"
                        : "bg-slate-950/70 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 border border-slate-800 active:bg-slate-800"
                    }`}
                  >
                    <span>{m}월</span>
                    {isCurrentActualMonth && !isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2 ring-2 ring-slate-900" title="이번 달" />
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 ml-1 stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer: Quick Go Today & Close */}
            <div className="flex items-center justify-between pt-3.5 border-t border-slate-800/80 text-xs">
              <button
                onClick={handleGoToday}
                className="text-emerald-400 hover:text-emerald-300 active:underline font-bold flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>오늘 ({todayYear}년 {todayMonth}월)로 이동</span>
              </button>

              <button
                onClick={() => setIsPickerOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition active:scale-90"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Navbar;

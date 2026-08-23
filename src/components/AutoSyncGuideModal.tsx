import React, { useState } from "react";
import type { Account, Transaction } from "../types/financial";
import { parseSingleSms } from "../utils/smsParser";
import { 
  Zap, 
  X, 
  Check, 
  Copy, 
  Smartphone, 
  Bell, 
  Sparkles,
  Bot
} from "lucide-react";

interface AutoSyncGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
}

export const AutoSyncGuideModal: React.FC<AutoSyncGuideModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<"ios" | "android" | "simulate">("ios");
  const [copied, setCopied] = useState(false);
  const [testLog, setTestLog] = useState<string | null>(null);

  if (!isOpen) return null;

  const shortcutUrlScheme = `wannaberich://?sms=ShortcutInput`;

  const handleCopyScheme = () => {
    navigator.clipboard.writeText(shortcutUrlScheme);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 시뮬레이션 테스트 실행 (실제 자동 등록 로직 수행)
  const runSimulation = (sampleText: string) => {
    const parsed = parseSingleSms(sampleText, accounts);
    if (parsed) {
      const newTx: Omit<Transaction, "id"> = {
        date: parsed.date,
        type: "expense",
        amount: parsed.amount,
        category: parsed.category,
        accountId: parsed.accountId,
        memo: parsed.memo,
        paymentMethod: parsed.paymentMethod,
        isFixed: false,
      };
      onAddTransaction(newTx);
      setTestLog(`⚡ [자동 연동 완료] ${parsed.cardCompany || "카드"} • ${parsed.memo} (${parsed.amount.toLocaleString()}원)이 [${parsed.category}] 카테고리로 즉시 등록되었습니다!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>은행 & 카드 결제 자동 연동 센터</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold">
                  100% 자동 기록
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                카드 결제 및 온라인 간편결제 발생 시 금액, 사용처, 카테고리를 실시간 자동 저장합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("ios")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition border-b-2 ${
              activeTab === "ios"
                ? "bg-slate-900 text-emerald-400 border-emerald-400 shadow-sm"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>🍏 아이폰 단축어 자동화 (추천)</span>
          </button>
          <button
            onClick={() => setActiveTab("simulate")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition border-b-2 ${
              activeTab === "simulate"
                ? "bg-slate-900 text-amber-400 border-amber-400 shadow-sm"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>🧪 실시간 자동 연동 테스트</span>
          </button>
          <button
            onClick={() => setActiveTab("android")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition border-b-2 ${
              activeTab === "android"
                ? "bg-slate-900 text-sky-400 border-sky-400 shadow-sm"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>🤖 안드로이드 자동화</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {activeTab === "ios" && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>아이폰 '단축어(Shortcuts) 자동화'로 손 하나 안 대고 자동 기록!</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  카드 결제 문자(SMS)나 카카오톡 알림톡이 오면, 아이폰이 알아서 가계부로 전달하여 금액, 가맹점, 카테고리를 0.1초 만에 자동 저장합니다.
                </p>
              </div>

              {/* Step by step */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                  📱 아이폰 단축어 자동화 설정 방법 (1분 완료)
                </h4>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-white">아이폰 [단축어] 앱 열기 → 하단 [자동화] 탭 클릭</p>
                      <p className="text-xs text-slate-400 mt-0.5">우측 상단 <strong>[+]</strong> 버튼을 눌러 새 개인용 자동화를 생성합니다.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-white">[메시지] 선택 → '메시지를 받을 때'</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        보낸 사람에 자주 쓰는 카드사(신한, 현대, 국민, 토스 등)를 지정하고, <strong>[즉시 실행]</strong>에 체크합니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-white">동작 추가: [URL 열기] 추가 후 아래 주소 넣기</p>
                      <p className="text-xs text-slate-400 mt-0.5 mb-2">
                        URL 입력란에 아래 전용 딥링크를 넣고 <strong>'단축어 입력(ShortcutInput)'</strong>을 파라미터로 연결합니다:
                      </p>

                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2.5">
                        <code className="text-xs font-mono text-emerald-400 flex-1 truncate">
                          {shortcutUrlScheme}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyScheme}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 transition shrink-0 cursor-pointer"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? "복사됨!" : "URL 복사"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "simulate" && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>실시간 결제 자동 수신 시뮬레이션</span>
                </div>
                <p className="text-xs text-slate-300">
                  아래 버튼을 누르면 실제 카드사/은행/온라인 결제 알림이 도착한 것처럼 가계부에 즉시 자동 등록되는 과정을 실시간으로 확인할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => runSimulation("[Web발신] 신한카드 승인 4,500원 08/22 17:25 스타벅스강남점 일시불")}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-2xl text-left space-y-1.5 transition group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white group-hover:text-emerald-400">☕ 스타벅스 커피 결제</span>
                    <span className="text-xs font-mono text-emerald-400 font-black">4,500원</span>
                  </div>
                  <p className="text-[11px] text-slate-400">신한카드 결제 문자 → '카페/간식' 자동 분류</p>
                </button>

                <button
                  type="button"
                  onClick={() => runSimulation("[Web발신] 현대카드 승인 24,000원 08/22 18:10 배달의민족(식사) 일시불")}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-2xl text-left space-y-1.5 transition group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white group-hover:text-emerald-400">🛵 배달의민족 저녁 주문</span>
                    <span className="text-xs font-mono text-emerald-400 font-black">24,000원</span>
                  </div>
                  <p className="text-[11px] text-slate-400">현대카드 결제 문자 → '식비' 자동 분류</p>
                </button>

                <button
                  type="button"
                  onClick={() => runSimulation("[Web발신] KB국민카드 승인 58,000원 08/22 14:30 GS칼텍스주유소 일시불")}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-2xl text-left space-y-1.5 transition group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white group-hover:text-emerald-400">⛽ GS칼텍스 주유</span>
                    <span className="text-xs font-mono text-emerald-400 font-black">58,000원</span>
                  </div>
                  <p className="text-[11px] text-slate-400">국민카드 결제 문자 → '교통/차량' 자동 분류</p>
                </button>

                <button
                  type="button"
                  onClick={() => runSimulation("[카카오페이] 결제 완료 38,900원 08/22 16:40 쿠팡 로켓배송")}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-2xl text-left space-y-1.5 transition group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white group-hover:text-emerald-400">📦 쿠팡 온라인 쇼핑</span>
                    <span className="text-xs font-mono text-emerald-400 font-black">38,900원</span>
                  </div>
                  <p className="text-[11px] text-slate-400">카카오페이 온라인 결제 → '쇼핑/의류' 자동 분류</p>
                </button>
              </div>

              {testLog && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-emerald-300 text-xs animate-in fade-in flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{testLog}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "android" && (
            <div className="space-y-4">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 text-sky-300 space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-sky-400" />
                  <span>안드로이드 MacroDroid / Tasker 연동</span>
                </div>
                <p className="text-xs text-slate-300">
                  안드로이드 폰에서는 무료 자동화 앱인 <strong>MacroDroid</strong>를 통해 결제 문자를 수신하자마자 가계부 딥링크로 자동 발송할 수 있습니다.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <p className="font-bold text-white text-xs">🛠️ MacroDroid 설정 방법</p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                  <li>MacroDroid 앱 설치 후 <strong>[매크로 추가]</strong> 클릭</li>
                  <li><strong>트리거</strong>: [메시지 수신] (카드사 발신번호 또는 '승인' 포함)</li>
                  <li><strong>동작</strong>: [웹사이트 열기 / 인텐트] → <code className="text-emerald-400 font-mono">wannaberich://?sms=[sms_body]</code> 지정</li>
                  <li>저장하면 결제 시마다 100% 완전 자동 전송 완료!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>국내 모든 카드사, 은행, 네이버/카카오/토스페이 지원</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            확인 및 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoSyncGuideModal;

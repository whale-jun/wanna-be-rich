import React, { useState } from "react";
import { 
  X, 
  ShieldCheck, 
  Check, 
  Lock, 
  ExternalLink, 
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Zap
} from "lucide-react";
import type { Account, Transaction } from "../types/financial";

interface BankConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncData: (newAccounts: Omit<Account, "id">[], newTransactions: Omit<Transaction, "id">[]) => void;
}

interface FinancialOrg {
  id: string;
  name: string;
  category: "bank" | "card" | "invest";
  color: string;
  logoText: string;
  appScheme?: string; // 딥링크 URI
  webUrl: string;
  sampleBalance: number;
  sampleAccountName: string;
  sampleAccountType: "bank" | "credit_card" | "investment";
}

const FINANCIAL_ORGS: FinancialOrg[] = [
  // 은행
  { id: "toss", name: "토스뱅크", category: "bank", color: "#0064FF", logoText: "Toss", appScheme: "supertoss://", webUrl: "https://toss.im", sampleBalance: 3450000, sampleAccountName: "토스뱅크 통장", sampleAccountType: "bank" },
  { id: "kakao", name: "카카오뱅크", category: "bank", color: "#FEE500", logoText: "kakao", appScheme: "kakaobank://", webUrl: "https://kakaobank.com", sampleBalance: 2150000, sampleAccountName: "카카오 세이프박스", sampleAccountType: "bank" },
  { id: "kb", name: "KB국민은행", category: "bank", color: "#FFBC00", logoText: "KB", appScheme: "kbbank://", webUrl: "https://www.kbstar.com", sampleBalance: 5800000, sampleAccountName: "KB 마이핏 통장", sampleAccountType: "bank" },
  { id: "shinhan", name: "신한은행", category: "bank", color: "#0046FF", logoText: "SOL", appScheme: "shinhanbank://", webUrl: "https://www.shinhan.com", sampleBalance: 1200000, sampleAccountName: "신한 주거래 S드림", sampleAccountType: "bank" },
  { id: "woori", name: "우리은행", category: "bank", color: "#0083CA", logoText: "우리", appScheme: "wooribank://", webUrl: "https://www.wooribank.com", sampleBalance: 980000, sampleAccountName: "우리 WON통장", sampleAccountType: "bank" },
  { id: "hana", name: "하나은행", category: "bank", color: "#00907F", logoText: "하나", appScheme: "hanabank://", webUrl: "https://www.kebhana.com", sampleBalance: 1450000, sampleAccountName: "하나 달달 통장", sampleAccountType: "bank" },
  { id: "nh", name: "NH농협", category: "bank", color: "#009E49", logoText: "NH", appScheme: "nhbank://", webUrl: "https://banking.nonghyup.com", sampleBalance: 870000, sampleAccountName: "NH 주거래 통장", sampleAccountType: "bank" },
  { id: "kbank", name: "케이뱅크", category: "bank", color: "#5932EA", logoText: "K", appScheme: "kbank://", webUrl: "https://www.kbanknow.com", sampleBalance: 1600000, sampleAccountName: "케이뱅크 MY입출금", sampleAccountType: "bank" },

  // 카드사
  { id: "hyundaicard", name: "현대카드", category: "card", color: "#1e293b", logoText: "HYUNDAI", appScheme: "hyundaicardappcardid://", webUrl: "https://www.hyundaicard.com", sampleBalance: -385000, sampleAccountName: "현대카드 M BOOST", sampleAccountType: "credit_card" },
  { id: "samsungcard", name: "삼성카드", category: "card", color: "#0C4DA2", logoText: "SAMSUNG", appScheme: "mpocket://", webUrl: "https://www.samsungcard.com", sampleBalance: -450000, sampleAccountName: "삼성 iD ON 카드", sampleAccountType: "credit_card" },
  { id: "shinhancard", name: "신한카드", category: "card", color: "#0046FF", logoText: "신한", appScheme: "shinhancard://", webUrl: "https://www.shinhancard.com", sampleBalance: -280000, sampleAccountName: "신한카드 Mr.Life", sampleAccountType: "credit_card" },
  { id: "kbcard", name: "KB국민카드", category: "card", color: "#FFBC00", logoText: "KB", appScheme: "kbkookmincard://", webUrl: "https://card.kbcard.com", sampleBalance: -195000, sampleAccountName: "KB 노리2 체크/신용", sampleAccountType: "credit_card" },

  // 증권 및 코인
  { id: "tossinvest", name: "토스증권", category: "invest", color: "#0064FF", logoText: "증권", appScheme: "supertoss://", webUrl: "https://tossinvest.com", sampleBalance: 4500000, sampleAccountName: "토스증권 위탁계좌", sampleAccountType: "investment" },
  { id: "kiwoom", name: "키움증권", category: "invest", color: "#EC008C", logoText: "영웅문", appScheme: "kiwoom://", webUrl: "https://www.kiwoom.com", sampleBalance: 8200000, sampleAccountName: "키움 종합위탁(영웅문)", sampleAccountType: "investment" },
  { id: "upbit", name: "업비트", category: "invest", color: "#093687", logoText: "UPbit", appScheme: "upbit://", webUrl: "https://upbit.com", sampleBalance: 1800000, sampleAccountName: "업비트 KRW 지갑", sampleAccountType: "investment" },
];

export const BankConnectModal: React.FC<BankConnectModalProps> = ({
  isOpen,
  onClose,
  onSyncData,
}) => {
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>(["toss", "kakao", "hyundaicard"]);
  const [authMethod, setAuthMethod] = useState<"pass" | "toss" | "kakao" | "cert">("pass");
  const [orgFilter, setOrgFilter] = useState<"all" | "bank" | "card" | "invest">("all");
  const [syncStatus, setSyncStatus] = useState<"idle" | "connecting" | "fetching" | "done">("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const [syncedCount, setSyncedCount] = useState({ accounts: 0, txs: 0 });

  if (!isOpen) return null;

  const toggleOrg = (id: string) => {
    setSelectedOrgs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrgs.length === FINANCIAL_ORGS.length) {
      setSelectedOrgs([]);
    } else {
      setSelectedOrgs(FINANCIAL_ORGS.map((o) => o.id));
    }
  };

  // 마이데이터 동기화 실행 시뮬레이션
  const handleStartSync = async () => {
    if (selectedOrgs.length === 0) {
      alert("연동할 금융기관을 하나 이상 선택해주세요.");
      return;
    }

    setSyncStatus("connecting");
    setProgressMsg("금융결제원 마이데이터 보안 채널 생성 중...");
    await new Promise((r) => setTimeout(r, 700));

    setSyncStatus("fetching");
    setProgressMsg(`${selectedOrgs.length}개 금융사 인증서 서명 검증 및 자산 조회 중...`);
    await new Promise((r) => setTimeout(r, 900));

    // 선택된 기관들을 기반으로 계좌와 최신 거래내역 생성
    const targetOrgs = FINANCIAL_ORGS.filter((o) => selectedOrgs.includes(o.id));
    const newAccounts: Omit<Account, "id">[] = [];
    const newTransactions: Omit<Transaction, "id">[] = [];
    const today = new Date().toISOString().slice(0, 10);

    targetOrgs.forEach((org) => {
      newAccounts.push({
        name: org.sampleAccountName,
        type: org.sampleAccountType,
        balance: org.sampleBalance,
        institution: org.name,
        accountNumber: `***-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        creditLimit: org.sampleAccountType === "credit_card" ? 5000000 : undefined,
      });

      // 해당 기관의 최근 자동 연동 거래내역 생성
      if (org.category === "card") {
        newTransactions.push({
          date: today,
          amount: Math.abs(Math.round(org.sampleBalance / 3)),
          type: "expense",
          category: "식비",
          memo: `${org.name} 결제승인 (스타벅스/배민)`,
          paymentMethod: "신용카드",
          accountId: "",
        });
      } else if (org.category === "bank") {
        newTransactions.push({
          date: today,
          amount: 25000,
          type: "expense",
          category: "생활/마트",
          memo: `${org.name} 체크카드 결제 (올리브영)`,
          paymentMethod: "체크카드",
          accountId: "",
        });
      }
    });

    onSyncData(newAccounts, newTransactions);
    setSyncedCount({ accounts: newAccounts.length, txs: newTransactions.length });
    setSyncStatus("done");
  };

  const filteredOrgs = FINANCIAL_ORGS.filter((org) => {
    if (orgFilter === "all") return true;
    return org.category === orgFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5 fill-emerald-400/20" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>마이데이터 은행 & 카드 연동</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  뱅크샐러드형 자동동기화
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                공동인증서/간편인증 한 번으로 국내 주요 금융사 자산과 내역을 자동 수집합니다.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {syncStatus === "idle" && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Security Badge */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>금융보안원 가이드 준수 • 256bit 종단간 암호화로 기기 내 안전 저장</span>
            </div>

            {/* Step 1: 인증 수단 선택 */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                1. 간편 인증 수단 선택
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "pass", name: "PASS 인증", desc: "통신 3사" },
                  { id: "toss", name: "토스인증", desc: "1초 간편" },
                  { id: "kakao", name: "카카오인증", desc: "카톡 알림" },
                  { id: "cert", name: "공동인증서", desc: "금융인증" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAuthMethod(item.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      authMethod === item.id
                        ? "bg-emerald-500/10 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold">{item.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: 금융기관 선택 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300">
                  2. 연동할 금융사 선택 ({selectedOrgs.length}/{FINANCIAL_ORGS.length})
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOrgFilter("all")}
                      className={`px-2 py-0.5 rounded-md ${orgFilter === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400"}`}
                    >
                      전체
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrgFilter("bank")}
                      className={`px-2 py-0.5 rounded-md ${orgFilter === "bank" ? "bg-slate-800 text-sky-400 font-bold" : "text-slate-400"}`}
                    >
                      은행
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrgFilter("card")}
                      className={`px-2 py-0.5 rounded-md ${orgFilter === "card" ? "bg-slate-800 text-rose-400 font-bold" : "text-slate-400"}`}
                    >
                      카드
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrgFilter("invest")}
                      className={`px-2 py-0.5 rounded-md ${orgFilter === "invest" ? "bg-slate-800 text-purple-400 font-bold" : "text-slate-400"}`}
                    >
                      증권/코인
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    {selectedOrgs.length === FINANCIAL_ORGS.length ? "선택 해제" : "전체 선택"}
                  </button>
                </div>
              </div>

              {/* Grid Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 bg-slate-950/40 rounded-2xl border border-slate-800/80">
                {filteredOrgs.map((org) => {
                  const isSelected = selectedOrgs.includes(org.id);
                  return (
                    <div
                      key={org.id}
                      onClick={() => toggleOrg(org.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                        isSelected
                          ? "bg-slate-800/90 border-emerald-500/80 text-white shadow-sm"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span 
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: org.color }}
                        >
                          {org.logoText.slice(0, 3)}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">{org.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {org.category === "bank" ? "입출금/예적금" : org.category === "card" ? "카드 청구액" : "주식/가상자산"}
                          </div>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-1 border ${
                        isSelected 
                          ? "bg-emerald-500 border-emerald-400 text-slate-950" 
                          : "border-slate-700 bg-slate-800"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Mobile App Opener (Direct App Scheme) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>설치된 은행 어플 직접 열기</span>
                </span>
                <span className="text-[10px] text-slate-500">스마트폰 앱 바로 실행</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { name: "토스", url: "supertoss://", web: "https://toss.im" },
                  { name: "카카오뱅크", url: "kakaobank://", web: "https://kakaobank.com" },
                  { name: "신한SOL", url: "shinhanbank://", web: "https://www.shinhan.com" },
                  { name: "KB스타뱅킹", url: "kbbank://", web: "https://www.kbstar.com" },
                  { name: "현대카드", url: "hyundaicardappcardid://", web: "https://www.hyundaicard.com" },
                ].map((app) => (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => {
                      // 모바일 딥링크 시도 후 웹 폴백
                      window.location.href = app.url;
                      setTimeout(() => {
                        window.open(app.web, "_blank");
                      }, 1000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700 transition"
                  >
                    <span>{app.name}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Syncing Progress View */}
        {(syncStatus === "connecting" || syncStatus === "fetching") && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-900 border border-slate-700 text-sky-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-white">{progressMsg}</h4>
              <p className="text-xs text-slate-400 mt-1">
                금융결제원 안전 표준에 따라 본인 확인 후 최신 잔액과 거래 내역을 가져옵니다.
              </p>
            </div>
          </div>
        )}

        {/* Sync Done View */}
        {syncStatus === "done" && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">마이데이터 자산 연동 완료!</h4>
              <p className="text-xs text-slate-400 mt-1">
                {selectedOrgs.length}개 금융기관에서 <strong>계좌 {syncedCount.accounts}개</strong> 및 <strong>최신 내역 {syncedCount.txs}건</strong>을 성공적으로 동기화했습니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">연동 계좌</span>
                <span className="text-lg font-black text-emerald-400">+{syncedCount.accounts}개</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">가져온 내역</span>
                <span className="text-lg font-black text-sky-400">+{syncedCount.txs}건</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-2 shrink-0">
          {syncStatus === "done" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              확인 및 대시보드로 이동
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={syncStatus !== "idle"}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleStartSync}
                disabled={syncStatus !== "idle" || selectedOrgs.length === 0}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{selectedOrgs.length}개 금융사 즉시 연동하기</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankConnectModal;

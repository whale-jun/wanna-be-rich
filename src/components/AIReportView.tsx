import React, { useState } from "react";
import { generateAIReport } from "../utils/gemini";
import type { Transaction, Account, RecurringItem, Savings, Investment } from "../types/financial";
import { calculateTaxDashboard, formatKRW } from "../utils/calculators";
import { 
  Sparkles, 
  Key, 
  Calculator, 
  Lightbulb,
  Building2,
  TrendingUp,
  Briefcase,
  Scale,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

interface AIReportViewProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  transactions: Transaction[];
  accounts: Account[];
  recurringItems: RecurringItem[];
  savings: Savings[];
  investments: Investment[];
}

export const AIReportView: React.FC<AIReportViewProps> = ({
  apiKey,
  onApiKeyChange,
  transactions,
  accounts,
  recurringItems,
  savings,
  investments,
}) => {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [activeExpertTab, setActiveExpertTab] = useState<"all" | "cpa" | "fund" | "pb" | "tax">("all");

  const taxData = calculateTaxDashboard(transactions);
  const threshold = (taxData.totalIncome || 45000000) * 0.25;
  const totalCardSpent = taxData.creditCardUsage + taxData.debitCardUsage;
  const thresholdProgress = Math.min(100, Math.round((totalCardSpent / (threshold || 1)) * 100));

  const handleGenerateReport = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await generateAIReport(
        apiKey,
        transactions,
        accounts,
        recurringItems,
        savings,
        investments
      );
      setReport(result);
    } catch (err: any) {
      setError(err.message || "리포트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 마크다운 파서 및 전문가 섹션 파싱
  const parseReportSections = (text: string) => {
    const lines = text.split("\n");
    const sections: { title: string; type: "score" | "cpa" | "fund" | "pb" | "tax" | "action" | "general"; content: string[] }[] = [];
    let currentSection: { title: string; type: "score" | "cpa" | "fund" | "pb" | "tax" | "action" | "general"; content: string[] } = {
      title: "종합 개요",
      type: "general",
      content: []
    };

    lines.forEach((line) => {
      if (line.startsWith("## 🏆") || line.includes("종합 재무 건강 점수")) {
        if (currentSection.content.length > 0) sections.push(currentSection);
        currentSection = { title: line.replace(/^##\s*/, ""), type: "score", content: [] };
      } else if (line.includes("[공인회계사") || line.includes("CPA")) {
        if (currentSection.content.length > 0) sections.push(currentSection);
        currentSection = { title: line.replace(/^##\s*/, ""), type: "cpa", content: [] };
      } else if (line.includes("[헤지펀드") || line.includes("펀드매니저")) {
        if (currentSection.content.length > 0) sections.push(currentSection);
        currentSection = { title: line.replace(/^##\s*/, ""), type: "fund", content: [] };
      } else if (line.includes("[공인재산관리사") || line.includes("PB")) {
        if (currentSection.content.length > 0) sections.push(currentSection);
        currentSection = { title: line.replace(/^##\s*/, ""), type: "pb", content: [] };
      } else if (line.includes("[전문 세무사") || line.includes("CTA") || line.includes("세무사")) {
        if (currentSection.content.length > 0) sections.push(currentSection);
        currentSection = { title: line.replace(/^##\s*/, ""), type: "tax", content: [] };
      } else if (line.includes("골든 액션") || line.includes("핵심 액션") || line.includes("실행할")) {
        if (currentSection.content.length > 0) sections.push(currentSection);
        currentSection = { title: line.replace(/^##\s*/, ""), type: "action", content: [] };
      } else {
        currentSection.content.push(line);
      }
    });

    if (currentSection.content.length > 0) sections.push(currentSection);
    return sections;
  };

  const parsedSections = report ? parseReportSections(report) : [];

  return (
    <div className="space-y-6 pb-12">
      {/* 🌟 Top Hero Card: 4대 전문가 위원회 배너 */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                Financial Advisory Board
              </span>
              <span className="text-xs text-slate-400 font-medium">4대 금융 전문가 통합 진단 시스템</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Wanna Be Rich? AI Financial Diagnosis Report
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              <strong>공인회계사(CPA)</strong>의 손익 감사, <strong>헤지펀드 매니저</strong>의 자산배분, <strong>재산관리사(PB)</strong>의 목돈 로드맵, <strong>세무사(CTA)</strong>의 절세 처방을 한 번에 분석합니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{apiKey ? "Gemini 키 설정됨" : "Gemini API 키"}</span>
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Sparkles className="w-4 h-4 fill-slate-950" />
              )}
              <span>{loading ? "전문가 4인 진단 분석 중..." : "AI 전문가 종합 리포트 생성"}</span>
            </button>
          </div>
        </div>

        {/* 4대 전문가 프로필 뱃지 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white">공인회계사 (CPA)</div>
              <div className="text-[10px] text-slate-400">손익 & 현금흐름 감사</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white">헤지펀드 매니저</div>
              <div className="text-[10px] text-slate-400">자산배분 & 공방 전략</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white">재산관리사 (PB)</div>
              <div className="text-[10px] text-slate-400">4개 통장 & 목돈 설계</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white">전문 세무사 (CTA)</div>
              <div className="text-[10px] text-slate-400">연말정산 & 절세 극대화</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini API Key Toggle Input */}
      {showKeyInput && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              Google Gemini API 키 설정
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              * 키 미입력 시 4대 전문가 룰 기반 로컬 스마트 엔진이 작동합니다.
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="AI Studio에서 발급받은 Gemini API 키 입력"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              onClick={() => setShowKeyInput(false)}
              className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* 연말정산 소득공제 실시간 게이지 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-sky-400" />
            <h3 className="text-base font-bold text-white">세무사 추천 • 연말정산 카드 소득공제 골든크로스</h3>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            신용카드(15%) vs 체크카드(30%)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">소득공제 문턱 기준 (총급여 25%)</span>
                <span className={thresholdProgress >= 100 ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  달성률 {thresholdProgress}% ({formatKRW(totalCardSpent)} / {formatKRW(threshold)})
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    thresholdProgress >= 100 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${thresholdProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>신용카드 결제액</span>
                  <span className="text-sky-400 font-semibold">공제율 15%</span>
                </div>
                <div className="text-lg font-black text-white mt-1">
                  {formatKRW(taxData.creditCardUsage)}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>체크카드/현금 결제액</span>
                  <span className="text-emerald-400 font-semibold">공제율 30%</span>
                </div>
                <div className="text-lg font-black text-white mt-1">
                  {formatKRW(taxData.debitCardUsage)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>세무사의 즉시 절세 처방</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {totalCardSpent < threshold ? (
                <>
                  현재 총 카드 결제액이 문턱(총급여의 25%)에 도달하지 않았습니다. 
                  포인트 적립과 할인 혜택이 풍부한 <strong>신용카드</strong>를 우선 사용하는 것이 유리합니다.
                </>
              ) : (
                <>
                  소득공제 문턱을 완벽히 돌파했습니다! 🎉 
                  지금부터는 공제율이 2배 높은 <strong>체크카드(30%) 및 현금영수증</strong> 위주로 결제 수단을 전환해야 연말정산 환급액을 극대화할 수 있습니다!
                </>
              )}
            </p>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80 flex justify-between">
              <span>추정 과세표준</span>
              <span className="text-slate-300 font-semibold">{formatKRW(taxData.taxableIncome)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 메인 AI 리포트 결과 컨테이너 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-5 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-bold text-white">4대 금융 전문가 위원회 진단 보고서 작성 중...</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                공인회계사, 헤지펀드 매니저, PB, 세무사가 자산 포트폴리오, 손익 현금흐름, 절세 문턱을 정밀 교차 검증하고 있습니다.
              </p>
            </div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Header / Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">AI 전문가 종합 진단 보고서</h3>
              </div>

              <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto no-scrollbar">
                {[
                  { id: "all", label: "전체 보기" },
                  { id: "cpa", label: "🏛️ 회계사" },
                  { id: "fund", label: "📈 펀드매니저" },
                  { id: "pb", label: "💼 PB자산관리" },
                  { id: "tax", label: "⚖️ 세무사" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveExpertTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      activeExpertTab === tab.id
                        ? "bg-slate-800 text-emerald-400 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 구조화된 섹션 렌더링 */}
            <div className="space-y-5">
              {parsedSections.map((sec, idx) => {
                // 필터링 적용
                if (activeExpertTab !== "all") {
                  if (activeExpertTab === "cpa" && sec.type !== "cpa" && sec.type !== "score") return null;
                  if (activeExpertTab === "fund" && sec.type !== "fund" && sec.type !== "score") return null;
                  if (activeExpertTab === "pb" && sec.type !== "pb" && sec.type !== "score") return null;
                  if (activeExpertTab === "tax" && sec.type !== "tax" && sec.type !== "score") return null;
                }

                // 1. 점수 스코어보드 섹션
                if (sec.type === "score") {
                  return (
                    <div 
                      key={idx} 
                      className="bg-gradient-to-r from-emerald-950/60 via-slate-950 to-sky-950/60 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h4 className="text-base sm:text-lg font-black text-white">{sec.title}</h4>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {sec.content.map((c, cIdx) => (
                          <p key={cIdx} className={c.startsWith(">") ? "bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-slate-200" : ""}>
                            {c.replace(/^>\s*/, "")}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                }

                // 2. 전문가별 전용 카드 섹션 (회계사, 펀드, PB, 세무사)
                const isCPA = sec.type === "cpa";
                const isFund = sec.type === "fund";
                const isPB = sec.type === "pb";
                const isTax = sec.type === "tax";
                const isAction = sec.type === "action";

                const borderColor = isCPA 
                  ? "border-emerald-500/30 bg-emerald-950/10" 
                  : isFund 
                  ? "border-sky-500/30 bg-sky-950/10" 
                  : isPB 
                  ? "border-purple-500/30 bg-purple-950/10" 
                  : isTax 
                  ? "border-amber-500/30 bg-amber-950/10" 
                  : "border-emerald-500/40 bg-gradient-to-br from-slate-950 to-slate-900";

                const titleColor = isCPA 
                  ? "text-emerald-400" 
                  : isFund 
                  ? "text-sky-400" 
                  : isPB 
                  ? "text-purple-400" 
                  : isTax 
                  ? "text-amber-400" 
                  : "text-emerald-300";

                return (
                  <div key={idx} className={`border rounded-2xl p-5 sm:p-6 shadow-md transition ${borderColor}`}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/80">
                      {isCPA && <Building2 className="w-5 h-5 text-emerald-400" />}
                      {isFund && <TrendingUp className="w-5 h-5 text-sky-400" />}
                      {isPB && <Briefcase className="w-5 h-5 text-purple-400" />}
                      {isTax && <Scale className="w-5 h-5 text-amber-400" />}
                      {isAction && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      <h4 className={`text-base font-extrabold ${titleColor}`}>{sec.title}</h4>
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {sec.content.map((c, cIdx) => {
                        const trimmed = c.trim();
                        if (!trimmed || trimmed === "---") return null;

                        if (trimmed.startsWith("- **") || trimmed.startsWith("1.") || trimmed.startsWith("2.") || trimmed.startsWith("3.")) {
                          return (
                            <div key={cIdx} className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="flex-1 text-slate-200">
                                {trimmed.replace(/^-\s*/, "")}
                              </div>
                            </div>
                          );
                        }

                        return <p key={cIdx} className="text-slate-300">{trimmed}</p>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-200">
                4대 전문가 AI 재무 진단 준비 완료
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                공인회계사 + 펀드매니저 + 재산관리사 + 세무사가 고객님의 수입, 지출, 고정비, 투자 자산을 정밀 분석해드립니다.
              </p>
            </div>
            <button
              onClick={handleGenerateReport}
              className="mt-2 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition shadow-xl shadow-emerald-500/25 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>지금 4대 전문가 진단 시작하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIReportView;

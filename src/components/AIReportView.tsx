import React, { useState } from "react";
import { generateAIReport } from "../utils/gemini";
import type { Transaction, Account, RecurringItem, Savings, Investment } from "../types/financial";
import { calculateTaxDashboard, formatKRW } from "../utils/calculators";
import { 
  Bot, 
  Sparkles, 
  Key, 
  Calculator, 
  Lightbulb
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

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span>AI CFO 재무 전략 & 절세 리포트</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gemini AI 기반 맞춤형 자산 진단 및 연말정산 카드 소득공제 최적화 전략을 제공합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{apiKey ? "API 키 설정됨" : "Gemini 키 설정"}</span>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? "AI 분석 중..." : "AI 전략 보고서 생성"}</span>
          </button>
        </div>
      </div>

      {showKeyInput && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              Google Gemini API 키 입력
            </span>
            <span className="text-[11px] text-slate-400">
              * 키 없이도 자체 로컬 스마트 진단 알고리즘이 작동합니다.
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="AI Studio에서 발급받은 Gemini API 키 (브라우저 로컬 저장)"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              onClick={() => setShowKeyInput(false)}
              className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-sky-400" />
            <h3 className="text-base font-bold text-white">연말정산 소득공제 최적화 분석</h3>
          </div>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            신용카드(15%) vs 체크카드(30%)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">카드 소득공제 문턱 (총급여의 25%)</span>
                <span className={thresholdProgress >= 100 ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {thresholdProgress}% ({formatKRW(totalCardSpent)} / {formatKRW(threshold)})
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

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>신용카드 사용액</span>
                  <span className="text-sky-400 font-semibold">공제율 15%</span>
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  {formatKRW(taxData.creditCardUsage)}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>체크카드/현금 사용액</span>
                  <span className="text-emerald-400 font-semibold">공제율 30%</span>
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  {formatKRW(taxData.debitCardUsage)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>AI CFO 절세 조언</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {totalCardSpent < threshold ? (
                <>
                  현재 총 카드 사용액이 문턱(총급여의 25%)에 도달하지 않았습니다. 
                  혜택 및 포인트 적립률이 높은 <strong>신용카드</strong>를 우선 사용하는 것이 유리합니다.
                </>
              ) : (
                <>
                  축하합니다! 소득공제 문턱을 돌파했습니다. 🎉
                  지금부터는 공제율이 2배 높은 <strong>체크카드(30%) 및 현금영수증</strong>을 집중 사용하세요!
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

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg min-h-[360px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-300">
              최근 가계부 및 자산 데이터를 분석하여 맞춤 전략을 수립하고 있습니다...
            </p>
            <span className="text-xs text-slate-500">소비 구조, 저축률, 고정비 절감, 연말정산 최적화 계산 중</span>
          </div>
        ) : report ? (
          <div className="prose prose-invert max-w-none space-y-4 text-slate-200 text-sm leading-relaxed">
            {report.split("\n\n").map((paragraph, idx) => {
              if (paragraph.startsWith("# ")) {
                return <h1 key={idx} className="text-xl sm:text-2xl font-black text-emerald-400 pb-2 border-b border-slate-800">{paragraph.replace("# ", "")}</h1>;
              }
              if (paragraph.startsWith("## ")) {
                return <h2 key={idx} className="text-base sm:text-lg font-bold text-sky-400 mt-4 mb-2">{paragraph.replace("## ", "")}</h2>;
              }
              if (paragraph.startsWith("- ")) {
                return (
                  <ul key={idx} className="list-disc list-inside space-y-1 text-slate-300">
                    {paragraph.split("\n").map((line, liIdx) => (
                      <li key={liIdx}>{line.replace("- ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={idx} className="text-slate-300">{paragraph}</p>;
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-300">
              AI 재무 진단 준비 완료
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              상단의 "AI 전략 보고서 생성" 버튼을 누르면 당신의 수입, 지출, 고정비, 자산 구조를 종합 진단해드립니다.
            </p>
            <button
              onClick={handleGenerateReport}
              className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>지금 진단 시작하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIReportView;

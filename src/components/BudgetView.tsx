import React, { useState } from "react";
import type { MonthlyBudget, Transaction } from "../types/financial";
import { EXPENSE_CATEGORIES, getCategoryColor } from "../utils/categories";
import { formatKRW } from "../utils/calculators";
import { 
  Target, 
  Sliders, 
  Calendar, 
  Zap, 
  Save
} from "lucide-react";

interface BudgetViewProps {
  currentMonth: string; // YYYY-MM
  budgets: Record<string, MonthlyBudget>;
  transactions: Transaction[];
  onSaveBudget: (month: string, totalBudget: number, categoryBudgets: Record<string, number>) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  currentMonth,
  budgets,
  transactions,
  onSaveBudget,
}) => {
  const [year, month] = currentMonth.split("-").map(Number);
  const currentBudget = budgets[currentMonth] || {
    month: currentMonth,
    totalBudget: 0,
    categoryBudgets: {},
  };

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTotalBudget, setEditTotalBudget] = useState<string>(String(currentBudget.totalBudget || ""));
  const [editCategoryBudgets, setEditCategoryBudgets] = useState<Record<string, string>>(() => {
    const res: Record<string, string> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      res[c.name] = String(currentBudget.categoryBudgets[c.name] || "");
    });
    return res;
  });

  const categorySpentMap: Record<string, number> = {};
  let totalSpent = 0;
  transactions
    .filter((tx) => tx.date.startsWith(currentMonth) && tx.type === "expense")
    .forEach((tx) => {
      categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + tx.amount;
      totalSpent += tx.amount;
    });

  const today = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = (today.getFullYear() === year && today.getMonth() + 1 === month) 
    ? today.getDate() 
    : 1;
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);

  const totalBudgetAmount = currentBudget.totalBudget || 0;
  const remainingTotalBudget = Math.max(0, totalBudgetAmount - totalSpent);
  const dailyRecommendedExpense = Math.floor(remainingTotalBudget / remainingDays);
  const totalSpendPercent = totalBudgetAmount > 0 
    ? Math.round((totalSpent / totalBudgetAmount) * 100) 
    : 0;

  const handleStartEdit = () => {
    setEditTotalBudget(String(currentBudget.totalBudget || ""));
    const res: Record<string, string> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      res[c.name] = currentBudget.categoryBudgets[c.name] ? String(currentBudget.categoryBudgets[c.name]) : "";
    });
    setEditCategoryBudgets(res);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = parseInt(editTotalBudget.replace(/[^0-9]/g, ""), 10) || 0;
    const catObj: Record<string, number> = {};
    Object.entries(editCategoryBudgets).forEach(([cat, val]) => {
      const numVal = parseInt(val.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(numVal) && numVal > 0) {
        catObj[cat] = numVal;
      }
    });

    onSaveBudget(currentMonth, numTotal, catObj);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-400" />
            <span>{month}월 예산 목표 관리</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            월별 지출 한도를 설정하고 카테고리별 예산 소진 상황을 실시간으로 추적하세요.
          </p>
        </div>

        <div>
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/20 transition"
            >
              <Sliders className="w-4 h-4" />
              <span>예산 수정하기</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              편집 취소
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🎯 {month}월 예산 설정</span>
            </h3>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4 stroke-[3]" />
              <span>설정 저장</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              이번 달 총 지출 목표 예산
            </label>
            <div className="relative max-w-sm">
              <input
                type="text"
                value={editTotalBudget ? Number(editTotalBudget).toLocaleString("ko-KR") : ""}
                onChange={(e) => setEditTotalBudget(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xl font-bold text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                원
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold text-slate-400">
                주요 카테고리별 예산 배분 (선택 사항)
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXPENSE_CATEGORIES.map((cat) => {
                const val = editCategoryBudgets[cat.name] || "";
                return (
                  <div key={cat.id} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-300 truncate w-24">
                      {cat.name}
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={val ? Number(val).toLocaleString("ko-KR") : ""}
                        onChange={(e) => setEditCategoryBudgets({
                          ...editCategoryBudgets,
                          [cat.name]: e.target.value.replace(/[^0-9]/g, "")
                        })}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-right font-semibold text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-500/20"
            >
              설정 저장 완료
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs font-semibold text-slate-400">총 예산 대비 지출</span>
              <div className="text-2xl font-black text-white mt-1">
                {formatKRW(totalSpent)} <span className="text-sm font-normal text-slate-400">/ {formatKRW(totalBudgetAmount)}</span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">소진율</span>
                  <span className={totalSpendPercent > 100 ? "text-rose-400 font-bold" : totalSpendPercent > 80 ? "text-amber-400" : "text-emerald-400"}>
                    {totalSpendPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      totalSpendPercent > 100 ? "bg-rose-500" : totalSpendPercent > 80 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, totalSpendPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs font-semibold text-slate-400">남은 잔여 예산</span>
              <div className={`text-2xl font-black mt-1 ${
                totalSpent > totalBudgetAmount && totalBudgetAmount > 0 ? "text-rose-400" : "text-sky-400"
              }`}>
                {totalBudgetAmount > 0 ? (
                  totalSpent > totalBudgetAmount 
                    ? `-${formatKRW(totalSpent - totalBudgetAmount)} 초과` 
                    : formatKRW(remainingTotalBudget)
                ) : (
                  "예산 미설정"
                )}
              </div>
              <div className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>이번 달 {remainingDays}일 남음 ({currentDay}/{daysInMonth}일)</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">오늘 하루 권장 지출액</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {totalBudgetAmount > 0 ? formatKRW(dailyRecommendedExpense) : "0원"}
              </div>
              <div className="text-xs text-slate-400 mt-3">
                {totalBudgetAmount > 0 ? (
                  totalSpent > totalBudgetAmount ? (
                    <span className="text-rose-400 font-semibold">⚠️ 예산 초과 상태입니다.</span>
                  ) : (
                    <span>하루 이 금액 내로 지출하면 예산 준수 가능!</span>
                  )
                ) : (
                  <span>예산을 설정하면 권장액이 계산됩니다.</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">카테고리별 예산 소진 현황</h3>
                <p className="text-xs text-slate-400 mt-0.5">각 항목별 실지출과 남은 한도를 확인하세요.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXPENSE_CATEGORIES.map((cat) => {
                const budgetAmt = currentBudget.categoryBudgets[cat.name] || 0;
                const spentAmt = categorySpentMap[cat.name] || 0;
                const percent = budgetAmt > 0 ? Math.round((spentAmt / budgetAmt) * 100) : 0;
                const isOver = budgetAmt > 0 && spentAmt > budgetAmt;

                if (budgetAmt === 0 && spentAmt === 0) return null;

                return (
                  <div key={cat.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getCategoryColor(cat.name) }} 
                        />
                        <span className="text-sm font-bold text-white">{cat.name}</span>
                      </div>
                      <div className="text-xs">
                        {budgetAmt > 0 ? (
                          <span className={isOver ? "text-rose-400 font-bold" : "text-slate-400"}>
                            {percent}% ({formatKRW(spentAmt)} / {formatKRW(budgetAmt)})
                          </span>
                        ) : (
                          <span className="text-slate-400">지출 {formatKRW(spentAmt)} (예산 미설정)</span>
                        )}
                      </div>
                    </div>

                    {budgetAmt > 0 && (
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? "bg-rose-500" : percent > 80 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>{isOver ? "초과 금액" : "남은 한도"}</span>
                      <span className={`font-semibold ${isOver ? "text-rose-400" : "text-slate-300"}`}>
                        {budgetAmt > 0 
                          ? (isOver ? `-${formatKRW(spentAmt - budgetAmt)}` : formatKRW(budgetAmt - spentAmt))
                          : "-"
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BudgetView;

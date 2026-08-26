import React from "react";
import type { 
  Transaction, 
  Account, 
  RecurringItem, 
  MonthlyBudget 
} from "../types/financial";
import { formatKRW, calculateMonthlySummary } from "../utils/calculators";
import { getCategoryColor } from "../utils/categories";
import { 
  ResponsiveContainer, 
  ComposedChart,
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Clock,
  Plus,
  LineChart as LineChartIcon
} from "lucide-react";

interface DashboardProps {
  currentMonth: string; // YYYY-MM
  accounts: Account[];
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  budgets: Record<string, MonthlyBudget>;
  onNavigateTab: (tab: any) => void;
  onOpenAddModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentMonth,
  accounts,
  transactions,
  recurringItems,
  budgets,
  onNavigateTab,
  onOpenAddModal,
}) => {
  // 1. 자산 계산 (Net Worth)
  const totalAssets = accounts
    .filter((a) => a.type !== "loan" && a.type !== "credit_card")
    .reduce((acc, a) => acc + (a.balance || 0), 0);

  const totalLiabilities = accounts
    .filter((a) => a.type === "loan" || (a.type === "credit_card" && a.balance < 0))
    .reduce((acc, a) => acc + Math.abs(a.balance || 0), 0);

  const netWorth = totalAssets - totalLiabilities;

  // 2. 이번 달 수입 / 지출 요약
  const summary = calculateMonthlySummary(transactions, currentMonth);

  // 3. 예산 상태
  const currentBudget = budgets[currentMonth]?.totalBudget || 0;
  const budgetSpentPercent = currentBudget > 0 
    ? Math.min(100, Math.round((summary.totalExpense / currentBudget) * 100)) 
    : 0;
  const remainingBudget = Math.max(0, currentBudget - summary.totalExpense);

  // 4. 최근 6개월 수입 vs 지출 vs 총 자산 꺾은선 추이 데이터
  const [currY, currM] = currentMonth.split("-").map(Number);
  const monthList: { mStr: string; mLabel: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currY, currM - 1 - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const mLabel = `${d.getMonth() + 1}월`;
    monthList.push({ mStr, mLabel });
  }

  // 과거 월별 순이익 흐름으로 각 월말 총자산 역산
  // 현재 netWorth 기준으로 이후 변동을 제외하고 각 시점의 총자산 추정
  let runningAsset = netWorth;
  const monthlyBalances = monthList.map(({ mStr }) => {
    const s = calculateMonthlySummary(transactions, mStr);
    return { mStr, income: s.totalIncome, expense: s.totalExpense, net: s.totalIncome - s.totalExpense };
  });

  // 현재월 이후의 총자산에서 거꾸로 역산
  const assetHistoryMap: Record<string, number> = {};
  for (let i = monthlyBalances.length - 1; i >= 0; i--) {
    assetHistoryMap[monthlyBalances[i].mStr] = runningAsset;
    // 이전 달의 자산 = 현재달 자산 - 이번달 순수익
    runningAsset = runningAsset - monthlyBalances[i].net;
  }

  const monthlyTrendData = monthlyBalances.map(({ mStr, income, expense }) => {
    const d = new Date(mStr + "-01");
    return {
      month: `${d.getMonth() + 1}월`,
      수입: income,
      지출: expense,
      총자산: Math.max(0, assetHistoryMap[mStr] || 0),
    };
  });

  // 5. 이번 달 카테고리별 지출 도넛 차트 데이터
  const categoryExpenseMap: Record<string, number> = {};
  transactions
    .filter((tx) => tx.date.startsWith(currentMonth) && tx.type === "expense")
    .forEach((tx) => {
      categoryExpenseMap[tx.category] = (categoryExpenseMap[tx.category] || 0) + tx.amount;
    });

  const categoryChartData = Object.entries(categoryExpenseMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 6. 다가오는 고정비
  const today = new Date();
  const currentDay = today.getDate();
  const upcomingRecurring = recurringItems
    .filter((r) => r.isActive && r.type === "expense" && r.dayOfMonth >= currentDay)
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
    .slice(0, 4);

  // 7. 최근 거래 내역 5건
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 순자산 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">총 순자산 (Net Worth)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {formatKRW(netWorth)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span>자산: <strong className="text-emerald-400 font-medium">{formatKRW(totalAssets)}</strong></span>
              <span>•</span>
              <span>부채/카드: <strong className="text-rose-400 font-medium">{formatKRW(totalLiabilities)}</strong></span>
            </div>
          </div>
        </div>

        {/* 이번달 수입 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">이번 달 총 수입</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              +{formatKRW(summary.totalIncome)}
            </div>
            <div className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
              <span>순수익:</span>
              <strong className="text-slate-200">
                {formatKRW(summary.totalIncome - summary.totalExpense)}
              </strong>
            </div>
          </div>
        </div>

        {/* 이번달 지출 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">이번 달 총 지출</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-400 tracking-tight">
              -{formatKRW(summary.totalExpense)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span>고정비: <strong className="text-slate-300">{formatKRW(summary.fixedExpense)}</strong></span>
              <span>•</span>
              <span>변동비: <strong className="text-slate-300">{formatKRW(summary.variableExpense)}</strong></span>
            </div>
          </div>
        </div>

        {/* 예산 잔액 & 소진율 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">남은 예산</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-sky-400 tracking-tight">
              {currentBudget > 0 ? formatKRW(remainingBudget) : "예산 미설정"}
            </div>
            {currentBudget > 0 ? (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>소진율</span>
                  <span className={budgetSpentPercent > 90 ? "text-rose-400 font-bold" : "text-slate-300"}>
                    {budgetSpentPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      budgetSpentPercent > 100 ? "bg-rose-500" : budgetSpentPercent > 80 ? "bg-amber-500" : "bg-sky-500"
                    }`} 
                    style={{ width: `${Math.min(100, budgetSpentPercent)}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={() => onNavigateTab("budgets")}
                className="mt-1.5 text-xs text-sky-400 hover:underline inline-block font-semibold"
              >
                + 이번 달 예산 설정하기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. 최근 6개월 수입 & 지출 & 총 자산 꺾은선 추이 차트 */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>최근 6개월 수입 & 지출 & 총 자산 추이</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">막대(수입/지출) 및 꺾은선(총 자산 변동) 통합 분석</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-sky-400 font-semibold bg-sky-500/10 px-2 py-1 rounded-md border border-sky-500/20">
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>총 자산 꺾은선</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                {/* 좌측 Y축: 수입 / 지출 */}
                <YAxis 
                  yAxisId="left"
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `${(val / 10000).toLocaleString()}만`} 
                />
                {/* 우측 Y축: 총 자산 */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#38bdf8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `${(val / 10000).toLocaleString()}만`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                  formatter={(value: any, name: any) => [
                    formatKRW(Number(value)), 
                    name === "총자산" ? "📈 총 자산" : name === "수입" ? "🟢 수입" : "🔴 지출"
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  formatter={(value) => {
                    if (value === "총자산") return <span className="text-sky-400 font-bold">총 자산 (꺾은선)</span>;
                    if (value === "수입") return <span className="text-emerald-400 font-bold">수입</span>;
                    if (value === "지출") return <span className="text-rose-400 font-bold">지출</span>;
                    return value;
                  }}
                />
                <Bar yAxisId="left" dataKey="수입" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="left" dataKey="지출" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="총자산" 
                  stroke="#38bdf8" 
                  strokeWidth={3} 
                  dot={{ fill: "#0284c7", stroke: "#38bdf8", strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, fill: "#38bdf8" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. 카테고리별 지출 비중 & 지출 비용 상세 카드 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white">카테고리별 지출 비중</h3>
              <p className="text-xs text-slate-400 mt-0.5">항목별 지출 비율 및 실제 지출액</p>
            </div>
            <span className="text-xs font-bold text-slate-300">
              총 {formatKRW(summary.totalExpense)}
            </span>
          </div>

          {categoryChartData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {categoryChartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                      formatter={(val: any, name: any) => [
                        `${formatKRW(Number(val))} (${Math.round((Number(val) / summary.totalExpense) * 100)}%)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 카테고리별 지출 비용 & 비중 (예: 주거/통신 56% \n 300,000 원) */}
              <div className="w-full mt-2 grid grid-cols-2 gap-2.5 max-h-40 overflow-y-auto pr-1">
                {categoryChartData.map((item) => {
                  const percent = Math.round((item.value / summary.totalExpense) * 100);
                  const color = getCategoryColor(item.name);
                  return (
                    <div 
                      key={item.name} 
                      className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/90 flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      {/* 1행: 카테고리명 & 비중 % */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs font-semibold text-slate-300 truncate">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-100 shrink-0">
                          {percent}%
                        </span>
                      </div>
                      {/* 2행: 실제 지출 금액 (예: 300,000 원) */}
                      <div className="mt-1 text-right text-xs font-black text-rose-300 tracking-tight">
                        {formatKRW(item.value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-8">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <span>이번 달 지출 내역이 없습니다.</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Upcoming Recurring & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 다가오는 고정비 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">이번 달 결제 예정 고정비</h3>
            </div>
            <button
              onClick={() => onNavigateTab("recurring")}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              전체 보기 →
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingRecurring.length > 0 ? (
              upcomingRecurring.map((item) => {
                const daysLeft = item.dayOfMonth - currentDay;
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {daysLeft === 0 ? "D-Day (오늘)" : `D-${daysLeft} (${item.dayOfMonth}일)`}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="text-xs text-slate-400">{item.category}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-rose-400">
                      -{formatKRW(item.amount)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2 opacity-80" />
                <span>이번 달 예정된 고정비가 모두 결제되었거나 없습니다.</span>
              </div>
            )}
          </div>
        </div>

        {/* 최근 거래 내역 5건 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">최근 거래 내역</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddModal}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
              <button
                onClick={() => onNavigateTab("transactions")}
                className="text-xs text-slate-400 hover:text-white font-semibold ml-2"
              >
                전체 내역 →
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: getCategoryColor(tx.category) }} 
                  />
                  <div>
                    <div className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-[240px]">
                      {tx.memo || tx.category}
                    </div>
                    <div className="text-xs text-slate-400">
                      {tx.date} • {tx.category}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${
                  tx.type === "income" ? "text-emerald-400" : tx.type === "expense" ? "text-rose-400" : "text-sky-400"
                }`}>
                  {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "⇄"}
                  {formatKRW(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

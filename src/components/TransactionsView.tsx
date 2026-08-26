import React, { useState, useMemo } from "react";
import type { Transaction, Account, TransactionType } from "../types/financial";
import { formatKRW, calculateMonthlySummary } from "../utils/calculators";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryColor, getCategoryBgColor } from "../utils/categories";
import { exportTransactionsToCSV } from "../utils/csvHelper";
import { 
  Search, 
  Plus, 
  Download, 
  List, 
  Calendar as CalendarIcon, 
  Edit3, 
  Trash2, 
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";

interface TransactionsViewProps {
  currentMonth: string; // YYYY-MM
  transactions: Transaction[];
  accounts: Account[];
  onOpenAddModal: (defaultDate?: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  currentMonth,
  transactions,
  accounts,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a.name])), [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date.startsWith(currentMonth)) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;
      if (accountFilter !== "all" && tx.accountId !== accountFilter && tx.toAccountId !== accountFilter) return false;

      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const memoMatch = tx.memo.toLowerCase().includes(term);
        const catMatch = tx.category.toLowerCase().includes(term);
        if (!memoMatch && !catMatch) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentMonth, typeFilter, categoryFilter, accountFilter, searchTerm]);

  const summary = useMemo(() => calculateMonthlySummary(transactions, currentMonth), [transactions, currentMonth]);

  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    filteredTransactions.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const [year, month] = currentMonth.split("-").map(Number);
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateStr: "" });
    }
    for (let d = 1; d <= lastDate; d++) {
      const dStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, dateStr: dStr });
    }
    return days;
  }, [year, month]);

  const daySummaryMap = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    transactions
      .filter((tx) => tx.date.startsWith(currentMonth))
      .forEach((tx) => {
        if (!map[tx.date]) map[tx.date] = { income: 0, expense: 0, count: 0 };
        if (tx.type === "income") map[tx.date].income += tx.amount;
        if (tx.type === "expense") map[tx.date].expense += tx.amount;
        map[tx.date].count += 1;
      });
    return map;
  }, [transactions, currentMonth]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Monthly Summary Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{month}월 가계부 내역</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                총 {filteredTransactions.length}건
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              상세 거래 내역을 검색하고 분류별로 조회하세요.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "list"
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>리스트</span>
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "calendar"
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>캘린더</span>
              </button>
            </div>

            <button
              onClick={() => exportTransactionsToCSV(transactions, accounts)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="CSV 엑셀 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() => onOpenAddModal()}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>추가</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Badges - Perfectly fitted in a single line with signs */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 text-center">
          <div className="px-1.5 py-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-center items-center overflow-hidden">
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap">총 수입</span>
            <div className="text-xs xs:text-sm sm:text-base font-black text-emerald-400 mt-1 whitespace-nowrap truncate w-full tracking-tight">
              +{formatKRW(summary.totalIncome)}
            </div>
          </div>
          <div className="px-1.5 py-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-center items-center overflow-hidden">
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap">총 지출</span>
            <div className="text-xs xs:text-sm sm:text-base font-black text-rose-400 mt-1 whitespace-nowrap truncate w-full tracking-tight">
              -{formatKRW(summary.totalExpense)}
            </div>
          </div>
          <div className="px-1.5 py-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-center items-center overflow-hidden">
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap">당월 수지</span>
            <div className={`text-xs xs:text-sm sm:text-base font-black mt-1 whitespace-nowrap truncate w-full tracking-tight ${
              summary.balance >= 0 ? "text-sky-400" : "text-rose-400"
            }`}>
              {summary.balance >= 0 ? "+" : ""}{formatKRW(summary.balance)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="내용 또는 카테고리 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto">
            {[
              { id: "all", label: "전체" },
              { id: "expense", label: "지출" },
              { id: "income", label: "수입" },
              { id: "transfer", label: "이체" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  typeFilter === tab.id
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">전체 카테고리</option>
            <optgroup label="지출 카테고리">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="수입 카테고리">
              {INCOME_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </optgroup>
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">전체 계좌/카드</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.institution || a.type})
              </option>
            ))}
          </select>

          {(categoryFilter !== "all" || accountFilter !== "all" || searchTerm || typeFilter !== "all") && (
            <button
              onClick={() => {
                setCategoryFilter("all");
                setAccountFilter("all");
                setSearchTerm("");
                setTypeFilter("all");
              }}
              className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-xl py-2 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>필터 초기화</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-4">
          {Object.keys(groupedTransactions).length > 0 ? (
            Object.entries(groupedTransactions).map(([date, txList]) => {
              const dayIncome = txList.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
              const dayExpense = txList.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
              const dayOfWeek = new Date(date).toLocaleDateString("ko-KR", { weekday: "short" });

              return (
                <div key={date} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{date}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                        {dayOfWeek}요일
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      {dayIncome > 0 && (
                        <span className="text-emerald-400">+{formatKRW(dayIncome)}</span>
                      )}
                      {dayExpense > 0 && (
                        <span className="text-rose-400">-{formatKRW(dayExpense)}</span>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {txList.map((tx) => {
                      const accName = accountMap.get(tx.accountId) || tx.paymentMethod || "미지정";
                      const toAccName = tx.toAccountId ? accountMap.get(tx.toAccountId) : "";

                      return (
                        <div 
                          key={tx.id} 
                          className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition group"
                        >
                          <div className="flex items-center gap-3">
                            <span 
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                              style={{ 
                                backgroundColor: getCategoryBgColor(tx.category), 
                                color: getCategoryColor(tx.category) 
                              }}
                            >
                              {tx.category.slice(0, 2)}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {tx.memo || tx.category}
                                </span>
                                {tx.isFixed && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                    고정비
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span>{tx.category}</span>
                                <span>•</span>
                                <span>
                                  {tx.type === "transfer" ? `${accName} → ${toAccName}` : accName}
                                </span>
                                {tx.paymentMethod && tx.type === "expense" && (
                                  <>
                                    <span>•</span>
                                    <span>{tx.paymentMethod}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className={`text-sm sm:text-base font-bold text-right ${
                              tx.type === "income" ? "text-emerald-400" : tx.type === "expense" ? "text-rose-400" : "text-sky-400"
                            }`}>
                              {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "⇄ "}
                              {formatKRW(tx.amount)}
                            </div>

                            <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => onEditTransaction(tx)}
                                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                                title="수정"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteTransaction(tx.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-lg">
              <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold text-slate-400">조건에 일치하는 거래 내역이 없습니다.</p>
              <p className="text-xs text-slate-500 mt-1">필터를 변경하거나 새로운 거래 내역을 추가해보세요.</p>
              <button
                onClick={() => onOpenAddModal()}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" />
                새 거래 내역 추가
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4">
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-800">
            <span className="text-rose-400">일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span className="text-sky-400">토</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((item, idx) => {
              if (!item.day) {
                return <div key={`empty-${idx}`} className="h-20 sm:h-24 bg-slate-950/20 rounded-xl" />;
              }

              const summaryDay = daySummaryMap[item.dateStr];
              const isSelected = selectedCalendarDate === item.dateStr;
              const isSunday = idx % 7 === 0;
              const isSaturday = idx % 7 === 6;

              return (
                <div
                  key={item.dateStr}
                  onClick={() => setSelectedCalendarDate(isSelected ? null : item.dateStr)}
                  className={`h-20 sm:h-24 p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition relative ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500"
                      : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${
                      isSunday ? "text-rose-400" : isSaturday ? "text-sky-400" : "text-slate-300"
                    }`}>
                      {item.day}
                    </span>
                    {summaryDay?.count && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {summaryDay.count}건
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 text-[10px] sm:text-xs font-semibold overflow-hidden">
                    {summaryDay?.income ? (
                      <div className="text-emerald-400 truncate">
                        +{formatKRW(summaryDay.income)}
                      </div>
                    ) : null}
                    {summaryDay?.expense ? (
                      <div className="text-rose-400 truncate">
                        -{formatKRW(summaryDay.expense)}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedCalendarDate && (
            <div className="mt-6 pt-4 border-t border-slate-800 animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📅 {selectedCalendarDate} 내역</span>
                  <span className="text-xs text-slate-400">
                    ({transactions.filter(t => t.date === selectedCalendarDate).length}건)
                  </span>
                </h4>
                <button
                  onClick={() => onOpenAddModal(selectedCalendarDate)}
                  className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>이 날짜에 내역 추가</span>
                </button>
              </div>

              <div className="space-y-2">
                {transactions.filter(t => t.date === selectedCalendarDate).length > 0 ? (
                  transactions
                    .filter(t => t.date === selectedCalendarDate)
                    .map((tx) => (
                      <div 
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                            style={{ backgroundColor: getCategoryBgColor(tx.category), color: getCategoryColor(tx.category) }}
                          >
                            {tx.category.slice(0, 2)}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">{tx.memo || tx.category}</div>
                            <div className="text-[10px] text-slate-400">{accountMap.get(tx.accountId)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${
                            tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {tx.type === "income" ? "+" : "-"}{formatKRW(tx.amount)}
                          </span>
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="text-slate-400 hover:text-slate-200 p-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-xs text-slate-500 py-3 text-center">
                    이 날짜의 거래 내역이 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsView;

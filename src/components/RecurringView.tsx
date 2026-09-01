import React, { useState } from "react";
import type { RecurringItem, Account } from "../types/financial";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryColor, getCategoryBgColor } from "../utils/categories";
import { formatKRW } from "../utils/calculators";
import { 
  Repeat, 
  Plus, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle2
} from "lucide-react";

interface RecurringViewProps {
  currentMonth: string; // YYYY-MM
  recurringItems: RecurringItem[];
  accounts: Account[];
  onAddRecurring: (item: Omit<RecurringItem, "id">) => void;
  onUpdateRecurring: (id: string, item: Partial<RecurringItem>) => void;
  onDeleteRecurring: (id: string) => void;
  onApplyToTransaction: (item: RecurringItem, monthStr: string) => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({
  currentMonth,
  recurringItems,
  accounts,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
  onApplyToTransaction,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("주거/통신");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "acc-1");
  const [dayOfMonth, setDayOfMonth] = useState<number>(15);
  const [memo, setMemo] = useState("");

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const openAddModal = () => {
    setEditingItem(null);
    setTitle("");
    setType("expense");
    setAmount("");
    setCategory(EXPENSE_CATEGORIES[0].name);
    setAccountId(accounts[0]?.id || "acc-1");
    setDayOfMonth(15);
    setMemo("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: RecurringItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setType(item.type);
    setAmount(String(item.amount));
    setCategory(item.category);
    setAccountId(item.accountId);
    setDayOfMonth(item.dayOfMonth);
    setMemo(item.memo || "");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (!title || isNaN(numAmount) || numAmount <= 0) {
      alert("항목명과 올바른 금액을 입력해주세요.");
      return;
    }

    const payload = {
      title,
      type,
      amount: numAmount,
      category,
      accountId,
      dayOfMonth: Number(dayOfMonth),
      memo,
      isActive: true,
      autoApply: true,
    };

    if (editingItem) {
      onUpdateRecurring(editingItem.id, payload);
    } else {
      onAddRecurring(payload);
    }
    setIsModalOpen(false);
  };

  const monthlyFixedExpense = recurringItems
    .filter((r) => r.isActive && r.type === "expense")
    .reduce((acc, r) => acc + r.amount, 0);

  const monthlyFixedIncome = recurringItems
    .filter((r) => r.isActive && r.type === "income")
    .reduce((acc, r) => acc + r.amount, 0);

  const yearlyFixedExpense = monthlyFixedExpense * 12;

  const today = new Date();
  const currentDay = today.getDate();

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-emerald-400" />
            <span>고정비 & 정기결제 관리</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            월세, 통신비, 구독료 등 매월 반복되는 비용을 한곳에서 추적하고 가계부에 원클릭 등록하세요.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>새 고정비 추가</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">월 고정 지출 총액</span>
          <div className="text-2xl font-black text-rose-400 mt-1">
            -{formatKRW(monthlyFixedExpense)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            총 {recurringItems.filter((r) => r.isActive && r.type === "expense").length}건의 고정 지출 항목
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">연간 고정 지출 예상액</span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {formatKRW(yearlyFixedExpense)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            숨만 쉬어도 나가는 1년 고정 비용
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">월 고정 수입 (급여 등)</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            +{formatKRW(monthlyFixedIncome)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            매월 정기적으로 유입되는 기본 자금
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>정기 결제 목록 ({recurringItems.length}개)</span>
          </h3>
          <span className="text-xs text-slate-400">매월 결제일 순 정렬</span>
        </div>

        <div className="space-y-3">
          {recurringItems
            .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
            .map((item) => {
              const isAppliedThisMonth = item.lastAppliedMonth === currentMonth;
              const daysLeft = item.dayOfMonth - currentDay;
              const isExpense = item.type === "expense";
              const accName = accountMap.get(item.accountId) || "미지정";

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        backgroundColor: getCategoryBgColor(item.category),
                        color: getCategoryColor(item.category),
                      }}
                    >
                      {item.dayOfMonth}일
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{item.title}</span>
                        {isExpense ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                            지출
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            수입
                          </span>
                        )}
                        {daysLeft >= 0 && daysLeft <= 7 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                            {daysLeft === 0 ? "D-Day (오늘)" : `D-${daysLeft}`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{accName}</span>
                        {item.memo && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{item.memo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className={`text-base font-bold ${isExpense ? "text-rose-400" : "text-emerald-400"}`}>
                      {isExpense ? "-" : "+"}{formatKRW(item.amount)}
                    </div>

                    <button
                      onClick={() => onApplyToTransaction(item, currentMonth)}
                      disabled={isAppliedThisMonth}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isAppliedThisMonth
                          ? "bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {isAppliedThisMonth ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>이번달 반영됨</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>가계부에 반영</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRecurring(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold">
                {editingItem ? "고정비 수정" : "새 고정비 / 정기결제 등록"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    type === "expense"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  고정 지출 (-)
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    type === "income"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  고정 수입 (+)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">항목명</label>
                <input
                  type="text"
                  placeholder="예: 넷플릭스 프리미엄, 아파트 월세"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">금액 (원)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={amount ? Number(amount).toLocaleString("ko-KR") : ""}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">매월 결제일</label>
                  <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                    <span className="text-xs text-slate-400">매월</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Number(e.target.value))}
                      className="w-12 bg-transparent text-sm font-bold text-white focus:outline-none text-center"
                    />
                    <span className="text-xs text-slate-400">일</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">카테고리</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">결제 계좌/카드</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.length === 0 && (
                    <option value="">등록된 계좌 없음 (현금/미지정)</option>
                  )}
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.institution || a.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">메모</label>
                <input
                  type="text"
                  placeholder="추가 메모 입력"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-slate-950 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringView;

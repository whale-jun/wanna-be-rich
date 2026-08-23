import React, { useState } from "react";
import type { Transaction, Account, TransactionType, PaymentMethod } from "../types/financial";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../utils/categories";
import { X, Check } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id">) => void;
  onUpdate?: (id: string, tx: Partial<Transaction>) => void;
  accounts: Account[];
  editingTx?: Transaction | null;
  defaultDate?: string;
}

interface ModalContentProps {
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id">) => void;
  onUpdate?: (id: string, tx: Partial<Transaction>) => void;
  accounts: Account[];
  editingTx?: Transaction | null;
  defaultDate?: string;
}

const TransactionModalContent: React.FC<ModalContentProps> = ({
  onClose,
  onSave,
  onUpdate,
  accounts,
  editingTx,
  defaultDate,
}) => {
  const [type, setType] = useState<TransactionType>(editingTx?.type || "expense");
  const [date, setDate] = useState<string>(
    editingTx?.date || defaultDate || new Date().toISOString().slice(0, 10)
  );
  const [amount, setAmount] = useState<string>(
    editingTx ? Number(editingTx.amount).toLocaleString("ko-KR") : ""
  );
  const [category, setCategory] = useState<string>(
    editingTx?.category || (editingTx?.type === "income" ? INCOME_CATEGORIES[0].name : EXPENSE_CATEGORIES[0].name)
  );
  const [accountId, setAccountId] = useState<string>(
    editingTx?.accountId || accounts[0]?.id || "acc-1"
  );
  const [toAccountId, setToAccountId] = useState<string>(editingTx?.toAccountId || "");
  const [memo, setMemo] = useState<string>(editingTx?.memo || "");
  const [isFixed, setIsFixed] = useState<boolean>(!!editingTx?.isFixed);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingTx?.paymentMethod || "신용카드"
  );

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (!editingTx) {
      if (newType === "expense") setCategory(EXPENSE_CATEGORIES[0].name);
      else if (newType === "income") setCategory(INCOME_CATEGORIES[0].name);
      else setCategory("계좌이체");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    const payload: Omit<Transaction, "id"> = {
      date,
      type,
      amount: numAmount,
      category,
      accountId: accountId || (accounts[0]?.id ?? "acc-1"),
      toAccountId: type === "transfer" ? toAccountId : undefined,
      memo: memo.trim(),
      isFixed,
      paymentMethod,
    };

    if (editingTx && onUpdate) {
      onUpdate(editingTx.id, payload);
    } else {
      onSave(payload);
    }
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    setAmount(rawVal ? Number(rawVal).toLocaleString("ko-KR") : "");
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h3 className="text-lg font-bold">
          {editingTx ? "내역 수정" : "거래 내역 추가"}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 p-2 bg-slate-950/60 border-b border-slate-800 gap-1">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className={`py-2 text-sm font-semibold rounded-lg transition ${
            type === "expense"
              ? "bg-rose-600/20 text-rose-400 border border-rose-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          지출 (-)
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={`py-2 text-sm font-semibold rounded-lg transition ${
            type === "income"
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          수입 (+)
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("transfer")}
          className={`py-2 text-sm font-semibold rounded-lg transition ${
            type === "transfer"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          이체 (⇄)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">금액 (원)</label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0"
              autoFocus
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
              원
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              {type === "transfer" ? "출금 계좌" : "결제 계좌/카드"}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.institution || acc.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {type === "transfer" && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">입금 계좌</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="">입금 계좌 선택</option>
              {accounts
                .filter((a) => a.id !== accountId)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.institution || acc.type})
                  </option>
                ))}
            </select>
          </div>
        )}

        {type !== "transfer" && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">카테고리</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800">
              {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`px-2.5 py-2 text-xs rounded-lg font-medium transition text-center truncate ${
                    category === cat.name
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "expense" && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">결제 수단</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["신용카드", "체크카드", "현금", "계좌이체"] as PaymentMethod[]).map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1.5 text-xs rounded-lg transition font-medium ${
                    paymentMethod === pm
                      ? "bg-slate-700 text-white font-semibold border border-slate-600"
                      : "bg-slate-800/40 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">메모 / 상세 내용</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 점심 식사, 스타벅스 라떼"
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {type === "expense" && (
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isFixed}
              onChange={(e) => setIsFixed(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700 w-4 h-4"
            />
            <span className="text-xs text-slate-300">고정 지출 (월세, 구독료, 통신비 등)</span>
          </label>
        )}

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition text-sm"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {editingTx ? "수정 완료" : "내역 저장"}
          </button>
        </div>
      </form>
    </div>
  );
};

export const TransactionModal: React.FC<TransactionModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <TransactionModalContent
        key={props.editingTx ? `edit-${props.editingTx.id}` : `new-${props.defaultDate || "today"}`}
        {...props}
      />
    </div>
  );
};

export default TransactionModal;

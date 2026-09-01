import { useState, useEffect, useCallback } from "react";
import type { 
  Transaction, 
  Account, 
  RecurringItem, 
  MonthlyBudget, 
  Savings, 
  Investment 
} from "../types/financial";
import { 
  calculateNetIncome, 
  calculateSavingsDetails, 
  calculateInvestmentDetails 
} from "../utils/calculators";
import { 
  initialAccounts, 
  initialTransactions, 
  initialRecurringItems, 
  initialBudgets, 
  initialSavings, 
  initialInvestments 
} from "../utils/mockData";

// 데이터 버전 키 (빈 초기 상태로 마이그레이션)
const STORAGE_INIT_KEY = "wbr_data_clean_init_v3";

export const useFinancialData = () => {
  // 초기화 여부 체크: 최초 실행 시 기존 샘플 로컬스토리지 데이터를 깨끗이 비워 빈 상태로 시작
  const checkInitialSetup = () => {
    const isInit = localStorage.getItem(STORAGE_INIT_KEY);
    if (!isInit) {
      localStorage.removeItem("agy_accounts");
      localStorage.removeItem("agy_transactions");
      localStorage.removeItem("agy_recurring");
      localStorage.removeItem("agy_budgets");
      localStorage.removeItem("agy_savings");
      localStorage.removeItem("agy_investments");
      localStorage.setItem(STORAGE_INIT_KEY, "true");
    }
  };

  // 1. 계좌 / 카드 / 자산 (기본 빈 배열)
  const [accounts, setAccounts] = useState<Account[]>(() => {
    checkInitialSetup();
    const saved = localStorage.getItem("agy_accounts");
    return saved ? JSON.parse(saved) : [];
  });

  // 2. 거래 내역 (수입, 지출, 이체) (기본 빈 배열)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("agy_transactions");
    return saved ? JSON.parse(saved) : [];
  });

  // 3. 정기결제 / 고정비 (기본 빈 배열)
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(() => {
    const saved = localStorage.getItem("agy_recurring");
    return saved ? JSON.parse(saved) : [];
  });

  // 4. 예산 설정 (기본 빈 객체)
  const [budgets, setBudgets] = useState<Record<string, MonthlyBudget>>(() => {
    const saved = localStorage.getItem("agy_budgets");
    return saved ? JSON.parse(saved) : {};
  });

  // 5. 저축/적금 목표 (기본 빈 배열)
  const [savings, setSavings] = useState<Savings[]>(() => {
    const saved = localStorage.getItem("agy_savings");
    const list: Savings[] = saved ? JSON.parse(saved) : [];
    return list.map(calculateSavingsDetails);
  });

  // 6. 투자 자산 / 주식 / 코인 (기본 빈 배열)
  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem("agy_investments");
    const list: Investment[] = saved ? JSON.parse(saved) : [];
    return list.map(calculateInvestmentDetails);
  });

  // 7. Gemini API Key
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem("agy_gemini_api_key") || "";
  });

  // LocalStorage 자동 동기화
  useEffect(() => {
    localStorage.setItem("agy_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("agy_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("agy_recurring", JSON.stringify(recurringItems));
  }, [recurringItems]);

  useEffect(() => {
    localStorage.setItem("agy_budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("agy_savings", JSON.stringify(savings));
  }, [savings]);

  useEffect(() => {
    localStorage.setItem("agy_investments", JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem("agy_gemini_api_key", geminiApiKey);
  }, [geminiApiKey]);

  // --- Transactions Actions ---
  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    const id = crypto.randomUUID();
    let newTx: Transaction = { ...tx, id };

    if (newTx.type === "income" && (newTx.category === "월급/급여" || newTx.category === "월급")) {
      newTx = calculateNetIncome(newTx) as Transaction;
    }

    // 계좌 잔액 자동 반영
    setAccounts(prev => prev.map(acc => {
      if (acc.id === newTx.accountId) {
        if (newTx.type === "income") {
          return { ...acc, balance: acc.balance + newTx.amount };
        } else if (newTx.type === "expense") {
          return { ...acc, balance: acc.balance - newTx.amount };
        } else if (newTx.type === "transfer" && newTx.toAccountId) {
          return { ...acc, balance: acc.balance - newTx.amount };
        }
      }
      if (newTx.type === "transfer" && acc.id === newTx.toAccountId) {
        return { ...acc, balance: acc.balance + newTx.amount };
      }
      return acc;
    }));

    setTransactions(prev => [newTx, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, updated: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== id) return t;
      let newTx: Transaction = { ...t, ...updated };
      if (newTx.type === "income" && (newTx.category === "월급/급여" || newTx.category === "월급")) {
        newTx = calculateNetIncome(newTx) as Transaction;
      }
      return newTx;
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const importTransactions = useCallback((newTxs: Partial<Transaction>[]) => {
    const fullTxs: Transaction[] = newTxs.map(tx => {
      let t: Transaction = {
        id: tx.id || crypto.randomUUID(),
        date: tx.date || new Date().toISOString().slice(0, 10),
        type: tx.type || "expense",
        category: tx.category || "식비",
        amount: tx.amount || 0,
        accountId: tx.accountId || "acc-1",
        memo: tx.memo || "",
        isFixed: tx.isFixed,
        paymentMethod: tx.paymentMethod,
        ...tx
      };
      if (t.type === "income" && (t.category === "월급/급여" || t.category === "월급")) {
        t = calculateNetIncome(t) as Transaction;
      }
      return t;
    });
    setTransactions(prev => [...fullTxs, ...prev]);
  }, []);

  // --- Accounts Actions ---
  const addAccount = useCallback((acc: Omit<Account, "id">) => {
    const newAcc: Account = { ...acc, id: crypto.randomUUID() };
    setAccounts(prev => [...prev, newAcc]);
  }, []);

  const updateAccount = useCallback((id: string, updated: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  }, []);

  // --- Recurring Items Actions ---
  const addRecurringItem = useCallback((item: Omit<RecurringItem, "id">) => {
    const newItem: RecurringItem = { ...item, id: crypto.randomUUID() };
    setRecurringItems(prev => [...prev, newItem]);
  }, []);

  const updateRecurringItem = useCallback((id: string, updated: Partial<RecurringItem>) => {
    setRecurringItems(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  }, []);

  const deleteRecurringItem = useCallback((id: string) => {
    setRecurringItems(prev => prev.filter(r => r.id !== id));
  }, []);

  const applyRecurringToTransaction = useCallback((itemOrId: RecurringItem | string, monthStr: string) => {
    const recurringId = typeof itemOrId === "string" ? itemOrId : itemOrId.id;
    const item = typeof itemOrId === "object" ? itemOrId : recurringItems.find(r => r.id === recurringId);
    if (!item) return;

    const day = String(item.dayOfMonth).padStart(2, "0");
    const date = `${monthStr}-${day}`;

    const newTx: Omit<Transaction, "id"> = {
      date,
      type: item.type,
      category: item.category,
      amount: item.amount,
      accountId: item.accountId,
      memo: `[정기결제] ${item.title}`,
      isFixed: item.type === "expense",
      isRecurring: true,
      recurringId: item.id,
    };

    addTransaction(newTx);
    updateRecurringItem(recurringId, { lastAppliedMonth: monthStr });
  }, [recurringItems, addTransaction, updateRecurringItem]);

  // --- Budgets Actions ---
  const setBudgetForMonth = useCallback((month: string, totalBudget: number, categoryBudgets: Record<string, number>) => {
    setBudgets(prev => ({
      ...prev,
      [month]: {
        month,
        totalBudget,
        categoryBudgets,
      }
    }));
  }, []);

  // --- Savings & Investments Actions ---
  const addSavings = useCallback((saving: Omit<Savings, "id">) => {
    const newSaving = calculateSavingsDetails({ ...saving, id: crypto.randomUUID() });
    setSavings(prev => [...prev, newSaving]);
  }, []);

  const updateSavings = useCallback((id: string, updated: Partial<Savings>) => {
    setSavings(prev => prev.map(s => s.id === id ? calculateSavingsDetails({ ...s, ...updated }) : s));
  }, []);

  const deleteSavings = useCallback((id: string) => {
    setSavings(prev => prev.filter(s => s.id !== id));
  }, []);

  const addInvestment = useCallback((investment: Omit<Investment, "id">) => {
    const newInv = calculateInvestmentDetails({ ...investment, id: crypto.randomUUID() });
    setInvestments(prev => [...prev, newInv]);
  }, []);

  const updateInvestment = useCallback((id: string, updated: Partial<Investment>) => {
    setInvestments(prev => prev.map(i => i.id === id ? calculateInvestmentDetails({ ...i, ...updated }) : i));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
  }, []);

  // 샘플 데이터로 복원 (테스트/체험용)
  const resetToSampleData = useCallback(() => {
    setAccounts(initialAccounts);
    setTransactions(initialTransactions);
    setRecurringItems(initialRecurringItems);
    setBudgets(initialBudgets);
    setSavings(initialSavings.map(calculateSavingsDetails));
    setInvestments(initialInvestments.map(calculateInvestmentDetails));
  }, []);

  // 모든 데이터를 완전히 0으로 초기화
  const clearAllData = useCallback(() => {
    setAccounts([]);
    setTransactions([]);
    setRecurringItems([]);
    setBudgets({});
    setSavings([]);
    setInvestments([]);
  }, []);

  const loadFullBackup = useCallback((backup: any) => {
    if (backup.accounts) setAccounts(backup.accounts);
    if (backup.transactions) setTransactions(backup.transactions);
    if (backup.recurringItems) setRecurringItems(backup.recurringItems);
    if (backup.budgets) setBudgets(backup.budgets);
    if (backup.savings) setSavings(backup.savings.map(calculateSavingsDetails));
    if (backup.investments) setInvestments(backup.investments.map(calculateInvestmentDetails));
  }, []);

  return {
    accounts,
    transactions,
    recurringItems,
    budgets,
    savings,
    investments,
    geminiApiKey,
    setGeminiApiKey,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    addAccount,
    updateAccount,
    deleteAccount,
    addRecurringItem,
    updateRecurringItem,
    deleteRecurringItem,
    applyRecurringToTransaction,
    setBudgetForMonth,
    addSavings,
    updateSavings,
    deleteSavings,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    resetToSampleData,
    clearAllData,
    loadFullBackup,
  };
};

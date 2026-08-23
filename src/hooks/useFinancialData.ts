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

export const useFinancialData = () => {
  // 계좌 / 자산
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem("agy_accounts");
    return saved ? JSON.parse(saved) : initialAccounts;
  });

  // 거래 내역 (수입, 지출, 이체)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("agy_transactions");
    if (saved) return JSON.parse(saved);
    
    // 이전 버전(junsun_incomes, junsun_expenses) 마이그레이션 호환성
    const oldIncomes = localStorage.getItem("junsun_incomes");
    const oldExpenses = localStorage.getItem("junsun_expenses");
    if (oldIncomes || oldExpenses) {
      const migrated: Transaction[] = [];
      if (oldIncomes) {
        JSON.parse(oldIncomes).forEach((inc: any) => {
          migrated.push({
            id: inc.id || crypto.randomUUID(),
            date: inc.date,
            type: "income",
            category: inc.category || "월급/급여",
            amount: inc.amount,
            accountId: "acc-1",
            memo: "기존 수입 내역",
            ...inc
          });
        });
      }
      if (oldExpenses) {
        JSON.parse(oldExpenses).forEach((exp: any) => {
          migrated.push({
            id: exp.id || crypto.randomUUID(),
            date: exp.date,
            type: "expense",
            category: exp.category || "식비",
            amount: exp.amount,
            accountId: exp.paymentMethod === "신용카드" ? "acc-3" : "acc-1",
            memo: "기존 지출 내역",
            isFixed: exp.type === "고정",
            paymentMethod: exp.paymentMethod,
          });
        });
      }
      return migrated.length > 0 ? migrated : initialTransactions;
    }

    return initialTransactions;
  });

  // 정기결제 / 고정비
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(() => {
    const saved = localStorage.getItem("agy_recurring");
    return saved ? JSON.parse(saved) : initialRecurringItems;
  });

  // 예산 설정
  const [budgets, setBudgets] = useState<Record<string, MonthlyBudget>>(() => {
    const saved = localStorage.getItem("agy_budgets");
    return saved ? JSON.parse(saved) : initialBudgets;
  });

  // 저축 목표
  const [savings, setSavings] = useState<Savings[]>(() => {
    const saved = localStorage.getItem("agy_savings");
    const list: Savings[] = saved ? JSON.parse(saved) : initialSavings;
    return list.map(calculateSavingsDetails);
  });

  // 투자 자산
  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem("agy_investments");
    const list: Investment[] = saved ? JSON.parse(saved) : initialInvestments;
    return list.map(calculateInvestmentDetails);
  });

  // Gemini API Key
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem("agy_gemini_api_key") || localStorage.getItem("junsun_gemini_api_key") || "";
  });

  // LocalStorage 동기화
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
        } else if (newTx.type === "transfer") {
          return { ...acc, balance: acc.balance - newTx.amount };
        }
      }
      if (newTx.type === "transfer" && newTx.toAccountId && acc.id === newTx.toAccountId) {
        return { ...acc, balance: acc.balance + newTx.amount };
      }
      return acc;
    }));

    setTransactions(prev => [newTx, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, updated: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id !== id) return tx;
      let merged = { ...tx, ...updated };
      if (merged.type === "income" && (merged.category === "월급/급여" || merged.category === "월급")) {
        merged = calculateNetIncome(merged) as Transaction;
      }
      return merged;
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const importTransactions = useCallback((importedList: Partial<Transaction>[]) => {
    const readyList = importedList.map(item => ({
      id: item.id || crypto.randomUUID(),
      date: item.date || new Date().toISOString().slice(0, 10),
      type: item.type || "expense",
      category: item.category || "기타지출",
      amount: item.amount || 0,
      accountId: item.accountId || accounts[0]?.id || "acc-1",
      memo: item.memo || "",
      isFixed: item.isFixed || false,
    } as Transaction));

    setTransactions(prev => [...readyList, ...prev]);
  }, [accounts]);

  // --- Accounts Actions ---
  const addAccount = useCallback((account: Omit<Account, "id">) => {
    const newAcc: Account = { ...account, id: crypto.randomUUID() };
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

  const applyRecurringToTransaction = useCallback((recurring: RecurringItem, monthStr: string) => {
    const date = `${monthStr}-${String(recurring.dayOfMonth).padStart(2, "0")}`;
    addTransaction({
      date,
      type: recurring.type,
      category: recurring.category,
      amount: recurring.amount,
      accountId: recurring.accountId,
      memo: `[고정비] ${recurring.title}`,
      isFixed: true,
      recurringId: recurring.id,
    });
    updateRecurringItem(recurring.id, { lastAppliedMonth: monthStr });
  }, [addTransaction, updateRecurringItem]);

  // --- Budget Actions ---
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

  const resetToSampleData = useCallback(() => {
    setAccounts(initialAccounts);
    setTransactions(initialTransactions);
    setRecurringItems(initialRecurringItems);
    setBudgets(initialBudgets);
    setSavings(initialSavings.map(calculateSavingsDetails));
    setInvestments(initialInvestments.map(calculateInvestmentDetails));
  }, []);

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

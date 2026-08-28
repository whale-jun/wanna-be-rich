import { useState, useEffect } from "react";
import { useFinancialData } from "./hooks/useFinancialData";
import { useTheme } from "./hooks/useTheme";
import { useSecurity } from "./hooks/useSecurity";
import { Navbar } from "./components/Navbar";
import type { NavTab } from "./components/Navbar";
import { BottomNav } from "./components/BottomNav";
import { Dashboard } from "./components/Dashboard";
import { TransactionsView } from "./components/TransactionsView";
import { BudgetView } from "./components/BudgetView";
import { RecurringView } from "./components/RecurringView";
import { AccountsView } from "./components/AccountsView";
import { AIReportView } from "./components/AIReportView";
import { TransactionModal } from "./components/TransactionModal";
import { DataManagementModal } from "./components/DataManagementModal";
import { SettingsModal } from "./components/SettingsModal";
import { LockScreen } from "./components/LockScreen";
import { AutoSyncGuideModal } from "./components/AutoSyncGuideModal";
import { BankConnectModal } from "./components/BankConnectModal";
import { SplashScreen } from "./components/SplashScreen";
import { parseMultipleSms, convertParsedToTransactions } from "./utils/smsParser";
import type { Transaction, Account } from "./types/financial";
import { Plus } from "lucide-react";

export function App() {
  const {
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
  } = useFinancialData();

  // Intro Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Theme hook
  const { theme, setTheme } = useTheme();

  // Security hook
  const {
    isPasswordEnabled,
    isUnlocked,
    setPassword,
    disablePassword,
    unlockApp,
    lockApp,
  } = useSecurity();

  // Navigation & Date State
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutoSyncOpen, setIsAutoSyncOpen] = useState(false);
  const [isBankConnectOpen, setIsBankConnectOpen] = useState(false);

  // Quick Open Handlers
  const handleOpenAddModal = (defaultDate?: string) => {
    setEditingTransaction(null);
    setModalDefaultDate(defaultDate || `${currentMonth}-01`);
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleTransfer = (fromId: string, toId: string, amount: number, memo: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    addTransaction({
      date: todayStr,
      type: "transfer",
      amount,
      category: "계좌이체",
      accountId: fromId,
      toAccountId: toId,
      memo: memo || "계좌 간 이체",
    });
  };

  // ⚡ 마이데이터 은행/카드 연동 데이터 수신 핸들러
  const handleBankSyncData = (newAccounts: Omit<Account, "id">[], newTransactions: Omit<Transaction, "id">[]) => {
    newAccounts.forEach((acc) => addAccount(acc));
    newTransactions.forEach((tx) => addTransaction(tx));
  };

  // 아이폰 단축어(Shortcuts) 딥링크/URL 파라미터 자동 수신 (?sms=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const smsText = params.get("sms");
    if (smsText && accounts.length > 0) {
      try {
        const decoded = decodeURIComponent(smsText);
        const parsed = parseMultipleSms(decoded, accounts);
        if (parsed.length > 0) {
          const txs = convertParsedToTransactions(parsed);
          txs.forEach((tx) => addTransaction(tx));
          alert(`⚡ [자동 연동] ${txs.length}건의 결제 내역이 가계부에 자동으로 등록되었습니다! 🎉`);
          // URL 파라미터 정리
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error("Shortcuts SMS parsing error:", err);
      }
    }
  }, [accounts, addTransaction]);

  // If app is locked by password, render the LockScreen
  if (!isUnlocked) {
    return <LockScreen onUnlock={unlockApp} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col font-sans transition-colors duration-200 pb-20 md:pb-6 overflow-x-hidden w-full">
      {/* Splash Screen (Shown on initial launch) */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* Top Universal Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAutoSyncModal={() => setIsAutoSyncOpen(true)}
      />

      {/* Main Screen Content View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4">
        {activeTab === "dashboard" && (
          <Dashboard
            currentMonth={currentMonth}
            accounts={accounts}
            transactions={transactions}
            recurringItems={recurringItems}
            budgets={budgets}
            onNavigateTab={setActiveTab}
            onOpenAddModal={() => handleOpenAddModal()}
            onOpenBankConnect={() => setIsBankConnectOpen(true)}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsView
            currentMonth={currentMonth}
            transactions={transactions}
            accounts={accounts}
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        )}

        {activeTab === "budgets" && (
          <BudgetView
            currentMonth={currentMonth}
            budgets={budgets}
            transactions={transactions}
            recurringItems={recurringItems}
            onSaveBudget={setBudgetForMonth}
          />
        )}

        {activeTab === "recurring" && (
          <RecurringView
            currentMonth={currentMonth}
            recurringItems={recurringItems}
            accounts={accounts}
            onAddRecurring={addRecurringItem}
            onUpdateRecurring={updateRecurringItem}
            onDeleteRecurring={deleteRecurringItem}
            onApplyToTransaction={applyRecurringToTransaction}
          />
        )}

        {activeTab === "accounts" && (
          <AccountsView
            accounts={accounts}
            savings={savings}
            investments={investments}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onAddSavings={addSavings}
            onUpdateSavings={updateSavings}
            onDeleteSavings={deleteSavings}
            onAddInvestment={addInvestment}
            onUpdateInvestment={updateInvestment}
            onDeleteInvestment={deleteInvestment}
            onTransfer={handleTransfer}
            onOpenBankConnect={() => setIsBankConnectOpen(true)}
          />
        )}

        {activeTab === "ai" && (
          <AIReportView
            apiKey={geminiApiKey}
            onApiKeyChange={setGeminiApiKey}
            transactions={transactions}
            accounts={accounts}
            recurringItems={recurringItems}
            savings={savings}
            investments={investments}
          />
        )}
      </main>

      {/* iOS Mobile Bottom Navigation Bar (6 Tabs Evenly Spaced) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Floating Action Button (FAB) for Quick Transaction Add */}
      <button
        onClick={() => handleOpenAddModal()}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] md:bottom-8 right-4 sm:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/35 hover:shadow-emerald-500/50 hover:scale-105 active:scale-90 transition-all duration-200 cursor-pointer"
        title="새 내역 추가"
      >
        <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
      </button>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={addTransaction}
        onUpdate={updateTransaction}
        accounts={accounts}
        editingTx={editingTransaction}
        defaultDate={modalDefaultDate}
      />

      {/* ⚡ 마이데이터 은행 & 카드 연동 모달 */}
      <BankConnectModal
        isOpen={isBankConnectOpen}
        onClose={() => setIsBankConnectOpen(false)}
        onSyncData={handleBankSyncData}
      />

      {/* Auto Sync Center Modal */}
      <AutoSyncGuideModal
        isOpen={isAutoSyncOpen}
        onClose={() => setIsAutoSyncOpen(false)}
        accounts={accounts}
        onAddTransaction={addTransaction}
      />

      {/* Data Backup & CSV Modal */}
      <DataManagementModal
        isOpen={isDataMenuOpen}
        onClose={() => setIsDataMenuOpen(false)}
        accounts={accounts}
        transactions={transactions}
        recurringItems={recurringItems}
        budgets={budgets}
        savings={savings}
        investments={investments}
        onImportTransactions={importTransactions}
        onResetSample={resetToSampleData}
        onClearAll={clearAllData}
        onLoadFullBackup={loadFullBackup}
      />

      {/* Settings Modal (Theme, Password, Gemini) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        isPasswordEnabled={isPasswordEnabled}
        onSetPassword={setPassword}
        onDisablePassword={disablePassword}
        onLockApp={lockApp}
        apiKey={geminiApiKey}
        onApiKeyChange={setGeminiApiKey}
        onOpenDataMenu={() => setIsDataMenuOpen(true)}
      />
    </div>
  );
}

export default App;

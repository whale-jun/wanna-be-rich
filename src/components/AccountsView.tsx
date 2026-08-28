import React, { useState } from "react";
import type { Account, Savings, Investment, AccountType } from "../types/financial";
import { formatKRW } from "../utils/calculators";
import { POPULAR_STOCKS, fetchLivePrice, calculateInvestmentMetrics } from "../utils/stockPriceService";
import type { StockPreset } from "../utils/stockPriceService";
import { 
  Landmark, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  ArrowRightLeft,
  PiggyBank,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
  RefreshCw
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface AccountsViewProps {
  accounts: Account[];
  savings: Savings[];
  investments: Investment[];
  onAddAccount: (acc: Omit<Account, "id">) => void;
  onUpdateAccount: (id: string, acc: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
  onAddSavings: (sav: Omit<Savings, "id">) => void;
  onUpdateSavings?: (id: string, sav: Partial<Savings>) => void;
  onDeleteSavings: (id: string) => void;
  onAddInvestment: (inv: Omit<Investment, "id">) => void;
  onUpdateInvestment?: (id: string, inv: Partial<Investment>) => void;
  onDeleteInvestment: (id: string) => void;
  onTransfer: (fromId: string, toId: string, amount: number, memo: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  savings,
  investments,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddSavings,
  onUpdateSavings,
  onDeleteSavings,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onTransfer,
}) => {
  // 🎯 통장 / 저축 / 투자 세부 페이지 전환 탭 상태
  const [activeAssetTab, setActiveAssetTab] = useState<"bank" | "savings" | "investment">("bank");

  // Account Modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState(accounts[0]?.id || "");
  const [transferTo, setTransferTo] = useState(accounts[1]?.id || "");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferMemo, setTransferMemo] = useState("");

  // Account Form
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balance, setBalance] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [paymentDay, setPaymentDay] = useState("");

  // Savings Modal (Add / Edit)
  const [isSavModalOpen, setIsSavModalOpen] = useState(false);
  const [editingSavings, setEditingSavings] = useState<Savings | null>(null);
  const [savTitle, setSavTitle] = useState("");
  const [savStartDate, setSavStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [savDeposit, setSavDeposit] = useState("");
  const [savTargetMonths, setSavTargetMonths] = useState("12");
  const [savCurrentMonths, setSavCurrentMonths] = useState("1");
  const [savRate, setSavRate] = useState("4.5");
  const [savInterestType, setSavInterestType] = useState<"simple" | "compound">("simple");
  const [savTaxFree, setSavTaxFree] = useState<boolean>(false);
  const [savGoal, setSavGoal] = useState("");
  const [_autoCalculatedMsg, setAutoCalculatedMsg] = useState("");

  // Investment Modal (Add / Edit)
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<Investment | null>(null);
  const [invName, setInvName] = useState("");
  const [invTicker, setInvTicker] = useState("");
  const [invMarket, setInvMarket] = useState<"KR" | "US" | "CRYPTO" | "OTHER">("KR");
  const [invBuyPrice, setInvBuyPrice] = useState("");
  const [invQuantity, setInvQuantity] = useState("1");
  const [invCurrentPrice, setInvCurrentPrice] = useState("");
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);

  // Helper: 시작일 기준으로 경과 개월수/회차 계산
  const getElapsedMonthsFromStart = (startDateStr: string, targetMax = 600) => {
    if (!startDateStr) return 1;
    const [sYear, sMonth] = startDateStr.split("-").map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const diff = (currentYear - sYear) * 12 + (currentMonth - sMonth) + 1;
    return Math.min(targetMax, Math.max(0, diff));
  };

  // Helper: 시작일 + 약정 개월수로 만기일 계산
  const getMaturityDate = (startDateStr: string, months: number) => {
    if (!startDateStr || !months) return "";
    const [y, m, d] = startDateStr.split("-").map(Number);
    const matDate = new Date(y, m - 1 + months, d || 1);
    const resY = matDate.getFullYear();
    const resM = String(matDate.getMonth() + 1).padStart(2, "0");
    return `${resY}년 ${resM}월`;
  };

  // Calculations
  const bankTotal = accounts
    .filter((a) => a.type === "bank" || a.type === "cash")
    .reduce((acc, a) => acc + (a.balance || 0), 0);

  const savingsTotal = savings.reduce((acc, s) => acc + (s.totalAmount || 0), 0) +
    accounts.filter((a) => a.type === "savings").reduce((acc, a) => acc + (a.balance || 0), 0);

  const investmentTotal = investments.reduce((acc, i) => acc + (i.evaluatedAmount || 0), 0) +
    accounts.filter((a) => a.type === "investment").reduce((acc, a) => acc + (a.balance || 0), 0);

  const cardDebtTotal = accounts
    .filter((a) => a.type === "credit_card" || a.type === "loan")
    .reduce((acc, a) => acc + Math.abs(a.balance || 0), 0);

  const totalAssets = bankTotal + savingsTotal + investmentTotal;
  const netWorth = totalAssets - cardDebtTotal;

  const assetChartData = [
    { name: "예금/현금", value: bankTotal, color: "#38bdf8" },
    { name: "적금/청약", value: savingsTotal, color: "#f43f5e" },
    { name: "투자/주식", value: investmentTotal, color: "#a855f7" },
  ].filter(d => d.value > 0);

  // Account Modal Handlers
  const openAddAccountModal = () => {
    setEditingAccount(null);
    setName("");
    setType("bank");
    setBalance("");
    setInstitution("");
    setAccountNumber("");
    setCreditLimit("");
    setPaymentDay("");
    setIsAccountModalOpen(true);
  };

  const openEditAccountModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(String(acc.balance));
    setInstitution(acc.institution || "");
    setAccountNumber(acc.accountNumber || "");
    setCreditLimit(acc.creditLimit ? String(acc.creditLimit) : "");
    setPaymentDay(acc.paymentDay ? String(acc.paymentDay) : "");
    setIsAccountModalOpen(true);
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("계좌/카드 이름을 입력해주세요.");
      return;
    }
    const numBalance = parseInt(balance.replace(/[^0-9-]/g, ""), 10) || 0;

    const payload: Omit<Account, "id"> = {
      name,
      type,
      balance: numBalance,
      institution,
      accountNumber,
      creditLimit: creditLimit ? parseInt(creditLimit.replace(/[^0-9]/g, ""), 10) : undefined,
      paymentDay: paymentDay ? parseInt(paymentDay, 10) : undefined,
    };

    if (editingAccount) {
      onUpdateAccount(editingAccount.id, payload);
    } else {
      onAddAccount(payload);
    }
    setIsAccountModalOpen(false);
  };

  // Transfer Submit
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseInt(transferAmount.replace(/[^0-9]/g, ""), 10);
    if (!transferFrom || !transferTo || transferFrom === transferTo || isNaN(numAmt) || numAmt <= 0) {
      alert("출금 계좌와 입금 계좌를 올바르게 선택하고 이체 금액을 입력해주세요.");
      return;
    }
    onTransfer(transferFrom, transferTo, numAmt, transferMemo || "계좌 간 이체");
    setIsTransferModalOpen(false);
    setTransferAmount("");
    setTransferMemo("");
  };

  // Savings Modal Handlers
  const openAddSavingsModal = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setEditingSavings(null);
    setSavTitle("");
    setSavStartDate(todayStr);
    setSavDeposit("");
    setSavTargetMonths("12");
    setSavCurrentMonths("1");
    setSavRate("4.5");
    setSavInterestType("simple");
    setSavTaxFree(false);
    setSavGoal("");
    setAutoCalculatedMsg("가입 시작일 기준 현재 1회차로 자동 설정되었습니다.");
    setIsSavModalOpen(true);
  };

  const openEditSavingsModal = (s: Savings) => {
    const sDate = s.date || new Date().toISOString().slice(0, 10);
    const targetM = s.targetMonths || 12;
    const currentM = s.currentMonths !== undefined ? s.currentMonths : (s.monthsElapsed || 1);

    setEditingSavings(s);
    setSavTitle(s.title || "");
    setSavStartDate(sDate);
    setSavDeposit(s.monthlyDeposit ? String(s.monthlyDeposit) : "");
    setSavTargetMonths(String(targetM));
    setSavCurrentMonths(String(currentM));
    setSavRate(s.annualRate ? String(s.annualRate) : "4.5");
    setSavInterestType(s.interestType || "simple");
    setSavTaxFree(!!s.taxFree);
    setSavGoal(s.goalAmount ? String(s.goalAmount) : "");
    setAutoCalculatedMsg("");
    setIsSavModalOpen(true);
  };

  const handleStartDateChange = (newDateStr: string) => {
    setSavStartDate(newDateStr);
    const targetMax = parseInt(savTargetMonths, 10) || 12;
    const calcMonths = getElapsedMonthsFromStart(newDateStr, targetMax);
    setSavCurrentMonths(String(calcMonths));
    setAutoCalculatedMsg(`가입일(${newDateStr}) 기준 현재까지 ${calcMonths}회차가 자동 계산되었습니다.`);
  };

  const handleSavingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deposit = parseInt(savDeposit.replace(/[^0-9]/g, ""), 10);
    const targetMonthsNum = parseInt(savTargetMonths.replace(/[^0-9]/g, ""), 10) || 12;
    const currentMonthsNum = parseInt(savCurrentMonths.replace(/[^0-9]/g, ""), 10) || 0;

    if (!savTitle || isNaN(deposit) || deposit <= 0) {
      alert("적금 이름과 월 납입액을 올바르게 입력해주세요.");
      return;
    }

    const payload: Omit<Savings, "id"> = {
      title: savTitle.trim(),
      date: savStartDate || new Date().toISOString().slice(0, 10),
      monthlyDeposit: deposit,
      annualRate: parseFloat(savRate) || 3.5,
      targetMonths: targetMonthsNum,
      currentMonths: Math.min(targetMonthsNum, currentMonthsNum),
      interestType: savInterestType,
      taxFree: savTaxFree,
      goalAmount: savGoal ? parseInt(savGoal.replace(/[^0-9]/g, ""), 10) : undefined,
    };

    if (editingSavings && onUpdateSavings) {
      onUpdateSavings(editingSavings.id, payload);
    } else {
      onAddSavings(payload);
    }
    setIsSavModalOpen(false);
  };

  const handleIncrementSavingsMonth = (s: Savings) => {
    if (!onUpdateSavings) return;
    const target = s.targetMonths || 12;
    const current = s.currentMonths || 0;
    if (current >= target) {
      alert("이미 만기 회차에 도달했습니다!");
      return;
    }
    onUpdateSavings(s.id, { currentMonths: current + 1 });
  };

  // Investment Modal Handlers
  const openAddInvestmentModal = () => {
    setEditingInv(null);
    setInvName("");
    setInvTicker("");
    setInvMarket("KR");
    setInvBuyPrice("");
    setInvQuantity("1");
    setInvCurrentPrice("");
    setIsInvModalOpen(true);
  };

  const openEditInvestmentModal = (inv: Investment) => {
    setEditingInv(inv);
    setInvName(inv.assetName);
    setInvTicker(inv.ticker || "");
    setInvMarket(inv.market || "KR");
    setInvBuyPrice(inv.buyPrice ? String(inv.buyPrice) : String(inv.investedAmount || ""));
    setInvQuantity(inv.quantity ? String(inv.quantity) : "1");
    setInvCurrentPrice(inv.currentPrice ? String(inv.currentPrice) : "");
    setIsInvModalOpen(true);
  };

  const handleSelectStockPreset = async (preset: StockPreset) => {
    setInvName(preset.name);
    setInvTicker(preset.ticker);
    setInvMarket(preset.market);
    setInvBuyPrice(String(preset.basePrice));
    
    // 실시간 현재가 비동기 조회
    const live = await fetchLivePrice(preset.ticker, preset.market);
    setInvCurrentPrice(String(live || preset.basePrice));
  };

  const handleInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(invQuantity) || 1;
    const buyP = parseInt(invBuyPrice.replace(/[^0-9]/g, ""), 10);
    const currP = parseInt(invCurrentPrice.replace(/[^0-9]/g, ""), 10) || buyP;

    if (!invName || isNaN(buyP) || buyP <= 0) {
      alert("종목명과 매수 단가를 올바르게 입력해주세요.");
      return;
    }

    const calculated = calculateInvestmentMetrics({
      assetName: invName.trim(),
      ticker: invTicker.trim().toUpperCase() || undefined,
      market: invMarket,
      date: editingInv ? editingInv.date : new Date().toISOString().slice(0, 10),
      buyPrice: buyP,
      quantity: qty,
      currentPrice: currP,
    }, currP);

    if (editingInv && onUpdateInvestment) {
      onUpdateInvestment(editingInv.id, calculated);
    } else {
      onAddInvestment(calculated as Omit<Investment, "id">);
    }
    setIsInvModalOpen(false);
  };

  // 실시간 전체 주가 일괄 갱신 핸들러
  const handleRefreshAllStockPrices = async () => {
    if (investments.length === 0) return;
    setIsRefreshingPrices(true);

    try {
      for (const inv of investments) {
        const ticker = inv.ticker || inv.assetName;
        const livePrice = await fetchLivePrice(ticker, inv.market);
        if (livePrice && onUpdateInvestment) {
          const updated = calculateInvestmentMetrics(inv, livePrice);
          onUpdateInvestment(inv.id, updated);
        }
      }
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  // Real-time Preview Calculation for Savings Modal
  const previewDeposit = parseInt(savDeposit.replace(/[^0-9]/g, ""), 10) || 0;
  const previewTargetMonths = parseInt(savTargetMonths.replace(/[^0-9]/g, ""), 10) || 12;
  const previewRate = parseFloat(savRate) || 0;
  const previewMaturityPrincipal = previewDeposit * previewTargetMonths;
  const previewTaxRate = savTaxFree ? 0 : 0.154;
  let previewPreTaxInterest = 0;
  if (previewTargetMonths > 0 && previewRate > 0) {
    if (savInterestType === "compound") {
      const mRate = previewRate / 100 / 12;
      previewPreTaxInterest = Math.max(0, previewDeposit * ((Math.pow(1 + mRate, previewTargetMonths) - 1) / mRate) - previewMaturityPrincipal);
    } else {
      previewPreTaxInterest = previewDeposit * (previewRate / 100 / 12) * (previewTargetMonths * (previewTargetMonths + 1) / 2);
    }
  }
  const previewMaturityInterest = Math.round(previewPreTaxInterest * (1 - previewTaxRate));
  const previewMaturityTotal = previewMaturityPrincipal + previewMaturityInterest;
  const previewMaturityDateStr = getMaturityDate(savStartDate, previewTargetMonths);

  // Real-time Preview for Investment Modal
  const previewQty = parseFloat(invQuantity) || 1;
  const previewBuyP = parseInt(invBuyPrice.replace(/[^0-9]/g, ""), 10) || 0;
  const previewCurrP = parseInt(invCurrentPrice.replace(/[^0-9]/g, ""), 10) || previewBuyP;
  const previewInvested = Math.round(previewBuyP * previewQty);
  const previewEvaluated = Math.round(previewCurrP * previewQty);
  const previewProfit = previewEvaluated - previewInvested;
  const previewReturnRate = previewInvested > 0 ? Number(((previewProfit / previewInvested) * 100).toFixed(2)) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Net Worth Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Net Worth Stat Card */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">총 순자산 (Net Worth)</h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              통합 자산 관리
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              {formatKRW(netWorth)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 flex-wrap">
              <span>총 자산: <strong className="text-slate-200">{formatKRW(totalAssets)}</strong></span>
              <span>•</span>
              <span>부채/카드 대금: <strong className="text-rose-400">{formatKRW(cardDebtTotal)}</strong></span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            아래 <strong>통장, 저축, 투자</strong> 버튼을 눌러 각 자산의 세부 내역을 확인하고 관리하세요.
          </p>
        </div>

        {/* Portfolio Pie Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <PieIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>자산 포트폴리오 비중</span>
            </h3>
          </div>

          {assetChartData.length > 0 ? (
            <div className="h-32 w-full relative my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={4}
                  >
                    {assetChartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                    formatter={(val: any) => [formatKRW(Number(val)), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-1 text-[11px] text-center pt-1 border-t border-slate-800/80">
            {assetChartData.map((d) => (
              <div key={d.name} className="truncate">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-400 text-[10px] truncate">{d.name}</span>
                </div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {totalAssets > 0 ? Math.round((d.value / totalAssets) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔘 3개 대형 카테고리 전환 버튼 (통장 / 저축 / 투자) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* 1. 통장 / 계좌 버튼 */}
        <button
          type="button"
          onClick={() => setActiveAssetTab("bank")}
          className={`p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 text-left border cursor-pointer ${
            activeAssetTab === "bank"
              ? "bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/20 ring-2 ring-sky-500/30 scale-[1.02]"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 opacity-80 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {accounts.length}개
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs sm:text-sm font-bold text-slate-300 block">통장 / 계좌</span>
            <div className="text-base sm:text-xl font-black text-sky-400 mt-0.5 tracking-tight truncate">
              {formatKRW(bankTotal)}
            </div>
          </div>
        </button>

        {/* 2. 저축 / 적금 버튼 */}
        <button
          type="button"
          onClick={() => setActiveAssetTab("savings")}
          className={`p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 text-left border cursor-pointer ${
            activeAssetTab === "savings"
              ? "bg-slate-900 border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/30 scale-[1.02]"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 opacity-80 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {savings.length}개
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs sm:text-sm font-bold text-slate-300 block">적금 / 저축</span>
            <div className="text-base sm:text-xl font-black text-rose-400 mt-0.5 tracking-tight truncate">
              {formatKRW(savingsTotal)}
            </div>
          </div>
        </button>

        {/* 3. 투자 / 주식 버튼 */}
        <button
          type="button"
          onClick={() => setActiveAssetTab("investment")}
          className={`p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 text-left border cursor-pointer ${
            activeAssetTab === "investment"
              ? "bg-slate-900 border-purple-500 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/30 scale-[1.02]"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 opacity-80 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {investments.length}개
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs sm:text-sm font-bold text-slate-300 block">투자 / 주식</span>
            <div className="text-base sm:text-xl font-black text-purple-400 mt-0.5 tracking-tight truncate">
              {formatKRW(investmentTotal)}
            </div>
          </div>
        </button>
      </div>

      {/* 📄 [세부 페이지 1] 통장 / 계좌 관리 세부 화면 */}
      {activeAssetTab === "bank" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-sky-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">등록된 통장 & 카드 ({accounts.length}개)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                입출금 통장, 신용카드, 체크카드, 대출 계좌를 관리하고 계좌 간 이체를 실행하세요.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                <span>계좌 간 이체</span>
              </button>
              <button
                onClick={openAddAccountModal}
                className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-sky-500/20 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>새 계좌/카드 추가</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const isCard = acc.type === "credit_card";
              return (
                <div
                  key={acc.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition relative group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {acc.institution || acc.type}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEditAccountModal(acc)}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                          title="계좌 수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteAccount(acc.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="계좌 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-base font-bold text-white truncate">{acc.name}</h4>
                      {acc.accountNumber && (
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{acc.accountNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      {isCard ? "이번달 결제 예정액" : "현재 잔액"}
                    </div>
                    <div className={`text-lg font-black mt-0.5 ${
                      isCard ? "text-rose-400" : "text-emerald-400"
                    }`}>
                      {formatKRW(Math.abs(acc.balance))}
                    </div>

                    {isCard && acc.creditLimit && (
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>한도 {formatKRW(acc.creditLimit)}</span>
                        {acc.paymentDay && <span>매월 {acc.paymentDay}일 결제</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📄 [세부 페이지 2] 적금 / 저축 세부 화면 */}
      {activeAssetTab === "savings" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-rose-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">적금 & 목돈 플랜 ({savings.length}개)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                시작일자 자동 회차 계산, 약정 개월수, 단리/복리 만기 수령액 및 납입 현황을 추적합니다.
              </p>
            </div>

            <button
              onClick={openAddSavingsModal}
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>적금 추가</span>
            </button>
          </div>

          <div className="space-y-4">
            {savings.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center">
                <PiggyBank className="w-10 h-10 mb-2 opacity-40 text-rose-400" />
                <p className="text-sm font-semibold text-slate-400">등록된 적금 플랜이 없습니다.</p>
                <p className="text-xs text-slate-500 mt-1">상단의 '적금 추가' 버튼을 눌러 새로운 적금을 등록해보세요!</p>
              </div>
            ) : (
              savings.map((s) => {
                const target = s.targetMonths || 12;
                const current = s.currentMonths !== undefined ? s.currentMonths : (s.monthsElapsed || 0);
                const progress = s.progressRate || Math.min(100, Math.round((current / target) * 100));
                const isCompleted = current >= target;
                const maturityStr = getMaturityDate(s.date, target);

                return (
                  <div key={s.id} className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-3 relative group hover:border-slate-700 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{s.title || "정기 적금"}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            {target}개월 약정
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {s.interestType === "compound" ? "월복리" : "단리"}
                          </span>
                          {s.taxFree && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              비과세
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span>월 {formatKRW(s.monthlyDeposit)} • 연 {s.annualRate}%</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {s.date} 가입 → <strong>{maturityStr} 만기</strong>
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditSavingsModal(s)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                          title="적금 설정값 변경"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSavings(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="적금 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Month Count */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-rose-400" />
                          <span>납입 회차: <strong>{current}회차</strong> / {target}회차 ({progress}%)</span>
                        </span>
                        {!isCompleted ? (
                          <button
                            onClick={() => handleIncrementSavingsMonth(s)}
                            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/20 transition"
                            title="이번 달 납입 완료 (+1회차)"
                          >
                            +1회차 납입
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 만기 완료!
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-rose-500 to-pink-400"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Accumulated vs Maturity Amount */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                      <div className="bg-slate-900/60 p-2.5 rounded-xl">
                        <span className="text-[11px] text-slate-400 block">현재 누적 평가액 ({current}회차 납입)</span>
                        <span className="text-sm font-bold text-rose-400">
                          {formatKRW(s.totalAmount || (s.monthlyDeposit * current))}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          원금 {formatKRW(s.accumulatedPrincipal || (s.monthlyDeposit * current))} + 세후이자 {formatKRW(s.accumulatedInterest || 0)}
                        </span>
                      </div>

                      <div className="bg-slate-900/60 p-2.5 rounded-xl">
                        <span className="text-[11px] text-slate-400 block">만기 시 예상 총수령액 ({target}회차 완납)</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatKRW(s.maturityTotal || (s.monthlyDeposit * target))}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          만기 세후이자 +{formatKRW(s.maturityInterest || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 📄 [세부 페이지 3] 투자 / 주식 세부 화면 */}
      {activeAssetTab === "investment" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>투자 & 주식 포트폴리오 ({investments.length}개)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    실시간 시세 연동
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                국내주식, 미국주식, 가상자산의 당일 시세를 실시간 조회하고 평가손익을 자동 연산합니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshAllStockPrices}
                disabled={isRefreshingPrices || investments.length === 0}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 px-3 py-2 rounded-xl font-bold flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                title="등록된 모든 종목의 실시간 주가 갱신"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPrices ? "animate-spin text-purple-400" : ""}`} />
                <span>시세 갱신</span>
              </button>

              <button
                onClick={openAddInvestmentModal}
                className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1 transition shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>종목 추가</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {investments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center">
                <TrendingUp className="w-10 h-10 mb-2 opacity-40 text-purple-400" />
                <p className="text-sm font-semibold text-slate-400">등록된 투자 종목이 없습니다.</p>
                <p className="text-xs text-slate-500 mt-1">상단의 '종목 추가' 버튼을 눌러 새로운 종목을 추가해보세요!</p>
              </div>
            ) : (
              investments.map((i) => {
                const isProfit = (i.profit || 0) >= 0;
                const buyP = i.buyPrice || 0;
                const currP = i.currentPrice || buyP;
                const qty = i.quantity || 1;

                return (
                  <div key={i.id} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3 hover:border-slate-700 transition group">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{i.assetName}</h4>
                          {i.ticker && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {i.ticker}
                            </span>
                          )}
                          {i.market && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {i.market === "KR" ? "국내주식" : i.market === "US" ? "미국주식" : i.market === "CRYPTO" ? "가상자산" : "기타"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          보유 {qty.toLocaleString()}주 • 매수 평단가 {formatKRW(buyP)} → <strong>현재가 {formatKRW(currP)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditInvestmentModal(i)}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                          title="종목 수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteInvestment(i.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition"
                          title="종목 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-[11px] text-slate-400 block">현재 평가 금액</span>
                        <span className="text-base font-black text-purple-300">
                          {formatKRW(i.evaluatedAmount || 0)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">수익률 & 평가손익</span>
                        <span className={`text-sm font-black ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                          {isProfit ? "+" : ""}{i.returnRate}% ({isProfit ? "+" : ""}{formatKRW(i.profit || 0)})
                        </span>
                      </div>
                    </div>

                    {i.lastUpdated && (
                      <div className="text-[10px] text-slate-500 text-right pt-0.5">
                        시세 기준: {i.lastUpdated}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold">
                {editingAccount ? "계좌/카드 정보 수정" : "새 계좌/카드 등록"}
              </h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">자산 종류</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="bank">입출금 통장</option>
                  <option value="credit_card">신용카드</option>
                  <option value="debit_card">체크카드</option>
                  <option value="savings">적금/예금</option>
                  <option value="investment">주식/투자</option>
                  <option value="cash">현금</option>
                  <option value="loan">대출/부채</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">계좌/카드명</label>
                <input
                  type="text"
                  placeholder="예: 토스 주거래 통장, 신한카드"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">금융기관</label>
                  <input
                    type="text"
                    placeholder="예: 카카오뱅크, 신한"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    {type === "credit_card" ? "결제 예정액" : "현재 잔액 (원)"}
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={balance ? Number(balance).toLocaleString("ko-KR") : ""}
                    onChange={(e) => setBalance(e.target.value.replace(/[^0-9-]/g, ""))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {type === "credit_card" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">카드 한도</label>
                    <input
                      type="text"
                      placeholder="5,000,000"
                      value={creditLimit ? Number(creditLimit).toLocaleString("ko-KR") : ""}
                      onChange={(e) => setCreditLimit(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">결제일 (1~31일)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="15"
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">계좌번호/카드번호 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 3333-01-1234567"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                >
                  {editingAccount ? "수정 완료" : "등록 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-sky-400" />
                <span>계좌 간 이체</span>
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">출금 계좌 (보내는 통장)</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatKRW(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">입금 계좌 (받는 통장)</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatKRW(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">이체 금액 (원)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={transferAmount ? Number(transferAmount).toLocaleString("ko-KR") : ""}
                  onChange={(e) => setTransferAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">메모 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 생활비 통장 충전, 비상금 이체"
                  value={transferMemo}
                  onChange={(e) => setTransferMemo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-sky-500/20"
                >
                  이체 실행
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Savings Add/Edit Modal */}
      {isSavModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-rose-400" />
                <span>{editingSavings ? "적금 플랜 수정" : "새 적금 플랜 등록"}</span>
              </h3>
              <button onClick={() => setIsSavModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavingsSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">적금 상품명</label>
                <input
                  type="text"
                  placeholder="예: 청년도약계좌, 카카오 26주 적금"
                  value={savTitle}
                  onChange={(e) => setSavTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">가입 시작일</label>
                  <input
                    type="date"
                    value={savStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">월 납입액 (원)</label>
                  <input
                    type="text"
                    placeholder="500,000"
                    value={savDeposit ? Number(savDeposit).toLocaleString("ko-KR") : ""}
                    onChange={(e) => setSavDeposit(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">약정 개월수</label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={savTargetMonths}
                    onChange={(e) => setSavTargetMonths(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">현재 납입 회차</label>
                  <input
                    type="number"
                    min="0"
                    max={savTargetMonths}
                    value={savCurrentMonths}
                    onChange={(e) => setSavCurrentMonths(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">연 이자율 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={savRate}
                    onChange={(e) => setSavRate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">이자 계산 방식</label>
                  <select
                    value={savInterestType}
                    onChange={(e) => setSavInterestType(e.target.value as "simple" | "compound")}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="simple">단리</option>
                    <option value="compound">월복리</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={savTaxFree}
                      onChange={(e) => setSavTaxFree(e.target.checked)}
                      className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 bg-slate-800 border-slate-700"
                    />
                    <span>비과세 적용 (이자소득세 15.4% 면제)</span>
                  </label>
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="bg-slate-950/80 border border-rose-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>실시간 만기 시 예상 수령액</span>
                  </span>
                  <span>{previewMaturityDateStr} 만기</span>
                </div>
                <div className="text-xl font-black text-emerald-400">
                  {formatKRW(previewMaturityTotal)}
                </div>
                <div className="text-xs text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                  <span>원금 합계: {formatKRW(previewMaturityPrincipal)}</span>
                  <span>세후 이자: +{formatKRW(previewMaturityInterest)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSavModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-500/20"
                >
                  {editingSavings ? "수정 완료" : "적금 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Investment Add/Edit Modal */}
      {isInvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span>{editingInv ? "투자 종목 수정" : "새 투자 종목 등록"}</span>
              </h3>
              <button onClick={() => setIsInvModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvestmentSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Popular Stock Presets */}
              {!editingInv && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    💡 빠른 종목 선택 (클릭 시 자동 입력)
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {POPULAR_STOCKS.map((preset) => (
                      <button
                        key={preset.ticker}
                        type="button"
                        onClick={() => handleSelectStockPreset(preset)}
                        className="text-xs bg-slate-800 hover:bg-purple-900/40 hover:text-purple-300 border border-slate-700 px-2.5 py-1 rounded-lg transition"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">종목명</label>
                  <input
                    type="text"
                    placeholder="예: 삼성전자, Apple"
                    value={invName}
                    onChange={(e) => setInvName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">티커/심볼</label>
                  <input
                    type="text"
                    placeholder="예: 005930, AAPL, BTC"
                    value={invTicker}
                    onChange={(e) => setInvTicker(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">시장 구분</label>
                  <select
                    value={invMarket}
                    onChange={(e) => setInvMarket(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="KR">국내주식 (KRW)</option>
                    <option value="US">미국주식 (USD/KRW)</option>
                    <option value="CRYPTO">가상자산</option>
                    <option value="OTHER">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">보유 수량 (주)</label>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    value={invQuantity}
                    onChange={(e) => setInvQuantity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">매수 단가 (원)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={invBuyPrice ? Number(invBuyPrice).toLocaleString("ko-KR") : ""}
                    onChange={(e) => setInvBuyPrice(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  현재가 (원) <span className="text-slate-500 font-normal">- 실시간 시세 자동 반영</span>
                </label>
                <input
                  type="text"
                  placeholder="현재가 미입력 시 매수 단가와 동일"
                  value={invCurrentPrice ? Number(invCurrentPrice).toLocaleString("ko-KR") : ""}
                  onChange={(e) => setInvCurrentPrice(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-purple-300 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="bg-slate-950/80 border border-purple-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
                  <span>실시간 평가 및 수익률</span>
                  <span className={previewProfit >= 0 ? "text-emerald-400 font-black" : "text-rose-400 font-black"}>
                    {previewProfit >= 0 ? "+" : ""}{previewReturnRate}% ({previewProfit >= 0 ? "+" : ""}{formatKRW(previewProfit)})
                  </span>
                </div>
                <div className="text-xl font-black text-white">
                  평가금액: {formatKRW(previewEvaluated)}
                </div>
                <div className="text-xs text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                  <span>총 매수 투자금: {formatKRW(previewInvested)}</span>
                  <span>보유 수량: {previewQty}주</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInvModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-500/20"
                >
                  {editingInv ? "수정 완료" : "종목 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsView;

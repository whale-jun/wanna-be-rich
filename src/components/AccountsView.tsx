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
  const [autoCalculatedMsg, setAutoCalculatedMsg] = useState("");

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
    { name: "예금/현금", value: bankTotal, color: "#3b82f6" },
    { name: "적금/청약", value: savingsTotal, color: "#ec4899" },
    { name: "투자/주식", value: investmentTotal, color: "#8b5cf6" },
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
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <span>자산 & 계좌 관리</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            은행 통장, 카드, 적금 목표, 주식 등 모든 금융 자산과 부채를 통합 관리하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            <ArrowRightLeft className="w-4 h-4 text-sky-400" />
            <span>계좌 간 이체</span>
          </button>
          <button
            onClick={openAddAccountModal}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>새 계좌/카드 추가</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <span className="text-xs font-semibold text-slate-400">총 순자산 (Net Worth)</span>
            <div className="text-3xl font-black text-emerald-400 mt-2">
              {formatKRW(netWorth)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              자산 {formatKRW(totalAssets)} - 부채/카드 {formatKRW(cardDebtTotal)}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold text-slate-400">입출금 통장 / 현금</span>
            <div className="text-2xl font-black text-sky-400 mt-2">
              {formatKRW(bankTotal)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              언제든 즉시 사용 가능한 유동성 자산
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold text-slate-400">적금 / 예금 / 청약</span>
            <div className="text-2xl font-black text-pink-400 mt-2">
              {formatKRW(savingsTotal)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              목돈 마련 및 이자 수익 목적 자산 ({savings.length}개 플랜)
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold text-slate-400">투자 / 주식 / 가상자산</span>
            <div className="text-2xl font-black text-purple-400 mt-2">
              {formatKRW(investmentTotal)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              실시간 당일 주가 & 수익률 자동 추적 ({investments.length}개 종목)
            </div>
          </div>
        </div>

        {/* Portfolio Pie Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <span>자산 포트폴리오 비중</span>
            </h3>
          </div>

          {assetChartData.length > 0 ? (
            <div className="h-44 w-full relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                  >
                    {assetChartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                    formatter={(val: any) => [formatKRW(Number(val)), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className="space-y-1.5 text-xs">
            {assetChartData.map((d) => (
              <div key={d.name} className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-300">{d.name}</span>
                </div>
                <span className="font-bold text-slate-200">
                  {totalAssets > 0 ? Math.round((d.value / totalAssets) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">등록된 계좌 및 카드 ({accounts.length}개)</h3>
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

      {/* Savings & Investments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings & 목돈 플랜 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-pink-400" />
              <div>
                <h3 className="text-base font-bold text-white">적금 & 목돈 플랜</h3>
                <p className="text-xs text-slate-400">시작일자 자동 회차 계산, 약정 개월수, 단리/복리 만기 수령액</p>
              </div>
            </div>
            <button
              onClick={openAddSavingsModal}
              className="text-xs bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>적금 추가</span>
            </button>
          </div>

          <div className="space-y-4">
            {savings.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                등록된 적금 플랜이 없습니다. 상단의 '적금 추가' 버튼을 눌러보세요!
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
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-pink-500/10 text-pink-300 border border-pink-500/20">
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
                          <Calendar className="w-3.5 h-3.5 text-pink-400" />
                          <span>납입 회차: <strong>{current}회차</strong> / {target}회차 ({progress}%)</span>
                        </span>
                        {!isCompleted ? (
                          <button
                            onClick={() => handleIncrementSavingsMonth(s)}
                            className="text-[11px] font-bold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 px-2 py-0.5 rounded-lg border border-pink-500/20 transition"
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
                            isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-pink-500 to-rose-400"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Accumulated vs Maturity Amount */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                      <div className="bg-slate-900/60 p-2.5 rounded-xl">
                        <span className="text-[11px] text-slate-400 block">현재 누적 평가액 ({current}회차 납입)</span>
                        <span className="text-sm font-bold text-pink-400">
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

                    {s.goalAmount && (
                      <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                        <span>목표 금액: {formatKRW(s.goalAmount)}</span>
                        <span className="text-emerald-400 font-semibold">{s.monthsToGoal}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Investment Portfolio with Real-Time Stock Tracker */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>투자 & 주식 포트폴리오</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    실시간 시세 연동
                  </span>
                </h3>
                <p className="text-xs text-slate-400">삼성전자, 해외주식, 코인 당일 주가 기반 자동 수익률 연산</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshAllStockPrices}
                disabled={isRefreshingPrices || investments.length === 0}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                title="등록된 모든 종목의 실시간 주가 갱신"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPrices ? "animate-spin text-purple-400" : ""}`} />
                <span className="hidden sm:inline">시세 갱신</span>
              </button>

              <button
                onClick={openAddInvestmentModal}
                className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>종목 추가</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {investments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                등록된 투자 종목이 없습니다. 상단의 '종목 추가' 버튼을 눌러보세요!
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
      </div>

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
                      min={1}
                      max={31}
                      placeholder="14"
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">계좌번호 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 110-123-456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
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
                <label className="block text-xs font-semibold text-slate-400 mb-1">출금 계좌</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (잔액 {formatKRW(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">입금 계좌</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {accounts
                    .filter((a) => a.id !== transferFrom)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (잔액 {formatKRW(a.balance)})
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-lg font-bold text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">메모</label>
                <input
                  type="text"
                  placeholder="예: 비상금 통장 이체, 적금 납입"
                  value={transferMemo}
                  onChange={(e) => setTransferMemo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 text-slate-950 py-2.5 rounded-xl text-xs font-bold hover:bg-sky-600 shadow-lg shadow-sky-500/20"
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-pink-400" />
                <span>{editingSavings ? "적금 플랜 설정 변경" : "새 적금 & 목돈 플랜 추가"}</span>
              </h3>
              <button onClick={() => setIsSavModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavingsSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">적금 / 플랜 이름</label>
                <input
                  type="text"
                  placeholder="예: 청년도약계좌, 1억 모으기 적금"
                  value={savTitle}
                  onChange={(e) => setSavTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* 가입 시작일 선택 */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-pink-400" />
                    <span>적금 가입 시작일</span>
                  </label>
                  <span className="text-[11px] text-pink-400 font-semibold">
                    만기 예정: {previewMaturityDateStr}
                  </span>
                </div>
                <input
                  type="date"
                  value={savStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
                {autoCalculatedMsg && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <Sparkles className="w-3 h-3" />
                    <span>{autoCalculatedMsg}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">월 납입액 (원)</label>
                  <input
                    type="text"
                    placeholder="500,000"
                    value={savDeposit ? Number(savDeposit).toLocaleString("ko-KR") : ""}
                    onChange={(e) => setSavDeposit(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">연 이자율 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="4.5"
                    value={savRate}
                    onChange={(e) => setSavRate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-bold"
                  />
                </div>
              </div>

              {/* 저축 약정 개월수 설정 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-400">
                    약정 저축 기간 (총 개월수)
                  </label>
                  <span className="text-xs text-pink-400 font-bold">{savTargetMonths}개월</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {["6", "12", "24", "36", "60"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSavTargetMonths(m);
                        const calcMonths = getElapsedMonthsFromStart(savStartDate, parseInt(m, 10));
                        setSavCurrentMonths(String(calcMonths));
                      }}
                      className={`py-1.5 text-xs rounded-lg font-semibold transition ${
                        savTargetMonths === m
                          ? "bg-pink-500 text-slate-950 font-bold shadow-md shadow-pink-500/20"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {m}개월
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={600}
                  placeholder="직접 개월수 입력 (예: 12)"
                  value={savTargetMonths}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setSavTargetMonths(raw);
                    if (raw) {
                      const calcMonths = getElapsedMonthsFromStart(savStartDate, parseInt(raw, 10));
                      setSavCurrentMonths(String(calcMonths));
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* 현재 납입 완료 회차 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-400">
                      현재 납입 완료 회차
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const targetMax = parseInt(savTargetMonths, 10) || 12;
                        const calc = getElapsedMonthsFromStart(savStartDate, targetMax);
                        setSavCurrentMonths(String(calc));
                        setAutoCalculatedMsg(`시작일 기준 ${calc}회차로 재계산되었습니다.`);
                      }}
                      className="text-[10px] text-pink-400 hover:underline"
                    >
                      자동계산
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={parseInt(savTargetMonths, 10) || 600}
                    placeholder="0"
                    value={savCurrentMonths}
                    onChange={(e) => {
                      setSavCurrentMonths(e.target.value);
                      setAutoCalculatedMsg("");
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-bold text-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">이자 계산 방식</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setSavInterestType("simple")}
                      className={`py-2 text-xs rounded-xl font-semibold transition ${
                        savInterestType === "simple"
                          ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      단리
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavInterestType("compound")}
                      className={`py-2 text-xs rounded-xl font-semibold transition ${
                        savInterestType === "compound"
                          ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      월복리
                    </button>
                  </div>
                </div>
              </div>

              {/* 비과세 여부 및 목표 금액 */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={savTaxFree}
                    onChange={(e) => setSavTaxFree(e.target.checked)}
                    className="rounded text-pink-500 focus:ring-pink-500 bg-slate-800 border-slate-700 w-4 h-4"
                  />
                  <span className="text-xs text-slate-300">비과세 적용 (이자소득세 15.4% 면제)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">최종 목표 금액 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 20,000,000"
                  value={savGoal ? Number(savGoal).toLocaleString("ko-KR") : ""}
                  onChange={(e) => setSavGoal(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* 실시간 만기 예상액 미리보기 카드 */}
              {previewDeposit > 0 && (
                <div className="bg-gradient-to-br from-pink-950/40 to-slate-950 border border-pink-500/30 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-pink-300 flex justify-between">
                    <span>💡 만기 시 예상 수령액 ({previewMaturityDateStr} 만기)</span>
                    <span>{savTaxFree ? "비과세" : "일반과세(15.4%)"}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs text-slate-400">총 수령액 (원금+세후이자)</span>
                    <span className="text-lg font-black text-emerald-400">
                      {formatKRW(previewMaturityTotal)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1.5">
                    <span>만기 총 원금: {formatKRW(previewMaturityPrincipal)}</span>
                    <span className="text-pink-400 font-semibold">세후 이자: +{formatKRW(previewMaturityInterest)}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSavModalOpen(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-pink-500 text-slate-950 py-2.5 rounded-xl text-xs font-bold hover:bg-pink-600 shadow-lg shadow-pink-500/20"
                >
                  {editingSavings ? "설정 저장 완료" : "적금 플랜 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Investment Modal with Live Stock Presets & Price Calculator */}
      {isInvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span>{editingInv ? "투자 종목 수정" : "새 주식 / 코인 종목 추가"}</span>
              </h3>
              <button onClick={() => setIsInvModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvestmentSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Quick Popular Stock Presets */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">인기 종목 빠른 선택</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {POPULAR_STOCKS.map((stock) => (
                    <button
                      key={stock.ticker}
                      type="button"
                      onClick={() => handleSelectStockPreset(stock)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                        invTicker === stock.ticker
                          ? "bg-purple-500 text-slate-950 border-purple-400 font-bold"
                          : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {stock.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">종목/자산명</label>
                  <input
                    type="text"
                    placeholder="예: 삼성전자, 엔비디아"
                    value={invName}
                    onChange={(e) => setInvName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">종목코드 / 티커</label>
                  <input
                    type="text"
                    placeholder="예: 005930, AAPL, BTC"
                    value={invTicker}
                    onChange={(e) => setInvTicker(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">매수 평단가 (원)</label>
                  <input
                    type="text"
                    placeholder="70,000"
                    value={invBuyPrice ? Number(invBuyPrice).toLocaleString("ko-KR") : ""}
                    onChange={(e) => setInvBuyPrice(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">보유 수량 (주/개)</label>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="10"
                    value={invQuantity}
                    onChange={(e) => setInvQuantity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">현재가 (당일 시세)</label>
                  <input
                    type="text"
                    placeholder="78,500"
                    value={invCurrentPrice ? Number(invCurrentPrice).toLocaleString("ko-KR") : ""}
                    onChange={(e) => setInvCurrentPrice(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 실시간 투자 손익 프리뷰 카드 */}
              {previewInvested > 0 && (
                <div className="bg-gradient-to-br from-purple-950/40 to-slate-950 border border-purple-500/30 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-purple-300 flex justify-between">
                    <span>💡 실시간 투자 수익률 분석</span>
                    <span className={`font-black ${previewProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {previewProfit >= 0 ? "+" : ""}{previewReturnRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs text-slate-400">현재 총 평가액</span>
                    <span className="text-lg font-black text-purple-300">
                      {formatKRW(previewEvaluated)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1.5">
                    <span>투자 원금: {formatKRW(previewInvested)}</span>
                    <span className={`font-semibold ${previewProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      평가손익: {previewProfit >= 0 ? "+" : ""}{formatKRW(previewProfit)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsInvModalOpen(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 text-slate-950 py-2.5 rounded-xl text-xs font-bold hover:bg-purple-600 shadow-lg shadow-purple-500/20"
                >
                  {editingInv ? "종목 수정 완료" : "종목 등록"}
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

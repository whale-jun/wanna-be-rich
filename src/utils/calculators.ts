import type { Transaction, Savings, Investment, TaxDashboardData, MonthlySummary } from "../types/financial";

/**
 * 금액을 한국 원화(KRW) 형식으로 포맷팅
 */
export const formatKRW = (amount: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat("ko-KR").format(amount);
};

/**
 * 근로소득 실수령액 계산 (2025~2026년 기준 4대보험 및 근로소득세 간이세액)
 */
export const calculateNetIncome = (transaction: Partial<Transaction>): Partial<Transaction> => {
  if (transaction.type !== "income" || (transaction.category !== "월급/급여" && transaction.category !== "월급")) {
    return { ...transaction, netAmount: transaction.amount };
  }

  const gross = transaction.amount || 0;
  const pension = Math.floor(gross * 0.045);       // 국민연금 4.5%
  const health = Math.floor(gross * 0.03545);      // 건강보험 약 3.545%
  const longterm = Math.floor(health * 0.1281);    // 장기요양 약 12.81%
  const employment = Math.floor(gross * 0.009);    // 고용보험 0.9%

  const yearly = gross * 12;
  let incomeTaxRate = 0.06;
  if (yearly > 14000000) incomeTaxRate = 0.15;
  if (yearly > 50000000) incomeTaxRate = 0.24;
  if (yearly > 88000000) incomeTaxRate = 0.35;

  const incomeTax = Math.floor(gross * (incomeTaxRate * 0.5)); // 간이세액 대략치
  const localTax = Math.floor(incomeTax * 0.1);

  const net = gross - pension - health - longterm - employment - incomeTax - localTax;

  return {
    ...transaction,
    pension,
    health,
    longterm,
    employment,
    incomeTax,
    localTax,
    netAmount: net,
  };
};

/**
 * 저축 복리 및 목표 달성 계산 (단리/복리, 약정 기간, 세후 수령액 계산)
 */
export const calculateSavingsDetails = (savings: Savings): Savings => {
  const startDate = new Date(savings.date);
  const monthly = savings.monthlyDeposit || 0;
  const annualRate = savings.annualRate || 0;
  const goal = savings.goalAmount || 0;
  const targetMonths = savings.targetMonths || 12;
  const interestType = savings.interestType || "simple";
  const isTaxFree = !!savings.taxFree;
  const taxRate = isTaxFree ? 0 : 0.154; // 이자소득세 15.4% (소득세 14% + 지방소득세 1.4%)

  const today = new Date();
  const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
  const elapsedMonths = Math.max(0, monthsDiff);
  
  // 현재 납입 회차 (사용자가 설정한 currentMonths가 있으면 우선 사용, 없으면 경과월을 타겟월수로 클램핑)
  const currentMonths = savings.currentMonths !== undefined 
    ? Math.min(targetMonths, Math.max(0, savings.currentMonths)) 
    : Math.min(targetMonths, Math.max(1, elapsedMonths));

  const monthlyRate = annualRate / 100 / 12;

  // 1. 현재까지 납입한 누적 원금 및 이자 계산
  const accumulatedPrincipal = monthly * currentMonths;
  let preTaxAccumulatedInterest = 0;

  if (currentMonths > 0 && annualRate > 0) {
    if (interestType === "compound") {
      // 월 복리 공식
      const compTotal = monthly * ((Math.pow(1 + monthlyRate, currentMonths) - 1) / monthlyRate);
      preTaxAccumulatedInterest = Math.max(0, compTotal - accumulatedPrincipal);
    } else {
      // 정기적금 단리 공식: sum_{i=1}^n [ monthly * annualRate * (n - i + 1) / 12 ]
      // = monthly * (annualRate/100/12) * (n * (n + 1) / 2)
      preTaxAccumulatedInterest = monthly * (annualRate / 100 / 12) * (currentMonths * (currentMonths + 1) / 2);
    }
  }

  const accumulatedInterest = Math.round(preTaxAccumulatedInterest * (1 - taxRate));
  const totalAmount = accumulatedPrincipal + accumulatedInterest;

  // 2. 만기 시 예상 수령액 계산
  const maturityPrincipal = monthly * targetMonths;
  let preTaxMaturityInterest = 0;

  if (targetMonths > 0 && annualRate > 0) {
    if (interestType === "compound") {
      const compMaturityTotal = monthly * ((Math.pow(1 + monthlyRate, targetMonths) - 1) / monthlyRate);
      preTaxMaturityInterest = Math.max(0, compMaturityTotal - maturityPrincipal);
    } else {
      preTaxMaturityInterest = monthly * (annualRate / 100 / 12) * (targetMonths * (targetMonths + 1) / 2);
    }
  }

  const maturityInterest = Math.round(preTaxMaturityInterest * (1 - taxRate));
  const maturityTotal = maturityPrincipal + maturityInterest;

  // 3. 진행률 (%)
  const progressRate = targetMonths > 0 ? Math.min(100, Math.round((currentMonths / targetMonths) * 100)) : 0;

  // 4. 목표 달성 개월수 예측
  let monthsToGoal = "목표 없음";
  if (goal > 0 && monthly > 0) {
    if (totalAmount >= goal) {
      monthsToGoal = "🎉 목표 달성 완료!";
    } else {
      let tempTotal = totalAmount;
      let count = 0;
      while (tempTotal < goal && count < 600) {
        const stepInterest = interestType === "compound" 
          ? tempTotal * monthlyRate 
          : monthly * (annualRate / 100 / 12);
        tempTotal = tempTotal + monthly + (stepInterest * (1 - taxRate));
        count++;
      }
      monthsToGoal = count >= 600 ? "50년 이상" : `${count}개월 후 (${Math.ceil(count / 12)}년)`;
    }
  }

  return {
    ...savings,
    targetMonths,
    currentMonths,
    interestType,
    taxFree: isTaxFree,
    monthsElapsed: elapsedMonths,
    accumulatedPrincipal: Math.round(accumulatedPrincipal),
    accumulatedInterest,
    totalAmount: Math.round(totalAmount),
    maturityPrincipal: Math.round(maturityPrincipal),
    maturityInterest,
    maturityTotal: Math.round(maturityTotal),
    progressRate,
    monthsToGoal,
  };
};

/**
 * 투자 수익 계산
 */
export const calculateInvestmentDetails = (investment: Investment): Investment => {
  const quantity = investment.quantity || 1;
  const buyPrice = investment.buyPrice || (investment.investedAmount ? investment.investedAmount / quantity : 0);
  const currentPrice = investment.currentPrice !== undefined 
    ? investment.currentPrice 
    : (buyPrice * (1 + ((investment.returnRate || 0) / 100)));

  const investedAmount = Math.round(buyPrice * quantity) || investment.investedAmount;
  const evaluatedAmount = Math.round(currentPrice * quantity);
  const profit = evaluatedAmount - investedAmount;
  const returnRate = investedAmount > 0 
    ? Number(((profit / investedAmount) * 100).toFixed(2)) 
    : (investment.returnRate || 0);

  return {
    ...investment,
    buyPrice,
    quantity,
    currentPrice,
    investedAmount,
    evaluatedAmount,
    profit,
    returnRate,
  };
};

/**
 * 연말정산 대시보드 데이터 계산
 */
export const calculateTaxDashboard = (
  transactions: Transaction[]
): TaxDashboardData => {
  let totalIncome = 0;
  let paidIncomeTax = 0;
  let credit = 0;
  let debit = 0;

  transactions.forEach((tx) => {
    if (tx.type === "income") {
      totalIncome += tx.amount;
      if (tx.incomeTax) {
        paidIncomeTax += tx.incomeTax;
      }
    } else if (tx.type === "expense") {
      if (tx.paymentMethod === "신용카드") credit += tx.amount;
      if (tx.paymentMethod === "체크카드") debit += tx.amount;
    }
  });

  const minUsage = totalIncome * 0.25;
  const totalCard = credit + debit;

  let deductible = 0;
  if (totalCard > minUsage) {
    deductible = Math.round((credit * 0.15) + (debit * 0.30));
  }

  const taxable = Math.max(totalIncome - deductible, 0);
  let taxRate = 0.06;
  if (taxable > 14000000) taxRate = 0.15;
  if (taxable > 50000000) taxRate = 0.24;
  if (taxable > 88000000) taxRate = 0.35;

  const calculatedTax = Math.round(taxable * taxRate);
  const estimatedRefund = Math.round(paidIncomeTax - (calculatedTax / 12));

  return {
    totalIncome,
    totalDeduction: deductible,
    taxableIncome: taxable,
    taxRate,
    calculatedTax,
    estimatedRefund,
    creditCardUsage: credit,
    debitCardUsage: debit,
    paidIncomeTax,
  };
};

/**
 * 월별 수입/지출/저축 요약 계산
 */
export const calculateMonthlySummary = (
  transactions: Transaction[],
  targetMonth: string // YYYY-MM
): MonthlySummary => {
  let totalIncome = 0;
  let totalExpense = 0;
  let fixedExpense = 0;
  let variableExpense = 0;

  transactions
    .filter((tx) => tx.date.startsWith(targetMonth))
    .forEach((tx) => {
      if (tx.type === "income") {
        totalIncome += tx.amount;
      } else if (tx.type === "expense") {
        totalExpense += tx.amount;
        if (tx.isFixed) {
          fixedExpense += tx.amount;
        } else {
          variableExpense += tx.amount;
        }
      }
    });

  return {
    month: targetMonth,
    totalIncome,
    totalExpense,
    fixedExpense,
    variableExpense,
    balance: totalIncome - totalExpense,
    netSavings: Math.max(0, totalIncome - totalExpense),
  };
};

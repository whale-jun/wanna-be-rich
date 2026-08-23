export type TransactionType = "income" | "expense" | "transfer";

export type IncomeCategory = "월급/급여" | "보너스/상여" | "부수입/사업" | "금융/배당금" | "용돈/선물" | "기타수입";

export type ExpenseCategory = 
  | "식비" 
  | "카페/간식" 
  | "주거/통신" 
  | "교통/차량" 
  | "쇼핑/의류" 
  | "문화/여가" 
  | "의료/건강" 
  | "교육/자기계발" 
  | "경조사/선물" 
  | "금융/보험" 
  | "반려동물"
  | "기타지출";

export type PaymentMethod = "신용카드" | "체크카드" | "현금" | "계좌이체" | "간편결제" | "기타";

export type AccountType = "bank" | "savings" | "credit_card" | "debit_card" | "investment" | "cash" | "loan";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
  accountNumber?: string;
  institution?: string; // 은행/증권/카드사 이름 (예: 토스뱅크, 신한카드)
  creditLimit?: number; // 신용카드인 경우 한도
  paymentDay?: number; // 신용카드 결제일 (1~31)
  memo?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number;
  category: IncomeCategory | ExpenseCategory | string;
  accountId: string; // 연결된 계좌/카드 ID
  toAccountId?: string; // 이체인 경우 입금 계좌 ID
  memo: string;
  isFixed?: boolean; // 고정비 여부
  recurringId?: string; // 연동된 정기결제 ID
  paymentMethod?: PaymentMethod;
  // 월급일 경우 소득세 등
  pension?: number;
  health?: number;
  longterm?: number;
  employment?: number;
  incomeTax?: number;
  localTax?: number;
  netAmount?: number;
}

export interface RecurringItem {
  id: string;
  title: string;
  type: "income" | "expense";
  amount: number;
  category: IncomeCategory | ExpenseCategory | string;
  accountId: string;
  dayOfMonth: number; // 1~31일
  memo?: string;
  isActive: boolean;
  autoApply: boolean; // 매월 1일 또는 해당일에 자동 생성 여부
  lastAppliedMonth?: string; // YYYY-MM
}

export interface CategoryBudget {
  category: ExpenseCategory | string;
  budgetAmount: number;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  totalBudget: number;
  categoryBudgets: Record<string, number>;
}

export interface Savings {
  id: string;
  date: string; // 시작일 YYYY-MM-DD
  monthlyDeposit: number; // 월 납입액
  annualRate: number; // 연 이자율 (%)
  targetMonths?: number; // 약정 저축 개월수 (예: 12, 24, 36)
  currentMonths?: number; // 현재 납입 완료 회차/개월수
  goalAmount?: number; // 목표 금액 (선택)
  title?: string;
  accountId?: string;
  interestType?: "simple" | "compound"; // 단리 / 복리
  taxFree?: boolean; // 비과세 여부 (일반과세 15.4%)
  
  // 계산된 필드
  monthsElapsed?: number;
  accumulatedPrincipal?: number;
  accumulatedInterest?: number;
  totalAmount?: number;
  maturityPrincipal?: number;
  maturityInterest?: number;
  maturityTotal?: number;
  progressRate?: number;
  monthsToGoal?: string;
}

export interface Investment {
  id: string;
  date: string;
  assetName: string;
  ticker?: string; // 주식/코인 티커 (예: 005930, AAPL, BTC)
  market?: "KR" | "US" | "CRYPTO" | "OTHER"; // 시장 구분
  buyPrice?: number; // 매수 평단가
  quantity?: number; // 보유 수량
  currentPrice?: number; // 실시간 당일 현재가
  investedAmount: number; // 총 투자원금 (buyPrice * quantity)
  evaluatedAmount?: number; // 현재 평가액 (currentPrice * quantity)
  profit?: number; // 평가 손익 (evaluatedAmount - investedAmount)
  returnRate: number; // 실시간 수익률 (%)
  currency?: "KRW" | "USD";
  lastUpdated?: string; // 마지막 시세 갱신 일시
  accountId?: string;
}

export interface MonthlySummary {
  month: string; // yyyy-MM
  totalIncome: number;
  totalExpense: number;
  fixedExpense: number;
  variableExpense: number;
  balance: number;
  netSavings: number;
}

export interface TaxDashboardData {
  totalIncome: number;
  totalDeduction: number;
  taxableIncome: number;
  taxRate: number;
  calculatedTax: number;
  estimatedRefund: number;
  creditCardUsage: number;
  debitCardUsage: number;
  paidIncomeTax: number;
}


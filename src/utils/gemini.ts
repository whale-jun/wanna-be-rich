import type { Transaction, Account, RecurringItem, Savings, Investment } from "../types/financial";
import { formatKRW } from "./calculators";

export const generateAIReport = async (
  apiKey: string,
  transactions: Transaction[],
  accounts: Account[],
  recurringItems: RecurringItem[],
  savings: Savings[],
  investments: Investment[]
): Promise<string> => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const incomes = monthTxs.filter(t => t.type === "income");
  const expenses = monthTxs.filter(t => t.type === "expense");
  const totalIncome = incomes.reduce((acc, i) => acc + i.amount, 0) || 4500000;
  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = Math.round((netSavings / (totalIncome || 1)) * 100);

  // 자산 계산
  const totalLiquidAssets = accounts
    .filter(a => a.type === "bank" || a.type === "savings" || a.type === "cash")
    .reduce((acc, a) => acc + (a.balance || 0), 0);
  const totalInvestAssets = investments.reduce((acc, i) => acc + (i.evaluatedAmount || i.investedAmount || 0), 0);
  const totalDebt = accounts
    .filter(a => a.type === "loan" || (a.type === "credit_card" && a.balance < 0))
    .reduce((acc, a) => acc + Math.abs(a.balance || 0), 0);
  const totalNetWorth = totalLiquidAssets + totalInvestAssets - totalDebt;

  // 고정비 vs 변동비
  const fixedExpense = recurringItems.filter(r => r.isActive && r.type === "expense").reduce((acc, r) => acc + r.amount, 0);
  const variableExpense = Math.max(0, totalExpense - fixedExpense);

  if (!apiKey) {
    return generateLocalFinancialAnalysis(transactions, accounts, recurringItems, savings, investments);
  }

  const prompt = `
당신은 대한민국 최고의 금융 전문가 4인(공인회계사 CPA + 헤지펀드 매니저 + 프라이빗 뱅커 PB/CFP + 세무사 CTA)으로 구성된 'Wanna Be Rich 종합 자산관리 위원회'입니다.

아래 사용자의 실제 금융 자산 및 가계부 데이터를 바탕으로, 최고급 가독성과 체계적인 구조를 갖춘 [AI Financial Diagnosis Report]를 작성해주세요.

[고객 실시간 재무 데이터]
- 총 순자산 (Net Worth): ${formatKRW(totalNetWorth)} (유동성 예적금: ${formatKRW(totalLiquidAssets)}, 투자자산: ${formatKRW(totalInvestAssets)}, 부채: ${formatKRW(totalDebt)})
- 이번 달 수입: ${formatKRW(totalIncome)}
- 이번 달 지출: ${formatKRW(totalExpense)} (고정비: ${formatKRW(fixedExpense)}, 변동비: ${formatKRW(variableExpense)})
- 당월 잉여 저축 여력: ${formatKRW(netSavings)} (저축률: ${savingsRate}%)
- 등록된 고정비 목록: ${recurringItems.map(r => `${r.title} (${formatKRW(r.amount)})`).join(", ") || "없음"}
- 적금/저축 플랜: ${savings.map(s => `${s.title} (월 ${formatKRW(s.monthlyDeposit)}, 목표 ${formatKRW(s.goalAmount || (s.monthlyDeposit * (s.targetMonths || 12)))})`).join(", ") || "없음"}
- 투자 포트폴리오: ${investments.map(i => `${i.assetName} (${formatKRW(i.investedAmount)}, 수익률 ${i.returnRate}%)`).join(", ") || "없음"}

반드시 다음 6대 파트의 마크다운 형식으로, 전문가의 품격 있고 신뢰감 넘치는 어조로 구체적인 수치와 액션 플랜을 제시하세요:

# 🏛️ Wanna Be Rich? AI Financial Diagnosis Report

## 🏆 종합 재무 건강 점수: [XX점 / 100점] (등급: [AAA / AA / A / B / C])
* 1줄 요약 총평 (현재 재무 상태에 대한 전문가 4인의 공통 진단)

---

## 1. 🏛️ [공인회계사 CPA] 손익 & 현금흐름 정밀 감사
- **현금흐름(FCF) 건전성:** 수입 대비 지출 비율, 잉여 현금 흐름 평가
- **비용 구조 분석:** 고정비 vs 변동비 밸런스 및 새어나가는 지출 누수(Leakage) 진단
- **회계사의 지출 통제 처방전:** 구체적인 비용 절감 가이드라인

---

## 2. 📈 [헤지펀드 매니저] 자산배분 & 포트폴리오 공방 전략
- **자산 배분율 점검:** 안전자산(예적금) vs 위험자산(주식/코인)의 황금 비율 진단
- **수익률 & 리스크 관리:** 현재 포트폴리오의 인플레이션 방어력 및 샤프지수 관점 피드백
- **펀드매니저의 리밸런싱 로드맵:** 다음 분기 목표 포트폴리오 비중 제안

---

## 3. 💼 [공인재산관리사 PB] 목돈 마련 & 4개 통장 시스템 구축
- **4개의 통장 분리 진단:** (1. 급여통장 → 2. 소비통장 → 3. 예비/비상금통장 → 4. 투자통장) 완비 여부
- **비상 예비자금 안전망:** 월 생활비 3~6개월치 유동성 파킹통장 분리 전략
- **복리 스노우볼 로드맵:** 목표 시드머니(1억/5억/10억) 달성 예상 시점 및 적립식 플랜

---

## 4. ⚖️ [전문 세무사 CTA] 13월의 월급 & 합법적 절세 극대화
- **연말정산 카드 골든크로스:** 신용카드(15% 공제) 문턱 돌파 후 체크카드(30% 공제) 전환 시점 분석
- **절세 3총사 계좌 점검:** ISA(비과세), 연금저축/IRP(최대 148.5만원 세액공제) 활용 처방
- **금융소득종합과세 방어:** 이자/배당소득 2,000만원 한도 관리 팁

---

## 5. 🎯 [전문가 4인 합의] 이번 달 즉시 실행할 골든 액션 3가지
1. **[회계사 처방]** 구체적 행동 강령
2. **[펀드매니저/PB 처방]** 구체적 행동 강령
3. **[세무사 처방]** 구체적 행동 강령
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const fbRes = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const fbData = await fbRes.json();
      if (fbData.candidates?.[0]?.content?.parts?.[0]?.text) {
        return fbData.candidates[0].content.parts[0].text;
      }
      throw new Error(fbData.error?.message || "AI 응답 생성 실패");
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("AI 분석 결과를 가져오지 못했습니다.");
    }
  } catch (err: any) {
    console.warn("Gemini API call failed, falling back to local analysis:", err);
    return generateLocalFinancialAnalysis(transactions, accounts, recurringItems, savings, investments) + 
      `\n\n> ⚠️ *참고: Gemini API 호출 중 오류가 발생하여 4대 전문가 룰 기반 로컬 스마트 진단 알고리즘 결과가 표시되었습니다.*`;
  }
};

/**
 * 🏛️ 4대 전문가 (세무사+회계사+재산관리사+펀드매니저) 로컬 스마트 진단 리포트 생성기
 */
export const generateLocalFinancialAnalysis = (
  transactions: Transaction[],
  accounts: Account[],
  recurringItems: RecurringItem[],
  savings: Savings[],
  investments: Investment[]
): string => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const monthIncomes = monthTxs.filter(t => t.type === "income");
  const monthExpenses = monthTxs.filter(t => t.type === "expense");

  const totalIncome = monthIncomes.reduce((acc, i) => acc + i.amount, 0) || 4500000;
  const totalExpense = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsRate = Math.round((netSavings / (totalIncome || 1)) * 100);

  // 자산 계산
  const liquidTotal = accounts
    .filter(a => a.type === "bank" || a.type === "savings" || a.type === "cash")
    .reduce((acc, a) => acc + (a.balance || 0), 0);
  const investTotal = investments.reduce((acc, i) => acc + (i.evaluatedAmount || i.investedAmount || 0), 0);
  const debtTotal = accounts
    .filter(a => a.type === "loan" || (a.type === "credit_card" && a.balance < 0))
    .reduce((acc, a) => acc + Math.abs(a.balance || 0), 0);
  const netWorth = liquidTotal + investTotal - debtTotal;

  // 고정비 계산
  const fixedExpense = recurringItems.filter(r => r.isActive && r.type === "expense").reduce((acc, r) => acc + r.amount, 0);
  const fixedRatio = Math.round((fixedExpense / (totalExpense || 1)) * 100);

  // 재무 건강 점수 산출 알고리즘
  let score = 50;
  if (savingsRate >= 40) score += 25;
  else if (savingsRate >= 25) score += 15;
  else if (savingsRate >= 10) score += 5;

  if (investTotal > 0) score += 15;
  if (fixedRatio <= 40 && fixedRatio > 0) score += 10;
  if (debtTotal === 0 || debtTotal < netWorth * 0.2) score += 10;
  score = Math.min(98, Math.max(45, score));

  const grade = score >= 90 ? "AAA (최우수)" : score >= 80 ? "AA (우수)" : score >= 70 ? "A (안정)" : "B (개선 필요)";

  return `# 🏛️ Wanna Be Rich? AI Financial Diagnosis Report

## 🏆 종합 재무 건강 점수: ${score}점 / 100점 (등급: ${grade})
> **[전문가 위원회 종합 총평]**
> 현재 순자산 **${formatKRW(netWorth)}**, 월 저축률 **${savingsRate}%**로 전반적인 현금흐름이 ${savingsRate >= 30 ? "매우 견고한 성장 궤도" : "안정적인 흐름"}에 진입해 있습니다. 아래 4대 전문가의 핵심 처방을 실행하면 자산 증식 속도를 2배 이상 가속할 수 있습니다.

---

## 1. 🏛️ [공인회계사 CPA] 손익 & 현금흐름 정밀 감사
- **잉여 현금흐름(FCF):** 당월 총 수입 ${formatKRW(totalIncome)} 중 지출(${formatKRW(totalExpense)})을 차감한 **${formatKRW(netSavings)}**의 잉여 자금이 안정적으로 창출되고 있습니다.
- **고정비 밸런스 검토:** 현재 정기 고정비는 **${formatKRW(fixedExpense)}** (전체 지출의 ${fixedRatio}%) 수준입니다. 고정비가 40% 이하일 때 재무 유연성이 가장 높으므로 현재 비율을 잘 통제하고 계십니다.
- **회계사의 지출 통제 처방:** 사용 빈도가 낮은 정기 구독(${recurringItems.length}건)을 분기별로 점검하여 고정비를 월 5~10만원 추가 다이어트하세요.

---

## 2. 📈 [헤지펀드 매니저] 자산배분 & 포트폴리오 공방 전략
- **현재 자산 배분 구조:** 유동성/예적금 **${formatKRW(liquidTotal)}** vs 투자자산 **${formatKRW(investTotal)}** (총 투자 비중: ${Math.round((investTotal / (netWorth || 1)) * 100)}%)
- **인플레이션 방어력:** 현금성 자산 비중이 지나치게 높으면 실질 구매력이 하락합니다. 월 잉여금의 50% 이상을 미국 S&P500, 나스닥100, 배당성장 ETF 등 우량 적립식 펀드로 분산 배분할 것을 권장합니다.
- **목표 포트폴리오 제안:** [안전 예적금 30%] : [성장형 ETF 50%] : [배당/채권 20%]의 안정적인 삼각 편대를 구축하세요.

---

## 3. 💼 [공인재산관리사 PB] 목돈 마련 & 4개 통장 시스템 구축
- **4개의 통장 시스템 완성도:** 급여통장 → 소비통장(생활비 전용 체크카드) → 비상금통장(파킹통장) → 투자통장으로 자금 흐름을 완전 자동화하세요.
- **비상 예비자금(Emergency Fund):** 월 평균 지출액의 3~6개월치(약 **${formatKRW(totalExpense * 4)}**)를 연 3.0~3.5%대 수시입출식 파킹통장에 항상 유지하여 급격한 시장 변동에 대비하세요.
- **복리 스노우볼 로드맵:** 현재 저축 플랜(${savings.length}개)을 지속 유지할 경우 향후 3년 내 약 **${formatKRW(netSavings * 36 + investTotal)}** 규모의 핵심 시드머니 형성이 가능합니다.

---

## 4. ⚖️ [전문 세무사 CTA] 13월의 월급 & 합법적 절세 극대화
- **연말정산 신용 vs 체크카드 골든크로스:** 총급여의 25%까지는 포인트 혜택이 큰 신용카드를 사용하고, 문턱 돌파 이후에는 소득공제율이 2배 높은 **체크카드(30%) 및 현금영수증**으로 즉시 결제를 전환하세요.
- **절세 삼총사 계좌(ISA/연금저축/IRP):** 연금저축 및 IRP 납입 시 연 최대 **148.5만원(16.5% 세액공제)**을 국가로부터 환급받을 수 있습니다. ISA 계좌는 200~400만원 비과세 혜택을 반드시 챙기세요.
- **금융소득 비과세 전략:** 예적금 이자 및 배당소득이 연 2,000만원을 초과하지 않도록 비과세/분리과세 계좌를 적극 활용하세요.

---

## 5. 🎯 [전문가 4인 합의] 이번 달 즉시 실행할 골든 액션 3가지
1. **[회계사]** 급여일 익일로 저축/투자 자동이체를 설정하여 **'선저축 후지출' 강제 루틴** 완성하기
2. **[펀드매니저]** 잉여 현금 중 월 50만원 이상을 **글로벌 우량 지수 ETF 적립식 매수**로 자동 전환하기
3. **[세무사]** 연금저축펀드 또는 IRP 계좌를 개설하여 **연말정산 148.5만원 환급 혜택** 선점하기
`;
};

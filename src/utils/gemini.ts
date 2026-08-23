import type { Transaction, Account, RecurringItem, Savings, Investment } from "../types/financial";

export const generateAIReport = async (
  apiKey: string,
  transactions: Transaction[],
  accounts: Account[],
  recurringItems: RecurringItem[],
  savings: Savings[],
  investments: Investment[]
): Promise<string> => {
  const incomes = transactions.filter(t => t.type === "income");
  const expenses = transactions.filter(t => t.type === "expense");
  const totalIncome = incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalAssets = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  if (!apiKey) {
    return generateLocalFinancialAnalysis(transactions, recurringItems);
  }

  const prompt = `
너는 대한민국 최고의 개인 금융 자산관리 전문가(AI CFO)다. 아래 사용자의 실제 가계부 및 자산 데이터를 분석하여 맞춤형 종합 재무 전략 리포트를 Markdown 형식으로 작성하라.

[재무 기본 데이터]
- 총 자산 규모: 약 ${totalAssets.toLocaleString()}원
- 등록된 총 수입 내역: ${totalIncome.toLocaleString()}원 (${incomes.length}건)
- 등록된 총 지출 내역: ${totalExpense.toLocaleString()}원 (${expenses.length}건)
- 정기 고정비 항목: ${recurringItems.map(r => `${r.title}(${r.amount.toLocaleString()}원)`).join(", ") || "없음"}
- 저축 플랜: ${savings.map(s => `${s.title}(월 ${s.monthlyDeposit.toLocaleString()}원)`).join(", ") || "없음"}
- 투자 포트폴리오: ${investments.map(i => `${i.assetName}(원금 ${i.investedAmount.toLocaleString()}원, 수익률 ${i.returnRate}%)`).join(", ") || "없음"}
- 최근 주요 지출 샘플: ${JSON.stringify(expenses.slice(0, 15).map(e => ({ date: e.date, cat: e.category, amt: e.amount, memo: e.memo })))}

다음 목차에 따라 친절하면서도 전문적이고 구체적인 액션 플랜을 제시하라:
# 📊 AI CFO 맞춤형 재무 진단 리포트

## 1. 🔍 수입 대비 지출 & 소비 구조 정밀 진단
## 2. 🎯 저축 및 비상금 포트폴리오 최적화
## 3. 📈 투자 자산 배분 & 인플레이션 방어 전략
## 4. 💳 연말정산 절세 황금 전략 (신용카드 vs 체크카드 비중)
## 5. 💡 이번 달 즉시 실천할 3가지 행동 강령
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
    return generateLocalFinancialAnalysis(transactions, recurringItems) + 
      `\n\n> ⚠️ *참고: Gemini API 호출 중 (${err.message}) 에러가 발생하여 로컬 AI 알고리즘 진단 결과가 표시되었습니다.*`;
  }
};

/**
 * 로컬 룰 기반 자동 재무 진단 리포트 생성기
 */
export const generateLocalFinancialAnalysis = (
  transactions: Transaction[],
  recurringItems: RecurringItem[]
): string => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const monthIncomes = monthTxs.filter(t => t.type === "income");
  const monthExpenses = monthTxs.filter(t => t.type === "expense");

  const totalIncome = monthIncomes.reduce((acc, i) => acc + i.amount, 0) || 4200000;
  const totalExpense = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = Math.round((netSavings / totalIncome) * 100);

  // 고정비 vs 변동비
  const fixedExpense = recurringItems.filter(r => r.isActive && r.type === "expense").reduce((acc, r) => acc + r.amount, 0);
  const fixedRatio = Math.round((fixedExpense / (totalExpense || 1)) * 100);

  // 최다 지출 카테고리
  const catMap: Record<string, number> = {};
  monthExpenses.forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  });
  const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  return `# 💰 Wanna Be Rich? AI Financial Diagnosis Report

## 1. 🔍 소비 구조 및 저축률 정밀 진단
- **당월 수입:** ${totalIncome.toLocaleString()}원
- **당월 지출:** ${totalExpense.toLocaleString()}원 (고정비 ${fixedExpense.toLocaleString()}원, 비중 ${fixedRatio}%)
- **잉여 저축 여력:** ${netSavings.toLocaleString()}원 (저축률: **${savingsRate}%**)

${savingsRate >= 40 
  ? "✅ **매우 우수한 저축률(40% 이상)**을 유지하고 계십니다! 잉여 현금을 단순 입출금 통장에 방치하기보다 단기 파킹통장이나 적립식 ETF로 분산 배치하는 것을 권장합니다." 
  : savingsRate >= 20 
  ? "⚡ **양호한 저축률(20~40%)** 수준입니다. 식비 및 쇼핑 등 변동 지출에서 약 10%만 추가 절약하면 연간 300만원 이상의 추가 시드머니를 확보할 수 있습니다." 
  : "⚠️ **저축률 개선이 시급합니다.** 수입 대비 소비 비중이 높아 예상치 못한 비상 지출 발생 시 유동성 위기가 올 수 있습니다."}

## 2. 💳 지출 카테고리 집중 분석
${topCategories.length > 0 
  ? `현재 가장 많은 지출이 발생한 상위 카테고리는 **${topCategories[0][0]} (${topCategories[0][1].toLocaleString()}원)** 및 **${topCategories[1]?.[0] || "기타"} (${(topCategories[1]?.[1] || 0).toLocaleString()}원)** 입니다.` 
  : "충분한 지출 내역이 기록되지 않았습니다."}
- **구독/고정비 다이어트:** 현재 등록된 고정비(${recurringItems.length}건, 월 ${fixedExpense.toLocaleString()}원) 중 최근 1개월간 사용 빈도가 낮은 OTT나 부가서비스가 있는지 점검하세요.

## 3. 🛡️ 연말정산 소득공제 최적화 전략
- **신용카드 문턱(총급여 25%):** 급여의 25%까지는 포인트 및 할인 혜택이 풍부한 **신용카드**를 우선 사용하세요.
- **문턱 초과 후:** 25% 초과 지출분부터는 소득공제율이 2배 높은 **체크카드(30%) 및 현금영수증** 위주로 결제 수단을 전환해야 환급액을 극대화할 수 있습니다.

## 4. 💡 이번 달 실천 액션 플랜 3가지
1. **일일 권장 지출 한도 준수:** 남은 기간 동안 하루 지출을 예산 범위 내로 통제하기
2. **비상금 통장 분리:** 월 지출액의 3~6배에 해당하는 비상 유동성 자금 파킹통장에 격리
3. **정기 적금 자동이체일 맞추기:** 급여일 익일로 자동이체일을 설정하여 '선저축 후소비' 강제화
`;
};

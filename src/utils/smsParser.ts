import type { Transaction, Account, ExpenseCategory } from "../types/financial";

export interface ParsedSmsResult {
  id: string;
  originalText: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  amount: number;
  memo: string; // 가맹점명 / 사용처
  cardCompany?: string; // 감지된 금융사/카드사/페이
  category: ExpenseCategory | string;
  accountId: string;
  paymentMethod: "신용카드" | "체크카드" | "계좌이체" | "간편결제" | "현금";
  confidence: "high" | "medium" | "low";
}

/**
 * 상호명/가맹점명 키워드 기반 카테고리 스마트 자동 추론
 */
export const guessCategoryFromMemo = (memo: string): ExpenseCategory | string => {
  const m = memo.toLowerCase();

  // 카페/간식
  if (/스타벅스|투썸|이디야|메가커피|컴포즈|빽다방|폴바셋|할리스|커피|카페|디저트|베이커리|파리바게|뚜레쥬르|배스킨|던킨|와플|설빙|공차/.test(m)) {
    return "카페/간식";
  }

  // 식비
  if (/배달의민족|요기요|쿠팡이츠|식당|음식점|김밥|국밥|치킨|피자|버거|맥도날드|롯데리아|버거킹|써브웨이|초밥|고기|갈비|삼겹살|포차|이자카야|마트|이마트|홈플러스|하나로|식자재|마켓컬리|오아시스|반찬|식품|한식|중식|일식|양식|분식/.test(m)) {
    return "식비";
  }

  // 교통/차량
  if (/주유|gs칼텍스|sk에너지|s-oil|현대오일|알뜰주유|지하철|버스|티머니|캐시비|카카오t|택시|코레일|srt|철도|하이패스|주차|쏘카|그린카|세차|대리운전|모빌리티/.test(m)) {
    return "교통/차량";
  }

  // 쇼핑/의류
  if (/쿠팡|네이버페이|11번가|g마켓|옥션|위메프|티몬|무신사|지그재그|에이블리|올리브영|다이소|백화점|아울렛|유니클로|zara|h&m|신세계|현대백화점|롯데백화점|편의점|gs25|cu|세븐일레븐|이마트24|마켓|스마트스토어|쇼핑/.test(m)) {
    return "쇼핑/의류";
  }

  // 문화/여가
  if (/넷플릭스|유튜브|디즈니|왓챠|웨이브|티빙|cgv|롯데시네마|메가박스|인터파크|티켓|영화|공연|전시|노래방|볼링|pc방|골프|테니스|헬스|피트니스|필라테스|숙박|야놀자|여기어때|에어비앤비|호텔|항공|여행|게임|넥슨|스팀/.test(m)) {
    return "문화/여가";
  }

  // 의료/건강
  if (/병원|의원|약국|치과|한의원|내과|이비인후과|정형외과|피부과|안과|검진|약|건강|의료|클리닉/.test(m)) {
    return "의료/건강";
  }

  // 주거/통신
  if (/관리비|도시가스|한전|전기요금|kt|skt|lgu\+|lg유플러스|알뜰폰|통신|인터넷|수도요금|월세|렌탈/.test(m)) {
    return "주거/통신";
  }

  // 교육/자기계발
  if (/학원|교보문고|예스24|알라딘|영풍문고|서점|책|인프런|패스트캠퍼스|클래스101|유데미|스터디|독서실|강의|교육|시험|자격증/.test(m)) {
    return "교육/자기계발";
  }

  // 금융/보험
  if (/보험|생명|화재|해상|손해|국민연금|건강보험|적금|예금|대출|이자|수수료|투자|증권/.test(m)) {
    return "금융/보험";
  }

  return "기타지출";
};

/**
 * 텍스트에서 카드사/은행/간편결제 이름 추론하여 매칭 계좌 찾기
 */
export const matchAccountFromText = (text: string, accounts: Account[]): { accountId: string; cardCompany?: string; paymentMethod: "신용카드" | "체크카드" | "계좌이체" | "간편결제" | "현금" } => {
  const t = text.toLowerCase();
  let cardCompany: string | undefined;
  let paymentMethod: "신용카드" | "체크카드" | "계좌이체" | "간편결제" | "현금" = "신용카드";

  if (/네이버페이/.test(t)) { cardCompany = "네이버페이"; paymentMethod = "간편결제"; }
  else if (/카카오페이/.test(t)) { cardCompany = "카카오페이"; paymentMethod = "간편결제"; }
  else if (/토스페이|토스/.test(t)) { cardCompany = "토스"; paymentMethod = "간편결제"; }
  else if (/쿠팡페이|쿠페이/.test(t)) { cardCompany = "쿠팡페이"; paymentMethod = "간편결제"; }
  else if (/신한/.test(t)) cardCompany = "신한";
  else if (/현대/.test(t)) cardCompany = "현대";
  else if (/국민|kb/.test(t)) cardCompany = "국민";
  else if (/삼성/.test(t)) cardCompany = "삼성";
  else if (/하나/.test(t)) cardCompany = "하나";
  else if (/우리/.test(t)) cardCompany = "우리";
  else if (/농협|nh/.test(t)) cardCompany = "농협";
  else if (/롯데/.test(t)) cardCompany = "롯데";
  else if (/비씨|bc/.test(t)) cardCompany = "BC";
  else if (/케이뱅크/.test(t)) cardCompany = "케이뱅크";
  else if (/카카오뱅크/.test(t)) cardCompany = "카카오뱅크";

  if (/체크|check/.test(t)) {
    paymentMethod = "체크카드";
  } else if (/이체|출금|송금|계좌/.test(t)) {
    paymentMethod = "계좌이체";
  }

  if (cardCompany) {
    const matched = accounts.find(
      (a) => a.name.includes(cardCompany!) || (a.institution && a.institution.includes(cardCompany!))
    );
    if (matched) {
      return { accountId: matched.id, cardCompany, paymentMethod };
    }
  }

  // 기본값: 첫 번째 신용카드 또는 첫 번째 계좌
  const defaultCard = accounts.find((a) => a.type === "credit_card") || accounts[0];
  return { accountId: defaultCard?.id || "acc-1", cardCompany, paymentMethod };
};

/**
 * 단일 문자/카톡/푸시 알림 텍스트 파싱
 */
export const parseSingleSms = (rawText: string, accounts: Account[]): ParsedSmsResult | null => {
  const text = rawText.trim();
  if (!text || text.length < 4) return null;

  // 1. 금액 추출 (예: 15,000원, 15000원, 15,000 KRW, 승인 45,000)
  let amount = 0;
  const wonMatch = text.match(/([0-9]{1,3}(,[0-9]{3})*|[0-9]+)\s*원/);
  const altMatch = text.match(/(?:승인|결제|출금|금액|이용|지불)\s*:?\s*([0-9]{1,3}(,[0-9]{3})+|[0-9]+)/);
  const numCommaMatch = text.match(/([0-9]{1,3}(,[0-9]{3})+)\s*(?:KRW|원)?/);

  if (wonMatch) {
    amount = parseInt(wonMatch[1].replace(/,/g, ""), 10);
  } else if (altMatch) {
    amount = parseInt(altMatch[1].replace(/,/g, ""), 10);
  } else if (numCommaMatch) {
    amount = parseInt(numCommaMatch[1].replace(/,/g, ""), 10);
  }

  if (isNaN(amount) || amount <= 0) return null;

  // 2. 날짜 및 시간 추출
  const now = new Date();
  const currentYear = now.getFullYear();
  let dateStr = now.toISOString().slice(0, 10);
  let timeStr = "";

  const dateTimeMatch = text.match(/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}:\d{2})/);
  const dateOnlyMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
  const koreanDateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
  const fullDateMatch = text.match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);

  if (fullDateMatch) {
    const y = fullDateMatch[1];
    const m = String(parseInt(fullDateMatch[2], 10)).padStart(2, "0");
    const d = String(parseInt(fullDateMatch[3], 10)).padStart(2, "0");
    dateStr = `${y}-${m}-${d}`;
  } else if (dateTimeMatch) {
    const m = String(parseInt(dateTimeMatch[1], 10)).padStart(2, "0");
    const d = String(parseInt(dateTimeMatch[2], 10)).padStart(2, "0");
    dateStr = `${currentYear}-${m}-${d}`;
    timeStr = dateTimeMatch[3];
  } else if (dateOnlyMatch) {
    const m = String(parseInt(dateOnlyMatch[1], 10)).padStart(2, "0");
    const d = String(parseInt(dateOnlyMatch[2], 10)).padStart(2, "0");
    dateStr = `${currentYear}-${m}-${d}`;
  } else if (koreanDateMatch) {
    const m = String(parseInt(koreanDateMatch[1], 10)).padStart(2, "0");
    const d = String(parseInt(koreanDateMatch[2], 10)).padStart(2, "0");
    dateStr = `${currentYear}-${m}-${d}`;
  }

  // 3. 카드사 매칭 및 계좌 추출
  const { accountId, cardCompany, paymentMethod } = matchAccountFromText(text, accounts);

  // 4. 가맹점/상호명/사용처 추출
  let memo = "";
  const cleanText = text
    .replace(/\[Web발신\]/g, "")
    .replace(/\[.+?카드\]/g, "")
    .replace(/\[토스\]|\[카카오페이\]|\[네이버페이\]/g, "")
    .replace(/누적\s*[\d,]+원?/g, "")
    .replace(/잔액\s*[\d,]+원?/g, "")
    .replace(/\(일시불\)/g, "")
    .replace(/\(\d+개월\)/g, "")
    .replace(/승인번호\s*:\s*\d+/g, "");

  // 날짜/시간 이후의 텍스트에서 가맹점 추출 시도
  const afterTimeMatch = cleanText.match(/(?:\d{1,2}:\d{2}|\d{1,2}\/\d{1,2})\s+([가-힣a-zA-Z0-9_\-\s&]+?)(?:\s+승인|\s+누적|\s+잔액|\s+일시불|$)/);
  const afterAmountMatch = cleanText.match(/[\d,]+원\s+([가-힣a-zA-Z0-9_\-\s&]+?)(?:\s+승인|\s+일시불|\s+누적|$)/);

  if (afterTimeMatch && afterTimeMatch[1].trim()) {
    memo = afterTimeMatch[1].trim();
  } else if (afterAmountMatch && afterAmountMatch[1].trim()) {
    memo = afterAmountMatch[1].trim();
  } else {
    // 텍스트 라인 중 금액/날짜가 아닌 라인을 상호명으로
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (!line.includes("원") && !line.includes("발신") && !line.includes("승인") && line.length < 30) {
        memo = line;
        break;
      }
    }
  }

  memo = memo.replace(/(승인|일시불|체크|출금|결제 완료|취소 완료|이용|완료)/g, "").trim();
  if (!memo || memo.length > 30) memo = cardCompany ? `${cardCompany} 결제` : "온라인/오프라인 결제";

  // 5. 카테고리 자동 추론
  const category = guessCategoryFromMemo(memo);

  return {
    id: crypto.randomUUID(),
    originalText: text,
    date: dateStr,
    time: timeStr,
    amount,
    memo,
    cardCompany,
    category,
    accountId,
    paymentMethod,
    confidence: "high",
  };
};

/**
 * 텍스트 블록 전체 파싱 (단일 건 또는 여러 건 분리 파싱)
 */
export const parseMultipleSms = (fullText: string, accounts: Account[]): ParsedSmsResult[] => {
  if (!fullText.trim()) return [];

  const delimiterPattern = /(?=\[Web발신\]|\[.+?카드\]|\[토스\]|\[카카오페이\]|\[네이버페이\]|\n\s*\n)/g;
  const rawChunks = fullText.split(delimiterPattern);

  const results: ParsedSmsResult[] = [];

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const parsed = parseSingleSms(trimmed, accounts);
    if (parsed) {
      results.push(parsed);
    }
  }

  if (results.length === 0) {
    const single = parseSingleSms(fullText, accounts);
    if (single) results.push(single);
  }

  return results;
};

/**
 * ParsedSmsResult 배열을 Transaction 포맷으로 변환
 */
export const convertParsedToTransactions = (
  items: ParsedSmsResult[]
): Omit<Transaction, "id">[] => {
  return items.map((item) => ({
    date: item.date,
    type: "expense",
    amount: item.amount,
    category: item.category,
    accountId: item.accountId,
    memo: item.memo,
    paymentMethod: item.paymentMethod,
    isFixed: false,
  }));
};

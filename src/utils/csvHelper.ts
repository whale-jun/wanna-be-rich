import type { Transaction, Account } from "../types/financial";

/**
 * 거래 내역을 CSV 문자열로 변환하여 다운로드
 */
export const exportTransactionsToCSV = (transactions: Transaction[], accounts: Account[]) => {
  const accountMap = new Map(accounts.map(a => [a.id, a.name]));

  const headers = ["날짜", "유형", "카테고리", "금액", "결제수단/계좌", "메모", "고정비여부"];
  
  const rows = transactions.map(tx => {
    const typeLabel = tx.type === "income" ? "수입" : tx.type === "expense" ? "지출" : "이체";
    const accountName = accountMap.get(tx.accountId) || tx.paymentMethod || "미지정";
    const isFixedLabel = tx.isFixed ? "고정" : "변동";
    const memo = `"${(tx.memo || "").replace(/"/g, '""')}"`;

    return [
      tx.date,
      typeLabel,
      tx.category,
      tx.amount,
      accountName,
      memo,
      isFixedLabel
    ].join(",");
  });

  // UTF-8 BOM 추가 (엑셀에서 한글 깨짐 방지)
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `wanna_be_rich_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * CSV 파일 텍스트를 파싱하여 Transaction 배열로 변환
 */
export const parseCSVToTransactions = (csvText: string, defaultAccountId: string): Partial<Transaction>[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length <= 1) return [];

  const results: Partial<Transaction>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts: string[] = [];
    let insideQuote = false;
    let currentPart = "";

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        parts.push(currentPart.trim());
        currentPart = "";
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart.trim());

    if (parts.length >= 4) {
      const date = parts[0] || new Date().toISOString().slice(0, 10);
      const rawType = parts[1] || "지출";
      const type = rawType.includes("수입") ? "income" : rawType.includes("이체") ? "transfer" : "expense";
      const category = parts[2] || (type === "income" ? "기타수입" : "기타지출");
      const amount = Math.abs(parseInt(parts[3].replace(/[^0-9-]/g, ""), 10)) || 0;
      const memo = (parts[5] || "").replace(/^"|"$/g, "");
      const isFixed = parts[6] ? parts[6].includes("고정") : false;

      results.push({
        id: crypto.randomUUID(),
        date,
        type,
        category,
        amount,
        accountId: defaultAccountId,
        memo,
        isFixed,
      });
    }
  }

  return results;
};

/**
 * 전체 가계부 백업 데이터 JSON 다운로드
 */
export const exportFullBackup = (data: any) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `wanna_be_rich_full_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

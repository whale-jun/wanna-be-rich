import React, { useRef } from "react";
import type { Account, Transaction, RecurringItem, MonthlyBudget, Savings, Investment } from "../types/financial";
import { exportTransactionsToCSV, parseCSVToTransactions, exportFullBackup } from "../utils/csvHelper";
import { X, Download, Upload, RefreshCw, Trash2, FileSpreadsheet, HardDriveDownload } from "lucide-react";

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  budgets: Record<string, MonthlyBudget>;
  savings: Savings[];
  investments: Investment[];
  onImportTransactions: (txs: Partial<Transaction>[]) => void;
  onResetSample: () => void;
  onClearAll: () => void;
  onLoadFullBackup: (backup: any) => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  recurringItems,
  budgets,
  savings,
  investments,
  onImportTransactions,
  onResetSample,
  onClearAll,
  onLoadFullBackup,
}) => {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    exportTransactionsToCSV(transactions, accounts);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseCSVToTransactions(text, accounts[0]?.id || "acc-1");
        if (parsed.length === 0) {
          alert("파싱할 수 있는 거래 내역이 없거나 형식이 올바르지 않습니다.");
          return;
        }
        onImportTransactions(parsed);
        alert(`${parsed.length}건의 거래 내역을 성공적으로 가져왔습니다.`);
        onClose();
      } catch (err: any) {
        alert("CSV 파일을 읽는 중 오류가 발생했습니다: " + (err?.message || "알 수 없는 오류"));
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleExportJSON = () => {
    const backupData = {
      version: "2.0",
      exportDate: new Date().toISOString(),
      accounts,
      transactions,
      recurringItems,
      budgets,
      savings,
      investments,
    };
    exportFullBackup(backupData);
  };

  const handleJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const backup = JSON.parse(text);
        onLoadFullBackup(backup);
        alert("전체 백업 데이터를 성공적으로 복원했습니다.");
        onClose();
      } catch (err: any) {
        alert("백업 파일 복원 실패: " + (err?.message || "올바른 JSON 형식이 아닙니다."));
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleResetSampleConfirm = () => {
    if (confirm("샘플 데이터를 새로 불러오시겠습니까? 현재 데이터가 기본 데이터로 교체됩니다.")) {
      onResetSample();
      alert("샘플 데이터를 성공적으로 로드했습니다.");
      onClose();
    }
  };

  const handleClearAllConfirm = () => {
    if (confirm("정말로 모든 가계부 및 자산 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      onClearAll();
      alert("모든 데이터가 초기화되었습니다.");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HardDriveDownload className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold">데이터 백업 & 관리</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* CSV Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <FileSpreadsheet className="w-4 h-4" />
              <span>엑셀 / CSV 거래 내역 연동</span>
            </div>
            <p className="text-xs text-slate-400">
              현재 저장된 가계부 내역 ({transactions.length}건)을 엑셀용 CSV 파일로 다운로드하거나, 외부 CSV 내역을 가져옵니다.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                CSV 내보내기
              </button>
              <button
                onClick={() => csvInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition"
              >
                <Upload className="w-4 h-4 text-sky-400" />
                CSV 가져오기
              </button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Full Backup Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <HardDriveDownload className="w-4 h-4" />
              <span>전체 자산 & 설정 완벽 백업 (JSON)</span>
            </div>
            <p className="text-xs text-slate-400">
              계좌, 고정비, 예산, 거래 내역, 저축 및 투자 데이터 전체를 파일로 백업하거나 복원합니다.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition"
              >
                <Download className="w-4 h-4 text-sky-400" />
                전체 백업 다운로드
              </button>
              <button
                onClick={() => jsonInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                백업 파일 복원
              </button>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleJSONUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Preset & Reset Section */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              데이터 초기화 및 기본값
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleResetSampleConfirm}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold py-2.5 px-4 rounded-xl transition"
              >
                <RefreshCw className="w-4 h-4" />
                샘플 데이터로 채우기
              </button>
              <button
                onClick={handleClearAllConfirm}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold py-2.5 px-4 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
                전체 데이터 초기화
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

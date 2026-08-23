import React from "react";
import type { NavTab } from "./Navbar";
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  Repeat, 
  Landmark, 
  Bot
} from "lucide-react";

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: "dashboard" as NavTab, label: "대시보드", icon: LayoutDashboard },
    { id: "transactions" as NavTab, label: "내역", icon: Receipt },
    { id: "budgets" as NavTab, label: "예산", icon: Target },
    { id: "recurring" as NavTab, label: "고정비", icon: Repeat },
    { id: "accounts" as NavTab, label: "자산", icon: Landmark },
    { id: "ai" as NavTab, label: "AI분석", icon: Bot },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-1.5 px-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition active:scale-95 ${
                isActive
                  ? "text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400 stroke-[2.5]" : "text-slate-400"}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

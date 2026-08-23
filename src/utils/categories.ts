export interface CategoryItem {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  bgColor: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: CategoryItem[] = [
  { id: "식비", name: "식비", type: "expense", color: "#f97316", bgColor: "rgba(249, 115, 22, 0.15)", icon: "Utensils" },
  { id: "카페/간식", name: "카페/간식", type: "expense", color: "#fb923c", bgColor: "rgba(251, 146, 60, 0.15)", icon: "Coffee" },
  { id: "주거/통신", name: "주거/통신", type: "expense", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.15)", icon: "Home" },
  { id: "교통/차량", name: "교통/차량", type: "expense", color: "#06b6d4", bgColor: "rgba(6, 182, 212, 0.15)", icon: "Car" },
  { id: "쇼핑/의류", name: "쇼핑/의류", type: "expense", color: "#ec4899", bgColor: "rgba(236, 72, 153, 0.15)", icon: "ShoppingBag" },
  { id: "문화/여가", name: "문화/여가", type: "expense", color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.15)", icon: "Film" },
  { id: "의료/건강", name: "의료/건강", type: "expense", color: "#10b981", bgColor: "rgba(16, 185, 129, 0.15)", icon: "Activity" },
  { id: "교육/자기계발", name: "교육/자기계발", type: "expense", color: "#6366f1", bgColor: "rgba(99, 102, 241, 0.15)", icon: "BookOpen" },
  { id: "경조사/선물", name: "경조사/선물", type: "expense", color: "#f43f5e", bgColor: "rgba(244, 63, 94, 0.15)", icon: "Gift" },
  { id: "금융/보험", name: "금융/보험", type: "expense", color: "#14b8a6", bgColor: "rgba(20, 184, 166, 0.15)", icon: "Shield" },
  { id: "반려동물", name: "반려동물", type: "expense", color: "#eab308", bgColor: "rgba(234, 179, 8, 0.15)", icon: "Heart" },
  { id: "기타지출", name: "기타지출", type: "expense", color: "#64748b", bgColor: "rgba(100, 116, 139, 0.15)", icon: "MoreHorizontal" },
];

export const INCOME_CATEGORIES: CategoryItem[] = [
  { id: "월급/급여", name: "월급/급여", type: "income", color: "#10b981", bgColor: "rgba(16, 185, 129, 0.15)", icon: "DollarSign" },
  { id: "보너스/상여", name: "보너스/상여", type: "income", color: "#059669", bgColor: "rgba(5, 150, 105, 0.15)", icon: "Award" },
  { id: "부수입/사업", name: "부수입/사업", type: "income", color: "#06b6d4", bgColor: "rgba(6, 182, 212, 0.15)", icon: "Briefcase" },
  { id: "금융/배당금", name: "금융/배당금", type: "income", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.15)", icon: "TrendingUp" },
  { id: "용돈/선물", name: "용돈/선물", type: "income", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.15)", icon: "Gift" },
  { id: "기타수입", name: "기타수입", type: "income", color: "#64748b", bgColor: "rgba(100, 116, 139, 0.15)", icon: "PlusCircle" },
];

export const getCategoryColor = (category: string): string => {
  const found = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(c => c.name === category || c.id === category);
  return found ? found.color : "#94a3b8";
};

export const getCategoryBgColor = (category: string): string => {
  const found = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(c => c.name === category || c.id === category);
  return found ? found.bgColor : "rgba(148, 163, 184, 0.15)";
};

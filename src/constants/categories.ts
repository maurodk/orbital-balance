import type { CategoryScope } from "@/types";

export interface DefaultCategorySeed {
  name: string;
  color: string;
  icon: string;
  type: CategoryScope;
}

/**
 * Reference copy of the default categories seeded by the
 * public.handle_new_user() trigger in supabase/migrations/0001_init.sql.
 * Keep in sync with SQL.
 */
export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: "Alimentação", color: "#F97316", icon: "UtensilsCrossed", type: "expense" },
  { name: "Transporte", color: "#3B82F6", icon: "Car", type: "expense" },
  { name: "Saúde", color: "#10B981", icon: "HeartPulse", type: "expense" },
  { name: "Moradia", color: "#8B5CF6", icon: "Home", type: "expense" },
  { name: "Lazer", color: "#EAB308", icon: "Gamepad2", type: "expense" },
  { name: "Educação", color: "#06B6D4", icon: "GraduationCap", type: "expense" },
  { name: "Vestuário", color: "#EC4899", icon: "Shirt", type: "expense" },
  { name: "Investimentos", color: "#D4AF7A", icon: "TrendingUp", type: "both" },
  { name: "Salário", color: "#22C55E", icon: "Banknote", type: "income" },
  { name: "Outros", color: "#94A3B8", icon: "MoreHorizontal", type: "both" },
];

export const PAYMENT_METHODS = [
  { value: "card", label: "Cartão", icon: "CreditCard", color: "#3B82F6" },
  { value: "cash", label: "Dinheiro", icon: "Banknote", color: "#22C55E" },
  { value: "pix", label: "Pix", icon: "Zap", color: "#14B8A6" },
  { value: "transfer", label: "Transferência", icon: "ArrowLeftRight", color: "#8B5CF6" },
] as const;

export const RECURRENCE_OPTIONS = [
  { value: "none", label: "Nenhuma" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
] as const;

import type { Database } from "./database";

export type TransactionType = "expense" | "income";
export type PaymentMethod = "card" | "cash" | "pix" | "transfer";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type NecessityTag = "necessary" | "unnecessary" | "pending";
export type CategoryScope = "expense" | "income" | "both";
export type GoalPriority = "low" | "medium" | "high";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type RecurringTransaction =
  Database["public"]["Tables"]["recurring_transactions"]["Row"];
export type MonthlyReport =
  Database["public"]["Tables"]["monthly_reports"]["Row"];
export type InvestmentGoal =
  Database["public"]["Tables"]["investment_goals"]["Row"];
export type Investment =
  Database["public"]["Tables"]["investments"]["Row"];
export type InvestmentContribution =
  Database["public"]["Tables"]["investment_contributions"]["Row"];
export type InvestmentGoalAllocation =
  Database["public"]["Tables"]["investment_goal_allocations"]["Row"];

export type TransactionInsert =
  Database["public"]["Tables"]["transactions"]["Insert"];
export type CategoryInsert =
  Database["public"]["Tables"]["categories"]["Insert"];
export type InvestmentGoalInsert =
  Database["public"]["Tables"]["investment_goals"]["Insert"];
export type InvestmentInsert =
  Database["public"]["Tables"]["investments"]["Insert"];
export type InvestmentContributionInsert =
  Database["public"]["Tables"]["investment_contributions"]["Insert"];
export type InvestmentGoalAllocationInsert =
  Database["public"]["Tables"]["investment_goal_allocations"]["Insert"];

export interface TransactionWithCategory extends Transaction {
  category: Category | null;
}

export interface InvestmentGoalWithRelations extends InvestmentGoal {
  investments: Investment[];
  contributions: InvestmentContribution[];
  allocations: InvestmentGoalAllocation[];
}

export interface InvestmentWithAllocations extends Investment {
  allocations: InvestmentGoalAllocation[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  isScheduled: boolean;
  transactionId: string;
  categoryColor: string;
}

export interface MonthSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
  count: number;
}

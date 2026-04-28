import type {
  CategorySpending,
  MonthSummary,
  Transaction,
  TransactionWithCategory,
} from "@/types";

export function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((acc, item) => acc + selector(item), 0);
}

export function calculateMonthSummary(
  transactions: Transaction[],
  month: number,
  year: number
): MonthSummary {
  const inMonth = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });

  const totalIncome = sumBy(
    inMonth.filter((t) => t.type === "income"),
    (t) => t.amount
  );
  const totalExpense = sumBy(
    inMonth.filter((t) => t.type === "expense"),
    (t) => t.amount
  );

  return {
    month,
    year,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: inMonth.length,
  };
}

export function calculateCurrentBalance(transactions: Transaction[]): number {
  const effective = transactions.filter((t) => !t.is_scheduled);
  const income = sumBy(
    effective.filter((t) => t.type === "income"),
    (t) => t.amount
  );
  const expense = sumBy(
    effective.filter((t) => t.type === "expense"),
    (t) => t.amount
  );
  return income - expense;
}

export function calculateCategorySpending(
  transactions: TransactionWithCategory[]
): CategorySpending[] {
  const expenses = transactions.filter(
    (t) => t.type === "expense" && t.category
  );
  const total = sumBy(expenses, (t) => t.amount);
  if (total === 0) return [];

  const map = new Map<string, CategorySpending>();
  for (const t of expenses) {
    if (!t.category) continue;
    const existing = map.get(t.category.id);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      map.set(t.category.id, {
        categoryId: t.category.id,
        categoryName: t.category.name,
        categoryColor: t.category.color,
        total: t.amount,
        percentage: 0,
        count: 1,
      });
    }
  }

  return Array.from(map.values())
    .map((s) => ({ ...s, percentage: s.total / total }))
    .sort((a, b) => b.total - a.total);
}

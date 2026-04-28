"use client";

import { useMemo } from "react";
import { useTransactions } from "./useTransactions";
import { calculateCurrentBalance, calculateMonthSummary, calculateCategorySpending } from "@/lib/calculations";

export function useBalance() {
  const { data: transactions = [], isLoading } = useTransactions();

  const balance = useMemo(() => calculateCurrentBalance(transactions), [transactions]);

  return { balance, isLoading };
}

export function useMonthSummary(month: number, year: number) {
  const { data: transactions = [], isLoading } = useTransactions({ month, year });

  const summary = useMemo(
    () => calculateMonthSummary(transactions, month, year),
    [transactions, month, year]
  );

  return { summary, isLoading };
}

export function useCategorySpending(month: number, year: number) {
  const { data: transactions = [], isLoading } = useTransactions({ month, year });

  const spending = useMemo(
    () => calculateCategorySpending(transactions),
    [transactions]
  );

  return { spending, isLoading };
}

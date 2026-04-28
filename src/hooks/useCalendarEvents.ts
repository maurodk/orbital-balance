"use client";

import { useMemo } from "react";
import { useTransactions } from "./useTransactions";
import type { CalendarEvent } from "@/types";

export function useCalendarEvents(month: number, year: number) {
  const { data: transactions = [], isLoading } = useTransactions({ month, year });

  const events = useMemo<CalendarEvent[]>(
    () =>
      transactions.map((t) => ({
        id: t.id,
        title: t.description,
        amount: t.amount,
        type: t.type,
        date: t.date,
        isScheduled: t.is_scheduled,
        transactionId: t.id,
        categoryColor: t.category?.color ?? "#94A3B8",
      })),
    [transactions]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = event.date.slice(0, 10);
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, event]);
    }
    return map;
  }, [events]);

  return { events, eventsByDate, isLoading };
}

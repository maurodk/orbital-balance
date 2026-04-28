"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X, LayoutGrid, List } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function DayCell({
  date,
  events,
  isCurrentMonth,
  onClick,
  selected,
}: {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  onClick: () => void;
  selected: boolean;
}) {
  const incomeEvents = events.filter((e) => e.type === "income");
  const expenseEvents = events.filter((e) => e.type === "expense");
  const today = isToday(date);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 p-2 rounded-xl min-h-[72px] transition-all duration-200 text-xs",
        isCurrentMonth ? "text-orbital-white" : "text-orbital-muted/30",
        selected && "bg-orbital-gold/12 ring-1 ring-orbital-gold/40 shadow-[0_0_16px_rgba(212,175,122,0.12)]",
        today && !selected && "ring-1 ring-orbital-gold/25",
        !selected && "hover:bg-white/5"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
          today && "bg-orbital-gold text-orbital-deep font-bold shadow-[0_0_12px_rgba(212,175,122,0.5)]"
        )}
      >
        {format(date, "d")}
      </span>
      <div className="flex gap-0.5 flex-wrap justify-center">
        {incomeEvents.length > 0 && (
          <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
        )}
        {expenseEvents.length > 0 && (
          <span className="h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_4px_rgba(239,68,68,0.6)]" />
        )}
      </div>
    </button>
  );
}

function DayDetail({
  date,
  events,
  onClose,
}: {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
}) {
  const incomeTotal = events.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expenseTotal = events.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="glass-card rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-orbital-white">{formatDate(date)}</p>
          <p className="text-xs text-orbital-muted mt-0.5">
            {events.length} transaç{events.length !== 1 ? "ões" : "ão"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-orbital-muted hover:text-orbital-white hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {events.length > 0 && (
        <div className="flex gap-4 mb-4 pb-3 border-b border-orbital-gold/10">
          {incomeTotal > 0 && (
            <div>
              <p className="text-xs text-orbital-muted">Receitas</p>
              <p className="text-sm font-semibold text-success">+{formatCurrency(incomeTotal)}</p>
            </div>
          )}
          {expenseTotal > 0 && (
            <div>
              <p className="text-xs text-orbital-muted">Despesas</p>
              <p className="text-sm font-semibold text-destructive">-{formatCurrency(expenseTotal)}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {events.length === 0 ? (
          <p className="text-xs text-orbital-muted text-center py-4">
            Nenhuma transação neste dia.
          </p>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-xs",
                e.isScheduled ? "opacity-60 bg-orbital-surface/50" : "bg-orbital-deep/40"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: e.categoryColor }}
                />
                <span className="text-orbital-white truncate max-w-[120px]">{e.title}</span>
                {e.isScheduled && (
                  <span className="text-orbital-muted">(agendado)</span>
                )}
              </div>
              <span
                className={
                  e.type === "income"
                    ? "text-success font-medium"
                    : "text-destructive font-medium"
                }
              >
                {e.type === "income" ? "+" : "-"}
                {formatCurrency(e.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"grid" | "agenda">("grid");

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { eventsByDate, isLoading } = useCalendarEvents(month, year);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startPad = getDay(startOfMonth(currentDate));
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const selectedEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

  // Month totals for the banner
  const monthTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    eventsByDate.forEach((events) => {
      events.forEach((e) => {
        if (!e.isScheduled) {
          if (e.type === "income") income += e.amount;
          else expense += e.amount;
        }
      });
    });
    return { income, expense, balance: income - expense };
  }, [eventsByDate]);

  // Agenda: sorted days with events
  const agendaEntries = useMemo(() => {
    return Array.from(eventsByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b));
  }, [eventsByDate]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-orbital-white">Calendário Financeiro</h1>
        <p className="text-sm text-orbital-muted mt-1">Visualize seus lançamentos por dia</p>
      </motion.div>

      {/* Month summary banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass-card rounded-xl px-5 py-4 flex flex-wrap items-center gap-6"
      >
        <div>
          <p className="text-xs text-orbital-muted uppercase tracking-wider mb-0.5">Receitas</p>
          <p className="text-lg font-bold text-success tabular-nums">
            +{formatCurrency(monthTotals.income)}
          </p>
        </div>
        <div>
          <p className="text-xs text-orbital-muted uppercase tracking-wider mb-0.5">Despesas</p>
          <p className="text-lg font-bold text-destructive tabular-nums">
            -{formatCurrency(monthTotals.expense)}
          </p>
        </div>
        <div>
          <p className="text-xs text-orbital-muted uppercase tracking-wider mb-0.5">Saldo do mês</p>
          <p
            className={cn(
              "text-lg font-bold tabular-nums",
              monthTotals.balance >= 0 ? "text-orbital-gold" : "text-destructive"
            )}
          >
            {formatCurrency(monthTotals.balance)}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Calendar / Agenda panel */}
        <div className="glass-card rounded-xl p-5">
          {/* Header: nav + view toggle */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1.5 rounded-lg text-orbital-muted hover:text-orbital-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <AnimatePresence mode="wait">
                <motion.p
                  key={monthLabel}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="text-sm font-semibold text-orbital-white capitalize w-44 text-center"
                >
                  {monthLabel}
                </motion.p>
              </AnimatePresence>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1.5 rounded-lg text-orbital-muted hover:text-orbital-white hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-orbital-deep/60">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  view === "grid"
                    ? "bg-orbital-gold/20 text-orbital-gold"
                    : "text-orbital-muted hover:text-orbital-white"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grade
              </button>
              <button
                onClick={() => setView("agenda")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  view === "agenda"
                    ? "bg-orbital-gold/20 text-orbital-gold"
                    : "text-orbital-muted hover:text-orbital-white"
                )}
              >
                <List className="h-3.5 w-3.5" />
                Agenda
              </button>
            </div>
          </div>

          {/* Grid view */}
          <AnimatePresence mode="wait">
            {view === "grid" && (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Week headers */}
                <div className="grid grid-cols-7 mb-2">
                  {WEEK_DAYS.map((d) => (
                    <p key={d} className="text-center text-xs font-medium text-orbital-muted py-1">
                      {d}
                    </p>
                  ))}
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {paddedDays.map((day, i) => {
                      if (!day) return <div key={`pad-${i}`} />;
                      const key = format(day, "yyyy-MM-dd");
                      const events = eventsByDate.get(key) ?? [];
                      return (
                        <DayCell
                          key={key}
                          date={day}
                          events={events}
                          isCurrentMonth={isSameMonth(day, currentDate)}
                          selected={
                            selectedDate
                              ? format(selectedDate, "yyyy-MM-dd") === key
                              : false
                          }
                          onClick={() => setSelectedDate(day)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Legend */}
                <div className="flex gap-5 mt-5 pt-4 border-t border-orbital-gold/10">
                  <span className="flex items-center gap-1.5 text-xs text-orbital-muted">
                    <span className="h-2 w-2 rounded-full bg-success" /> Receita
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-orbital-muted">
                    <span className="h-2 w-2 rounded-full bg-destructive" /> Despesa
                  </span>
                </div>
              </motion.div>
            )}

            {/* Agenda view */}
            {view === "agenda" && (
              <motion.div
                key="agenda"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-1"
              >
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : agendaEntries.length === 0 ? (
                  <p className="text-xs text-orbital-muted text-center py-10">
                    Nenhum lançamento neste mês.
                  </p>
                ) : (
                  agendaEntries.map(([dateKey, events]) => {
                    const dayDate = new Date(dateKey + "T00:00:00");
                    const dayIncome = events.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
                    const dayExpense = events.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);

                    return (
                      <div key={dateKey} className="rounded-xl bg-orbital-deep/40 border border-orbital-gold/8 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-orbital-white capitalize">
                            {format(dayDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                          </p>
                          <div className="flex gap-3 text-xs">
                            {dayIncome > 0 && (
                              <span className="text-success">+{formatCurrency(dayIncome)}</span>
                            )}
                            {dayExpense > 0 && (
                              <span className="text-destructive">-{formatCurrency(dayExpense)}</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {events.map((e) => (
                            <div
                              key={e.id}
                              className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-orbital-deep/50"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: e.categoryColor }}
                                />
                                <span className="text-orbital-white">{e.title}</span>
                                {e.isScheduled && (
                                  <span className="text-orbital-muted text-[10px]">(agendado)</span>
                                )}
                              </div>
                              <span
                                className={
                                  e.type === "income"
                                    ? "text-success font-medium tabular-nums"
                                    : "text-destructive font-medium tabular-nums"
                                }
                              >
                                {e.type === "income" ? "+" : "-"}
                                {formatCurrency(e.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Day detail panel */}
        <AnimatePresence>
          {selectedDate && view === "grid" ? (
            <DayDetail
              date={selectedDate}
              events={selectedEvents}
              onClose={() => setSelectedDate(null)}
            />
          ) : view === "grid" ? (
            <div className="glass-card rounded-xl border-dashed p-5 items-center justify-center hidden xl:flex">
              <p className="text-xs text-orbital-muted text-center">
                Selecione um dia para ver os detalhes
              </p>
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

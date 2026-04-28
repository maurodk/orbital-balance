"use client";

import { useMemo, useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useTransactions, useRecentTransactions } from "@/hooks/useTransactions";
import { useCategorySpending } from "@/hooks/useBalance";
import { calculateMonthSummary } from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { MonthlyLineChart } from "@/components/charts/monthly-line-chart";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/useUIStore";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { MonthSummary } from "@/types";

/* ─── Animated counter ──────────────────────────────── */
function AnimatedValue({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v * 100) / 100),
    });
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{formatCurrency(display)}</span>;
}

/* ─── Contextual greeting ───────────────────────────── */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Bom dia", emoji: "☀️" };
  if (hour >= 12 && hour < 18) return { text: "Boa tarde", emoji: "🌤️" };
  return { text: "Boa noite", emoji: "🌙" };
}

/* ─── Shared fade-up variant ────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ─── Summary card ──────────────────────────────────── */

/* ─── Page ───────────────────────────────────────────── */
export default function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const greeting = getGreeting();

  const [firstName, setFirstName] = useState("");
  const { openTransactionDialog } = useUIStore();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const name =
        (data.user?.user_metadata?.name as string | undefined) ??
        data.user?.email?.split("@")[0] ??
        "";
      setFirstName(name.split(" ")[0]);
    });
  }, []);

  const { data: allTransactions = [], isLoading: loadingAll } = useTransactions();
  const { data: recentTransactions = [], isLoading: loadingRecent } = useRecentTransactions(5);
  const { spending, isLoading: loadingSpending } = useCategorySpending(month, year);

  const summary = useMemo(
    () => calculateMonthSummary(allTransactions, month, year),
    [allTransactions, month, year]
  );

  const balance = useMemo(() => {
    const effective = allTransactions.filter((t) => !t.is_scheduled);
    const inc = effective.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = effective.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return inc - exp;
  }, [allTransactions]);

  const last6Months = useMemo<MonthSummary[]>(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 1 - (5 - i), 1);
      return calculateMonthSummary(allTransactions, d.getMonth() + 1, d.getFullYear());
    });
  }, [allTransactions, month, year]);

  const isLoading = loadingAll || loadingRecent;

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm text-orbital-muted">
          {greeting.text}{firstName ? `, ${firstName}` : ""} {greeting.emoji}
        </p>
        <h1 className="text-2xl font-bold text-orbital-white mt-0.5">
          Seu painel financeiro
        </h1>
      </motion.div>

      {/* Hero: Balance card + Chart — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-stretch">

        {/* Left: Saldo total + CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="glass-card rounded-2xl p-6 shadow-gold-glow flex flex-col justify-between gap-6"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-orbital-muted uppercase tracking-widest mb-3">
              Saldo total
            </p>
            {isLoading ? (
              <div className="h-12 w-full rounded-lg bg-orbital-surface animate-pulse" />
            ) : (
              <p
                className={cn(
                  "text-4xl font-bold tracking-tight tabular-nums break-all",
                  balance >= 0 ? "text-gradient-gold" : "text-destructive"
                )}
              >
                <AnimatedValue value={balance} />
              </p>
            )}
            {balance < 0 && !isLoading && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                Saldo negativo — revise seus gastos
              </div>
            )}

            {/* Month breakdown */}
            {!isLoading && (
              <div className="mt-5 space-y-2.5 border-t border-orbital-gold/10 pt-4">
                <p className="text-[10px] uppercase tracking-widest text-orbital-muted mb-3">Este mês</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-orbital-muted">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    Receitas
                  </span>
                  <span className="text-xs font-semibold text-success tabular-nums">
                    {formatCurrency(summary.totalIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-orbital-muted">
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    Despesas
                  </span>
                  <span className="text-xs font-semibold text-destructive tabular-nums">
                    {formatCurrency(summary.totalExpense)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-orbital-gold/10 pt-2.5">
                  <span className="flex items-center gap-1.5 text-xs text-orbital-muted">
                    <Wallet className="h-3.5 w-3.5 text-orbital-gold" />
                    Saldo do mês
                  </span>
                  <span className={cn("text-xs font-semibold tabular-nums", summary.balance >= 0 ? "text-orbital-gold" : "text-destructive")}>
                    {formatCurrency(summary.balance)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* CTA buttons — full-width, stacked */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => openTransactionDialog("income")}
              className="w-full gap-2 bg-success/12 text-success border border-success/30 hover:bg-success hover:text-white hover:border-success hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-250 font-semibold py-3 rounded-xl text-sm"
            >
              <TrendingUp className="h-4 w-4" />
              Adicionar Receita
            </Button>
            <Button
              onClick={() => openTransactionDialog("expense")}
              className="w-full gap-2 bg-destructive/12 text-destructive border border-destructive/30 hover:bg-destructive hover:text-white hover:border-destructive hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-250 font-semibold py-3 rounded-xl text-sm"
            >
              <TrendingDown className="h-4 w-4" />
              Registrar Gasto
            </Button>
          </div>
        </motion.div>

        {/* Right: Line Chart hero */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-5">
            <h3 className="text-base font-semibold text-orbital-white">
              Evolução financeira
            </h3>
            <p className="text-xs text-orbital-muted mt-0.5">Receitas vs. despesas nos últimos 6 meses</p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : (
            <MonthlyLineChart data={last6Months} height={400} />
          )}
        </motion.div>

      </div>{/* end hero grid */}

      {/* Bottom row: category bars + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-orbital-white mb-5">
            Gastos por categoria
          </h3>
          {loadingSpending ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : spending.length === 0 ? (
            <EmptyState
              title="Sem gastos este mês"
              description="Registre despesas para visualizar a distribuição."
            />
          ) : (
            <CategoryBarChart data={spending} />
          )}
        </motion.div>

        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-orbital-white">Últimas transações</h3>
            <Link href="/dashboard/transactions">
              <Button
                variant="ghost"
                size="sm"
                className="text-orbital-gold hover:text-orbital-gold text-xs gap-1"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {loadingRecent ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              title="Nenhuma transação ainda"
              description="Use os botões acima para registrar sua primeira transação."
            />
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t, i) => (
                <TransactionCard key={t.id} transaction={t} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}


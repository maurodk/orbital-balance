"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { subMonths } from "date-fns";
import { BarChart3, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateMonthSummary, calculateCategorySpending } from "@/lib/calculations";
import { formatCurrency, formatMonthYear, formatPercent } from "@/lib/formatters";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MonthSummary } from "@/types";
import { cn } from "@/lib/utils";

function InsightCard({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-orbital-gold/5 border border-orbital-gold/20 px-4 py-3">
      <span className="text-orbital-gold mt-0.5">💡</span>
      <p className="text-sm text-orbital-white">{text}</p>
    </div>
  );
}

function generateInsights(
  current: MonthSummary,
  previous: MonthSummary | undefined,
  unnecessaryTotal: number
): string[] {
  const insights: string[] = [];

  if (current.balance < 0) {
    insights.push("Seu saldo do mês está negativo. Revise seus gastos urgentemente.");
  }

  if (current.totalExpense > 0) {
    const unnecessaryPct = unnecessaryTotal / current.totalExpense;
    if (unnecessaryPct > 0.3) {
      insights.push(
        `${formatPercent(unnecessaryPct)} dos seus gastos foram classificados como desnecessários. Há espaço para economizar.`
      );
    }
  }

  if (previous && current.totalExpense > 0 && previous.totalExpense > 0) {
    const change = (current.totalExpense - previous.totalExpense) / previous.totalExpense;
    if (change > 0.2) {
      insights.push(
        `Suas despesas aumentaram ${formatPercent(change)} em relação ao mês anterior.`
      );
    } else if (change < -0.1) {
      insights.push(
        `Ótimo! Suas despesas diminuíram ${formatPercent(Math.abs(change))} em relação ao mês anterior.`
      );
    }
  }

  if (current.totalIncome === 0) {
    insights.push("Nenhuma receita registrada neste mês. Configure uma receita recorrente para projeções precisas.");
  }

  if (insights.length === 0) {
    insights.push("Continue registrando suas transações para receber insights personalizados.");
  }

  return insights;
}

export default function ReportsPage() {
  const now = new Date();
  const [selectedTab, setSelectedTab] = useState("current");
  const { data: allTransactions = [], isLoading } = useTransactions();

  const last12 = useMemo<{ month: number; year: number; label: string }[]>(() =>
    Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, i);
      return { month: d.getMonth() + 1, year: d.getFullYear(), label: formatMonthYear(d.getMonth() + 1, d.getFullYear()) };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const selectedMonthData = last12[Number(selectedTab === "current" ? 0 : selectedTab)] ?? last12[0];

  const summary = useMemo(
    () => calculateMonthSummary(allTransactions, selectedMonthData.month, selectedMonthData.year),
    [allTransactions, selectedMonthData]
  );

  const previousMonthData = last12[
    Number(selectedTab === "current" ? 1 : Number(selectedTab) + 1)
  ] ?? last12[1];

  const previousSummary = useMemo(
    () => previousMonthData
      ? calculateMonthSummary(allTransactions, previousMonthData.month, previousMonthData.year)
      : undefined,
    [allTransactions, previousMonthData]
  );

  const monthTransactions = useMemo(
    () => allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonthData.month && d.getFullYear() === selectedMonthData.year;
    }),
    [allTransactions, selectedMonthData]
  );

  const spending = useMemo(() => calculateCategorySpending(monthTransactions), [monthTransactions]);

  const unnecessaryTotal = useMemo(
    () => monthTransactions.filter((t) => t.type === "expense" && t.necessity_tag === "unnecessary")
      .reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );

  const insights = useMemo(
    () => generateInsights(summary, previousSummary, unnecessaryTotal),
    [summary, previousSummary, unnecessaryTotal]
  );

  const last6Months = useMemo<MonthSummary[]>(
    () => last12.slice(0, 6).reverse().map((m) =>
      calculateMonthSummary(allTransactions, m.month, m.year)
    ),
    [allTransactions, last12]
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-orbital-white">Relatórios</h1>
        <p className="text-sm text-orbital-muted mt-1">Análise detalhada das suas finanças</p>
      </motion.div>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {last12.slice(0, 6).map((m, i) => (
          <button
            key={`${m.year}-${m.month}`}
            onClick={() => setSelectedTab(i === 0 ? "current" : String(i))}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors border",
              (selectedTab === "current" && i === 0) || selectedTab === String(i)
                ? "bg-orbital-gold text-orbital-deep border-orbital-gold"
                : "border-orbital-gold/20 text-orbital-muted hover:text-orbital-white hover:border-orbital-gold/40"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Receitas", value: summary.totalIncome, icon: TrendingUp, color: "text-success" },
              { label: "Despesas", value: summary.totalExpense, icon: TrendingDown, color: "text-destructive" },
              { label: "Saldo", value: summary.balance, icon: Wallet, color: summary.balance >= 0 ? "text-orbital-gold" : "text-destructive" },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={cn("h-4 w-4", card.color)} />
                  <p className="text-xs text-orbital-muted">{card.label}</p>
                </div>
                <p className={cn("text-2xl font-bold", card.color)}>{formatCurrency(card.value)}</p>
                {previousSummary && (
                  <p className="text-xs text-orbital-muted mt-1">
                    {card.label === "Receitas" && previousSummary.totalIncome > 0 &&
                      `vs ${formatCurrency(previousSummary.totalIncome)} mês ant.`}
                    {card.label === "Despesas" && previousSummary.totalExpense > 0 &&
                      `vs ${formatCurrency(previousSummary.totalExpense)} mês ant.`}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-orbital-white mb-4">
                  <BarChart3 className="h-4 w-4 inline mr-2 text-orbital-gold" />
                  Evolução 6 meses
                </h3>
                <MonthlyBarChart data={last6Months} />
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-orbital-white mb-4">Gastos por categoria</h3>
                {spending.length === 0 ? (
                  <p className="text-sm text-orbital-muted text-center py-8">Sem despesas neste período.</p>
                ) : (
                  <>
                    <CategoryPieChart data={spending} />
                    <div className="mt-4 space-y-2">
                      {spending.slice(0, 5).map((s) => (
                        <div key={s.categoryId} className="flex items-center gap-3">
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.categoryColor }} />
                          <span className="flex-1 text-sm text-orbital-white">{s.categoryName}</span>
                          <span className="text-sm font-medium text-orbital-muted">{formatCurrency(s.total)}</span>
                          <span className="text-xs text-orbital-muted w-10 text-right">{formatPercent(s.percentage / 100)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <InsightCard key={i} text={insight} />
                ))}
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-orbital-white mb-3">Necessário vs Desnecessário</h3>
                  {summary.totalExpense > 0 ? (
                    <>
                      <div className="flex gap-4 mb-3">
                        <div>
                          <p className="text-xs text-orbital-muted">Necessário</p>
                          <p className="text-lg font-bold text-success">
                            {formatCurrency(monthTransactions.filter(t => t.type === "expense" && t.necessity_tag === "necessary").reduce((s, t) => s + t.amount, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-orbital-muted">Desnecessário</p>
                          <p className="text-lg font-bold text-destructive">{formatCurrency(unnecessaryTotal)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-orbital-muted">Pendente</p>
                          <p className="text-lg font-bold text-orbital-muted">
                            {formatCurrency(monthTransactions.filter(t => t.type === "expense" && t.necessity_tag === "pending").reduce((s, t) => s + t.amount, 0))}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-orbital-deep overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{
                            width: `${((summary.totalExpense - unnecessaryTotal) / summary.totalExpense) * 100}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-orbital-muted">Sem despesas registradas.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

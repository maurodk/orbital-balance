"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { subMonths } from "date-fns";
import { BarChart3, Download, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateCategorySpending, calculateMonthSummary } from "@/lib/calculations";
import { exportFinanceWorkbook } from "@/lib/excel-export";
import { formatCurrency, formatMonthYear, formatPercent } from "@/lib/formatters";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MonthSummary } from "@/types";
import { cn } from "@/lib/utils";

function InsightCard({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-orbital-gold/5 border border-orbital-gold/20 px-4 py-3">
      <span className="text-orbital-gold mt-0.5">!</span>
      <p className="text-sm text-orbital-white">{text}</p>
    </div>
  );
}

function generateInsights(
  current: MonthSummary,
  previous: MonthSummary | undefined,
  unnecessaryTotal: number,
  necessaryTotal: number
): string[] {
  const insights: string[] = [];

  if (current.transactionCount === 0) {
    return [
      "Nenhuma transacao encontrada para este periodo. Registre receitas e despesas para gerar uma analise personalizada.",
    ];
  }

  if (current.balance < 0) {
    insights.push(
      "Seu saldo do mes esta negativo. Revise despesas recorrentes e gastos variaveis antes de assumir novos compromissos."
    );
  } else if (current.totalIncome > 0) {
    const savingsRate = current.balance / current.totalIncome;
    if (savingsRate >= 0.2) {
      insights.push(
        `Voce preservou ${formatPercent(savingsRate)} das receitas do mes. E um bom ritmo para reserva ou investimentos.`
      );
    } else if (savingsRate < 0.05) {
      insights.push(
        "Seu saldo ficou muito proximo de zero. Vale separar uma meta minima de sobra mensal antes de novos gastos."
      );
    }
  }

  if (current.totalExpense > 0) {
    const unnecessaryPct = unnecessaryTotal / current.totalExpense;
    const necessaryPct = necessaryTotal / current.totalExpense;
    if (unnecessaryPct > 0.3) {
      insights.push(
        `${formatPercent(unnecessaryPct)} dos seus gastos foram classificados como desnecessarios. Ha espaco para economizar.`
      );
    } else if (necessaryPct > 0.75) {
      insights.push(
        "A maior parte das despesas foi marcada como necessaria. Isso ajuda na previsibilidade, mas revise se alguma conta fixa pode ser renegociada."
      );
    }
  }

  if (previous && current.totalExpense > 0 && previous.totalExpense > 0) {
    const change = (current.totalExpense - previous.totalExpense) / previous.totalExpense;
    if (change > 0.2) {
      insights.push(
        `Suas despesas aumentaram ${formatPercent(change)} em relacao ao mes anterior.`
      );
    } else if (change < -0.1) {
      insights.push(
        `Otimo! Suas despesas diminuiram ${formatPercent(Math.abs(change))} em relacao ao mes anterior.`
      );
    }
  }

  if (previous && current.totalIncome > 0 && previous.totalIncome > 0) {
    const incomeChange = (current.totalIncome - previous.totalIncome) / previous.totalIncome;
    if (incomeChange < -0.15) {
      insights.push(
        `Suas receitas cairam ${formatPercent(Math.abs(incomeChange))} em relacao ao mes anterior. Ajuste o orcamento deste mes com cautela.`
      );
    }
  }

  if (current.totalIncome === 0) {
    insights.push(
      "Nenhuma receita registrada neste mes. Configure uma receita recorrente para projecoes mais precisas."
    );
  }

  if (insights.length === 0) {
    insights.push("Continue registrando suas transacoes para receber insights personalizados.");
  }

  return insights;
}

export default function ReportsPage() {
  const now = new Date();
  const [selectedTab, setSelectedTab] = useState("current");
  const { data: allTransactions = [], isLoading } = useTransactions();

  const last12 = useMemo<{ month: number; year: number; label: string }[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(now, i);
        return {
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          label: formatMonthYear(d.getMonth() + 1, d.getFullYear()),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const selectedMonthData =
    last12[Number(selectedTab === "current" ? 0 : selectedTab)] ?? last12[0];

  const summary = useMemo(
    () =>
      calculateMonthSummary(
        allTransactions,
        selectedMonthData.month,
        selectedMonthData.year
      ),
    [allTransactions, selectedMonthData]
  );

  const previousMonthData =
    last12[Number(selectedTab === "current" ? 1 : Number(selectedTab) + 1)] ??
    last12[1];

  const previousSummary = useMemo(
    () =>
      previousMonthData
        ? calculateMonthSummary(allTransactions, previousMonthData.month, previousMonthData.year)
        : undefined,
    [allTransactions, previousMonthData]
  );

  const monthTransactions = useMemo(
    () =>
      allTransactions.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() + 1 === selectedMonthData.month &&
          d.getFullYear() === selectedMonthData.year
        );
      }),
    [allTransactions, selectedMonthData]
  );

  const spending = useMemo(
    () => calculateCategorySpending(monthTransactions),
    [monthTransactions]
  );

  const unnecessaryTotal = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === "expense" && t.necessity_tag === "unnecessary")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const necessaryTotal = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === "expense" && t.necessity_tag === "necessary")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const pendingTotal = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === "expense" && t.necessity_tag === "pending")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const insights = useMemo(
    () => generateInsights(summary, previousSummary, unnecessaryTotal, necessaryTotal),
    [summary, previousSummary, unnecessaryTotal, necessaryTotal]
  );

  const last6Months = useMemo<MonthSummary[]>(
    () =>
      last12
        .slice(0, 6)
        .reverse()
        .map((m) => calculateMonthSummary(allTransactions, m.month, m.year)),
    [allTransactions, last12]
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-orbital-white">Relatorios</h1>
          <p className="text-sm text-orbital-muted mt-1">
            Analise detalhada das suas financas
          </p>
        </div>
        <Button
          onClick={() =>
            exportFinanceWorkbook({
              monthLabel: selectedMonthData.label,
              summary,
              previousSummary,
              transactions: monthTransactions,
              spending,
            })
          }
          disabled={isLoading}
          className="gap-2 bg-orbital-gold text-orbital-deep hover:bg-orbital-gold-dark font-semibold"
        >
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </motion.div>

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
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Receitas",
                value: summary.totalIncome,
                icon: TrendingUp,
                color: "text-success",
              },
              {
                label: "Despesas",
                value: summary.totalExpense,
                icon: TrendingDown,
                color: "text-destructive",
              },
              {
                label: "Saldo",
                value: summary.balance,
                icon: Wallet,
                color: summary.balance >= 0 ? "text-orbital-gold" : "text-destructive",
              },
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
                <p className={cn("text-2xl font-bold", card.color)}>
                  {formatCurrency(card.value)}
                </p>
                {previousSummary && (
                  <p className="text-xs text-orbital-muted mt-1">
                    {card.label === "Receitas" &&
                      previousSummary.totalIncome > 0 &&
                      `vs ${formatCurrency(previousSummary.totalIncome)} mes ant.`}
                    {card.label === "Despesas" &&
                      previousSummary.totalExpense > 0 &&
                      `vs ${formatCurrency(previousSummary.totalExpense)} mes ant.`}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Visao geral</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-orbital-white mb-4">
                  <BarChart3 className="h-4 w-4 inline mr-2 text-orbital-gold" />
                  Evolucao 6 meses
                </h3>
                <MonthlyBarChart data={last6Months} />
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-orbital-white mb-4">
                  Gastos por categoria
                </h3>
                {spending.length === 0 ? (
                  <p className="text-sm text-orbital-muted text-center py-8">
                    Sem despesas neste periodo.
                  </p>
                ) : (
                  <>
                    <CategoryPieChart data={spending} />
                    <div className="mt-4 space-y-2">
                      {spending.slice(0, 5).map((s) => (
                        <div key={s.categoryId} className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.categoryColor }}
                          />
                          <span className="flex-1 text-sm text-orbital-white">
                            {s.categoryName}
                          </span>
                          <span className="text-sm font-medium text-orbital-muted">
                            {formatCurrency(s.total)}
                          </span>
                          <span className="text-xs text-orbital-muted w-10 text-right">
                            {formatPercent(s.percentage)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              <div className="space-y-3">
                {insights.map((insight) => (
                  <InsightCard key={insight} text={insight} />
                ))}
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-orbital-white mb-3">
                    Necessario vs Desnecessario
                  </h3>
                  {summary.totalExpense > 0 ? (
                    <>
                      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-3">
                        <div>
                          <p className="text-xs text-orbital-muted">Necessario</p>
                          <p className="text-lg font-bold text-success">
                            {formatCurrency(necessaryTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-orbital-muted">Desnecessario</p>
                          <p className="text-lg font-bold text-destructive">
                            {formatCurrency(unnecessaryTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-orbital-muted">Pendente</p>
                          <p className="text-lg font-bold text-orbital-muted">
                            {formatCurrency(pendingTotal)}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-orbital-deep overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{
                            width: `${(necessaryTotal / summary.totalExpense) * 100}%`,
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

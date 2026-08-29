"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { differenceInCalendarMonths } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Coins,
  Landmark,
  LineChart,
  Pencil,
  PiggyBank,
  Plus,
  SlidersHorizontal,
  Target,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  useDeleteInvestment,
  useDeleteInvestmentGoal,
  useInvestmentGoals,
  useInvestments,
} from "@/hooks/useInvestments";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRIORITY_LABEL } from "@/lib/goals";
import type { InvestmentGoalWithRelations, InvestmentWithAllocations } from "@/types";

const GoalFormDialog = dynamic(() =>
  import("@/components/goals/goal-dialogs").then((m) => m.GoalFormDialog)
);
const InvestmentFormDialog = dynamic(() =>
  import("@/components/goals/goal-dialogs").then((m) => m.InvestmentFormDialog)
);
const ContributionDialog = dynamic(() =>
  import("@/components/goals/goal-dialogs").then((m) => m.ContributionDialog)
);
const AllocationDialog = dynamic(() =>
  import("@/components/goals/goal-dialogs").then((m) => m.AllocationDialog)
);

function goalCurrentAmount(goal: InvestmentGoalWithRelations) {
  return goal.investments.reduce((sum, investment) => {
    const allocation = goal.allocations.find((item) => item.investment_id === investment.id);
    const percentage = allocation ? Number(allocation.percentage) : investment.goal_id === goal.id ? 100 : 0;
    return sum + Number(investment.amount) * (percentage / 100);
  }, 0);
}

function investmentGoalAmount(investment: InvestmentWithAllocations, goalId: string) {
  const allocation = investment.allocations?.find((item) => item.goal_id === goalId);
  const percentage = allocation ? Number(allocation.percentage) : investment.goal_id === goalId ? 100 : 0;
  return Number(investment.amount) * (percentage / 100);
}

function goalProgress(goal: InvestmentGoalWithRelations) {
  return Math.min((goalCurrentAmount(goal) / Number(goal.target_amount)) * 100, 100);
}

function monthlyNeed(goal: InvestmentGoalWithRelations) {
  if (!goal.deadline) return null;
  const remaining = Math.max(Number(goal.target_amount) - goalCurrentAmount(goal), 0);
  if (remaining === 0) return 0;
  const months = Math.max(differenceInCalendarMonths(new Date(goal.deadline), new Date()) + 1, 1);
  return remaining / months;
}

function goalStatus(goal: InvestmentGoalWithRelations) {
  const progress = goalProgress(goal);
  if (progress >= 100) return { label: "Concluida", className: "text-success bg-success/10" };
  if (!goal.deadline) return { label: "Sem prazo", className: "text-orbital-muted bg-orbital-muted/10" };

  const needed = monthlyNeed(goal) ?? 0;
  const current = goalCurrentAmount(goal);
  const monthsElapsed = Math.max(differenceInCalendarMonths(new Date(), new Date(goal.created_at)) + 1, 1);
  const monthlyPace = current / monthsElapsed;

  if (new Date(goal.deadline) < new Date()) {
    return { label: "Atrasada", className: "text-destructive bg-destructive/10" };
  }

  if (monthlyPace >= needed) return { label: "No ritmo", className: "text-success bg-success/10" };
  return { label: "Atencao", className: "text-warning bg-warning/10" };
}

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Target;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-orbital-muted">{title}</p>
          <p className="mt-1 text-xl font-semibold text-orbital-white">{value}</p>
          <p className="mt-1 text-xs text-orbital-muted">{detail}</p>
        </div>
        <div className="rounded-lg bg-orbital-gold/10 p-2 text-orbital-gold">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color = "#D4AF7A" }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-orbital-deep">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function GoalsPage() {
  const { data: goals = [], isLoading: loadingGoals } = useInvestmentGoals();
  const { data: investments = [], isLoading: loadingInvestments } = useInvestments();
  const deleteGoal = useDeleteInvestmentGoal();
  const deleteInvestment = useDeleteInvestment();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentWithAllocations | null>(null);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [allocationInvestmentId, setAllocationInvestmentId] = useState<string | undefined>();

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? goals[0] ?? null;
  const isLoading = loadingGoals || loadingInvestments;

  const totals = useMemo(() => {
    const totalInvested = investments.reduce((sum, investment) => sum + Number(investment.amount), 0);
    const targetTotal = goals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
    const allocated = goals.reduce((sum, goal) => sum + goalCurrentAmount(goal), 0);
    return {
      totalInvested,
      targetTotal,
      allocated,
      remaining: Math.max(targetTotal - allocated, 0),
      progress: targetTotal > 0 ? Math.min((allocated / targetTotal) * 100, 100) : 0,
    };
  }, [goals, investments]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-orbital-gold">
            <Target className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">M&I</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-orbital-white">Metas & Investimentos</h1>
          <p className="mt-1 text-sm text-orbital-muted">Planeje objetivos, vincule investimentos e acompanhe aportes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <WalletCards className="h-4 w-4" /> Investimento
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  setEditingInvestment(null);
                  setInvestmentDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Novo investimento
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setContributionDialogOpen(true)}
                disabled={investments.length === 0}
              >
                <ArrowUpRight className="h-4 w-4" /> Aporte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setGoalDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova meta
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Total investido" value={formatCurrency(totals.totalInvested)} detail={`${investments.length} investimentos registrados`} icon={PiggyBank} />
            <SummaryCard title="Metas abertas" value={String(goals.length)} detail={formatCurrency(totals.targetTotal)} icon={Target} />
            <SummaryCard title="Guardado nas metas" value={formatCurrency(totals.allocated)} detail={`${totals.progress.toFixed(0)}% do objetivo geral`} icon={LineChart} />
            <SummaryCard title="Falta guardar" value={formatCurrency(totals.remaining)} detail="Soma do restante das metas" icon={CircleDollarSign} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
            <section className="glass-card rounded-xl p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-orbital-white">Metas</h2>
                <span className="text-xs text-orbital-muted">{goals.length}</span>
              </div>
              {goals.length === 0 ? (
                <p className="rounded-lg bg-orbital-deep/50 p-3 text-sm text-orbital-muted">
                  Crie uma meta para começar.
                </p>
              ) : (
                <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                  {goals.map((goal) => {
                    const current = goalCurrentAmount(goal);
                    const progress = goalProgress(goal);
                    return (
                      <button
                        key={goal.id}
                        onClick={() => setSelectedGoalId(goal.id)}
                        className={cn(
                          "w-full rounded-lg border border-orbital-gold/10 bg-orbital-deep/35 p-3 text-left transition-colors hover:border-orbital-gold/30",
                          selectedGoal?.id === goal.id && "border-orbital-gold/45 bg-orbital-gold/[0.07]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: goal.color }} />
                          <p className="min-w-0 flex-1 truncate text-sm font-medium text-orbital-white">{goal.name}</p>
                        </div>
                        <div className="mt-3">
                          <ProgressBar value={progress} color={goal.color} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-orbital-muted">{progress.toFixed(0)}%</span>
                          <span className="text-orbital-white">{formatCurrency(current)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <div>
          {selectedGoal ? (
            <section className="glass-card rounded-xl p-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedGoal.color }} />
                        <h2 className="truncate text-lg font-semibold text-orbital-white">{selectedGoal.name}</h2>
                      </div>
                      <p className="mt-1 text-sm text-orbital-muted">{selectedGoal.description || "Sem descricao"}</p>
                    </div>
                    <button
                      onClick={() => deleteGoal.mutate(selectedGoal.id)}
                      disabled={deleteGoal.isPending}
                      className="rounded-lg p-2 text-orbital-muted transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      aria-label="Excluir meta"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="rounded-xl bg-orbital-deep/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs text-orbital-muted">Guardado</p>
                        <p className="text-2xl font-semibold text-orbital-white">{formatCurrency(goalCurrentAmount(selectedGoal))}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs text-orbital-muted">Meta</p>
                        <p className="text-base font-semibold text-orbital-gold">{formatCurrency(selectedGoal.target_amount)}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs text-orbital-muted">Falta</p>
                        <p className="text-base font-semibold text-orbital-white">{formatCurrency(Math.max(Number(selectedGoal.target_amount) - goalCurrentAmount(selectedGoal), 0))}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={goalProgress(selectedGoal)} color={selectedGoal.color} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-orbital-gold/10 bg-orbital-deep/40 p-3">
                      <CalendarDays className="mb-2 h-4 w-4 text-orbital-gold" />
                      <p className="text-xs text-orbital-muted">Prazo</p>
                      <p className="text-sm font-medium text-orbital-white">{selectedGoal.deadline ? formatDate(selectedGoal.deadline) : "Opcional"}</p>
                    </div>
                    <div className="rounded-lg border border-orbital-gold/10 bg-orbital-deep/40 p-3">
                      <Coins className="mb-2 h-4 w-4 text-orbital-gold" />
                      <p className="text-xs text-orbital-muted">Guardar por mes</p>
                      <p className="text-sm font-medium text-orbital-white">{monthlyNeed(selectedGoal) === null ? "Sem prazo" : formatCurrency(monthlyNeed(selectedGoal) ?? 0)}</p>
                    </div>
                    <div className="rounded-lg border border-orbital-gold/10 bg-orbital-deep/40 p-3">
                      <LineChart className="mb-2 h-4 w-4 text-orbital-gold" />
                      <p className="text-xs text-orbital-muted">Progresso</p>
                      <p className="text-sm font-medium text-orbital-white">{goalProgress(selectedGoal).toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setContributionDialogOpen(true)} disabled={selectedGoal.investments.length === 0}>
                      Aporte
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAllocationInvestmentId(undefined);
                        setAllocationDialogOpen(true);
                      }}
                      disabled={investments.length === 0}
                    >
                      Vincular investimento
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-orbital-white">Investimentos vinculados</h3>
                    {selectedGoal.investments.length === 0 ? (
                      <p className="rounded-lg bg-orbital-deep/50 p-3 text-sm text-orbital-muted">Nenhum investimento vinculado ainda.</p>
                    ) : (
                      selectedGoal.investments.slice(0, 4).map((investment) => (
                        <div key={investment.id} className="flex items-center justify-between gap-3 rounded-lg bg-orbital-deep/50 p-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Landmark className="h-4 w-4 text-orbital-gold" />
                              <p className="truncate text-sm font-medium text-orbital-white">{investment.name}</p>
                            </div>
                            <p className="mt-0.5 text-xs text-orbital-muted">{investment.institution} · {investment.type}</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-orbital-white">{formatCurrency(investmentGoalAmount(investment as InvestmentWithAllocations, selectedGoal.id))}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-orbital-white">Ultimos aportes</h3>
                    {selectedGoal.contributions.length === 0 ? (
                      <p className="rounded-lg bg-orbital-deep/50 p-3 text-sm text-orbital-muted">Nenhum aporte registrado.</p>
                    ) : (
                      selectedGoal.contributions.slice(0, 4).map((contribution) => (
                        <div key={contribution.id} className="flex items-center justify-between rounded-lg bg-orbital-deep/50 p-3">
                          <div>
                            <p className="text-sm font-medium text-orbital-white">{formatCurrency(contribution.amount)}</p>
                            <p className="text-xs text-orbital-muted">{formatDate(contribution.contribution_date)}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-success" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="glass-card rounded-xl p-5 text-sm text-orbital-muted">
              Selecione ou crie uma meta para ver detalhes.
            </section>
          )}
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-orbital-white">Investimentos</h2>
              <span className="text-xs text-orbital-muted">{investments.length} registrados</span>
            </div>
            {investments.length === 0 ? (
              <div className="glass-card rounded-xl p-5 text-sm text-orbital-muted">
                Nenhum investimento criado ainda. Cadastre um investimento e depois vincule-o a uma ou mais metas.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {investments.map((investment) => {
                  const allocated = (investment.allocations ?? []).reduce((sum, allocation) => sum + Number(allocation.percentage), 0);
                  return (
                    <div key={investment.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-orbital-gold" />
                            <h3 className="truncate text-sm font-semibold text-orbital-white">{investment.name}</h3>
                          </div>
                          <p className="mt-1 text-xs text-orbital-muted">{investment.institution} · {investment.type}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingInvestment(investment);
                              setInvestmentDialogOpen(true);
                            }}
                            className="rounded-lg p-2 text-orbital-muted transition-colors hover:bg-orbital-gold/10 hover:text-orbital-gold"
                            aria-label="Editar investimento"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setAllocationInvestmentId(investment.id);
                              setAllocationDialogOpen(true);
                            }}
                            className="rounded-lg p-2 text-orbital-muted transition-colors hover:bg-orbital-gold/10 hover:text-orbital-gold"
                            aria-label="Vincular investimento"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteInvestment.mutate(investment.id)}
                            disabled={deleteInvestment.isPending}
                            className="rounded-lg p-2 text-orbital-muted transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                            aria-label="Excluir investimento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-orbital-muted">Valor atual</p>
                          <p className="text-lg font-semibold text-orbital-white">{formatCurrency(investment.amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-orbital-muted">Alocado</p>
                          <p className="text-sm font-semibold text-orbital-gold">{allocated.toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-orbital-deep/55 p-2">
                          <p className="text-[11px] text-orbital-muted">Instituicao</p>
                          <p className="mt-1 truncate text-sm font-semibold text-orbital-white">{investment.institution}</p>
                        </div>
                        <div className="rounded-lg bg-orbital-deep/55 p-2">
                          <p className="text-[11px] text-orbital-muted">Tipo</p>
                          <p className="mt-1 truncate text-sm font-semibold text-orbital-white">{investment.type}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="hidden">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-orbital-white">Metas</h2>
                <span className="text-xs text-orbital-muted">{goals.length} ativas</span>
              </div>

              {goals.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Target className="mx-auto h-10 w-10 text-orbital-gold" />
                  <h3 className="mt-3 text-base font-semibold text-orbital-white">Crie sua primeira meta</h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-orbital-muted">
                    Defina um objetivo, vincule investimentos e acompanhe quanto falta para chegar la.
                  </p>
                  <Button onClick={() => setGoalDialogOpen(true)} className="mt-4">Criar meta</Button>
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {goals.map((goal, index) => {
                    const current = goalCurrentAmount(goal);
                    const progress = goalProgress(goal);
                    const status = goalStatus(goal);
                    return (
                      <motion.button
                        key={goal.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => setSelectedGoalId(goal.id)}
                        className={cn(
                          "glass-card rounded-xl p-4 text-left transition-colors duration-100 hover:border-orbital-gold/30",
                          selectedGoal?.id === goal.id && "border-orbital-gold/45 bg-orbital-gold/[0.04]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: goal.color }} />
                              <h3 className="truncate text-sm font-semibold text-orbital-white">{goal.name}</h3>
                            </div>
                            <p className="mt-1 text-xs text-orbital-muted">{goal.category} · prioridade {PRIORITY_LABEL[goal.priority]}</p>
                          </div>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs", status.className)}>{status.label}</span>
                        </div>
                        <div className="mt-4 space-y-2">
                          <ProgressBar value={progress} color={goal.color} />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-orbital-white">{formatCurrency(current)}</span>
                            <span className="text-orbital-muted">{formatCurrency(goal.target_amount)}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-orbital-muted">
                          <span>{progress.toFixed(0)}% completo</span>
                          <span>{goal.deadline ? formatDate(goal.deadline) : "sem prazo"}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="hidden">
              <h2 className="text-lg font-semibold text-orbital-white">Detalhe da meta</h2>
              {selectedGoal ? (
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-orbital-white">{selectedGoal.name}</h3>
                      <p className="mt-1 text-sm text-orbital-muted">{selectedGoal.description || "Sem descricao"}</p>
                    </div>
                    <button
                      onClick={() => deleteGoal.mutate(selectedGoal.id)}
                      disabled={deleteGoal.isPending}
                      className="rounded-lg p-2 text-orbital-muted transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      aria-label="Excluir meta"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-5 rounded-xl bg-orbital-deep/70 p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-orbital-muted">Guardado</p>
                        <p className="text-2xl font-semibold text-orbital-white">{formatCurrency(goalCurrentAmount(selectedGoal))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-orbital-muted">Falta</p>
                        <p className="text-base font-semibold text-orbital-gold">{formatCurrency(Math.max(Number(selectedGoal.target_amount) - goalCurrentAmount(selectedGoal), 0))}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={goalProgress(selectedGoal)} color={selectedGoal.color} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-orbital-gold/10 bg-orbital-deep/40 p-3">
                      <CalendarDays className="mb-2 h-4 w-4 text-orbital-gold" />
                      <p className="text-xs text-orbital-muted">Prazo</p>
                      <p className="text-sm font-medium text-orbital-white">{selectedGoal.deadline ? formatDate(selectedGoal.deadline) : "Opcional"}</p>
                    </div>
                    <div className="rounded-lg border border-orbital-gold/10 bg-orbital-deep/40 p-3">
                      <Coins className="mb-2 h-4 w-4 text-orbital-gold" />
                      <p className="text-xs text-orbital-muted">Guardar por mes</p>
                      <p className="text-sm font-medium text-orbital-white">{monthlyNeed(selectedGoal) === null ? "Sem prazo" : formatCurrency(monthlyNeed(selectedGoal) ?? 0)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button className="flex-1" onClick={() => setContributionDialogOpen(true)} disabled={selectedGoal.investments.length === 0}>
                      Aporte
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setAllocationInvestmentId(undefined);
                        setAllocationDialogOpen(true);
                      }}
                      disabled={investments.length === 0}
                    >
                      Vincular investimento
                    </Button>
                  </div>

                  <div className="mt-5 space-y-3">
                    <h4 className="text-sm font-semibold text-orbital-white">Investimentos vinculados</h4>
                    {selectedGoal.investments.length === 0 ? (
                      <p className="rounded-lg bg-orbital-deep/50 p-3 text-sm text-orbital-muted">Nenhum investimento vinculado ainda.</p>
                    ) : (
                      selectedGoal.investments.map((investment) => (
                        <div key={investment.id} className="flex items-center justify-between gap-3 rounded-lg bg-orbital-deep/50 p-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Landmark className="h-4 w-4 text-orbital-gold" />
                              <p className="truncate text-sm font-medium text-orbital-white">{investment.name}</p>
                            </div>
                            <p className="mt-0.5 text-xs text-orbital-muted">{investment.institution} · {investment.type}</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-orbital-white">{formatCurrency(investmentGoalAmount(investment as InvestmentWithAllocations, selectedGoal.id))}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-5 space-y-3">
                    <h4 className="text-sm font-semibold text-orbital-white">Ultimos aportes</h4>
                    {selectedGoal.contributions.length === 0 ? (
                      <p className="rounded-lg bg-orbital-deep/50 p-3 text-sm text-orbital-muted">Nenhum aporte registrado.</p>
                    ) : (
                      selectedGoal.contributions.slice(0, 5).map((contribution) => (
                        <div key={contribution.id} className="flex items-center justify-between rounded-lg bg-orbital-deep/50 p-3">
                          <div>
                            <p className="text-sm font-medium text-orbital-white">{formatCurrency(contribution.amount)}</p>
                            <p className="text-xs text-orbital-muted">{formatDate(contribution.contribution_date)}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-success" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-xl p-5 text-sm text-orbital-muted">
                  Selecione ou crie uma meta para ver detalhes.
                </div>
              )}
            </aside>
          </div>
        </>
      )}

      <GoalFormDialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} />
      <InvestmentFormDialog
        open={investmentDialogOpen}
        onClose={() => {
          setInvestmentDialogOpen(false);
          setEditingInvestment(null);
        }}
        editingInvestment={editingInvestment}
      />
      <AllocationDialog
        open={allocationDialogOpen}
        onClose={() => setAllocationDialogOpen(false)}
        investments={investments}
        goals={goals}
        defaultGoalId={selectedGoal?.id}
        defaultInvestmentId={allocationInvestmentId}
      />
      <ContributionDialog
        open={contributionDialogOpen}
        onClose={() => setContributionDialogOpen(false)}
        investments={investments}
        defaultGoalId={selectedGoal?.id}
      />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { differenceInCalendarMonths, format } from "date-fns";
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
  useCreateContribution,
  useCreateInvestment,
  useCreateInvestmentGoal,
  useDeleteInvestment,
  useDeleteInvestmentGoal,
  useInvestmentGoals,
  useInvestments,
  useUpdateInvestment,
  useUpsertInvestmentAllocations,
} from "@/hooks/useInvestments";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GoalPriority, InvestmentGoalWithRelations, InvestmentWithAllocations } from "@/types";

const GOAL_COLORS = ["#D4AF7A", "#22C55E", "#3B82F6", "#8B5CF6", "#14B8A6", "#F97316"];

const GOAL_CATEGORIES = [
  "Reserva",
  "Carro",
  "Imovel",
  "Viagem",
  "Educacao",
  "Aposentadoria",
  "Outro",
];

const INVESTMENT_TYPES = [
  "Caixinha",
  "CDB",
  "Tesouro Direto",
  "FII",
  "Acoes",
  "Cripto",
  "Poupanca",
  "Outro",
];

const PRIORITY_LABEL: Record<GoalPriority, string> = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
};

function parseMoney(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
}

function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return `R$${(Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMoneyFormValue(value: number | null | undefined) {
  if (!value) return "";
  return formatMoneyInput(Number(value).toFixed(2));
}

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

function GoalFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createGoal = useCreateInvestmentGoal();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Carro");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseMoney(targetAmount);
    if (!name.trim() || amount <= 0) return;

    await createGoal.mutateAsync({
      name: name.trim(),
      description: description.trim() || null,
      category,
      priority,
      target_amount: amount,
      deadline: deadline || null,
      color,
    });
    setName("");
    setDescription("");
    setTargetAmount("");
    setDeadline("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Comprar carro" />
            </div>
            <div className="space-y-1.5">
              <Label>Valor da meta</Label>
              <Input
                value={targetAmount}
                inputMode="numeric"
                onChange={(e) => setTargetAmount(formatMoneyInput(e.target.value))}
                placeholder="R$20.000,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prazo opcional</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as GoalPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descricao</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes da meta" />
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {GOAL_COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={cn("h-7 w-7 rounded-full border-2", color === item ? "border-orbital-white" : "border-transparent")}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
          </div>

          <Button className="w-full" disabled={createGoal.isPending || !name.trim() || parseMoney(targetAmount) <= 0}>
            {createGoal.isPending ? <LoadingSpinner size={16} /> : "Criar meta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvestmentFormDialog({
  open,
  onClose,
  editingInvestment,
}: {
  open: boolean;
  onClose: () => void;
  editingInvestment?: InvestmentWithAllocations | null;
}) {
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment();
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [type, setType] = useState("Caixinha");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const isEditing = !!editingInvestment;
  const isBusy = createInvestment.isPending || updateInvestment.isPending;

  useEffect(() => {
    if (!open) return;
    setName(editingInvestment?.name ?? "");
    setInstitution(editingInvestment?.institution ?? "");
    setType(editingInvestment?.type ?? "Caixinha");
    setAmount(formatMoneyFormValue(editingInvestment?.amount));
    setNotes(editingInvestment?.notes ?? "");
  }, [editingInvestment, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentAmount = parseMoney(amount);
    if (!name.trim() || !institution.trim()) return;

    const payload = {
      name: name.trim(),
      institution: institution.trim(),
      type,
      amount: currentAmount,
      notes: notes.trim() || null,
    };

    if (editingInvestment) {
      await updateInvestment.mutateAsync({
        id: editingInvestment.id,
        ...payload,
      });
    } else {
      await createInvestment.mutateAsync({
        ...payload,
        goal_id: null,
      });
    }
    setName("");
    setInstitution("");
    setAmount("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar investimento" : "Novo investimento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Caixinha Nubank" />
            </div>
            <div className="space-y-1.5">
              <Label>Instituicao</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Nubank" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVESTMENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor atual</Label>
              <Input value={amount} inputMode="numeric" onChange={(e) => setAmount(formatMoneyInput(e.target.value))} placeholder="R$11.000,00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Liquidez, taxa, observacoes..." />
          </div>
          <Button className="w-full" disabled={isBusy || !name.trim() || !institution.trim() || parseMoney(amount) <= 0}>
            {isBusy ? <LoadingSpinner size={16} /> : isEditing ? "Salvar investimento" : "Registrar investimento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContributionDialog({
  open,
  onClose,
  investments,
  defaultGoalId,
}: {
  open: boolean;
  onClose: () => void;
  investments: InvestmentWithAllocations[];
  defaultGoalId?: string;
}) {
  const createContribution = useCreateContribution();
  const availableInvestments = defaultGoalId
    ? investments.filter((investment) =>
        investment.goal_id === defaultGoalId ||
        investment.allocations?.some((allocation) => allocation.goal_id === defaultGoalId)
      )
    : investments;
  const [investmentId, setInvestmentId] = useState(availableInvestments[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const selectedInvestment = investments.find((investment) => investment.id === investmentId);

  useEffect(() => {
    if (open) setInvestmentId(availableInvestments[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultGoalId, investments.length, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const contributionAmount = parseMoney(amount);
    if (!investmentId || contributionAmount <= 0) return;

    await createContribution.mutateAsync({
      investment_id: investmentId,
      goal_id: defaultGoalId ?? selectedInvestment?.goal_id ?? null,
      amount: contributionAmount,
      contribution_date: date,
      notes: notes.trim() || null,
    });
    setAmount("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar aporte</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Investimento</Label>
            <Select value={investmentId} onValueChange={setInvestmentId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {availableInvestments.map((investment) => (
                  <SelectItem key={investment.id} value={investment.id}>
                    {investment.name} - {investment.institution}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input value={amount} inputMode="numeric" onChange={(e) => setAmount(formatMoneyInput(e.target.value))} placeholder="R$500,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Origem do aporte" />
          </div>
          <Button className="w-full" disabled={createContribution.isPending || !investmentId || parseMoney(amount) <= 0}>
            {createContribution.isPending ? <LoadingSpinner size={16} /> : "Salvar aporte"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AllocationDialog({
  open,
  onClose,
  investments,
  goals,
  defaultGoalId,
  defaultInvestmentId,
}: {
  open: boolean;
  onClose: () => void;
  investments: InvestmentWithAllocations[];
  goals: InvestmentGoalWithRelations[];
  defaultGoalId?: string;
  defaultInvestmentId?: string;
}) {
  const upsertAllocations = useUpsertInvestmentAllocations();
  const [investmentId, setInvestmentId] = useState("");
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const selectedInvestment = investments.find((investment) => investment.id === investmentId);
  const total = Object.values(allocations).reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    if (!open) return;
    const investment = investments.find((item) => item.id === defaultInvestmentId) ?? investments[0];
    setInvestmentId(investment?.id ?? "");
    if (!investment) {
      setAllocations({});
      return;
    }
    const current = Object.fromEntries(
      (investment.allocations ?? []).map((allocation) => [
        allocation.goal_id,
        Number(allocation.percentage),
      ])
    );
    setAllocations(
      Object.keys(current).length > 0
        ? current
        : defaultGoalId
          ? { [defaultGoalId]: 100 }
          : {}
    );
  }, [defaultGoalId, defaultInvestmentId, investments, open]);

  const handleInvestmentChange = (id: string) => {
    setInvestmentId(id);
    const investment = investments.find((item) => item.id === id);
    const current = Object.fromEntries(
      (investment?.allocations ?? []).map((allocation) => [
        allocation.goal_id,
        Number(allocation.percentage),
      ])
    );
    setAllocations(
      Object.keys(current).length > 0
        ? current
        : defaultGoalId
          ? { [defaultGoalId]: 100 }
          : {}
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!investmentId || total <= 0 || total > 100) return;
    await upsertAllocations.mutateAsync({
      investmentId,
      allocations: Object.entries(allocations)
        .filter(([, percentage]) => percentage > 0)
        .map(([goalId, percentage]) => ({ goal_id: goalId, percentage })),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vincular investimento a metas</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Investimento criado</Label>
            <Select value={investmentId} onValueChange={handleInvestmentChange}>
              <SelectTrigger><SelectValue placeholder="Selecione um investimento" /></SelectTrigger>
              <SelectContent>
                {investments.map((investment) => (
                  <SelectItem key={investment.id} value={investment.id}>
                    {investment.name} - {formatCurrency(investment.amount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInvestment && (
            <div className="rounded-2xl border border-orbital-gold/15 bg-orbital-deep/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-orbital-white">{selectedInvestment.name}</p>
                  <p className="text-xs text-orbital-muted">{selectedInvestment.institution} · {selectedInvestment.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-orbital-muted">Disponivel</p>
                  <p className="text-sm font-semibold text-orbital-gold">{Math.max(100 - total, 0).toFixed(0)}%</p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {goals.map((goal) => {
                  const value = allocations[goal.id] ?? 0;
                  return (
                    <div key={goal.id} className="rounded-xl border border-orbital-gold/10 bg-orbital-surface/55 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: goal.color }} />
                            <p className="truncate text-sm font-medium text-orbital-white">{goal.name}</p>
                          </div>
                          <p className="mt-0.5 text-xs text-orbital-muted">
                            {formatCurrency(Number(selectedInvestment.amount) * (value / 100))}
                          </p>
                        </div>
                        <span className="rounded-full bg-orbital-gold/10 px-3 py-1 text-sm font-semibold text-orbital-gold">
                          {value}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={value}
                        onChange={(event) =>
                          setAllocations((current) => ({
                            ...current,
                            [goal.id]: Number(event.target.value),
                          }))
                        }
                        className="h-2 w-full cursor-pointer accent-[#D4AF7A]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            total > 100 ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-orbital-gold/15 bg-orbital-gold/5 text-orbital-white"
          )}>
            Total alocado: <strong>{total.toFixed(0)}%</strong>. {total > 100 ? "Reduza a soma para no maximo 100%." : "O restante permanece livre."}
          </div>

          <Button className="w-full gap-2" disabled={upsertAllocations.isPending || !investmentId || total <= 0 || total > 100}>
            {upsertAllocations.isPending ? <LoadingSpinner size={16} /> : <SlidersHorizontal className="h-4 w-4" />}
            Salvar alocacao
          </Button>
        </form>
      </DialogContent>
    </Dialog>
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

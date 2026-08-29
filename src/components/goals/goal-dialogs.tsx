"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  useCreateContribution,
  useCreateInvestment,
  useCreateInvestmentGoal,
  useUpdateInvestment,
  useUpsertInvestmentAllocations,
} from "@/hooks/useInvestments";
import { formatCurrency } from "@/lib/formatters";
import {
  GOAL_CATEGORIES,
  GOAL_COLORS,
  INVESTMENT_TYPES,
  formatMoneyFormValue,
  formatMoneyInput,
  parseMoney,
} from "@/lib/goals";
import { cn } from "@/lib/utils";
import type {
  GoalPriority,
  InvestmentGoalWithRelations,
  InvestmentWithAllocations,
} from "@/types";

export function GoalFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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
              <DateInput value={deadline} onChange={setDeadline} />
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

export function InvestmentFormDialog({
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

export function ContributionDialog({
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
              <DateInput value={date} onChange={setDate} />
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

export function AllocationDialog({
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

"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CreditCard,
  Banknote,
  Zap,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
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
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useCategories } from "@/hooks/useCategories";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/useTransactions";
import type { Transaction, TransactionType, PaymentMethod, RecurrenceType, NecessityTag } from "@/types";
import { RECURRENCE_OPTIONS } from "@/constants/categories";
import { cn } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.string().min(1, "Informe o valor"),
  description: z.string().min(1, "Informe a descrição"),
  category_id: z.string().optional().nullable(),
  payment_method: z.enum(["card", "cash", "pix", "transfer"]),
  date: z.string().min(1, "Informe a data"),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]),
  necessity_tag: z.enum(["necessary", "unnecessary", "pending"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const PAYMENT_OPTIONS = [
  { value: "card", label: "Cartão", icon: CreditCard, color: "#3B82F6" },
  { value: "cash", label: "Dinheiro", icon: Banknote, color: "#22C55E" },
  { value: "pix", label: "Pix", icon: Zap, color: "#14B8A6" },
  { value: "transfer", label: "Transferência", icon: ArrowLeftRight, color: "#8B5CF6" },
] as const;

const NECESSITY_OPTIONS = [
  { value: "necessary", label: "Necessário" },
  { value: "unnecessary", label: "Desnecessário" },
  { value: "pending", label: "Pendente" },
] as const;

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const amount = Number(digits) / 100;
  return `R$${amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCurrencyAmount(value: number) {
  return `R$${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseCurrencyValue(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
}

interface TransactionFormProps {
  defaultType?: TransactionType;
  editingTransaction?: Transaction | null;
  onSuccess?: () => void;
}

export function TransactionForm({ defaultType = "expense", editingTransaction, onSuccess }: TransactionFormProps) {
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const isEditing = !!editingTransaction;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: editingTransaction?.type ?? defaultType,
      amount: editingTransaction ? formatCurrencyAmount(editingTransaction.amount) : "",
      description: editingTransaction?.description ?? "",
      category_id: editingTransaction?.category_id ?? null,
      payment_method: editingTransaction?.payment_method ?? "pix",
      date: editingTransaction?.date ?? format(new Date(), "yyyy-MM-dd"),
      recurrence: editingTransaction?.recurrence ?? "none",
      necessity_tag: editingTransaction?.necessity_tag ?? "pending",
      notes: editingTransaction?.notes ?? "",
    },
  });

  const currentType = watch("type");
  const filteredCategories = categories.filter(
    (c) => c.type === currentType || c.type === "both"
  );

  useEffect(() => {
    if (!editingTransaction) {
      reset({
        type: defaultType,
        amount: "",
        description: "",
        category_id: null,
        payment_method: "pix",
        date: format(new Date(), "yyyy-MM-dd"),
        recurrence: "none",
        necessity_tag: "pending",
        notes: "",
      });
    }
  }, [defaultType, editingTransaction, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      type: values.type as TransactionType,
      amount: parseCurrencyValue(values.amount),
      description: values.description,
      category_id: values.category_id ?? null,
      payment_method: values.payment_method as PaymentMethod,
      date: values.date,
      recurrence: values.recurrence as RecurrenceType,
      necessity_tag: values.type === "income" ? "pending" : (values.necessity_tag as NecessityTag),
      notes: values.notes || null,
      is_scheduled: false,
      tags: null,
      recurrence_end_date: null,
    };

    if (isEditing && editingTransaction) {
      await updateMutation.mutateAsync({ id: editingTransaction.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onSuccess?.();
  };

  const isBusy = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-lg overflow-hidden border border-orbital-gold/20">
        {(["expense", "income"] as const).map((t) => (
          <label
            key={t}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium cursor-pointer transition-colors",
              currentType === t
                ? t === "expense"
                  ? "bg-destructive/20 text-destructive"
                  : "bg-success/20 text-success"
                : "text-orbital-muted hover:text-orbital-white hover:bg-orbital-surface-hover"
            )}
          >
            <input type="radio" {...register("type")} value={t} className="sr-only" />
            {t === "expense" ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            {t === "expense" ? "Gasto" : "Receita"}
          </label>
        ))}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <Input
              id="amount"
              placeholder="R$0,00"
              inputMode="numeric"
              value={field.value}
              onChange={(event) => field.onChange(formatCurrencyInput(event.target.value))}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" placeholder="Ex: Almoço, Salário..." {...register("description")} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="date">Data</Label>
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DateInput
              id="date"
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              className="bg-orbital-surface text-orbital-white border-orbital-gold/20 hover:border-orbital-gold/35"
            />
          )}
        />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      {/* Payment Method */}
      <div className="space-y-1.5">
        <Label>Forma de pagamento</Label>
        <Controller
          control={control}
          name="payment_method"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      field.value === opt.value
                        ? "border-orbital-gold/40 bg-orbital-gold/10 text-orbital-gold"
                        : "border-orbital-gold/10 bg-orbital-surface text-orbital-muted hover:text-orbital-white hover:border-orbital-gold/20"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" style={{ color: field.value === opt.value ? "#D4AF7A" : opt.color }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Recurrence */}
      <div className="space-y-1.5">
        <Label>Recorrência</Label>
        <Controller
          control={control}
          name="recurrence"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Necessity Tag */}
      {currentType === "expense" && (
        <div className="space-y-1.5">
        <Label>Classificação</Label>
        <Controller
          control={control}
          name="necessity_tag"
          render={({ field }) => (
            <div className="flex gap-2">
              {NECESSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    field.value === opt.value
                      ? "border-orbital-gold/40 bg-orbital-gold/10 text-orbital-gold"
                      : "border-orbital-gold/10 bg-orbital-surface text-orbital-muted hover:text-orbital-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        />
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Input id="notes" placeholder="Notas adicionais..." {...register("notes")} />
      </div>

      <Button
        type="submit"
        disabled={isBusy}
        className="w-full bg-orbital-gold text-orbital-deep hover:bg-orbital-gold-dark font-semibold"
      >
        {isBusy ? <LoadingSpinner size={16} /> : isEditing ? "Salvar alterações" : "Registrar"}
      </Button>
    </form>
  );
}

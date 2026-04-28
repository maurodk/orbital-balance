"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical, Pencil, Trash2, Copy } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { TransactionWithCategory } from "@/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "./transaction-form";
import { useDeleteTransaction, useCreateTransaction } from "@/hooks/useTransactions";

const NECESSITY_LABELS: Record<string, { label: string; className: string }> = {
  necessary: { label: "Necessário", className: "text-success bg-success/10" },
  unnecessary: { label: "Desnecessário", className: "text-destructive bg-destructive/10" },
  pending: { label: "Pendente", className: "text-orbital-muted bg-orbital-muted/10" },
};

interface TransactionCardProps {
  transaction: TransactionWithCategory;
  index?: number;
}

export function TransactionCard({ transaction: t, index = 0 }: TransactionCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteTransaction();
  const createMutation = useCreateTransaction();

  const necessity = NECESSITY_LABELS[t.necessity_tag] ?? NECESSITY_LABELS.pending;
  const showNecessity = t.type === "expense";

  const handleDuplicate = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...rest } = t;
    createMutation.mutate({
      ...rest,
      category_id: rest.category_id ?? null,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="flex items-center gap-3 rounded-xl bg-orbital-surface border border-orbital-gold/[0.08] px-4 py-3 hover:border-orbital-gold/20 hover:shadow-[0_4px_20px_rgba(212,175,122,0.06)] transition-all"
      >
        {/* Category dot */}
        <div
          className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: `${t.category?.color ?? "#94A3B8"}20` }}
        >
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: t.category?.color ?? "#94A3B8" }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-orbital-white truncate">{t.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-orbital-muted">{formatDate(t.date)}</span>
            {t.category && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${t.category.color}18`,
                  color: t.category.color,
                }}
              >
                {t.category.name}
              </span>
            )}
            {showNecessity && (
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full", necessity.className)}>
                {necessity.label}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={cn(
              "text-sm font-semibold",
              t.type === "income" ? "text-success" : "text-destructive"
            )}
          >
            {t.type === "income" ? "+" : "-"}
            {formatCurrency(t.amount)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-md text-orbital-muted hover:text-orbital-white hover:bg-orbital-surface-hover transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate(t.id)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>Editar transação</DialogTitle>
          </DialogHeader>
          <TransactionForm
            editingTransaction={t}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFiltersStore } from "@/store/useFiltersStore";
import type { TransactionWithCategory, TransactionType, PaymentMethod, NecessityTag } from "@/types";
import { List } from "lucide-react";

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { transactions: filters, setTransactionFilter, resetTransactionFilters } = useFiltersStore();
  const [page, setPage] = useState(1);

  const filtered = useMemo<TransactionWithCategory[]>(() => {
    return (transactions as TransactionWithCategory[]).filter((t) => {
      if (filters.search && !t.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.categoryId !== "all" && t.category_id !== filters.categoryId) return false;
      if (filters.paymentMethod !== "all" && t.payment_method !== filters.paymentMethod) return false;
      if (filters.necessityTag !== "all" && t.necessity_tag !== filters.necessityTag) return false;
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;
      return true;
    });
  }, [transactions, filters]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const hasActiveFilters =
    filters.search ||
    filters.type !== "all" ||
    filters.categoryId !== "all" ||
    filters.paymentMethod !== "all" ||
    filters.necessityTag !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-orbital-white">Transações</h1>
        <p className="text-sm text-orbital-muted mt-1">
          {filtered.length} transação{filtered.length !== 1 ? "ões" : ""}
        </p>
      </motion.div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-orbital-muted" />
          <span className="text-sm font-medium text-orbital-white">Filtros</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetTransactionFilters}
              className="ml-auto text-xs text-orbital-muted hover:text-orbital-white gap-1"
            >
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orbital-muted" />
            <Input
              placeholder="Buscar por descrição..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => setTransactionFilter("search", e.target.value)}
            />
          </div>

          <Select value={filters.type} onValueChange={(v) => setTransactionFilter("type", v as TransactionType | "all")}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.categoryId} onValueChange={(v) => setTransactionFilter("categoryId", v)}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.paymentMethod} onValueChange={(v) => setTransactionFilter("paymentMethod", v as PaymentMethod | "all")}>
            <SelectTrigger><SelectValue placeholder="Pagamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas formas</SelectItem>
              <SelectItem value="card">Cartão</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="pix">Pix</SelectItem>
              <SelectItem value="transfer">Transferência</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.necessityTag} onValueChange={(v) => setTransactionFilter("necessityTag", v as NecessityTag | "all")}>
            <SelectTrigger><SelectValue placeholder="Classificação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="necessary">Necessário</SelectItem>
              <SelectItem value="unnecessary">Desnecessário</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <DateInput
              value={filters.dateFrom ?? ""}
              onChange={(v) => setTransactionFilter("dateFrom", v || null)}
            />
            <DateInput
              value={filters.dateTo ?? ""}
              onChange={(v) => setTransactionFilter("dateTo", v || null)}
            />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={List}
          title="Nenhuma transação encontrada"
          description={hasActiveFilters ? "Tente ajustar os filtros." : "Registre sua primeira transação."}
        />
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((t, i) => (
              <TransactionCard key={t.id} transaction={t} index={i} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                className="border-orbital-gold/20 text-orbital-muted hover:text-orbital-white"
              >
                Carregar mais
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

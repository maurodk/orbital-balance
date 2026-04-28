"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Transaction, TransactionInsert, TransactionWithCategory } from "@/types";
import type { Database } from "@/types/database";

type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

export const TRANSACTIONS_KEY = ["transactions"] as const;

interface FetchOptions {
  month?: number;
  year?: number;
  limit?: number;
}

export async function fetchTransactions(opts: FetchOptions = {}): Promise<TransactionWithCategory[]> {
  const supabase = createSupabaseBrowserClient();
  let query = supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts.month !== undefined && opts.year !== undefined) {
    const from = `${opts.year}-${String(opts.month).padStart(2, "0")}-01`;
    const lastDay = new Date(opts.year, opts.month, 0).getDate();
    const to = `${opts.year}-${String(opts.month).padStart(2, "0")}-${lastDay}`;
    query = query.gte("date", from).lte("date", to);
  }

  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as TransactionWithCategory[];
}

export function useTransactions(opts: FetchOptions = {}) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, opts],
    queryFn: () => fetchTransactions(opts),
  });
}

export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, { limit }],
    queryFn: () => fetchTransactions({ limit }),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<TransactionInsert, "user_id">) => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("transactions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({ ...payload, user_id: user.id } as any)
        .select("*, category:categories(*)")
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      toast.success("Transação registrada!");
    },
    onError: (err: Error) => toast.error("Erro ao registrar transação", { description: err.message }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Transaction> & { id: string }) => {
      const supabase = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("transactions")
        .update(payload as TransactionUpdate)
        .eq("id", id)
        .select("*, category:categories(*)")
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      toast.success("Transação atualizada!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar transação", { description: err.message }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      toast.success("Transação removida!");
    },
    onError: (err: Error) => toast.error("Erro ao remover transação", { description: err.message }),
  });
}

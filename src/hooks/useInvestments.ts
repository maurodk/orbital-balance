"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Investment,
  InvestmentContributionInsert,
  InvestmentGoal,
  InvestmentGoalInsert,
  InvestmentGoalWithRelations,
  InvestmentInsert,
} from "@/types";
import type { Database } from "@/types/database";

type GoalUpdate = Database["public"]["Tables"]["investment_goals"]["Update"] & { id: string };
type InvestmentUpdate = Database["public"]["Tables"]["investments"]["Update"] & { id: string };

export const INVESTMENTS_KEY = ["investments"] as const;

async function getUserId() {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado");
  return user.id;
}

export async function fetchInvestmentGoals(): Promise<InvestmentGoalWithRelations[]> {
  const supabase = createSupabaseBrowserClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("investment_goals")
    .select("*, investments(*), contributions:investment_contributions(*)")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as InvestmentGoalWithRelations[];
}

export async function fetchInvestments(): Promise<Investment[]> {
  const supabase = createSupabaseBrowserClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("investments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Investment[];
}

export function useInvestmentGoals() {
  return useQuery({
    queryKey: [...INVESTMENTS_KEY, "goals"],
    queryFn: fetchInvestmentGoals,
  });
}

export function useInvestments() {
  return useQuery({
    queryKey: [...INVESTMENTS_KEY, "all"],
    queryFn: fetchInvestments,
  });
}

export function useCreateInvestmentGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<InvestmentGoalInsert, "user_id">) => {
      const supabase = createSupabaseBrowserClient();
      const userId = await getUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("investment_goals")
        .insert({ ...payload, user_id: userId })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as InvestmentGoal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Meta criada!");
    },
    onError: (err: Error) => toast.error("Erro ao criar meta", { description: err.message }),
  });
}

export function useUpdateInvestmentGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: GoalUpdate) => {
      const supabase = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("investment_goals")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as InvestmentGoal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Meta atualizada!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar meta", { description: err.message }),
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<InvestmentInsert, "user_id">) => {
      const supabase = createSupabaseBrowserClient();
      const userId = await getUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("investments")
        .insert({ ...payload, user_id: userId })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Investment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Investimento registrado!");
    },
    onError: (err: Error) => toast.error("Erro ao registrar investimento", { description: err.message }),
  });
}

export function useUpdateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: InvestmentUpdate) => {
      const supabase = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("investments")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Investment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Investimento atualizado!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar investimento", { description: err.message }),
  });
}

export function useCreateContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<InvestmentContributionInsert, "user_id"> & { investment_id: string }
    ) => {
      const supabase = createSupabaseBrowserClient();
      const userId = await getUserId();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: investment, error: investmentError } = await (supabase as any)
        .from("investments")
        .select("amount")
        .eq("id", payload.investment_id)
        .single();

      if (investmentError) throw new Error(investmentError.message);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("investment_contributions")
        .insert({ ...payload, user_id: userId })
        .select()
        .single();

      if (error) throw new Error(error.message);

      const nextAmount = Number(investment.amount ?? 0) + payload.amount;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("investments")
        .update({ amount: nextAmount })
        .eq("id", payload.investment_id);

      if (updateError) throw new Error(updateError.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Aporte registrado!");
    },
    onError: (err: Error) => toast.error("Erro ao registrar aporte", { description: err.message }),
  });
}

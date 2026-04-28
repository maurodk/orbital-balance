"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Investment,
  InvestmentContributionInsert,
  InvestmentGoal,
  InvestmentGoalAllocation,
  InvestmentGoalAllocationInsert,
  InvestmentGoalInsert,
  InvestmentGoalWithRelations,
  InvestmentInsert,
  InvestmentWithAllocations,
} from "@/types";
import type { Database } from "@/types/database";

type GoalUpdate = Database["public"]["Tables"]["investment_goals"]["Update"] & { id: string };
type InvestmentUpdate = Database["public"]["Tables"]["investments"]["Update"] & { id: string };

export const INVESTMENTS_KEY = ["investments"] as const;

async function fetchAllocationsSafe(): Promise<InvestmentGoalAllocation[]> {
  const supabase = createSupabaseBrowserClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("investment_goal_allocations")
    .select("*");

  if (error) return [];
  return (data ?? []) as InvestmentGoalAllocation[];
}

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
  const { data: goals, error } = await (supabase as any)
    .from("investment_goals")
    .select("*, contributions:investment_contributions(*)")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const [{ data: investments, error: investmentsError }, allocations] =
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("investments").select("*"),
      fetchAllocationsSafe(),
    ]);

  if (investmentsError) throw new Error(investmentsError.message);

  return ((goals ?? []) as InvestmentGoalWithRelations[]).map((goal) => {
    const goalAllocations = allocations.filter(
      (allocation) => allocation.goal_id === goal.id
    );
    const allocatedInvestments = ((investments ?? []) as Investment[]).filter(
      (investment) =>
        investment.goal_id === goal.id ||
        goalAllocations.some((allocation) => allocation.investment_id === investment.id)
    );

    return {
      ...goal,
      investments: allocatedInvestments,
      allocations: goalAllocations,
      contributions: goal.contributions ?? [],
    };
  });
}

export async function fetchInvestments(): Promise<InvestmentWithAllocations[]> {
  const supabase = createSupabaseBrowserClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("investments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const allocations = await fetchAllocationsSafe();
  return ((data ?? []) as Investment[]).map((investment) => ({
    ...investment,
    allocations: allocations.filter((allocation) => allocation.investment_id === investment.id),
  }));
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

export function useDeleteInvestmentGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("investment_goals").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Meta excluida!");
    },
    onError: (err: Error) => toast.error("Erro ao excluir meta", { description: err.message }),
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

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("investments").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Investimento excluido!");
    },
    onError: (err: Error) => toast.error("Erro ao excluir investimento", { description: err.message }),
  });
}

export function useUpsertInvestmentAllocations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      investmentId,
      allocations,
    }: {
      investmentId: string;
      allocations: Omit<InvestmentGoalAllocationInsert, "user_id" | "investment_id">[];
    }) => {
      const supabase = createSupabaseBrowserClient();
      const userId = await getUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from("investment_goal_allocations")
        .delete()
        .eq("investment_id", investmentId);

      if (deleteError) throw new Error(deleteError.message);

      if (allocations.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from("investment_goal_allocations")
          .insert(
            allocations.map((allocation) => ({
              ...allocation,
              investment_id: investmentId,
              user_id: userId,
            }))
          );

        if (insertError) throw new Error(insertError.message);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("investments")
        .update({ goal_id: allocations.length === 1 ? allocations[0].goal_id : null })
        .eq("id", investmentId);

      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      toast.success("Alocacao atualizada!");
    },
    onError: (err: Error) => toast.error("Erro ao vincular investimento", { description: err.message }),
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

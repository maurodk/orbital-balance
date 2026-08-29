"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Category, CategoryInsert } from "@/types";

const QUERY_KEY = ["categories"] as const;

async function fetchCategories(): Promise<Category[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("is_default", { ascending: false })
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCategories,
    // Categories change rarely; keep them fresh for 10 min.
    staleTime: 10 * 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CategoryInsert, "user_id">) => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("categories")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({ ...payload, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Categoria criada!");
    },
    onError: (err: Error) => toast.error("Erro ao criar categoria", { description: err.message }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Category> & { id: string }) => {
      const supabase = createSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("categories")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Categoria atualizada!");
    },
    onError: (err: Error) => toast.error("Erro ao atualizar categoria", { description: err.message }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Categoria removida!");
    },
    onError: (err: Error) => toast.error("Erro ao remover categoria", { description: err.message }),
  });
}

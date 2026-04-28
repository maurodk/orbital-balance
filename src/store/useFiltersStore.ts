import { create } from "zustand";
import type {
  NecessityTag,
  PaymentMethod,
  TransactionType,
} from "@/types";

interface TransactionFilters {
  search: string;
  type: TransactionType | "all";
  categoryId: string | "all";
  paymentMethod: PaymentMethod | "all";
  necessityTag: NecessityTag | "all";
  dateFrom: string | null;
  dateTo: string | null;
}

interface FiltersState {
  transactions: TransactionFilters;
  setTransactionFilter: <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => void;
  resetTransactionFilters: () => void;
}

const defaultFilters: TransactionFilters = {
  search: "",
  type: "all",
  categoryId: "all",
  paymentMethod: "all",
  necessityTag: "all",
  dateFrom: null,
  dateTo: null,
};

export const useFiltersStore = create<FiltersState>((set) => ({
  transactions: defaultFilters,
  setTransactionFilter: (key, value) =>
    set((s) => ({ transactions: { ...s.transactions, [key]: value } })),
  resetTransactionFilters: () => set({ transactions: defaultFilters }),
}));

import { create } from "zustand";

type TransactionDialogMode = "expense" | "income" | null;

interface UIState {
  transactionDialogMode: TransactionDialogMode;
  openTransactionDialog: (mode: Exclude<TransactionDialogMode, null>) => void;
  closeTransactionDialog: () => void;

  selectedCalendarDate: string | null;
  setSelectedCalendarDate: (date: string | null) => void;

  sidebarOpenMobile: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  transactionDialogMode: null,
  openTransactionDialog: (mode) => set({ transactionDialogMode: mode }),
  closeTransactionDialog: () => set({ transactionDialogMode: null }),

  selectedCalendarDate: null,
  setSelectedCalendarDate: (date) => set({ selectedCalendarDate: date }),

  sidebarOpenMobile: false,
  toggleMobileSidebar: () =>
    set((s) => ({ sidebarOpenMobile: !s.sidebarOpenMobile })),
  closeMobileSidebar: () => set({ sidebarOpenMobile: false }),
}));

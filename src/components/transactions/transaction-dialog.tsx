"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/store/useUIStore";
import { TransactionForm } from "./transaction-form";

export function TransactionDialog() {
  const { transactionDialogMode, closeTransactionDialog } = useUIStore();

  const isOpen = transactionDialogMode !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeTransactionDialog()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>
            {transactionDialogMode === "income" ? "Adicionar Receita" : "Registrar Gasto"}
          </DialogTitle>
        </DialogHeader>
        {isOpen && (
          <TransactionForm
            defaultType={transactionDialogMode!}
            onSuccess={closeTransactionDialog}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

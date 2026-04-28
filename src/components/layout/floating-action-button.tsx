"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const { openTransactionDialog } = useUIStore();

  const handleSelect = (mode: "income" | "expense") => {
    setOpen(false);
    openTransactionDialog(mode);
  };

  return (
    <div className="fixed bottom-6 right-6 z-30 hidden lg:flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.12, delay: 0.03 }}
              onClick={() => handleSelect("expense")}
              className="flex items-center gap-2 rounded-full bg-orbital-surface border border-orbital-gold/20 px-4 py-2.5 text-sm font-medium text-orbital-white shadow-lg hover:bg-orbital-surface-hover transition-colors duration-100"
            >
              <TrendingDown className="h-4 w-4 text-destructive" />
              Registrar Gasto
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.12 }}
              onClick={() => handleSelect("income")}
              className="flex items-center gap-2 rounded-full bg-orbital-surface border border-orbital-gold/20 px-4 py-2.5 text-sm font-medium text-orbital-white shadow-lg hover:bg-orbital-surface-hover transition-colors duration-100"
            >
              <TrendingUp className="h-4 w-4 text-success" />
              Adicionar Receita
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {open && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <motion.button
        onClick={() => setOpen((v) => !v)}
        animate={{ rotate: open ? 45 : 0 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.55 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-orbital-gold text-orbital-deep shadow-lg shadow-orbital-gold/30 hover:bg-orbital-gold-dark transition-colors"
        aria-label="Adicionar transação"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}

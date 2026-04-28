"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Palette, Pencil, Plus, Trash2 } from "lucide-react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EAB308",
  "#06B6D4", "#EC4899", "#D4AF7A", "#22C55E", "#94A3B8",
  "#EF4444", "#F59E0B", "#14B8A6", "#6366F1", "#84CC16",
];

interface CategoryFormState {
  name: string;
  color: string;
  icon: string;
  type: "expense" | "income" | "both";
}

const defaultForm: CategoryFormState = {
  name: "",
  color: "#D4AF7A",
  icon: "Tag",
  type: "expense",
};

function CategoryFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Category | null;
}) {
  const [form, setForm] = useState<CategoryFormState>(
    editing
      ? { name: editing.name, color: editing.color, icon: editing.icon, type: editing.type }
      : defaultForm
  );
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isEditing = !!editing;
  const isBusy = createMutation.isPending || updateMutation.isPending;
  const isColorValid = /^#[0-9A-Fa-f]{6}$/.test(form.color);
  const previewColor = isColorValid ? form.color : defaultForm.color;

  useEffect(() => {
    setForm(
      editing
        ? { name: editing.name, color: editing.color, icon: editing.icon, type: editing.type }
        : defaultForm
    );
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (isEditing && editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...form });
    } else {
      await createMutation.mutateAsync({ ...form, is_default: false });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome da categoria"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as CategoryFormState["type"] }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex items-center gap-3 rounded-lg border border-orbital-gold/10 bg-orbital-deep/40 p-3">
              <label
                className="relative flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-orbital-gold/20"
                style={{ backgroundColor: previewColor }}
                aria-label="Escolher cor personalizada"
              >
                <input
                  type="color"
                  value={previewColor}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value.toUpperCase() }))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <Palette className="h-5 w-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]" />
              </label>
              <div className="min-w-0 flex-1 space-y-1">
                <Input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  onBlur={() => {
                    if (!/^#[0-9A-Fa-f]{6}$/.test(form.color)) {
                      setForm((f) => ({ ...f, color: defaultForm.color }));
                    } else {
                      setForm((f) => ({ ...f, color: f.color.toUpperCase() }));
                    }
                  }}
                  placeholder="#D4AF7A"
                  maxLength={7}
                  className="font-mono text-xs uppercase"
                />
                <p className="text-[11px] text-orbital-muted">
                  Escolha na paleta ou informe um hexadecimal.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    form.color === c ? "border-orbital-white scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${previewColor}25` }}
            >
              <span className="h-4 w-4 rounded-full" style={{ backgroundColor: previewColor }} />
            </div>
            <span className="text-sm text-orbital-white font-medium">{form.name || "Prévia"}</span>
          </div>

          <Button
            type="submit"
            disabled={isBusy || !form.name.trim() || !isColorValid}
            className="w-full bg-orbital-gold text-orbital-deep hover:bg-orbital-gold-dark font-semibold"
          >
            {isBusy ? <LoadingSpinner size={16} /> : isEditing ? "Salvar" : "Criar categoria"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const TYPE_LABEL: Record<string, string> = {
    expense: "Despesa",
    income: "Receita",
    both: "Ambos",
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-orbital-white">Categorias</h1>
          <p className="text-sm text-orbital-muted mt-1">{categories.length} categorias</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-orbital-gold text-orbital-deep hover:bg-orbital-gold-dark font-semibold gap-2"
        >
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 glass-card rounded-xl px-4 py-3 hover:border-orbital-gold/25 transition-all"
            >
              <div
                className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orbital-white truncate">{cat.name}</p>
                <p className="text-xs text-orbital-muted">{TYPE_LABEL[cat.type]}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {cat.is_default ? (
                  <div className="p-1.5 text-orbital-muted" title="Categoria padrão">
                    <Lock className="h-4 w-4" />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 rounded-md text-orbital-muted hover:text-orbital-white hover:bg-orbital-surface-hover transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(cat.id)}
                      className="p-1.5 rounded-md text-orbital-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <CategoryFormDialog open={dialogOpen} onClose={handleClose} editing={editing} />
    </div>
  );
}

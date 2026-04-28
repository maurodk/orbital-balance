"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.name as string | undefined) ?? "");
      setIsLoading(false);
    });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({
      data: { name },
    });
    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
    } else {
      toast.success("Perfil atualizado!");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-orbital-white">Configurações</h1>
        <p className="text-sm text-orbital-muted mt-1">Gerencie sua conta e preferências</p>
      </motion.div>

      {/* Profile */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orbital-gold/10">
            <User className="h-5 w-5 text-orbital-gold" />
          </div>
          <h2 className="text-base font-semibold text-orbital-white">Perfil</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6"><LoadingSpinner /></div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-orbital-muted">O email não pode ser alterado aqui.</p>
            </div>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-orbital-gold text-orbital-deep hover:bg-orbital-gold-dark font-semibold gap-2"
            >
              {isSaving ? <LoadingSpinner size={14} /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </form>
        )}
      </motion.section>

      <Separator />

      {/* App info */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="glass-card rounded-xl p-6"
      >
        <h2 className="text-base font-semibold text-orbital-white mb-3">Sobre</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-orbital-muted">Aplicativo</span>
            <span className="text-orbital-white font-medium">Orbital Balance</span>
          </div>
          <div className="flex justify-between">
            <span className="text-orbital-muted">Versão</span>
            <span className="text-orbital-white font-medium">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-orbital-muted">Slogan</span>
            <span className="text-orbital-gold font-medium italic">Controle Hoje, Liberdade Amanhã.</span>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  List,
  CalendarDays,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transações", icon: List },
  { href: "/dashboard/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/dashboard/goals", label: "M&I", icon: Target },
  { href: "/dashboard/categories", label: "Categorias", icon: Tag },
  { href: "/dashboard/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Config.", icon: Settings },
];

interface DockItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

function DockItem({ icon: Icon, label, active, onClick }: DockItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.55 }}
      className="relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl"
    >
      <div
        className={cn(
          "p-2.5 rounded-xl transition-all duration-300",
          active
            ? "bg-orbital-gold/20 shadow-[0_0_16px_rgba(212,175,122,0.35)]"
            : "hover:bg-white/5"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5 transition-colors duration-200",
            active
              ? "text-orbital-gold"
              : "text-orbital-muted group-hover:text-orbital-white"
          )}
        />
      </div>
      <span
        className={cn(
          "text-[10px] font-medium leading-none transition-colors duration-200",
          active ? "text-orbital-gold" : "text-orbital-muted/60"
        )}
      >
        {label}
      </span>

      {/* Active indicator */}
      {active && (
        <motion.span
          layoutId="dock-active-dot"
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orbital-gold"
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        />
      )}
    </motion.button>
  );
}

export function DockNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="pointer-events-auto flex items-end gap-0.5 px-3 py-2.5 rounded-2xl border border-orbital-gold/15 shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(212,175,122,0.05)]"
        style={{
          background: "rgba(11, 19, 32, 0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <DockItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              active={active}
              onClick={() => router.push(item.href)}
            />
          );
        })}

        {/* Divider */}
        <div className="w-px h-9 bg-orbital-gold/12 mx-1 self-center" />

        {/* Logout */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.55 }}
          className="group flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl"
        >
          <div className="p-2.5 rounded-xl hover:bg-destructive/10 transition-colors duration-200">
            <LogOut className="w-5 h-5 text-orbital-muted group-hover:text-destructive transition-colors duration-200" />
          </div>
          <span className="text-[10px] font-medium leading-none text-orbital-muted/60">
            Sair
          </span>
        </motion.button>
      </motion.nav>
    </div>
  );
}

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
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transações", icon: List },
  { href: "/dashboard/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/dashboard/goals", label: "M&I", icon: Target },
  { href: "/dashboard/categories", label: "Categorias", icon: Tag },
  {
    href: "/dashboard/reports",
    label: "Relatórios",
    icon: BarChart3,
    mobileHidden: true,
  },
];

interface DockItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  mobileHidden?: boolean;
}

function DockItem({ icon: Icon, label, active, onClick, mobileHidden }: DockItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.55 }}
      className={cn(
        "group relative flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1 sm:gap-1 sm:px-2 sm:py-1.5",
        mobileHidden && "hidden lg:flex"
      )}
    >
      <div
        className={cn(
          "rounded-xl p-1.5 transition-all duration-300 sm:p-2 lg:p-2.5",
          active
            ? "bg-orbital-gold/20 shadow-[0_0_16px_rgba(212,175,122,0.35)]"
            : "hover:bg-white/5"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 transition-colors duration-200 sm:h-[18px] sm:w-[18px] lg:h-5 lg:w-5",
            active
              ? "text-orbital-gold"
              : "text-orbital-muted group-hover:text-orbital-white"
          )}
        />
      </div>
      <span
        className={cn(
          "w-full truncate text-center text-[9px] font-medium leading-none transition-colors duration-200 sm:text-[10px]",
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none lg:bottom-4 lg:px-4">
      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="pointer-events-auto grid w-full grid-cols-5 gap-0.5 border-t border-orbital-gold/15 px-2 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_36px_rgba(0,0,0,0.38)] sm:px-4 lg:flex lg:w-auto lg:items-end lg:gap-0.5 lg:rounded-2xl lg:border lg:px-3 lg:py-2.5 lg:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(212,175,122,0.05)]"
        style={{
          background: "rgba(11, 19, 32, 0.92)",
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
              mobileHidden={item.mobileHidden}
            />
          );
        })}

      </motion.nav>
    </div>
  );
}

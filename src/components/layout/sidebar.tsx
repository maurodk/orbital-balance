"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  List,
  CalendarDays,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { useUIStore } from "@/store/useUIStore";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transações", icon: List },
  { href: "/dashboard/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/dashboard/categories", label: "Categorias", icon: Tag },
  { href: "/dashboard/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "text-orbital-gold bg-orbital-gold/8"
          : "text-orbital-muted hover:text-orbital-white hover:bg-orbital-surface-hover"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-orbital-gold rounded-r-full" />
      )}
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-orbital-gold" : "text-orbital-muted")} />
      {label}
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
      setUserName(
        (data.user?.user_metadata?.name as string | undefined) ??
          data.user?.email?.split("@")[0] ??
          ""
      );
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Logo size={36} />
      </div>

      <Separator className="mx-4 w-auto" />

      <nav className="flex-1 space-y-1 p-3 mt-2">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            }
            onClick={onClose}
          />
        ))}
      </nav>

      <Separator className="mx-4 w-auto" />

      <div className="p-3 pb-5 mt-2 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-orbital-white truncate">{userName || "Usuário"}</p>
            <p className="text-xs text-orbital-muted truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-orbital-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}

// Desktop sidebar
export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-orbital-deep border-r border-orbital-gold/10 z-30">
      <SidebarContent />
    </aside>
  );
}

// Mobile sidebar drawer
export function MobileSidebar() {
  const { sidebarOpenMobile, closeMobileSidebar } = useUIStore();

  return (
    <AnimatePresence>
      {sidebarOpenMobile && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileSidebar}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed left-0 top-0 h-full w-72 bg-orbital-deep border-r border-orbital-gold/10 z-50 lg:hidden"
          >
            <button
              onClick={closeMobileSidebar}
              className="absolute right-4 top-4 p-1.5 rounded-md text-orbital-muted hover:text-orbital-white hover:bg-orbital-surface transition-colors"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onClose={closeMobileSidebar} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

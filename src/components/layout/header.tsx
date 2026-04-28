"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserName(
        (data.user?.user_metadata?.name as string | undefined) ??
          data.user?.email?.split("@")[0] ??
          ""
      );
    });
  }, []);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center justify-center border-b border-orbital-gold/10 px-4 lg:px-8 relative"
      style={{
        background: "rgba(11, 19, 32, 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <Link
        href="/dashboard"
        aria-label="Voltar para o painel principal"
        className="group rounded-full outline-none transition-[filter,transform] duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_18px_rgba(212,175,122,0.55)] focus-visible:drop-shadow-[0_0_18px_rgba(212,175,122,0.7)]"
      >
        <Logo
          size={150}
          showText={false}
          className="transition-opacity duration-300 group-hover:opacity-95"
        />
      </Link>
      <div className="absolute right-4 lg:right-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full outline-none transition-[filter,transform] duration-200 hover:scale-105 hover:drop-shadow-[0_0_12px_rgba(212,175,122,0.35)] focus-visible:drop-shadow-[0_0_14px_rgba(212,175,122,0.6)]"
              aria-label="Abrir menu do perfil"
            >
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="text-xs bg-orbital-gold/15 text-orbital-gold border border-orbital-gold/25">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/reports")}
              className="lg:hidden"
            >
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings className="h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

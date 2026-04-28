"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function Header() {
  const [userName, setUserName] = useState("");

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

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center justify-center border-b border-orbital-gold/10 px-4 lg:px-8 relative"
      style={{
        background: "rgba(11, 19, 32, 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <Logo size={150} showText={false} />
      <div className="absolute right-4 lg:right-8">
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="text-xs bg-orbital-gold/15 text-orbital-gold border border-orbital-gold/25">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

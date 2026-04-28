import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { DockNav } from "@/components/layout/dock-nav";
import { BackgroundCanvas } from "@/components/layout/background-canvas";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0A1628] relative overflow-x-hidden">
      <BackgroundCanvas />

      <Header />

      <main className="relative z-10 pb-32 min-h-[calc(100vh-56px)]">
        <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>

      <DockNav />
      <TransactionDialog />
    </div>
  );
}


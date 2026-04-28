import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-orbital-deep">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,122,0.08),transparent_55%)]"
      />
      <div
        aria-hidden
        className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orbital-gold/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-orbital-gold/[0.04] blur-3xl"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-10 flex flex-col items-center">
          <Logo size={200} showText={false} />
          <p className="mt-2 text-sm text-orbital-muted tracking-wide">
            Controle Hoje, Liberdade Amanhã.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}

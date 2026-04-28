import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md border-gold-subtle backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-orbital-white">
            Bem-vindo de volta
          </h2>
          <p className="mt-1 text-sm text-orbital-muted">
            Acesse sua conta para continuar.
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-orbital-muted">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="font-medium text-orbital-gold hover:underline underline-offset-4"
          >
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

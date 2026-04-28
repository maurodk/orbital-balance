import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md border-gold-subtle backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-orbital-white">
            Comece sua jornada
          </h2>
          <p className="mt-1 text-sm text-orbital-muted">
            Crie sua conta e tome controle das suas finanças.
          </p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-orbital-muted">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-orbital-gold hover:underline underline-offset-4"
          >
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

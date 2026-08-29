import type { GoalPriority } from "@/types";

export const GOAL_COLORS = ["#D4AF7A", "#22C55E", "#3B82F6", "#8B5CF6", "#14B8A6", "#F97316"];

export const GOAL_CATEGORIES = [
  "Reserva",
  "Automóvel",
  "Imovel",
  "Viagem",
  "Educacao",
  "Aposentadoria",
  "Outro",
];

export const INVESTMENT_TYPES = [
  "Caixinha",
  "CDB",
  "Tesouro Direto",
  "FII",
  "Acoes",
  "Cripto",
  "Poupanca",
  "Outro",
];

export const PRIORITY_LABEL: Record<GoalPriority, string> = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
};

export function parseMoney(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
}

export function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return `R$${(Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatMoneyFormValue(value: number | null | undefined) {
  if (!value) return "";
  return formatMoneyInput(Number(value).toFixed(2));
}

import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCurrencyCompact(value: number): string {
  return compactFormatter.format(value);
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value);
}

export function formatDate(value: string | Date, pattern = "dd/MM/yyyy"): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern, { locale: ptBR });
}

export function formatDateLong(value: string | Date): string {
  return formatDate(value, "d 'de' MMMM 'de' yyyy");
}

export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

export function formatRelative(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
}

/**
 * Parse a brazilian currency string ("R$ 1.234,56") into a number.
 * Accepts raw digits too ("123456" → 1234.56 if centavos = true).
 */
export function parseCurrencyInput(
  value: string,
  centavos = true
): number {
  const clean = value.replace(/\D/g, "");
  if (!clean) return 0;
  const num = Number(clean);
  return centavos ? num / 100 : num;
}

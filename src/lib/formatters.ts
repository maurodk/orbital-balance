import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const DEFAULT_CURRENCY = "BRL";

export const CURRENCY_OPTIONS = [
  { value: "BRL", label: "Real brasileiro", locale: "pt-BR" },
  { value: "USD", label: "Dólar americano", locale: "en-US" },
  { value: "EUR", label: "Euro", locale: "de-DE" },
] as const;

export type SupportedCurrency = (typeof CURRENCY_OPTIONS)[number]["value"];

function getPreferredCurrency(): SupportedCurrency {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  const stored = window.localStorage.getItem("orbital-preferred-currency");
  return CURRENCY_OPTIONS.some((option) => option.value === stored)
    ? (stored as SupportedCurrency)
    : DEFAULT_CURRENCY;
}

function getCurrencyLocale(currency: SupportedCurrency) {
  return CURRENCY_OPTIONS.find((option) => option.value === currency)?.locale ?? "pt-BR";
}

function createCurrencyFormatter(compact = false) {
  const currency = getPreferredCurrency();
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  });
}

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return createCurrencyFormatter().format(value);
}

export function formatCurrencyCompact(value: number): string {
  return createCurrencyFormatter(true).format(value);
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

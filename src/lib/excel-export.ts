import { format } from "date-fns";
import type { CategorySpending, MonthSummary, TransactionWithCategory } from "@/types";

const NECESSITY_LABELS: Record<string, string> = {
  necessary: "Necessario",
  unnecessary: "Desnecessario",
  pending: "Pendente",
};

function xmlEscape(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textCell(value: string | number | null | undefined): string {
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function numberCell(value: number): string {
  return `<Cell><Data ss:Type="Number">${Number.isFinite(value) ? value : 0}</Data></Cell>`;
}

function formulaCell(formula: string): string {
  return `<Cell ss:Formula="${xmlEscape(formula)}"><Data ss:Type="Number">0</Data></Cell>`;
}

function row(cells: string[]): string {
  return `<Row>${cells.join("")}</Row>`;
}

function worksheet(name: string, rows: string[]): string {
  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${rows.join("")}</Table></Worksheet>`;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportFinanceWorkbook({
  monthLabel,
  summary,
  previousSummary,
  transactions,
  spending,
}: {
  monthLabel: string;
  summary: MonthSummary;
  previousSummary?: MonthSummary;
  transactions: TransactionWithCategory[];
  spending: CategorySpending[];
}) {
  const transactionRows = [
    row([
      textCell("Data"),
      textCell("Descricao"),
      textCell("Tipo"),
      textCell("Categoria"),
      textCell("Necessidade"),
      textCell("Metodo"),
      textCell("Recorrencia"),
      textCell("Agendado"),
      textCell("Valor"),
    ]),
    ...transactions.map((t) =>
      row([
        textCell(t.date),
        textCell(t.description),
        textCell(t.type === "income" ? "Receita" : "Despesa"),
        textCell(t.category?.name ?? "Sem categoria"),
        textCell(NECESSITY_LABELS[t.necessity_tag] ?? "Pendente"),
        textCell(t.payment_method),
        textCell(t.recurrence),
        textCell(t.is_scheduled ? "Sim" : "Nao"),
        numberCell(t.amount),
      ])
    ),
  ];

  const lastTransactionRow = Math.max(transactions.length + 1, 2);
  const summaryRows = [
    row([textCell("Relatorio"), textCell(monthLabel)]),
    row([textCell("Indicador"), textCell("Valor calculado")]),
    row([textCell("Receitas"), formulaCell(`=SUMIF(Transacoes!R2C3:R${lastTransactionRow}C3,"Receita",Transacoes!R2C9:R${lastTransactionRow}C9)`)]),
    row([textCell("Despesas"), formulaCell(`=SUMIF(Transacoes!R2C3:R${lastTransactionRow}C3,"Despesa",Transacoes!R2C9:R${lastTransactionRow}C9)`)]),
    row([textCell("Saldo"), formulaCell("=R[-2]C-R[-1]C")]),
    row([textCell("Total de transacoes"), formulaCell(`=COUNTA(Transacoes!R2C2:R${lastTransactionRow}C2)`)]),
    row([textCell("Receitas registradas no app"), numberCell(summary.totalIncome)]),
    row([textCell("Despesas registradas no app"), numberCell(summary.totalExpense)]),
    row([textCell("Saldo registrado no app"), numberCell(summary.balance)]),
    row([textCell("Receitas mes anterior"), numberCell(previousSummary?.totalIncome ?? 0)]),
    row([textCell("Despesas mes anterior"), numberCell(previousSummary?.totalExpense ?? 0)]),
  ];

  const categoryRows = [
    row([textCell("Categoria"), textCell("Total calculado"), textCell("Participacao")]),
    ...spending.map((s) =>
      row([
        textCell(s.categoryName),
        formulaCell(`=SUMIF(Transacoes!R2C4:R${lastTransactionRow}C4,RC[-1],Transacoes!R2C9:R${lastTransactionRow}C9)`),
        formulaCell(`=IF(Resumo!R4C2=0,0,RC[-1]/Resumo!R4C2)`),
      ])
    ),
    ...(spending.length === 0
      ? [row([textCell("Sem despesas no periodo"), numberCell(0), numberCell(0)])]
      : []),
  ];

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${worksheet("Resumo", summaryRows)}
  ${worksheet("Transacoes", transactionRows)}
  ${worksheet("Categorias", categoryRows)}
</Workbook>`;

  const filename = `orbital-balance-${format(new Date(), "yyyy-MM-dd-HHmm")}.xls`;
  downloadFile(filename, workbook);
}

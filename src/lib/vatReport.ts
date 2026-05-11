import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExpenseEntry } from '../types';

export interface VatExpense {
  date: string;
  merchantName: string;
  supplierVatId: string;
  invoiceNumber: string;
  amountBeforeVat: number;
  vatAmount: number;
  total: number;
}

export function collectVatExpenses(
  months: Record<number, { expenses: ExpenseEntry[] }>,
  monthIndices: number[]
): VatExpense[] {
  return monthIndices.flatMap((mi) =>
    (months[mi]?.expenses ?? [])
      .filter((e) => e.vatAmount != null && e.vatAmount > 0)
      .map((e) => ({
        date: e.date,
        merchantName: e.description,
        supplierVatId: e.supplierVatId ?? '',
        invoiceNumber: e.invoiceNumber ?? '',
        amountBeforeVat: e.amountBeforeVat ?? (e.amount - (e.vatAmount ?? 0)),
        vatAmount: e.vatAmount ?? 0,
        total: e.amount,
      }))
  );
}

export function generateCsv(expenses: VatExpense[], periodLabel: string): string {
  const header = 'תאריך,שם ספק,ח.פ,מספר חשבונית,לפני מע"מ,מע"מ,סה"כ';
  const rows = expenses.map((e) =>
    [e.date, e.merchantName, e.supplierVatId, e.invoiceNumber,
     e.amountBeforeVat.toFixed(2), e.vatAmount.toFixed(2), e.total.toFixed(2)].join(',')
  );
  const totalBeforeVat = expenses.reduce((s, e) => s + e.amountBeforeVat, 0);
  const totalVat = expenses.reduce((s, e) => s + e.vatAmount, 0);
  const totalAmount = expenses.reduce((s, e) => s + e.total, 0);
  const summary = `סה"כ,,,, ${totalBeforeVat.toFixed(2)},${totalVat.toFixed(2)},${totalAmount.toFixed(2)}`;
  const titleRow = `דוח תשומות - ${periodLabel}`;
  return [titleRow, header, ...rows, summary].join('\n');
}

export function downloadCsv(content: string, filename: string) {
  const bom = '﻿';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generatePdf(expenses: VatExpense[], periodLabel: string): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text(`VAT Inputs Report - ${periodLabel}`, 14, 15);

  const totalBeforeVat = expenses.reduce((s, e) => s + e.amountBeforeVat, 0);
  const totalVat = expenses.reduce((s, e) => s + e.vatAmount, 0);
  const totalAmount = expenses.reduce((s, e) => s + e.total, 0);

  doc.setFontSize(9);
  doc.text(
    `Total before VAT: ${totalBeforeVat.toFixed(2)}   VAT: ${totalVat.toFixed(2)}   Total: ${totalAmount.toFixed(2)}`,
    14, 22
  );

  autoTable(doc, {
    startY: 27,
    head: [['Date', 'Supplier', 'VAT ID', 'Invoice #', 'Before VAT', 'VAT', 'Total']],
    body: expenses.map((e) => [
      e.date, e.merchantName, e.supplierVatId, e.invoiceNumber,
      e.amountBeforeVat.toFixed(2), e.vatAmount.toFixed(2), e.total.toFixed(2),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [123, 109, 200] },
  });

  return doc;
}

export function pdfToBase64(doc: jsPDF): string {
  return btoa(doc.output());
}

export function csvToBase64(csv: string): string {
  const bom = '﻿';
  return btoa(unescape(encodeURIComponent(bom + csv)));
}

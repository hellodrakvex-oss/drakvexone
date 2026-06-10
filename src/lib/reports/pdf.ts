"use client";

import type { DailyReport } from "./types";
import { RobotoRegular, RobotoBold } from "./fonts";

/**
 * Generates and downloads a professional PDF daily closing report.
 * Uses jsPDF — client-side only.
 */
export async function generateDailyReportPDF(report: DailyReport): Promise<void> {
  // Dynamic import so it is never bundled into the server build
  const jspdfModule = await import("jspdf");
  // jsPDF ships as default export; handle both CJS default-wrapping patterns
  const JsPDF = (jspdfModule as any).jsPDF ?? (jspdfModule as any).default?.jsPDF ?? (jspdfModule as any).default;

  const doc = new JsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
  doc.addFileToVFS("Roboto-Bold.ttf", RobotoBold);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;

  // ─── Colours ────────────────────────────────────────────────────────────────
  const PURPLE = [139, 92, 246] as [number, number, number];     // primary
  const GREEN  = [16, 185, 129] as [number, number, number];     // emerald-500
  const RED    = [239, 68, 68] as [number, number, number];      // rose-500
  const DARK   = [15, 10, 30] as [number, number, number];       // bg
  const CARD   = [24, 18, 45] as [number, number, number];       // card
  const MUTED  = [120, 115, 140] as [number, number, number];
  const WHITE  = [255, 255, 255] as [number, number, number];

  let y = 0;

  // ─── Header Background ───────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 297, "F");

  // Header gradient bar
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, pageW, 42, "F");

  // Brand wordmark
  doc.setFont("Roboto", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text("DRAKVEX ONE", margin, 18);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 215, 255);
  doc.text("Daily Closing Report", margin, 26);

  // Date & shop on right
  doc.setFontSize(9);
  doc.setTextColor(220, 215, 255);
  const dateLabel = new Date(report.date).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  doc.text(dateLabel, pageW - margin, 18, { align: "right" });
  doc.setFont("Roboto", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(report.shopName, pageW - margin, 26, { align: "right" });

  y = 52;

  // ─── Helper: Section card ────────────────────────────────────────────────────
  function sectionCard(title: string, rows: { label: string; value: string; color?: [number, number, number]; bold?: boolean }[], height: number) {
    // Card background
    doc.setFillColor(...CARD);
    doc.roundedRect(margin, y, contentW, height, 4, 4, "F");

    // Section title pill
    doc.setFillColor(...PURPLE);
    doc.roundedRect(margin + 6, y + 6, 70, 8, 2, 2, "F");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text(title.toUpperCase(), margin + 11, y + 11.5);

    let rowY = y + 22;
    rows.forEach((row, i) => {
      if (i > 0) {
        doc.setDrawColor(40, 35, 65);
        doc.line(margin + 6, rowY - 2, margin + contentW - 6, rowY - 2);
      }
      doc.setFont("Roboto", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(row.label, margin + 8, rowY + 4);

      doc.setFont("Roboto", row.bold ? "bold" : "normal");
      doc.setFontSize(row.bold ? 11 : 9);
      doc.setTextColor(...(row.color ?? WHITE));
      doc.text(row.value, margin + contentW - 8, rowY + 4, { align: "right" });

      rowY += 12;
    });

    y += height + 6;
  }

  // ─── Section 1: Business Summary ────────────────────────────────────────────
  sectionCard(
    "Business Summary",
    [
      { label: "Total Sales", value: `₹${report.totalSales.toLocaleString("en-IN")}`, color: GREEN, bold: true },
      { label: "Cash Sales", value: `₹${report.cashSales.toLocaleString("en-IN")}` },
      { label: "UPI / Digital Sales", value: `₹${report.upiSales.toLocaleString("en-IN")}` },
      { label: "Total Expenses", value: `₹${report.totalExpenses.toLocaleString("en-IN")}`, color: RED },
      { label: "Net Profit", value: `₹${report.netProfit.toLocaleString("en-IN")} (${report.profitMarginPercent}%)`, color: report.netProfit >= 0 ? GREEN : RED, bold: true },
    ],
    88
  );

  // ─── Section 2: Due Summary ──────────────────────────────────────────────────
  sectionCard(
    "Due Summary",
    [
      { label: "Due Added Today", value: `₹${report.dueAdded.toLocaleString("en-IN")}`, color: RED },
      { label: "Collections Today", value: `₹${report.dueCollected.toLocaleString("en-IN")}`, color: GREEN },
      { label: "Total Pending Balance", value: `₹${report.pendingDueBalance.toLocaleString("en-IN")}`, color: RED, bold: true },
    ],
    64
  );

  // ─── Section 3: Performance ──────────────────────────────────────────────────
  sectionCard(
    "Performance Metrics",
    [
      { label: "Number of Sales", value: `${report.salesCount}` },
      { label: "Number of Expenses", value: `${report.expensesCount}` },
      { label: "Unique Customers", value: `${report.uniqueCustomersCount}` },
      { label: "Total Transactions", value: `${report.transactionsTotal}` },
      { label: "Average Sale Value", value: `₹${Math.round(report.averageSaleValue).toLocaleString("en-IN")}` },
    ],
    88
  );

  // ─── Footer ───────────────────────────────────────────────────────────────────
  doc.setFillColor(30, 25, 55);
  doc.rect(0, 275, pageW, 22, "F");
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Generated by Drakvex One — Business Operating System", pageW / 2, 285, { align: "center" });
  doc.setTextColor(100, 95, 130);
  doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, pageW / 2, 291, { align: "center" });

  // ─── Save ────────────────────────────────────────────────────────────────────
  doc.save(`daily-report-${report.date}.pdf`);
}

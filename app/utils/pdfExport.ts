// ─────────────────────────────────────────────
//  KhetiBahi – Buyer History PDF export
//
//  Two exports, both client-side with jsPDF + jspdf-autotable — same
//  "build it in the browser, hand back a file" shape as
//  exportIncomeToCSV in helpers.ts, just a PDF instead of a CSV:
//
//  1. exportBuyerHistoryToPDF   — one buyer's sales for one crop
//     (used by CropBuyerHistoryModal after a buyer search)
//  2. exportCropBuyersToPDF     — EVERY buyer who's bought one crop,
//     grouped and subtotaled, in one PDF (the "give me all buyers"
//     export from the crop page, no search needed)
//
//  Install with:  npm install jspdf jspdf-autotable
// ─────────────────────────────────────────────

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { formatNPR, prettyDate } from "./helpers";

export interface BuyerHistoryRecord {
  id: string;
  date: string;
  crop: string;
  buyer: string;
  quantityKg: number;
  ratePerKg: number;
  amount: number;
  amountPaid: number;
  note: string;
}

export interface BuyerHistorySummary {
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  totalKg: number;
  count: number;
}

// jspdf-autotable attaches lastAutoTable to the doc instance at runtime;
// it isn't in jsPDF's own TS types, so this narrow cast is expected/safe.
function lastTableEndY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function safeSlug(s: string): string {
  return s.trim().replace(/\s+/g, "-").toLowerCase();
}

// jsPDF's built-in fonts (Helvetica/Times/Courier) have no emoji glyphs —
// printing one renders as garbled boxes/symbols instead of the emoji, and
// throws off that line's width. Crop labels in the UI are "🍅 Tomato" (see
// CROPS in constants.ts), so strip the emoji + any leftover leading space
// before anything reaches doc.text() or a filename. The on-screen modal
// keeps the emoji — this only affects the generated PDF/filename.
function stripEmoji(s: string): string {
  return s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F\u{200D}]/gu, "").trim();
}

/**
 * One buyer's sales for one crop (or "All Crops" if not scoped) —
 * table of every sale plus a totals block underneath.
 */
export function exportBuyerHistoryToPDF(
  buyer: string,
  cropLabel: string,
  records: BuyerHistoryRecord[],
  summary: BuyerHistorySummary
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("KhetiBahi — Buyer History", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Buyer: ${buyer}`, 14, 27);
  doc.text(`Crop: ${stripEmoji(cropLabel)}`, 14, 33);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 39);

  autoTable(doc, {
    startY: 46,
    head: [["Date", "Crop", "Qty (kg)", "Rate/kg", "Amount", "Paid", "Due", "Note"]],
    body: records.map((r) => [
      prettyDate(r.date),
      r.crop,
      r.quantityKg.toString(),
      formatNPR(r.ratePerKg),
      formatNPR(r.amount),
      formatNPR(r.amountPaid),
      formatNPR(Math.max(r.amount - r.amountPaid, 0)),
      r.note || "—",
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [46, 125, 50], textColor: 255 }, // brand green
    columnStyles: { 7: { cellWidth: 40 } },
  });

  const finalY = lastTableEndY(doc);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total sales: ${summary.count}`, 14, finalY + 16);
  doc.text(`Total kg sold: ${summary.totalKg} kg`, 14, finalY + 22);
  doc.text(`Total amount: ${formatNPR(summary.totalAmount)}`, 14, finalY + 28);
  doc.text(`Total paid: ${formatNPR(summary.totalPaid)}`, 14, finalY + 34);
  doc.text(`Total still due: ${formatNPR(summary.totalDue)}`, 14, finalY + 40);

  doc.save(`buyer-history-${safeSlug(buyer)}-${safeSlug(stripEmoji(cropLabel))}.pdf`);
}

/**
 * Every buyer who's bought ONE crop, in a single PDF:
 *   page 1 → one row per buyer (sales count, kg, amount, paid, due)
 *   after  → one detail table per buyer, newest sale first
 *
 * Takes the crop's full income list (already loaded client-side via
 * useIncome() on the crop page — no extra API call needed) and groups
 * it by buyer itself, so the caller doesn't have to.
 */
export function exportCropBuyersToPDF(cropLabel: string, records: BuyerHistoryRecord[]) {
  const doc = new jsPDF();

  // ── Group by buyer (case-insensitive key, original casing kept for display) ──
  const groups = new Map<string, { displayName: string; rows: BuyerHistoryRecord[] }>();
  for (const r of records) {
    const key = r.buyer.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, { displayName: r.buyer.trim(), rows: [] });
    groups.get(key)!.rows.push(r);
  }

  const buyerSummaries = Array.from(groups.values())
    .map(({ displayName, rows }) => {
      const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);
      const totalPaid = rows.reduce((sum, r) => sum + r.amountPaid, 0);
      const totalKg = rows.reduce((sum, r) => sum + r.quantityKg, 0);
      return {
        buyer: displayName,
        rows: rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        count: rows.length,
        totalKg,
        totalAmount,
        totalPaid,
        totalDue: Math.max(totalAmount - totalPaid, 0),
      };
    })
    .sort((a, b) => a.buyer.localeCompare(b.buyer));

  const grandAmount = buyerSummaries.reduce((sum, b) => sum + b.totalAmount, 0);
  const grandPaid = buyerSummaries.reduce((sum, b) => sum + b.totalPaid, 0);
  const grandDue = buyerSummaries.reduce((sum, b) => sum + b.totalDue, 0);

  // ── Page 1: one row per buyer ──
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`KhetiBahi — All Buyers · ${stripEmoji(cropLabel)}`, 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);
  doc.text(
    `${buyerSummaries.length} buyer${buyerSummaries.length === 1 ? "" : "s"} · ${records.length} sale${records.length === 1 ? "" : "s"} total`,
    14,
    32
  );

  autoTable(doc, {
    startY: 39,
    head: [["Buyer", "Sales", "Kg", "Amount", "Paid", "Due"]],
    body: buyerSummaries.map((b) => [
      b.buyer,
      b.count.toString(),
      b.totalKg.toString(),
      formatNPR(b.totalAmount),
      formatNPR(b.totalPaid),
      formatNPR(b.totalDue),
    ]),
    foot: [["Total", records.length.toString(), "", formatNPR(grandAmount), formatNPR(grandPaid), formatNPR(grandDue)]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [46, 125, 50], textColor: 255 },
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
  });

  // ── Following pages: one detail table per buyer ──
  let cursorY = lastTableEndY(doc) + 14;
  const pageBottom = doc.internal.pageSize.getHeight() - 20;

  for (const b of buyerSummaries) {
    // Rough space check: header line + at least one row's worth of table.
    if (cursorY + 24 > pageBottom) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(b.buyer, 14, cursorY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${b.count} sale${b.count === 1 ? "" : "s"} · ${b.totalKg}kg · ${formatNPR(b.totalAmount)} (${formatNPR(b.totalDue)} due)`,
      14,
      cursorY + 5
    );

    autoTable(doc, {
      startY: cursorY + 9,
      head: [["Date", "Qty (kg)", "Rate/kg", "Amount", "Paid", "Due", "Note"]],
      body: b.rows.map((r) => [
        prettyDate(r.date),
        r.quantityKg.toString(),
        formatNPR(r.ratePerKg),
        formatNPR(r.amount),
        formatNPR(r.amountPaid),
        formatNPR(Math.max(r.amount - r.amountPaid, 0)),
        r.note || "—",
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [120, 144, 156], textColor: 255 },
      columnStyles: { 6: { cellWidth: 40 } },
      margin: { left: 14, right: 14 },
    });

    cursorY = lastTableEndY(doc) + 14;
  }

  doc.save(`all-buyers-${safeSlug(stripEmoji(cropLabel))}.pdf`);
}

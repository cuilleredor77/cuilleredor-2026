// Factures Cuillère d'Or : numérotation continue, factures d'acompte, de solde, unique, personnalisée et avoirs.
// Montants TTC, TVA non applicable (art. 293 B du CGI). Une facture reste modifiable tant qu'elle n'est pas envoyée.
import { computeTotals, formatDateFR, formatEUR, formatDateShort, lineTotal, parseQuote, quoteFileName, round2, type RequestRow } from "./quote";

export type InvoiceKind = "acompte" | "solde" | "unique" | "perso" | "avoir";

export const INVOICE_KINDS: Record<InvoiceKind, { label: string; title: string }> = {
  acompte: { label: "Facture d’acompte", title: "FACTURE D’ACOMPTE" },
  solde: { label: "Facture de solde", title: "FACTURE DE SOLDE" },
  unique: { label: "Facture", title: "FACTURE" },
  perso: { label: "Facture personnalisée", title: "FACTURE" },
  avoir: { label: "Avoir", title: "AVOIR" },
};

/** Dernier numéro émis hors de l'outil, par année : la numérotation reprend juste après. */
export const INVOICE_START: Record<number, number> = { 2026: 21 };

export type InvoiceLine = { label: string; detail?: string; qty: number; unit: string; price: number };
export type InvoiceDeduction = { label: string; amount: number };

export type InvoiceData = {
  title: string; // « FACTURE D’ACOMPTE », modifiable
  client: { name: string; address: string; email: string; phone: string; extra: string }; // extra : SIREN / n° TVA d'un client professionnel
  event: { type: string; date: string; place: string };
  lines: InvoiceLine[];
  deductions: InvoiceDeduction[]; // acomptes déjà facturés (facture de solde)
  dueOn: string; // AAAA-MM-JJ, ou "" = à réception
  note: string;
};

export type Invoice = {
  id: number;
  request_id: number;
  number: string;
  seq: number;
  year: number;
  kind: InvoiceKind;
  issued_on: string;
  status: "brouillon" | "envoyee";
  sent_on: string;
  paid_on: string;
  ref_number: string;
  data_json: string;
  created_at: string;
  updated_at: string;
};

export const invoiceNumber = (year: number, seq: number) => `F-${year}-${String(seq).padStart(4, "0")}`;

export function parseInvoice(inv: Pick<Invoice, "data_json">): InvoiceData {
  return JSON.parse(inv.data_json) as InvoiceData;
}

export function invoiceTotals(data: InvoiceData) {
  const gross = round2(data.lines.reduce((s, l) => s + lineTotal({ id: "", ...l }), 0));
  const deducted = round2(data.deductions.reduce((s, d) => s + (d.amount || 0), 0));
  return { gross, deducted, net: round2(gross - deducted) };
}

function base(row: RequestRow, title: string): InvoiceData {
  return {
    title,
    client: { name: row.client_name, address: row.billing_address || "", email: row.client_email, phone: row.client_phone, extra: "" },
    event: { type: row.event_type, date: row.event_date, place: row.event_place },
    lines: [],
    deductions: [],
    dueOn: "",
    note: "",
  };
}

const quoteRef = (row: RequestRow) => {
  const q = parseQuote(row);
  return `devis du ${formatDateShort(q.issuedOn)}${row.event_date ? ` — ${row.event_type} du ${formatDateShort(row.event_date)}` : ""}`;
};

/** Lignes du devis, sans les lignes à 0 € (à chiffrer, offertes sans montant). */
function quoteLines(row: RequestRow): InvoiceLine[] {
  return parseQuote(row)
    .lines.filter((l) => lineTotal(l) !== 0)
    .map((l) => ({ label: l.label, detail: [l.day, l.detail].filter(Boolean).join(" · ") || undefined, qty: l.qty, unit: l.unit, price: l.price }));
}

/** Nouvelle facture préremplie depuis la fiche. `previous` : factures déjà émises pour cette fiche. */
export function draftInvoice(kind: InvoiceKind, row: RequestRow, previous: Invoice[], source?: Invoice): { data: InvoiceData; ref_number: string } {
  const quote = parseQuote(row);
  const totals = computeTotals(quote, row.event_date, row.service_mode);
  const data = base(row, INVOICE_KINDS[kind].title);
  if (kind === "acompte") {
    const received = (quote.payments || []).find((p) => /acompte/i.test(p.label) && p.amount > 0);
    const amount = received ? received.amount : totals.deposit;
    const rate = totals.total ? Math.round((amount / totals.total) * 100) : 30;
    data.lines = [{ label: `Acompte de ${rate} % sur le ${quoteRef(row)}`, detail: `Montant total de la prestation : ${formatEUR(totals.total)}`, qty: 1, unit: "forfait", price: amount }];
    data.dueOn = received?.receivedOn || "";
    data.note = received ? `Acompte reçu le ${formatDateFR(received.receivedOn)}.` : "";
  } else if (kind === "solde" || kind === "unique") {
    data.lines = quoteLines(row);
    if (kind === "solde") {
      const acomptes = previous.filter((i) => i.kind === "acompte");
      data.deductions = acomptes.length
        ? acomptes.map((i) => ({ label: `Acompte facturé (facture ${i.number} du ${formatDateShort(i.issued_on)})`, amount: invoiceTotals(parseInvoice(i)).net }))
        : (quote.payments || [])
            .filter((p) => /acompte/i.test(p.label) && p.amount > 0)
            .map((p) => ({ label: `${p.label}${p.receivedOn ? ` reçu le ${formatDateShort(p.receivedOn)}` : ""}`, amount: p.amount }));
      data.dueOn = totals.balanceDue || "";
    }
  } else if (kind === "perso") {
    data.lines = [{ label: "", qty: 1, unit: "forfait", price: 0 }];
  } else if (kind === "avoir" && source) {
    const src = parseInvoice(source);
    data.client = src.client;
    data.event = src.event;
    data.lines = src.lines.map((l) => ({ ...l, price: -l.price }));
    data.deductions = src.deductions.map((d) => ({ ...d, amount: -d.amount }));
    data.note = `Avoir annulant la facture ${source.number} du ${formatDateFR(source.issued_on)}.`;
    return { data, ref_number: source.number };
  }
  return { data, ref_number: "" };
}

export function invoiceFileName(row: RequestRow, inv: Pick<Invoice, "number" | "kind">): string {
  return quoteFileName(row).replace(/_Devis_Contrat$/, `_${inv.kind === "avoir" ? "Avoir" : "Facture"}_${inv.number}`);
}

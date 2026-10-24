// Archive les factures envoyées : PDF figé dans « Mon Drive/Cuillère d'Or – Factures » (Drive synchronisé du Mac).
// À lancer depuis le Mac : npx tsx scripts/archive-factures.ts   (--all pour tout réarchiver)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { invoiceFileName, type Invoice } from "../lib/invoice";
import type { RequestRow } from "../lib/quote";

const DRIVE = join(homedir(), "Library/CloudStorage/GoogleDrive-mainhan.lowinsky@gmail.com/Mon Drive/Cuillère d'Or – Factures");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const all = process.argv.includes("--all");

function d1<T>(sql: string): T[] {
  const out = execFileSync("npx", ["wrangler", "d1", "execute", "cuilleredor-devis", "--remote", "--json", "--command", sql], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return (JSON.parse(out) as Array<{ results: T[] }>)[0].results;
}

mkdirSync(DRIVE, { recursive: true });
const rows = d1<Invoice & RequestRow & { inv_id: number }>(
  `SELECT i.*, i.id AS inv_id, r.token, r.client_name, r.event_type, r.event_date FROM invoices i JOIN requests r ON r.id = i.request_id
   WHERE i.status = 'envoyee'${all ? "" : " AND i.archived_on = ''"} ORDER BY i.year, i.seq`,
);
if (!rows.length) console.log("Aucune facture envoyée à archiver.");
for (const r of rows) {
  const file = join(DRIVE, `${invoiceFileName(r, r)}.pdf`);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${file}`, `https://cuilleredor.fr/devis/${r.token}/facture/${r.number}`], { stdio: "ignore" });
  if (!existsSync(file)) { console.log(`✗ ${r.number} : PDF non créé`); continue; }
  d1(`UPDATE invoices SET archived_on = strftime('%Y-%m-%d','now') WHERE id = ${Number(r.inv_id)}`);
  console.log(`✓ ${r.number} → ${file}`);
}

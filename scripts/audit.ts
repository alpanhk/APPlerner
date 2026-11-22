// Jalankan: npx tsx scripts/audit.ts
// Memeriksa semua bab terhadap Pola Prolog dan mensimulasikan jalur jawaban contoh.
import { auditAll } from "../src/story/audit";
import { CHAPTERS } from "../src/story/chapters";
import { advance, answer, choose, nodeOf, startGame, visibleOptions } from "../src/story/engine";
import { fill } from "../src/story/match";

let failed = 0;
for (const res of auditAll(CHAPTERS)) {
  const bad = res.checks.filter((c) => !c.ok);
  console.log(`${res.ok ? "OK  " : "GAGAL"} ${res.id.padEnd(7)} ${String(res.nodes).padStart(3)} node, ${String(res.inputs).padStart(2)} giliran — ${res.title}`);
  for (const c of bad) {
    failed++;
    console.log(`      ✗ ${c.label}\n        ${c.detail}`);
  }
}

// Simulasi: mainkan setiap bab sampai tamat dengan jawaban contoh, selalu memilih opsi terakhir yang maju.
const NAME = "Rina";
for (const ch of CHAPTERS) {
  let { g } = startGame(ch, NAME);
  let steps = 0;
  let attempts = 0;
  const picked = new Set<string>();
  while (!g.done && steps < 600) {
    steps++;
    const node = nodeOf(ch, g.nodeId);
    if (node.kind === "line") g = advance(ch, g, NAME).g;
    else if (node.kind === "input") {
      const s = answer(ch, g, fill(node.model, NAME), NAME);
      if (s.feedback) {
        console.log(`      ✗ ${node.id}: contoh ditolak (${s.feedback})`);
        failed++;
        break;
      }
      if (s.attempt) attempts++;
      g = s.g;
    } else if (node.kind === "choice") {
      const opts = visibleOptions(ch, g);
      // Coba setiap opsi sekali (urut), lalu ambil opsi terakhir untuk maju.
      const fresh = opts.find((o) => !picked.has(`${node.id}:${o.label}`) && !o.label.startsWith("Ulangi") && o.label !== "Dengar penjelasan sekali lagi");
      const opt = fresh ?? opts[opts.length - 1];
      picked.add(`${node.id}:${opt.label}`);
      g = choose(ch, g, opt, NAME).g;
    }
  }
  if (!g.done) {
    failed++;
    console.log(`      ✗ ${ch.id}: simulasi tidak mencapai akhir (berhenti di ${g.nodeId})`);
  } else console.log(`SIM  ${ch.id.padEnd(7)} tamat dalam ${steps} langkah, ${attempts} bukti tercatat, ${g.notes.length} kalimat di buku catatan`);
}

console.log(failed ? `\n${failed} masalah ditemukan.` : "\nSemua bab mengikuti Pola Prolog.");
process.exit(failed ? 1 : 0);

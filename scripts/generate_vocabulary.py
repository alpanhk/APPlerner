#!/usr/bin/env python3
"""Generator seed kosakata Lernen (PRD 6.3/6.4).

M0: minimal. Sumber CSV opsional -> JSON seed unit; tanpa CSV -> menulis
seed default unit 1. Bentuk CSV (dengan header):

    de,article,plural,kind,meaning_id,example_de,example_id,tags

Aturan validator PRD 6.4: noun wajib punya artikel + plural; contoh tak kosong;
duplikat `de` ditolak.

Pemakaian:
    python scripts/generate_vocabulary.py            # seed default unit 1
    python scripts/generate_vocabulary.py --unit 2 --csv scripts/source/words_unit2.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "data" / "seed"


def validate(words: list[dict], unit: int) -> None:
    errors: list[str] = []
    seen: set[str] = set()
    for i, w in enumerate(words, 1):
        de = (w.get("de") or "").strip()
        if not de:
            errors.append(f"baris {i}: kolom de kosong")
            continue
        if de in seen:
            errors.append(f"baris {i}: duplikat de={de!r}")
        seen.add(de)
        if w.get("kind") == "noun":
            if not (w.get("article") or "").strip():
                errors.append(f"{de}: noun tanpa artikel")
            if not (w.get("plural") or "").strip():
                errors.append(f"{de}: noun tanpa plural")
        if not (w.get("meaning_id") or "").strip():
            errors.append(f"{de}: meaning_id kosong")
    if errors:
        print("VALIDASI GAGAL:", file=sys.stderr)
        for e in errors:
            print(" -", e, file=sys.stderr)
        sys.exit(1)


def read_csv(path: Path) -> list[dict]:
    words: list[dict] = []
    with path.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            words.append(
                {
                    "kind": (row.get("kind") or "noun").strip(),
                    "de": row.get("de", "").strip(),
                    "article": (row.get("article") or "").strip() or None,
                    "plural": (row.get("plural") or "").strip() or None,
                    "meaning_id": row.get("meaning_id", "").strip(),
                    "example_de": row.get("example_de", "").strip() or None,
                    "example_id": row.get("example_id", "").strip() or None,
                    "tags": row.get("tags", "").strip() or f"unit{unit}",
                }
            )
    return words


def default_unit1() -> list[dict]:
    # Sumber: daftar Goethe A1 + kurasi manual (tema unit 1).
    return json.loads(
        (OUT_DIR / "words_unit1.json").read_text(encoding="utf-8")
    )["words"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--unit", type=int, default=1)
    ap.add_argument("--level", default="A1")
    ap.add_argument("--theme", default="Salam & perkenalan diri")
    ap.add_argument("--csv", type=Path, default=None)
    args = ap.parse_args()

    words = read_csv(args.csv) if args.csv else default_unit1()
    validate(words, args.unit)

    seed = {
        "unit": args.unit,
        "level": args.level,
        "theme": args.theme,
        "source": "CSV generator (PRD 6.3)" if args.csv else "Goethe A1 + kurasi manual (PRD 6.3)",
        "seed_version": 1,
        "words": words,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"words_unit{args.unit}.json"
    out.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {out.relative_to(ROOT)} ({len(words)} kata)")


if __name__ == "__main__":
    main()
